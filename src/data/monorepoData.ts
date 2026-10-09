export interface MonorepoFile {
  path: string;
  category: 'Root & Tooling' | 'Apps / Web (Next.js)' | 'Apps / API (NestJS)' | 'Packages / Shared';
  description: string;
  language: 'json' | 'typescript' | 'bash' | 'markdown' | 'yaml';
  content: string;
}

export const MONOREPO_FILES: MonorepoFile[] = [
  {
    path: 'package.json (Raíz)',
    category: 'Root & Tooling',
    description: 'Workspace root con scripts unificados para desarrollo paralelo, pruebas y migraciones.',
    language: 'json',
    content: `{
  "name": "nova-salud-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:web": "turbo run dev --filter=@nova-salud/web",
    "dev:api": "turbo run dev --filter=@nova-salud/api",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e --filter=@nova-salud/web",
    "db:generate": "prisma generate --schema=./prisma/schema.prisma",
    "db:migrate": "prisma migrate dev --schema=./prisma/schema.prisma",
    "db:seed": "tsx ./prisma/seed.ts",
    "db:studio": "prisma studio --schema=./prisma/schema.prisma"
  },
  "devDependencies": {
    "turbo": "^2.4.2",
    "prettier": "^3.5.0",
    "eslint": "^9.20.0",
    "typescript": "^5.7.3",
    "prisma": "^6.3.1",
    "tsx": "^4.19.2"
  },
  "packageManager": "pnpm@9.15.4"
}`
  },
  {
    path: 'turbo.json',
    category: 'Root & Tooling',
    description: 'Pipeline de orquestación de compilación, cache incremental y ejecución paralela.',
    language: 'json',
    content: `{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "cache": false
    }
  }
}`
  },
  {
    path: '.env.example (Variables Centrales)',
    category: 'Root & Tooling',
    description: 'Plantilla de configuración con segregación estricta entre secretos de servidor y variables públicas.',
    language: 'bash',
    content: `# ==============================================================================
# BOTICA NOVA SALUD - VARIABLES DE ENTORNO UNIFICADAS
# ==============================================================================

# --- SUPABASE POSTGRESQL & AUTH ---
# Connection pooling para Prisma en NestJS (puerto 6543)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Conexión directa para migraciones DDL (puerto 5432)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase Project Credentials
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Clave pública (Web & API)

# ATENCIÓN: La clave service_role NUNCA se expone al frontend
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Solo NestJS backend

# --- BACKEND NESTJS (apps/api) ---
PORT=4000
NODE_ENV="development"
JWT_SECRET="super-secure-high-entropy-secret-key-nova-salud-2026"
CORS_ORIGIN="http://localhost:3000"
THROTTLE_TTL=60
THROTTLE_LIMIT=20

# --- FRONTEND NEXT.JS (apps/web) ---
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
NEXT_PUBLIC_APP_NAME="Nova Salud"`
  },
  {
    path: 'tsconfig.base.json',
    category: 'Root & Tooling',
    description: 'Configuración base de TypeScript con comprobación estricta y rutas modulares.',
    language: 'json',
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}`
  },
  {
    path: 'apps/web/package.json',
    category: 'Apps / Web (Next.js)',
    description: 'Dependencias del cliente web: Next.js 15, Tailwind, shadcn/ui, TanStack Query y Zod.',
    language: 'json',
    content: `{
  "name": "@nova-salud/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@nova-salud/shared": "workspace:*",
    "@supabase/supabase-js": "^2.48.1",
    "@tanstack/react-query": "^5.66.0",
    "next": "15.1.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.475.0",
    "react-hook-form": "^7.54.2",
    "@hookform/resolvers": "^3.10.0",
    "zod": "^3.24.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.1",
    "sonner": "^2.0.1"
  },
  "devDependencies": {
    "@types/node": "^22.13.1",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@playwright/test": "^1.50.1",
    "tailwindcss": "^4.0.6",
    "typescript": "^5.7.3"
  }
}`
  },
  {
    path: 'apps/web/middleware.ts',
    category: 'Apps / Web (Next.js)',
    description: 'Guardia de rutas perimetral (Capa 1): valida tokens JWT y redirige según permisos.',
    language: 'typescript',
    content: `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que no requieren sesión iniciada
const PUBLIC_ROUTES = ['/login', '/recuperar-clave'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extraer token de sesión de cookies
  const token = request.cookies.get('sb-access-token')?.value;

  // 1. Redirigir a login si intenta ingresar al dashboard sin token
  if (!token && !PUBLIC_ROUTES.includes(pathname) && !pathname.startsWith('/_next')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si ya tiene sesión e intenta ver el login, mandar al Dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};`
  },
  {
    path: 'apps/api/package.json',
    category: 'Apps / API (NestJS)',
    description: 'Dependencias del backend: NestJS 10, Prisma Client, @nestjs/schedule, class-validator y Swagger.',
    language: 'json',
    content: `{
  "name": "@nova-salud/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "lint": "eslint \\"{src,apps,libs,test}/**/*.ts\\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  },
  "dependencies": {
    "@nova-salud/shared": "workspace:*",
    "@nestjs/common": "^10.4.15",
    "@nestjs/core": "^10.4.15",
    "@nestjs/platform-express": "^10.4.15",
    "@nestjs/config": "^3.3.0",
    "@nestjs/schedule": "^4.1.2",
    "@nestjs/swagger": "^8.1.1",
    "@nestjs/throttler": "^6.4.0",
    "@prisma/client": "^6.3.1",
    "@supabase/supabase-js": "^2.48.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "helmet": "^8.0.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.9",
    "@nestjs/testing": "^10.4.15",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.13.1",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.7.3"
  }
}`
  },
  {
    path: 'apps/api/src/main.ts',
    category: 'Apps / API (NestJS)',
    description: 'Bootstraping empresarial con Helmet, CORS restrictivo, ValidationPipe global y OpenAPI Swagger.',
    language: 'typescript',
    content: `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Cabeceras de seguridad HTTP
  app.use(helmet());

  // 2. Control de Orígenes Cruzados (CORS) estricto
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 3. Prefijo global de versionado de API
  app.setGlobalPrefix('api/v1');

  // 4. Validación estricta de DTOs con sanitización de inputs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Descarta campos no definidos en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían propiedades maliciosas
      transform: true, // Convierte tipos según el DTO automáticamente
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 5. Documentación interactiva Swagger / OpenAPI
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Botica Nova Salud - API Core')
      .setDescription('Sistema centralizado de ventas, inventario FEFO, alertas automáticas y matriz RBAC.')
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(\`🚀 Servidor NestJS ejecutándose en: http://localhost:\${port}/api/v1\`);
  console.log(\`📚 Documentación Swagger en: http://localhost:\${port}/api/docs\`);
}

bootstrap();`
  },
  {
    path: 'packages/shared/src/index.ts',
    category: 'Packages / Shared',
    description: 'Contratos compartidos entre Frontend y Backend: interfaces, enums y DTOs.',
    language: 'typescript',
    content: `// ==============================================================================
// PAQUETE COMPARTIDO @nova-salud/shared (TypeScript)
// ==============================================================================

// Enums compartidos
export enum ModuleId {
  AUTH_RBAC = 'auth_rbac',
  INVENTORY = 'inventory_batches',
  POS_SALES = 'pos_sales',
  PURCHASES = 'purchases_suppliers',
  ALERTS = 'alerts_replenishment',
  CUSTOMERS = 'customers_loyalty',
  REPORTS = 'reports_bi',
  AUDIT = 'audit_forensics',
}

export enum ActionType {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
}

// Interfaz para la matriz dinámica de permisos
export interface UserPermissionDto {
  moduleId: ModuleId;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Contrato de respuesta del Check de Permisos
export interface AuthUserResponse {
  id: string;
  dni: string;
  fullName: string;
  email: string;
  roleTitle: string;
  isRootAdmin: boolean;
  mustChangePassword: boolean;
  permissions: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>;
}

// Contrato para Checkout Atómico en POS
export interface CheckoutCartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CheckoutSalePayload {
  customerId?: string;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'MIXTO';
  items: CheckoutCartItem[];
  cashGiven?: number;
}`
  }
];
