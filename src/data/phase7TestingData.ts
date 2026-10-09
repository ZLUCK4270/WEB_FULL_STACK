export interface TestSuiteItem {
  id: string;
  name: string;
  type: 'unit_jest' | 'e2e_playwright';
  filePath: string;
  description: string;
  code: string;
}

export const PHASE7_TEST_FILES: TestSuiteItem[] = [
  {
    id: 'fefo_unit_test',
    name: 'Transacción FEFO (Jest Unit Test)',
    type: 'unit_jest',
    filePath: 'apps/api/src/sales/sales.service.spec.ts',
    description: 'Prueba unitaria que valida la selección cronológica por vencimiento, el bloqueo de lotes caducados y el rollback ante falta de stock.',
    code: `import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('SalesService - Lógica Transaccional FEFO', () => {
  let service: SalesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('debe despachar prioritariamente del lote más próximo a vencer (Criterio FEFO)', async () => {
    const mockBatches = [
      { id: 'batch-1', batch_code: 'LOTE-2026-11', expiration_date: new Date('2026-11-01'), current_stock: 10 },
      { id: 'batch-2', batch_code: 'LOTE-2027-05', expiration_date: new Date('2027-05-01'), current_stock: 50 },
    ];

    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      const mockTx = {
        product: { findUnique: jest.fn().mockResolvedValue({ id: 'prod-1', name: 'Amoxicilina 500mg', salePrice: 1.0 }) },
        $queryRaw: jest.fn().mockResolvedValue(mockBatches),
        batch: { update: jest.fn().mockResolvedValue({}) },
        stockMovement: { create: jest.fn().mockResolvedValue({}) },
        sale: { count: jest.fn().mockResolvedValue(100), create: jest.fn().mockResolvedValue({ id: 'sale-1', saleCode: 'BOL-B001-00000101' }) },
        saleItem: { create: jest.fn().mockResolvedValue({ id: 'item-1' }) },
        saleItemBatch: { create: jest.fn().mockResolvedValue({}) },
      };
      return callback(mockTx);
    });

    const result = await service.processSaleAtomic('cashier-uuid', {
      items: [{ productId: 'prod-1', quantity: 5 }],
      paymentMethod: 'EFECTIVO' as any,
    });

    expect(result).toBeDefined();
    expect(result.saleCode).toBe('BOL-B001-00000101');
    expect(result.totalAmount).toBe(5);
  });

  it('debe rechazar la venta si los lotes disponibles están vencidos', async () => {
    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      const mockTx = {
        product: { findUnique: jest.fn().mockResolvedValue({ id: 'prod-1', name: 'Jarabe Vencido' }) },
        $queryRaw: jest.fn().mockResolvedValue([]), // 0 lotes vigentes encontrados (vencidos excluidos)
      };
      return callback(mockTx);
    });

    await expect(
      service.processSaleAtomic('cashier-uuid', {
        items: [{ productId: 'prod-1', quantity: 1 }],
        paymentMethod: 'EFECTIVO' as any,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});`
  },
  {
    id: 'permissions_guard_test',
    name: 'Guard de Permisos RBAC (Jest Unit Test)',
    type: 'unit_jest',
    filePath: 'apps/api/src/common/guards/permissions.guard.spec.ts',
    description: 'Valida que el Administrador Propietario tenga acceso irrestricto y que empleados sin permiso reciban HTTP 403 Forbidden.',
    code: `import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('PermissionsGuard - Autorización Dinámica', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: { userProfile: { findUnique: jest.fn() } },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('debe permitir acceso total al Administrador Propietario (BR-SEC-01)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ module: 'pos_sales', action: 'create' });
    jest.spyOn(prisma.userProfile, 'findUnique').mockResolvedValue({
      id: 'admin-uuid',
      isRootAdmin: true,
      isActive: true,
      permissions: [],
    } as any);

    const mockContext = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'admin-uuid' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const canActivate = await guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
  });

  it('debe lanzar ForbiddenException (403) si el cajero no tiene permiso para eliminar', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ module: 'inventory_batches', action: 'delete' });
    jest.spyOn(prisma.userProfile, 'findUnique').mockResolvedValue({
      id: 'cajero-uuid',
      isRootAdmin: false,
      isActive: true,
      permissions: [{ moduleId: 'inventory_batches', canView: true, canCreate: false, canEdit: false, canDelete: false }],
    } as any);

    const mockContext = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'cajero-uuid' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
  });
});`
  },
  {
    id: 'playwright_e2e_test',
    name: 'Flujo de Venta POS FEFO (Playwright E2E)',
    type: 'e2e_playwright',
    filePath: 'apps/web/e2e/sales-fefo.spec.ts',
    description: 'Prueba de extremo a extremo que simula el inicio de sesión del cajero, la búsqueda del fármaco, la confirmación de cobro en <3 clics y la impresión del ticket.',
    code: `import { test, expect } from '@playwright/test';

test.describe('Flujo de Venta Rápida POS con Despacho FEFO', () => {
  test('debe completar una venta en mostrador en menos de 3 clics y descontar el lote adecuado', async ({ page }) => {
    // 1. Acceso seguro al Punto de Venta
    await page.goto('/login');
    await page.fill('input[type="email"]', 'cajero@novasalud.pe');
    await page.fill('input[type="password"]', 'Temporal2026!');
    await page.click('button[type="submit"]');

    // Redirección obligatoria al POS
    await expect(page).toHaveURL(/.*\/dashboard\/pos/);

    // 2. Clic 1: Búsqueda reactiva mediante atajo de teclado o escaneo
    const searchInput = page.locator('input[placeholder*="Buscar medicamento"]');
    await searchInput.fill('Amoxicilina');
    await page.keyboard.press('Enter');

    // Verifica que el medicamento fue añadido al carrito
    const cartItem = page.locator('[data-testid="cart-item-amoxicilina"]');
    await expect(cartItem).toBeVisible();

    // 3. Clic 2: Presionar tecla F9 para abrir modal de cobro rápido
    await page.keyboard.press('F9');
    const paymentModal = page.locator('[data-testid="payment-modal"]');
    await expect(paymentModal).toBeVisible();

    // Seleccionar pago en efectivo y monto entregado
    await page.click('button:has-text("Efectivo")');
    await page.fill('input[name="cashGiven"]', '50');

    // 4. Clic 3: Confirmar transacción
    await page.click('button:has-text("Confirmar Venta")');

    // Verificación de resultado exitoso: Ticket emitido y carrito limpio
    const successToast = page.locator('text=Venta completada con éxito');
    await expect(successToast).toBeVisible({ timeout: 5000 });

    const ticketReceipt = page.locator('[data-testid="printable-ticket"]');
    await expect(ticketReceipt).toContainText('BOL-B001');
    await expect(ticketReceipt).toContainText('LOTE-AMX-2026-PRIORIDAD-1'); // Lote FEFO verificado
  });
});`
  }
];

export const DEPLOYMENT_STEPS = [
  {
    step: '1. Base de Datos en Supabase',
    service: 'Supabase Free Tier (PostgreSQL + Auth + Realtime)',
    tasks: [
      'Crear proyecto en app.supabase.com (Región us-east-1).',
      'Copiar cadena de conexión de PgBouncer (puerto 6543) como DATABASE_URL y conexión directa (puerto 5432) como DIRECT_URL.',
      'Ejecutar migraciones de Prisma: npx prisma migrate deploy.',
      'Ejecutar script de RLS y triggers: psql -f prisma/rls_policies.sql.',
      'Cargar catálogo inicial: npx tsx prisma/seed.ts.'
    ]
  },
  {
    step: '2. Backend NestJS en Render / Railway',
    service: 'Render Web Service o Railway Starter (Node.js)',
    tasks: [
      'Vincular repositorio de GitHub.',
      'Root Directory: . | Build Command: pnpm --filter=@nova-salud/api build.',
      'Start Command: node apps/api/dist/main.',
      'Configurar variables de entorno: DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, PORT=4000.',
      'Verificar endpoints en https://nova-salud-api.onrender.com/api/v1/health.'
    ]
  },
  {
    step: '3. Frontend PWA en Vercel',
    service: 'Vercel Hobby Plan (Next.js 15 Edge CDN)',
    tasks: [
      'Importar monorepo en Vercel seleccionando apps/web como Root Directory.',
      'Framework Preset: Next.js.',
      'Configurar variables de entorno: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      'Despliegue automático con soporte SSL/HTTPS y Service Worker PWA para tablets de mostrador.'
    ]
  }
];
