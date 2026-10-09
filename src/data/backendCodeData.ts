export interface BackendModuleFile {
  id: string;
  moduleName: string;
  filePath: string;
  description: string;
  code: string;
}

export const BACKEND_CODE_FILES: BackendModuleFile[] = [
  {
    id: 'fefo_service',
    moduleName: 'Ventas & Transacción FEFO',
    filePath: 'apps/api/src/sales/sales.service.ts',
    description: 'Servicio transaccional atómico (SERIALIZABLE) con bloqueo pesimista (SELECT FOR UPDATE) y despacho FEFO.',
    code: `import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Prisma } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SalesService {
  private supabaseAdmin;

  constructor(private readonly prisma: PrismaService) {
    this.supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  /**
   * PROCESO DE VENTA ATÓMICA CON CRITERIO FEFO (First Expired, First Out)
   * 1. Bloqueo pesimista de lotes vigentes ordenados por fecha de expiración ASC
   * 2. Descuento secuencial de stock hasta cubrir la cantidad requerida
   * 3. Creación de venta, líneas de detalle y vínculos exactos sale_item_batches
   * 4. Registro de movimientos en el Kárdex (stock_movements)
   * 5. Emisión de eventos en tiempo real para terminales POS
   */
  async processSaleAtomic(cashierId: string, dto: CreateSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El carrito de venta no puede estar vacío');
    }

    // Ejecución en transacción aislada SERIALIZABLE en PostgreSQL
    return await this.prisma.$transaction(
      async (tx) => {
        let calculatedSubtotal = 0;
        let calculatedDiscount = 0;
        const processedItemsData = [];
        const stockReductionEvents = [];

        // 1. Iterar y procesar cada producto del carrito bajo FEFO
        for (const item of dto.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId, isActive: true },
          });

          if (!product) {
            throw new NotFoundException(\`Medicamento con ID \${item.productId} no encontrado o inactivo\`);
          }

          // Bloqueo pesimista de lotes vigentes (No vencidos y con stock > 0)
          // Ordenados estrictamente por fecha de expiración ascendente (FEFO)
          const validBatches: Array<{
            id: string;
            batch_code: string;
            expiration_date: Date;
            current_stock: number;
          }> = await tx.$queryRaw\`
            SELECT id, batch_code, expiration_date, current_stock
            FROM public.batches
            WHERE product_id = \${item.productId}::uuid
              AND expiration_date > CURRENT_DATE
              AND current_stock > 0
            ORDER BY expiration_date ASC
            FOR UPDATE;
          \`;

          const totalAvailableStock = validBatches.reduce(
            (acc, b) => acc + b.current_stock,
            0,
          );

          if (totalAvailableStock < item.quantity) {
            throw new BadRequestException(
              \`Stock insuficiente para "\${product.name}". Solicitado: \${item.quantity}, Disponible en lotes vigentes: \${totalAvailableStock}. Lotes vencidos bloqueados automáticamente.\`,
            );
          }

          // Deducción FEFO entre uno o múltiples lotes
          let pendingToDeduct = item.quantity;
          const batchAllocations: Array<{ batchId: string; quantity: number }> = [];

          for (const batch of validBatches) {
            if (pendingToDeduct <= 0) break;

            const deductFromBatch = Math.min(batch.current_stock, pendingToDeduct);
            pendingToDeduct -= deductFromBatch;

            // Actualizar stock del lote físico
            const updatedStock = batch.current_stock - deductFromBatch;
            await tx.batch.update({
              where: { id: batch.id },
              data: {
                currentStock: updatedStock,
                status: updatedStock === 0 ? 'AGOTADO' : undefined,
              },
            });

            batchAllocations.push({
              batchId: batch.id,
              quantity: deductFromBatch,
            });

            // Registrar en el Kárdex Farmacéutico
            await tx.stockMovement.create({
              data: {
                productId: product.id,
                batchId: batch.id,
                userId: cashierId,
                movementType: 'SALIDA_VENTA',
                quantity: deductFromBatch,
                previousStock: batch.current_stock,
                newStock: updatedStock,
                reason: \`Despacho FEFO en mostrador POS - Lote \${batch.batch_code}\`,
              },
            });
          }

          const lineSubtotal = Number(product.salePrice) * item.quantity - (item.discount || 0);
          calculatedSubtotal += Number(product.salePrice) * item.quantity;
          calculatedDiscount += item.discount || 0;

          processedItemsData.push({
            productId: product.id,
            unitPrice: product.salePrice,
            quantity: item.quantity,
            discount: item.discount || 0,
            subtotal: lineSubtotal,
            batchAllocations,
          });

          stockReductionEvents.push({
            productId: product.id,
            remainingStock: totalAvailableStock - item.quantity,
          });
        }

        // 2. Generar correlativo legal de boleta (ej: BOL-B001-00004523)
        const saleCount = await tx.sale.count();
        const nextCorrelative = String(saleCount + 1).padStart(8, '0');
        const saleCode = \`BOL-B001-\${nextCorrelative}\`;

        const totalAmount = calculatedSubtotal - calculatedDiscount;
        const taxAmount = Number((totalAmount - totalAmount / 1.18).toFixed(2)); // IGV 18% Perú

        // 3. Insertar registro maestro de venta
        const sale = await tx.sale.create({
          data: {
            saleCode,
            cashierId,
            customerId: dto.customerId || null,
            paymentMethod: dto.paymentMethod,
            subtotal: calculatedSubtotal,
            discountAmount: calculatedDiscount,
            taxAmount,
            totalAmount,
            cashGiven: dto.cashGiven ? new Prisma.Decimal(dto.cashGiven) : null,
            cashChange: dto.cashGiven ? new Prisma.Decimal(dto.cashGiven - totalAmount) : null,
            status: 'COMPLETADA',
          },
        });

        // 4. Insertar detalles y desglose exacto de lotes
        for (const itemData of processedItemsData) {
          const saleItem = await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: itemData.productId,
              unitPrice: itemData.unitPrice,
              quantity: itemData.quantity,
              discount: itemData.discount,
              subtotal: itemData.subtotal,
            },
          });

          for (const alloc of itemData.batchAllocations) {
            await tx.saleItemBatch.create({
              data: {
                saleItemId: saleItem.id,
                batchId: alloc.batchId,
                quantity: alloc.quantity,
              },
            });
          }
        }

        return {
          saleId: sale.id,
          saleCode: sale.saleCode,
          totalAmount,
          taxAmount,
          createdAt: sale.createdAt,
          itemsCount: processedItemsData.length,
          stockEvents: stockReductionEvents,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      },
    );
  }
}`
  },
  {
    id: 'permissions_guard',
    moduleName: 'Seguridad & RBAC Dinámico',
    filePath: 'apps/api/src/common/guards/permissions.guard.ts',
    description: 'Guard global que intercepta solicitudes, lee los metadatos de @RequirePermission y valida contra PostgreSQL.',
    code: `import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extraer permisos requeridos del decorador @RequirePermission
    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no exige permisos específicos, permitir paso
    if (!requiredPermission) {
      return true;
    }

    // 2. Extraer usuario autenticado inyectado por JwtAuthGuard
    const request = context.switchToHttp().getRequest();
    const user = request.user; // { id: UUID, email: string }

    if (!user || !user.id) {
      throw new UnauthorizedException('Token de autenticación ausente o inválido');
    }

    // 3. Consultar perfil de usuario
    const userProfile = await this.prisma.userProfile.findUnique({
      where: { id: user.id },
      include: {
        permissions: {
          where: { moduleId: requiredPermission.module },
        },
      },
    });

    if (!userProfile || !userProfile.isActive) {
      throw new ForbiddenException('La cuenta de usuario se encuentra inactiva o deshabilitada');
    }

    // 4. Regla Inviolable BR-SEC-01: Administrador Propietario tiene pase irrestricto
    if (userProfile.isRootAdmin) {
      return true;
    }

    // 5. Evaluar matriz dinámica Módulo × Acción
    const modulePermission = userProfile.permissions[0];

    if (!modulePermission) {
      throw new ForbiddenException(
        \`Acceso Denegado: No posee permisos asignados para el módulo "\${requiredPermission.module}"\`,
      );
    }

    let hasAction = false;
    switch (requiredPermission.action) {
      case 'view':
        hasAction = modulePermission.canView;
        break;
      case 'create':
        hasAction = modulePermission.canCreate;
        break;
      case 'edit':
        hasAction = modulePermission.canEdit;
        break;
      case 'delete':
        hasAction = modulePermission.canDelete;
        break;
    }

    if (!hasAction) {
      throw new ForbiddenException(
        \`Acceso Denegado: Su cuenta no cuenta con la facultad "\${requiredPermission.action.toUpperCase()}" en el módulo "\${requiredPermission.module}"\`,
      );
    }

    return true;
  }
}`
  },
  {
    id: 'require_permission_decorator',
    moduleName: 'Decorador RBAC',
    filePath: 'apps/api/src/common/decorators/require-permission.decorator.ts',
    description: 'Decorador tipado para controladores: @RequirePermission("pos_sales", "create").',
    code: `import { SetMetadata } from '@nestjs/common';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface RequiredPermission {
  module: string;
  action: PermissionAction;
}

export const PERMISSION_KEY = 'required_permission';

/**
 * Decorador de autorización granular para endpoints en NestJS.
 * Ejemplo de uso:
 * @Post('checkout')
 * @RequirePermission('pos_sales', 'create')
 */
export const RequirePermission = (module: string, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { module, action });`
  },
  {
    id: 'users_service',
    moduleName: 'Gestión de Usuarios & Supabase Admin',
    filePath: 'apps/api/src/users/users.service.ts',
    description: 'Creación segura de colaboradores con Supabase Admin API, asignación de permisos y eventos en tiempo real.',
    code: `import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class UsersService {
  private supabaseAdmin;

  constructor(private readonly prisma: PrismaService) {
    this.supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Uso seguro y exclusivo en NestJS
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  /**
   * Crea un nuevo empleado en Supabase Auth y sincroniza perfil y matriz RBAC
   */
  async createUser(adminId: string, dto: CreateUserDto) {
    // 1. Validar que DNI o Correo no existan en el sistema
    const existing = await this.prisma.userProfile.findFirst({
      where: {
        OR: [{ email: dto.email }, { dni: dto.dni }],
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe un colaborador registrado con ese DNI o correo');
    }

    // 2. Crear usuario en Supabase Auth con credencial temporal
    const { data: authUser, error: authError } =
      await this.supabaseAdmin.auth.admin.createUser({
        email: dto.email,
        password: dto.temporaryPassword,
        email_confirm: true,
        user_metadata: {
          first_name: dto.firstName,
          last_name: dto.lastName,
          dni: dto.dni,
        },
      });

    if (authError || !authUser.user) {
      throw new BadRequestException(\`Error en Supabase Auth: \${authError?.message}\`);
    }

    const userId = authUser.user.id;

    // 3. Crear registro en users_profile y user_permissions en transacción
    const newProfile = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.userProfile.create({
        data: {
          id: userId,
          dni: dto.dni,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          roleTitle: dto.roleTitle || 'Cajero',
          mustChangePassword: true, // Obligatorio cambiar en primer login
        },
      });

      // Crear permisos iniciales según la plantilla o personalización recibida
      if (dto.initialPermissions && dto.initialPermissions.length > 0) {
        for (const p of dto.initialPermissions) {
          await tx.userPermission.create({
            data: {
              userId,
              moduleId: p.moduleId,
              canView: p.canView,
              canCreate: p.canCreate,
              canEdit: p.canEdit,
              canDelete: p.canDelete,
              grantedById: adminId,
            },
          });
        }
      }

      return profile;
    });

    return {
      message: 'Colaborador creado exitosamente con cambio de clave obligatorio.',
      user: newProfile,
    };
  }

  /**
   * Actualiza la matriz Módulo × Acción y propaga el cambio en tiempo real vía WebSockets
   */
  async updateUserPermissions(
    adminId: string,
    targetUserId: string,
    dto: UpdatePermissionsDto,
  ) {
    const target = await this.prisma.userProfile.findUnique({
      where: { id: targetUserId },
    });

    if (!target) {
      throw new NotFoundException('Empleado no encontrado');
    }

    if (target.isRootAdmin) {
      throw new BadRequestException('Regla BR-SEC-01: El Administrador Propietario posee permisos inmutables');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const perm of dto.permissions) {
        await tx.userPermission.upsert({
          where: {
            userId_moduleId: {
              userId: targetUserId,
              moduleId: perm.moduleId,
            },
          },
          update: {
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEdit: perm.canEdit,
            canDelete: perm.canDelete,
            grantedById: adminId,
          },
          create: {
            userId: targetUserId,
            moduleId: perm.moduleId,
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEdit: perm.canEdit,
            canDelete: perm.canDelete,
            grantedById: adminId,
          },
        });
      }
    });

    // Notificar al canal Supabase Realtime para actualización inmediata en UI sin relogueo
    await this.supabaseAdmin.channel(\`user-perms:\${targetUserId}\`).send({
      type: 'broadcast',
      event: 'PERMISSIONS_UPDATED',
      payload: { userId: targetUserId, timestamp: new Date() },
    });

    return { success: true, message: 'Permisos actualizados y propagados en tiempo real' };
  }
}`
  },
  {
    id: 'dtos_validation',
    moduleName: 'DTOs & Validación class-validator',
    filePath: 'apps/api/src/sales/dto/create-sale.dto.ts',
    description: 'Definición de DTOs con decoradores estrictos para evitar inyecciones y datos malformados.',
    code: `import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethodEnum {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  MIXTO = 'MIXTO',
}

export class CartItemDto {
  @ApiProperty({ example: '8f7a6b2c-4e3d-4a1b-9c8e-7d6f5a4b3c2d' })
  @IsUUID('4', { message: 'El productId debe ser un UUID válido' })
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 3, description: 'Cantidad de unidades a vender' })
  @IsNumber()
  @IsPositive({ message: 'La cantidad debe ser mayor a cero' })
  quantity: number;

  @ApiProperty({ example: 0.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreateSaleDto {
  @ApiProperty({ required: false, example: '3a1b2c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' })
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @ApiProperty({ enum: PaymentMethodEnum, example: PaymentMethodEnum.EFECTIVO })
  @IsEnum(PaymentMethodEnum, { message: 'Método de pago no válido' })
  paymentMethod: PaymentMethodEnum;

  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiProperty({ required: false, example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashGiven?: number;
}`
  },
  {
    id: 'prisma_service',
    moduleName: 'Infraestructura Prisma',
    filePath: 'apps/api/src/prisma/prisma.service.ts',
    description: 'Servicio singleton inyectable con conexión a Supabase y manejo de desconexión limpia.',
    code: `import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✔ Conexión establecida con PostgreSQL (Supabase Pooler)');
    } catch (error) {
      this.logger.error('❌ Error conectando a PostgreSQL:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Desconexión limpia de Prisma finalizada.');
  }
}`
  }
];
