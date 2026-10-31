# Botica Nova Salud — Sistema de gestión de inventario, ventas y atención al cliente

> ⚠️ **NOTA DE BORRADOR — eliminar al terminar la Fase 10 de `PROMPT_MAESTRO.md`.**
> Este README describe el **estado objetivo** del proyecto (Docker con base de datos autoinicializada, alertas automáticas, caja, compras, etc.). El repositorio actual **todavía no cumple** todo lo que aquí se describe: varios comandos solo funcionarán después de aplicar el prompt maestro. Cada comando debe ejecutarse en un clon limpio antes de dar este documento por válido.

Aplicación web para la botica **Nova Salud** que centraliza y automatiza el **inventario**, las **ventas** y la **atención al cliente**, con stock en tiempo real y **alertas automáticas de reposición**.

---

## Contenido

1. [¿Qué hace?](#qué-hace)
2. [Requisitos](#requisitos)
3. [Inicio rápido con Docker (recomendado)](#inicio-rápido-con-docker-recomendado)
4. [Ejecución local para desarrollo](#ejecución-local-para-desarrollo)
5. [Usuarios de demostración](#usuarios-de-demostración)
6. [Variables de entorno](#variables-de-entorno)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [API principal](#api-principal)
9. [Pruebas](#pruebas)
10. [Tu primera venta en 3 pasos](#tu-primera-venta-en-3-pasos)
11. [Solución de problemas](#solución-de-problemas)
12. [Seguridad antes de producción](#seguridad-antes-de-producción)

---

## ¿Qué hace?

| Módulo | Para qué sirve |
|---|---|
| **Punto de venta (POS)** | Cobrar rápido: búsqueda o lector de código de barras, descuento automático de stock por **FEFO** (se vende primero lo que vence antes), efectivo/Yape/tarjeta, vuelto, ticket imprimible. |
| **Historial de ventas** | Registro de cada venta con cajero, cliente, método de pago y lotes despachados; anulación con reposición de stock. |
| **Inventario y lotes** | Productos, lotes con vencimiento, kárdex (historial de movimientos), ajustes con motivo, sustitutos por genérico. |
| **Alertas y reposición** | Avisos **automáticos** de sin stock, stock bajo, vencimiento próximo y vencido; sugerencias de compra agrupadas por proveedor. |
| **Compras y proveedores** | Órdenes de compra, recepción total o parcial con lote y vencimiento reales. |
| **Caja** | Apertura de turno, ingresos/egresos, cierre con arqueo (esperado vs contado). |
| **Clientes** | Fichas, búsqueda por DNI/RUC, historial de compras. |
| **Usuarios y permisos** | Matriz de permisos por módulo y acción; cambio de contraseña obligatorio en el primer ingreso. |
| **Auditoría y respaldos** | Bitácora con usuario, IP y detalle; respaldos nativos de la base de datos. |

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4 · Node.js + Express 4 · Microsoft SQL Server 2022 · Docker.

---

## Requisitos

**Para Docker (recomendado):**
- Docker Desktop (Windows/macOS) o Docker Engine + plugin Compose v2 (Linux). Verifica con `docker compose version`.
- **≥ 4 GB de RAM libres** (SQL Server necesita al menos 2 GB).
- Windows: backend **WSL2** de Docker Desktop.

**Para ejecución local sin contenedores de aplicación:**
- Node.js **22 LTS o superior** y npm.
- Una instancia de SQL Server 2019+ (lo más simple: la de Docker, ver más abajo).
- Opcional: `sqlcmd` o SSMS / extensión *SQL Server (mssql)* de VS Code para inspeccionar la BD.

---

## Inicio rápido con Docker (recomendado)

```bash
# 1) Clonar
git clone https://github.com/ZLUCK4270/WEB_FULL_STACK.git
cd WEB_FULL_STACK

# 2) Crear tu .env con secretos fuertes generados
cp .env.example .env
./scripts/gen-secrets.sh          # escribe MSSQL_SA_PASSWORD, DB_PASSWORD y JWT_SECRET en .env

# 3) Levantar todo (la primera vez descarga imágenes y crea la BD: ~2-3 min)
docker compose up -d --build

# 4) Comprobar que todo esté "healthy"
docker compose ps
```

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
.\scripts\gen-secrets.ps1
docker compose up -d --build
docker compose ps
```

Cuando `docker compose ps` muestre `db`, `backend` y `frontend` como **healthy** (y `db-init` como *exited 0*):

| Qué | Dirección |
|---|---|
| **Aplicación** | <http://localhost:3000> |
| Estado del backend | <http://localhost:3000/api/health> |
| SQL Server (solo desde tu equipo) | `localhost,1433` |

Ingresa con un [usuario de demostración](#usuarios-de-demostración). Para cargar datos de ejemplo (≈ 30 productos con lotes, alertas y clientes) pon `SEED_DEMO=true` en `.env` **antes** del primer arranque.

> 📘 Operación diaria, respaldos, modo desarrollo, producción con HTTPS y errores frecuentes: **[README.docker.md](README.docker.md)**.

---

## Ejecución local para desarrollo

### Opción A — Base de datos en Docker, aplicación en tu máquina (la más cómoda)

```bash
cp .env.example .env && ./scripts/gen-secrets.sh
docker compose up -d db db-init          # solo BD + creación/siembra automática
```

Backend (terminal 1):

```bash
cd backend
cp .env.example .env                     # DB_SERVER=localhost, DB_USER=novasalud, DB_PASSWORD = el de la raíz
npm install
npm run dev                              # http://localhost:8081  (nodemon)
```

Frontend (terminal 2):

```bash
cd frontend
cp .env.example .env                     # VITE_API_URL=http://localhost:8081/api
npm install
npm run dev                              # http://localhost:3000  (Vite, recarga en caliente)
```

### Opción B — Con una instancia de SQL Server que ya tienes

1. Crea la base de datos, el usuario de aplicación y aplica el esquema y los datos base:

   ```bash
   sqlcmd -S localhost -U sa -P '<tu_clave_sa>' -C -Q "IF DB_ID('NovaSalud') IS NULL CREATE DATABASE NovaSalud;"

   sqlcmd -S localhost -U sa -P '<tu_clave_sa>' -C -d NovaSalud -Q "
   IF SUSER_ID('novasalud') IS NULL CREATE LOGIN novasalud WITH PASSWORD = '<clave_de_la_app>', CHECK_POLICY = ON;
   IF USER_ID('novasalud') IS NULL CREATE USER novasalud FOR LOGIN novasalud;
   ALTER ROLE db_datareader ADD MEMBER novasalud;
   ALTER ROLE db_datawriter ADD MEMBER novasalud;
   ALTER ROLE db_backupoperator ADD MEMBER novasalud;
   GRANT EXECUTE TO novasalud;"

   for f in database/migrations/*.sql database/seeds/010_base.sql; do
     sqlcmd -S localhost -U sa -P '<tu_clave_sa>' -C -d NovaSalud -b -i "$f" || break
   done
   ```

   En PowerShell, el bucle es:

   ```powershell
   Get-ChildItem database\migrations\*.sql | Sort-Object Name | ForEach-Object {
     sqlcmd -S localhost -U sa -P $env:MSSQL_SA_PASSWORD -C -d NovaSalud -b -i $_.FullName
   }
   sqlcmd -S localhost -U sa -P $env:MSSQL_SA_PASSWORD -C -d NovaSalud -b -i database\seeds\010_base.sql
   ```

2. Ajusta `backend/.env` con tu servidor y continúa como en la Opción A (backend y frontend).

### Scripts disponibles

| Carpeta | Comando | Hace |
|---|---|---|
| `backend` | `npm run dev` | API con recarga automática |
| `backend` | `npm start` | API en modo producción |
| `backend` | `npm test` | Pruebas de integración (requiere SQL Server de pruebas) |
| `frontend` | `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `frontend` | `npm run build` | Compilación de producción (`dist/`) |
| `frontend` | `npm run lint` | Verificación de tipos (`tsc --noEmit`) |
| `frontend` | `npm test` / `npm run e2e` | Pruebas unitarias / extremo a extremo |

---

## Usuarios de demostración

| Rol | DNI | Contraseña | Puede |
|---|---|---|---|
| Administrador | `10203040` | `regente2026` | Todo |
| Cajero / vendedor | `71829304` | `caja2026` | POS, clientes, consulta de inventario |
| Almacén | `76543210` | `almacen2026` | Inventario, compras, alertas |

> ⚠️ **Solo para demostración.** Estas credenciales son públicas (están en el repositorio). El sistema obliga a cambiarlas en el primer ingreso; **no las uses en producción**.

---

## Variables de entorno

Se definen en el `.env` de la **raíz** (lo lee Docker Compose). `backend/.env` y `frontend/.env` solo se usan al ejecutar sin Docker.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MSSQL_SA_PASSWORD` | Sí | Clave de `sa` del SQL Server del contenedor. ≥ 8 caracteres con 3 de 4 clases (mayúscula, minúscula, número, símbolo). |
| `DB_PASSWORD` | Sí | Clave del usuario de aplicación `novasalud`. |
| `JWT_SECRET` | Sí | Secreto para firmar sesiones. ≥ 32 caracteres aleatorios. El backend **no arranca** sin él. |
| `JWT_EXPIRES_IN` | No (`8h`) | Duración de la sesión. |
| `CORS_ORIGIN` | No | Origen permitido en producción (con Docker el proxy `/api` lo hace innecesario). |
| `SEED_DEMO` | No (`false`) | `true` carga datos de ejemplo en el primer arranque. |
| `TZ` | No (`America/Lima`) | Zona horaria de BD y backend. |
| `MSSQL_PID` | No (`Express`) | Edición de SQL Server. |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_HOST_PORT` | No | Puertos publicados (3000 / 8081 / 1433). |
| `NODE_ENV` | No (`production`) | `development` muestra errores detallados. |

Genera secretos con `./scripts/gen-secrets.sh` (Linux/macOS/WSL) o `.\scripts\gen-secrets.ps1` (Windows). **Nunca subas tu `.env` a Git** (ya está en `.gitignore`).

---

## Estructura del proyecto

```
.
├─ docker-compose.yml          # Producción local: db, db-init, backend, frontend
├─ docker-compose.dev.yml      # Override de desarrollo (hot reload)
├─ .env.example                # Plantilla de variables (copiar a .env)
├─ README.md / README.docker.md
├─ docs/                       # DECISIONES.md, API.md, MANUAL_USUARIO.md
├─ scripts/                    # gen-secrets, backup, restore (.sh y .ps1)
├─ database/
│  ├─ migrations/              # Esquema versionado e idempotente
│  └─ seeds/                   # 010_base.sql (siempre) · 020_demo.sql (SEED_DEMO=true)
├─ backend/
│  └─ src/                     # config · routes · controllers · services · validators · middleware · jobs
└─ frontend/
   └─ src/                     # app · features (pos, inventario, alertas…) · components · hooks · lib
```

---

## API principal

Base: `/api` · Autenticación: `Authorization: Bearer <token>` · Errores: JSON `{ "error": "mensaje", "requestId": "…" }`.

| Método y ruta | Descripción |
|---|---|
| `GET /health` · `GET /ready` | Estado del servicio · estado incluyendo la BD |
| `POST /auth/login` · `PUT /auth/change-password` | Inicio de sesión · cambio de contraseña |
| `GET /inventory/products` · `POST /inventory/batches` | Productos con stock vendible · ingreso de lote |
| `POST /sales` · `POST /sales/:id/void` | Registrar venta (FEFO) · anular con reposición |
| `GET /alerts` · `GET /replenishment/suggestions` | Alertas activas · sugerencias de reposición |
| `POST /purchases` · `POST /purchases/:id/receive` | Orden de compra · recepción (total o parcial) |
| `POST /cash/open` · `POST /cash/close` | Abrir turno · cerrar con arqueo |
| `GET /audit` | Bitácora con filtros |

Documentación completa de endpoints en `docs/API.md`.

---

## Pruebas

```bash
# Backend (levanta una BD efímera y corre las pruebas)
docker compose --profile test up -d db-test
cd backend && npm test

# Frontend
cd frontend && npm test

# Extremo a extremo (con la app levantada en :3000)
cd frontend && npx playwright install --with-deps && npm run e2e
```

Incluyen: permisos por rol, FEFO multi‑lote, **50 ventas simultáneas de la última unidad (solo 1 debe ocurrir)**, anulación, alertas automáticas, recepción de compras y cierre de caja.

---

## Tu primera venta en 3 pasos

1. **Abre caja** (menú *Caja* → *Abrir turno* → fondo inicial).
2. **Ve a Punto de venta**, escanea el código de barras o escribe el nombre y pulsa `Enter`. Repite por cada producto.
3. Pulsa **`F4`** (Cobrar) → elige el método de pago → **Completar venta** → imprime el ticket → `Enter` para una **nueva venta**.

Atajos: `F2` buscar · `F4` cobrar · `Esc` cancelar · `Ctrl+Z` deshacer · `?` ayuda.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `docker compose up` falla con *variable is required* | Falta `.env` o está sin rellenar | Ejecuta `cp .env.example .env` y `./scripts/gen-secrets.sh` |
| La pantalla de login carga pero **no deja entrar** | BD aún inicializando o `db-init` falló | `docker compose logs db-init`; vuelve a lanzar `docker compose up db-init` |
| `Login failed for user 'novasalud'` | `DB_PASSWORD` distinto al usado al crear el volumen | Ver [README.docker.md](README.docker.md#errores-frecuentes) |
| Al refrescar una pantalla sale 404 | Front antiguo sin *fallback* SPA | `docker compose up -d --build frontend` |
| "Ventas de hoy" cambia de día a las 19:00 | Zona horaria UTC | Verifica `TZ=America/Lima` y reinicia `db` y `backend` |
| Puerto 3000/8081/1433 ocupado | Otro programa lo usa | Cambia `FRONTEND_PORT` / `BACKEND_PORT` / `DB_HOST_PORT` en `.env` |
| `npm install` falla en `backend` | Versión de Node antigua | Usa Node 22 LTS o superior |

Más casos de Docker (Apple Silicon, Windows/CRLF, memoria) en **[README.docker.md](README.docker.md)**.

---

## Seguridad antes de producción

- [ ] Genera **secretos nuevos**; los que existieron en versiones anteriores del repositorio son públicos: **rótalos**.
- [ ] Cambia las contraseñas de los usuarios demo y desactiva `SEED_DEMO`.
- [ ] Sirve la aplicación **solo por HTTPS** (proxy inverso con TLS; ver `README.docker.md`).
- [ ] No publiques el puerto 1433 fuera de `127.0.0.1`.
- [ ] Programa **respaldos** y prueba una **restauración** real.
- [ ] Revisa `npm audit --omit=dev` y actualiza dependencias.
- [ ] Nota legal: el ticket es una **nota de venta interna**, no un comprobante electrónico SUNAT (no hay integración con OSE/PSE). Valida con tu contador antes de emitir comprobantes tributarios con este sistema.
