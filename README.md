# 🏥 Botica Nova Salud — Sistema Web de Gestión Farmacéutica (ERP + POS + FEFO + RBAC)

Plataforma Full Stack web diseñada para la gestión centralizada y automatizada de inventario por lotes (**FEFO — First-Expire, First-Out**), Punto de Venta (POS) ágil con buscador de sustitutos bioequivalentes (DCI), control de caja por turnos, compras/reposición automática, alertas en tiempo real y auditoría forense bajo estándares **DIGEMID / BPA / SUNAT**.

---

## 🏗️ Arquitectura y Stack Tecnológico

| Capa | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Frontend (SPA)** | React 19, TypeScript 7 (`strict`), Vite 8, Tailwind CSS v4, Lucide Icons, Axios | Interfaz clínica adaptativa (Modo Claro/Oscuro), panel lateral colapsable sin superposición, POS con atajos (`F2`, `F4`, `ESC`) |
| **Backend (API REST)** | Node.js 22, Express 4, JWT (`jsonwebtoken`), `bcryptjs`, Rate Limiter en memoria | Autenticación segura, RBAC granular por módulo/acción, motor transaccional FEFO, cabeceras OWASP |
| **Datos y Esquema SQL** | Microsoft SQL Server 2022 (`database/*.sql`) + Adaptador Transaccional (`backend/src/config/db.js`) | 18 tablas relacionales en español, semillas pre-cargadas con catálogo farmacéutico peruano real |
| **DevOps & QA** | Docker Multi-Stage, Nginx Reverse Proxy, Docker Compose, GitHub Actions CI, `node:test` | Contenedores aislados (`3080:80` y `8081:8081`), pruebas de integración automatizadas |

---

## 📂 Estructura del Proyecto

```text
WEB_FULL_STACK/
├── .github/workflows/ci.yml   # Pipeline CI/CD (Install, DB Check, Typecheck, Tests, Build)
├── backend/                   # Servidor API REST Express (CommonJS)
│   ├── src/
│   │   ├── config/db.js       # Adaptador SQL transaccional + datos semilla realistas
│   │   ├── controllers/       # Controladores (auth, sales, inventory, cash, purchases, alerts, audit, customers, backups, dashboard)
│   │   ├── middleware/        # authMiddleware (JWT), rbacMiddleware, rateLimiter
│   │   ├── routes/            # Enrutadores modulares bajo /api/*
│   │   └── services/          # fefoService.js (despacho y anulación FEFO) y backupService.js
│   ├── Dockerfile             # Imagen Node 22 Alpine para producción
│   └── server.js              # Punto de entrada API (:8081)
├── database/                  # Scripts T-SQL para Microsoft SQL Server
│   ├── 01_schema.sql          # DDL completo de las 18 tablas e índices
│   ├── 02_seed.sql            # Datos semilla iniciales y matriz RBAC
│   ├── 03_migration.sql       # Migraciones de autenticación y campos extendidos
│   └── 03_seed_auth.sql       # Hashes bcrypt de usuarios iniciales
├── src/                       # Frontend React 19 + TypeScript + Tailwind v4
│   ├── components/            # Vistas modulares (dashboard, pos, sales, inventory, cash, purchases, alerts, customers, audit, auth, layout)
│   ├── context/               # PharmacyContext.tsx (estado global sincronizado)
│   ├── i18n/                  # Contexto de idioma y diccionario ES/EN
│   ├── services/              # Cliente Axios con interceptores JWT (api.js, pharmacyApi.js)
│   └── types/                 # Contratos TypeScript (pharmacy.ts)
├── tests/
│   └── api.test.mjs           # Suite automatizada de pruebas QA (Salud, JWT, RBAC, FEFO, Alertas)
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
| `npm test` | `node --test tests/api.test.mjs` | Ejecuta las pruebas de integración de API, JWT, RBAC y motor FEFO |
| `npm run format` | `node -e ...` | Verifica formato y finales de línea UTF-8 LF |
| `npm run db:generate` | `node -e ...` | Valida el esquema SQL (`database/01_schema.sql`) y el adaptador |
| `npm run db:migrate` | `node -e ...` | Verifica sincronización de migraciones (`database/03_migration.sql`) |
| `npm run db:seed` | `node -e ...` | Verifica los datos semilla cargados (productos, lotes FEFO, usuarios) |

---

## 🔑 Credenciales de Prueba Pre-cargadas (RBAC)

| Rol | Usuario | DNI | Contraseña | Permisos Habilitados |
| :--- | :--- | :--- | :--- | :--- |
| **Q.F. Regente / Admin** | Carlos Alberto Mendoza Vera | `10203040` | `regente2026` | Acceso total a los 9 módulos + Respaldos y Auditoría |
| **Cajero POS** | Juan Manuel Pérez García | `71829304` | `caja2026` | Punto de Venta, Historial Ventas, Caja y Turnos, Clientes |
| **Jefe de Almacén** | Luis Enrique Torres Valdivia | `76543210` | `almacen2026` | Panel General, Inventario y Lotes FEFO, Compras, Alertas |

---

## 🚀 Instalación y Despliegue Paso a Paso

### Opción A: Despliegue con Docker Compose (Recomendado para Producción / Evaluación)
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
   npm --prefix backend install
   ```
2. Verificar tipos, pruebas automatizadas y compilación de producción:
   ```powershell
   npm run lint
   npm test
   npm run build
   ```
3. Arrancar en modo producción:
   ```powershell
   npm start
   ```
   El sistema estará disponible en **`http://localhost:3000`**.
