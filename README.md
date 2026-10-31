# Botica Nova Salud S.A.C. — Sistema Integral de Gestión Farmacéutica

Sistema web **Full-Stack** diseñado para la administración integral de farmacias y boticas bajo normativas sanitarias peruanas (**DIGEMID**). Incorpora despacho automático por **FEFO** (_First Expired, First Out_), Punto de Venta (POS), control de Kárdex, arqueo de caja, gestión de compras, alertas inteligentes en tiempo real y auditoría forense con control de acceso basado en roles (**RBAC**).

---

## 1. Arquitectura y Stack Tecnológico

### Frontend (Cliente SPA)

- **Framework:** React 19 + TypeScript + Vite 8
- **Estilos y UI:** Tailwind CSS v4, Lucide React (iconografía), Motion (animaciones fluidas)
- **Visualización y Reportes:**
  - `Recharts`: Gráficos estadísticos en el Panel de Control (ventas, stock, rotación).
  - `jsPDF` + `jspdf-autotable`: Emisión de comprobantes (Boletas/Facturas en PDF) y reportes de auditoría/inventario.
  - `xlsx`: Exportación de reportes gerenciales, kárdex y cierres de caja a Microsoft Excel.
- **Estado Global e Internacionalización:** Context API (`PharmacyContext` y `LanguageProvider`).

### Backend (API RESTful)

- **Entorno:** Node.js + Express.js
- **Seguridad y Autenticación:**
  - **JWT (`jsonwebtoken`):** Sesiones firmadas con expiración configurable (`24h`).
  - **Encriptación (`bcryptjs`):** Hash seguro de contraseñas.
  - **Matriz RBAC:** Middleware de permisos granulares por módulo (`puede_ver`, `puede_crear`, `puede_editar`, `puede_eliminar`).
- **Servidor Unificado (`server.ts`):** Integra el router `/api` del backend con Vite en modo middleware para desarrollo y sirve los archivos estáticos compilados (`dist/`) en producción.

### Base de Datos

- **Motor Principal (Producción / Docker):** Microsoft SQL Server 2022 Express (`database/01_schema.sql`, `02_seed.sql`).
- **Motor Adaptativo En Memoria (`backend/src/config/db.js`):** Adaptador SQL in-memory pre-poblado que permite ejecutar y demostrar el sistema instantáneamente sin requerir una instancia activa de SQL Server en entornos de desarrollo rápido o contenedores ligeros gratuitos.

---

## 2. Módulos Principales del Sistema

| Módulo                    | Identificador | Funcionalidades Clave                                                                                                                                                                      |
| :------------------------ | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Panel de Control**      | `dashboard`   | KPIs financieros, ventas del día, productos críticos, lotes por vencer y gráficos interactivos.                                                                                            |
| **Punto de Venta (POS)**  | `pos`         | Despacho automático **FEFO** (prioriza lotes próximos a vencer y bloquea lotes vencidos), cálculo de IGV (18%), pagos mixtos (Efectivo, Yape/Plin, Tarjeta) y emisión de comprobantes PDF. |
| **Historial de Ventas**   | `sales`       | Consulta de transacciones, reimpresión de tickets/boletas, anulación con retorno automático de stock al lote original y exportación a Excel/PDF.                                           |
| **Inventario y Lotes**    | `inventory`   | Catálogo de medicamentos (registro sanitario DIGEMID, genérico/comercial, condición de receta), trazabilidad por lotes, fechas de vencimiento y Kárdex de movimientos.                     |
| **Caja Registradora**     | `cash`        | Apertura de turno con fondo inicial, registro de ingresos/egresos extraordinarios, cálculo de efectivo esperado vs. contado y arqueo de cierre.                                            |
| **Compras y Reposición**  | `purchases`   | Órdenes de compra a droguerías/laboratorios, recepción de mercadería con creación automática de lotes y sugerencias de reposición por stock mínimo.                                        |
| **Centro de Alertas**     | `alerts`      | Motor automático que detecta `SIN_STOCK`, `STOCK_BAJO`, `VENCIMIENTO_CERCA` (≤ 30 días) y `VENCIDO`, con auto-resolución al reponer inventario.                                            |
| **Clientes**              | `customers`   | Padrón de clientes por DNI/RUC, historial de compras y datos de contacto.                                                                                                                  |
| **Auditoría y Seguridad** | `audit`       | Bitácora forense inmutable de acciones críticas, matriz de usuarios/roles (**RBAC**) y generación de respaldos JSON del estado del sistema.                                                |

---

## 3. Estructura del Proyecto

```text
WEB_FULL_STACK/
├── backend/                  # API REST Express + Controladores y Servicios
│   ├── src/
│   │   ├── config/db.js      # Adaptador SQL / In-Memory DB con motor de alertas
│   │   ├── controllers/      # Lógica de negocio por módulo (ventas, FEFO, caja, etc.)
│   │   ├── middlewares/      # Autenticación JWT, RBAC y auditoría
│   │   ├── routes/           # Definición de endpoints REST (/api/*)
│   │   └── services/         # Servicios transversales (alertas, respaldos)
│   ├── Dockerfile            # Imagen Docker del backend (Node 18 Alpine)
│   └── server.js             # Punto de entrada independiente del API (puerto 8081)
├── database/                 # Scripts SQL para Microsoft SQL Server
│   ├── 01_schema.sql         # Definición de tablas, claves foráneas e índices
│   ├── 02_seed.sql           # Datos semilla (categorías, laboratorios, productos)
│   └── 03_seed_auth.sql      # Usuarios iniciales y matriz de permisos RBAC
├── src/                      # Código fuente del Frontend (React + TypeScript)
│   ├── components/           # Vistas modulares (pos, inventory, sales, cash, etc.)
│   ├── context/              # Estado global (PharmacyContext.tsx)
│   ├── services/             # Cliente HTTP Axios (api.js, pharmacyApi.js)
│   ├── types/                # Definiciones TypeScript (pharmacy.ts)
│   └── App.tsx               # Shell principal, navegación por roles y layout
├── server.ts                 # Servidor Full-Stack unificado (Express + Vite/Static)
├── docker-compose.yml        # Orquestación multicontenedor (SQL Server + Backend + Frontend)
└── package.json              # Dependencias y scripts del proyecto unificado
```

---

## 4. Credenciales de Acceso de Prueba (RBAC)

El sistema cuenta con tres perfiles preconfigurados para validar la segregación de funciones:

| Rol / Cargo                   | DNI (Usuario) | Contraseña    | Módulos Habilitados                                       |
| :---------------------------- | :------------ | :------------ | :-------------------------------------------------------- |
| **Administrador Propietario** | `10203040`    | `regente2026` | Acceso total (9 módulos, incluyendo Auditoría y RBAC)     |
| **Cajero / Mostrador**        | `71829304`    | `caja2026`    | Dashboard, POS, Historial Ventas, Caja, Clientes, Alertas |
| **Almacén y Logística**       | `76543210`    | `almacen2026` | Dashboard, Inventario y Lotes, Compras, Alertas           |

---

## 5. Instalación y Ejecución Local

### Requisitos Previos

- **Node.js** v18 o superior (recomendado v20/v22)
- **npm** v9+

### Pasos para Iniciar en Modo Desarrollo Unificado

1. Instalar las dependencias en la raíz del proyecto:
   ```bash
   npm install
   ```
2. Iniciar el servidor unificado (Frontend + Backend en el mismo puerto):
   ```bash
   npm run dev
   ```
3. Abrir en el navegador:
   ```text
   http://localhost:3000
   ```

### Scripts Disponibles en `package.json`

- `npm run dev`: Levanta el servidor Express + Vite con Hot Module Replacement (HMR) en `http://localhost:3000`.
- `npm run build`: Compila el frontend de React optimizado para producción en la carpeta `dist/`.
- `npm start`: Ejecuta el servidor en modo producción (`NODE_ENV=production tsx server.ts`).
- `npm run lint`: Verifica el tipado estático con TypeScript (`tsc --noEmit`).
