# 🏥 Botica Nova Salud — Sistema Web de Gestión Farmacéutica (ERP + POS + FEFO + RBAC)

Plataforma Full Stack web diseñada para la gestión centralizada y automatizada de inventario por lotes (**FEFO — First-Expire, First-Out**), Punto de Venta (POS) ágil con buscador de sustitutos bioequivalentes (DCI), control de caja por turnos, compras/reposición automática, alertas en tiempo real, gestión de empleados con rangos de acceso (RBAC) y auditoría forense bajo estándares **DIGEMID / BPA / SUNAT**.

---

## 🏗️ Arquitectura y Stack Tecnológico

| Capa | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Frontend (SPA)** | React 19, TypeScript 7 (`strict`), Vite 8, Tailwind CSS v4, Lucide Icons, Axios | Interfaz clínica adaptativa (Modo Claro/Oscuro), panel lateral colapsable acoplado, POS con atajos (`F2`, `F4`, `ESC`) y módulo de administración de personal |
| **Backend (API REST)** | Node.js 22, Express 4, JWT (`jsonwebtoken`), `bcryptjs`, Rate Limiter en memoria | Autenticación segura estándar, control de acceso RBAC granular por rol/módulo, motor transaccional FEFO, cabeceras OWASP |
| **Datos y Esquema SQL** | Microsoft SQL Server 2022 (`database/*.sql`) + Adaptador Transaccional (`backend/src/config/db.js`) | 18 tablas relacionales en español, semillas pre-cargadas con catálogo farmacéutico peruano real y usuarios con contraseñas encriptadas con bcrypt |
| **DevOps & QA** | Docker Multi-Stage, Nginx Reverse Proxy, Docker Compose, GitHub Actions CI, `node:test` | Contenedores aislados (`3080:80` y `8081:8081`), suite de 7 pruebas de integración automatizadas |

---

## 📂 Estructura del Proyecto

```text
WEB_FULL_STACK/
├── .github/workflows/ci.yml   # Pipeline CI/CD (Install, DB Check, Typecheck, Tests, Build)
├── backend/                   # Servidor API REST Express (CommonJS)
│   ├── src/
│   │   ├── config/db.js       # Adaptador SQL transaccional + datos semilla realistas
│   │   ├── controllers/       # Controladores (auth, users, sales, inventory, cash, purchases, alerts, audit, customers, backups, dashboard)
│   │   ├── middleware/        # authMiddleware (JWT), rbacMiddleware, rateLimiter
│   │   ├── routes/            # Enrutadores modulares bajo /api/* (/auth, /users, /sales, etc.)
│   │   └── services/          # fefoService.js (despacho y anulación FEFO) y backupService.js
│   ├── Dockerfile             # Imagen Node 22 Alpine para producción
│   └── server.js              # Punto de entrada API (:8081)
├── database/                  # Scripts T-SQL para Microsoft SQL Server
│   ├── 01_schema.sql          # DDL completo de las 18 tablas e índices
│   ├── 02_seed.sql            # Datos semilla iniciales y matriz RBAC
│   ├── 03_migration.sql       # Migraciones de autenticación y campos extendidos
│   └── 03_seed_auth.sql       # Hashes bcrypt de usuarios iniciales
├── src/                       # Frontend React 19 + TypeScript + Tailwind v4
│   ├── components/            # Vistas modulares:
│   │   ├── auth/              # LoginView.tsx (Login limpio estándar sin datos predeterminados en pantalla)
│   │   ├── users/             # UsersManagementView.tsx (Gestión de Personal & Rangos RBAC)
│   │   ├── dashboard/         # DashboardView.tsx (Métricas y KPIs en tiempo real)
│   │   ├── pos/               # PointOfSaleView.tsx (Punto de Venta ágil, FEFO, sustitutos DCI)
│   │   ├── sales/             # SalesHistoryView.tsx (Historial y anulación con reversión de stock)
│   │   ├── inventory/         # InventoryBatchesView.tsx (Stock, lotes FEFO, kárdex y ajustes)
│   │   ├── cash/              # CashRegisterView.tsx (Apertura, arqueo y cierre por turnos)
│   │   ├── purchases/         # PurchasesView.tsx (Compras y sugerencias de reposición automática)
│   │   ├── alerts/            # ActiveAlertsView.tsx (Alertas de stock mínimo, crítico y vencimiento)
│   │   ├── customers/         # CustomersView.tsx (Directorio de clientes y pacientes)
│   │   ├── audit/             # AuditView.tsx (Bitácora forense de auditoría)
│   │   └── layout/            # SidebarDrawer.tsx, MobileNavigationDock.tsx, Header.tsx
│   ├── context/               # PharmacyContext.tsx (estado global sincronizado)
│   ├── i18n/                  # Contexto de idioma y diccionario ES/EN
│   ├── services/              # Cliente Axios con interceptores JWT (api.js, pharmacyApi.js)
│   └── types/                 # Contratos TypeScript (pharmacy.ts)
├── tests/
│   └── api.test.mjs           # Suite de 7 pruebas QA (Salud, JWT, RBAC, FEFO, Alertas, Usuarios)
├── Dockerfile                 # Build Multi-Stage Frontend (Node 22 -> Nginx Alpine)
├── docker-compose.yml         # Orquestación completa (sqlserver + backend + frontend)
├── nginx.conf                 # Servidor SPA y Reverse Proxy (/api -> backend:8081)
└── server.ts                  # Servidor unificado (Vite middleware en dev / estáticos en prod)
```

---

## ⚙️ Variables de Entorno (`.env.example`)

Copie `.env.example` a `.env` en la raíz del proyecto:

| Variable | Entorno | Descripción | Valor por defecto / Ejemplo |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Servidor | Modo de ejecución (`development` / `production`) | `development` |
| `PORT` | Servidor | Puerto HTTP del servidor API o unificado | `8081` (API) / `3000` (`server.ts`) |
| `CORS_ORIGIN` | Servidor | Orígenes permitidos separados por coma | `http://localhost:3080` |
| `JWT_SECRET` | Servidor (Secreto) | Clave de firma de tokens JWT (**nunca exponer en cliente**) | `reemplazar_por_secreto_seguro` |
| `JWT_EXPIRES_IN` | Servidor | Tiempo de expiración del token JWT | `24h` |
| `DB_SERVER` | Servidor | Host de SQL Server | `localhost` o `sqlserver` |
| `DB_PORT` | Servidor | Puerto de SQL Server | `1433` |
| `DB_USER` | Servidor | Usuario de base de datos | `sa` |
| `DB_PASSWORD` | Servidor (Secreto) | Contraseña de SQL Server | `NovaSalud2026!` |
| `DB_DATABASE` | Servidor | Nombre de la base de datos | `NovaSalud` |
| `DB_ENCRYPT` | Servidor | Cifrado TLS de conexión SQL | `false` |
| `VITE_API_URL` | Cliente (Pública) | Ruta base de la API consumida por React | `/api` |
| `DISABLE_HMR` | Desarrollo | Desactiva Hot Module Replacement en entornos cloud | `false` |

---

## 📜 Scripts Disponibles (`package.json`)

| Script | Comando | Descripción |
| :--- | :--- | :--- |
| `npm run dev` | `tsx server.ts` | Inicia el servidor unificado en modo desarrollo (API + Vite HMR) |
| `npm run build` | `vite build` | Compila el bundle optimizado de producción en `/dist` |
| `npm start` | `tsx server.ts --production` | Inicia el servidor en modo producción sirviendo `/dist` y `/api` |
| `npm run lint` | `tsc --noEmit` | Verificación estática de tipos con TypeScript (`strict: true`) |
| `npm run typecheck` | `tsc --noEmit` | Alias de verificación estricta de tipos |
| `npm test` | `node --test tests/api.test.mjs` | Ejecuta las 7 pruebas de integración (Salud, JWT, RBAC, FEFO, Alertas, Usuarios y Permisos) |
| `npm run format` | `node -e ...` | Verifica formato y codificación UTF-8 |
| `npm run db:generate` | `node -e ...` | Valida el esquema SQL (`database/01_schema.sql`) y el adaptador |
| `npm run db:migrate` | `node -e ...` | Verifica sincronización de migraciones (`database/03_migration.sql`) |
| `npm run db:seed` | `node -e ...` | Verifica los datos semilla cargados (productos, lotes FEFO, usuarios) |

---

## 🔐 Matriz de Rangos de Acceso (RBAC) y Credenciales de Acceso

La pantalla de inicio de sesión es **estándar y limpia**, sin usuarios pre-rellenados ni botones demostrativos expuestos públicamente. Para ingresar, los usuarios utilizan sus credenciales asignadas:

| Rango de Acceso (Rol) | Empleado por Defecto | DNI | Contraseña | Módulos y Permisos Habilitados |
| :--- | :--- | :--- | :--- | :--- |
| **Q.F. Regente / Administrador General** | Carlos Alberto Mendoza Vera | `10203040` | `regente2026` | **Acceso total a los 10 módulos:** Dashboard, POS, Ventas, Inventario y Lotes FEFO, Caja, Compras, Alertas, Clientes, **Personal y Accesos RBAC**, Auditoría. Puede crear y editar usuarios. |
| **Cajero POS / Vendedor Mostrador** | Juan Manuel Pérez García | `71829304` | `caja2026` | Punto de Venta (POS), Historial de Ventas, Caja Registradora / Arqueo y Clientes. Restringido para compras, inventario admin y personal. |
| **Encargado de Almacén / Control BPA** | Luis Enrique Torres Valdivia | `76543210` | `almacen2026` | Panel de Control, Inventario y Lotes FEFO, Compras y Reposición, Alertas de Stock y Vencimiento. Restringido para ventas y caja. |

### 👥 Creación de Nuevos Empleados por el Administrador
Desde el módulo **"Personal y accesos"** (`/api/users`), el Administrador General puede:
1. Crear nuevos usuarios especificando DNI (8 dígitos), nombres, apellidos, correo, teléfono, cargo y contraseña inicial (encriptada con `bcrypt`).
2. Asignar el **Rango de Acceso (Rol)** deseado (`admin`, `vendedor`, `almacen`), con configuración automática de los permisos del sistema.
3. Editar datos personales, modificar rangos de acceso o restablecer contraseñas de cualquier empleado.
4. Activar o desactivar cuentas en tiempo real (bloqueando de inmediato su acceso al sistema).

---

## 🚀 Instalación y Despliegue Paso a Paso

> 💡 **¿Buscas desplegar en la nube 100% gratis?** Consulta la guía paso a paso en [**DOCKER_Y_DESPLIEGUE.md**](./DOCKER_Y_DESPLIEGUE.md).

### Opción A: Despliegue con Docker Compose (Recomendado para Evaluación Completa)
1. Construir y levantar los 3 contenedores (`sqlserver`, `backend`, `frontend`):
   ```powershell
   docker compose up -d --build
   ```
2. Abrir en el navegador: **`http://localhost:3080`**
3. Verificar estado de salud de la API: **`http://localhost:8081/api/health`**

### Opción B: Ejecución Local desde Cero (Node.js 22+)
1. Instalar dependencias:
   ```powershell
   npm install
   ```
2. Ejecutar pruebas automatizadas y compilación de producción:
   ```powershell
   npm run lint
   npm test
   npm run build
   ```
3. Iniciar el servidor unificado en modo producción:
   ```powershell
   npm start
   ```
   El sistema estará disponible en **`http://localhost:3000`**.
