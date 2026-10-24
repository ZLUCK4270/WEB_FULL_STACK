# Botica Nova Salud - Sistema de Gestión Farmacéutica

Sistema web integral full stack para la automatización y control centralizado de **inventario por lotes (FEFO)**, **punto de venta (POS)** con sugerencia de genéricos y **atención al cliente** para la botica comercial Nova Salud.

---

## 1. Arquitectura y Tecnologías

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS v4 + Axios + Lucide Icons.
- **Backend**: Node.js + Express + SQL Server (`mssql`) + JWT + Bcryptjs.
- **Base de Datos**: Microsoft SQL Server 2022 (Esquema relacional con identificadores UUID, claves foráneas e integridad transaccional).
- **Contenedores**: Docker & Docker Compose para despliegue unificado.

---

## 2. Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker & Docker Compose** (opcional, para ejecución con contenedores)
- Instancia de **Microsoft SQL Server** (si se ejecuta en local fuera de Docker)

---

## 3. Configuración Inicial

### 3.1. Clonar y Configurar Variables de Entorno

```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd ../frontend
cp .env.example .env
```

#### Variables críticas del Backend (`backend/.env`):
- `PORT`: Puerto del servidor API (por defecto `8081`).
- `JWT_SECRET`: Secreto criptográfico de firma de tokens (cambiar en producción por uno de >= 32 caracteres).
- `JWT_EXPIRES_IN`: Duración de sesión (`24h`).
- `DB_USER`: Usuario de SQL Server (`novasalud`).
- `DB_PASSWORD`: Contraseña de SQL Server.
- `DB_DATABASE`: Nombre de la base de datos (`NovaSalud`).
- `DB_SERVER`: Host de SQL Server (`localhost` o nombre del servicio Docker).
- `DB_PORT`: Puerto de conexión (`1433`).
- `CORS_ORIGIN`: Origen permitido para peticiones web (`*` en dev, dominio en producción).

#### Variables del Frontend (`frontend/.env`):
- `VITE_API_URL`: URL base del API (`http://localhost:8081/api`).

---

## 4. Base de Datos (Scripts SQL en Orden)

Si se inicializa una base de datos SQL Server manualmente, ejecutar en este orden estricto dentro de la carpeta `database/`:

1. `01_schema.sql` — Creación de tablas, restricciones foráneas e índices.
2. `02_seed.sql` — Datos iniciales de categorías, laboratorios, proveedores, productos y lotes.
3. `03_migration.sql` — Campos de control, estados y configuración extendida.
4. `03_seed_auth.sql` — Usuarios del sistema con claves hasheadas con bcrypt (cost factor 10) y matriz RBAC.

### Credenciales de Acceso Semilla:
| Rol | DNI | Contraseña | Perfil |
| :--- | :--- | :--- | :--- |
| **Administrador** | `10203040` | `regente2026` | Químico Farmacéutico / Regente |
| **Vendedor** | `71829304` | `caja2026` | Técnico en Farmacia / Cajero |
| **Almacén** | `76543210` | `almacen2026` | Encargado de Almacén |

---

## 5. Ejecución en Desarrollo (Local)

### Backend:
```bash
cd backend
npm install
npm run dev
# Servidor escuchando en http://localhost:8081
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
# Aplicación web lista en http://localhost:3000
```

---

## 6. Despliegue con Docker Compose

Levanta automáticamente Microsoft SQL Server 2022, el Backend API y compila el entorno:

```bash
docker compose up -d --build
```

Para verificar logs:
```bash
docker compose logs -f backend
```

---

## 7. Módulos Implementados

1. **Autenticación y Seguridad (RBAC)**: Login por DNI y clave cifrada con bcrypt, control de sesiones JWT, cabeceras HTTP de protección (XSS, CSP, nosniff, HSTS) y permisos basados en rol (`admin`, `vendedor`, `almacen`).
2. **Punto de Venta (POS)**: Búsqueda reactiva de productos, sugerencia de genéricos equivalentes por DCI en mostrador, emisión de comprobantes (Boleta/Factura), selección de clientes y cobro con Efectivo, Yape y Tarjeta.
3. **Despacho Automático FEFO**: Asignación y descuento estricto de unidades priorizando los lotes con fecha de vencimiento más próxima (*First Expired, First Out*) con bloqueos transaccionales a nivel de fila (`UPDLOCK/HOLDLOCK`).
4. **Historial de Ventas**: Consulta, filtrado por fecha o código de comprobante, e inspección detallada de lotes dispensados por cada ítem.
5. **Inventario y Lotes**: Catálogo de productos, umbral de stock mínimo configurable, semáforos de reposición, filtros de productos críticos y ajuste manual de stock justificado.
6. **Alertas de Stock**: Notificaciones de quiebre de stock y lotes próximos a vencer con resolución en un clic.
7. **Atención y Clientes**: Directorio de clientes con tipo y número de documento (DNI/RUC), historial de compras y contacto.

---

## 8. Recomendación de Hosting para Producción

- **Base de Datos**: Azure SQL Database o AWS RDS for SQL Server (alta disponibilidad y respaldos automáticos gestionados).
- **Backend**: Container Apps (Azure), Render o Railway (despliegue en contenedor Docker con variables de entorno protegidas).
- **Frontend**: Vercel o Cloudflare Pages (distribución global por CDN, HTTPS automático y compresión Brotli/Gzip).
