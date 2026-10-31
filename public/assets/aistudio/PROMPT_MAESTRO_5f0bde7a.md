# PROMPT MAESTRO — Botica Nova Salud (Full Stack)

> **Cómo usarlo:** abre el repositorio `ZLUCK4270/WEB_FULL_STACK` en tu agente de código (Claude Code u otro con acceso a shell y a Docker), pega **todo este archivo** como primer mensaje y adjunta `README.md` y `README.docker.md` (son los borradores objetivo que el agente debe validar y dejar exactos al final).
> El diagnóstico de la sección 4 fue hecho leyendo el código real del repositorio. Los hallazgos marcados **[V]** se comprobaron además contra el comportamiento de la librería; el resto son por lectura de código y el agente debe **reproducirlos antes de corregirlos**.

---

## 1. ROL

Actúa como un **ingeniero de software senior con más de 20 años de experiencia full stack** (arquitectura, bases de datos transaccionales, seguridad aplicativa, DevOps con Docker y diseño de producto/UX). Tu estándar es el de un sistema que una botica real opera todos los días: **correcto antes que bonito, simple antes que ingenioso, verificable antes que "debería funcionar"**.

Principios de trabajo:

1. **Evidencia sobre suposición.** No afirmes que algo funciona sin haberlo ejecutado. Si no puedes ejecutarlo en tu entorno (p. ej. no hay Docker), dilo explícitamente en el informe final.
2. **Reproduce antes de corregir.** Para cada defecto de la sección 4: reprodúcelo (test o comando) → corrígelo → demuestra que el test pasa.
3. **Cambios pequeños y trazables.** Rama `feature/hardening`, un commit por tarea con mensaje convencional (`fix:`, `feat:`, `chore:`, `docs:`, `test:`).
4. **No inventes requisitos ni cambies el stack** (sección 3). Donde falte información, elige la opción convencional, regístrala en `docs/DECISIONES.md` y sigue; solo detente a preguntar ante acciones **irreversibles** o que pierdan datos.
5. **Nada de secretos en el repositorio.** Ni contraseñas, ni JWT secrets, ni `.env` reales.

---

## 2. MISIÓN Y DEFINICIÓN DE "TERMINADO"

Entregar un sistema web **100 % funcional, desplegable con un solo comando de Docker**, que cumpla el caso de negocio (sección 3) con una interfaz **directa, óptima, autodidacta, interactiva e intuitiva**.

El trabajo está **terminado** solo cuando se demuestran, con salida real de comandos o tests, **todos** estos escenarios (sección 12 tiene el detalle):

- [ ] Desde un clon limpio + `.env` generado: `docker compose up -d --build` deja todos los servicios `healthy` y la app usable en `http://localhost:3000`, **con la base de datos creada y sembrada automáticamente**.
- [ ] Un **cajero (no admin)** inicia sesión y vende. (Hoy es imposible: ver C1.)
- [ ] Se crea un producto con categoría/laboratorio elegidos de listas, se registra su primer lote y aparece stock.
- [ ] Una venta descuenta stock por FEFO, queda ligada a su kárdex y a su lote, y **dispara la alerta de reposición sin intervención manual**.
- [ ] 50 ventas concurrentes de la última unidad → exactamente 1 exitosa.
- [ ] Anular una venta devuelve el stock a los mismos lotes.
- [ ] Una orden de compra se recibe (total o parcial) con lote y vencimiento reales, y la alerta se autorresuelve.
- [ ] Las sugerencias de reposición generan órdenes de compra agrupadas por proveedor.
- [ ] Caja: apertura, ventas vinculadas, cierre con arqueo (esperado vs contado).
- [ ] Un lote vencido se marca `VENCIDO` solo y deja de contar como stock vendible.
- [ ] Respaldos: crear, listar, descargar; procedimiento de restauración probado.
- [ ] Toda acción relevante queda en auditoría con usuario, IP y user-agent.
- [ ] Los dos README son exactos: cada comando fue ejecutado.

---

## 3. CASO DE NEGOCIO Y RESTRICCIONES

### 3.1 Caso
**Botica "Nova Salud"** (zona comercial, alta demanda, crecimiento sostenido). Hoy el control de stock y la atención son **manuales**: errores, desabastecimientos frecuentes y largas esperas. Se implementa un **software web** que centraliza y automatiza **inventario, ventas y atención al cliente**: stock en tiempo real, alertas automáticas de reposición, registro de ventas e interfaz ágil de atención.

### 3.2 Condiciones obligatorias
1. Accesible desde dispositivos web y con **seguridad de datos** garantizada.
2. **Módulo de alertas de reposición** por bajo stock.
3. Interfaz **intuitiva** que **reduzca el tiempo de atención** al cliente.

### 3.3 La propuesta debe incluir
- Software web que gestione de forma centralizada inventario, ventas y atención al cliente.
- Sistema de registro de ventas.
- Interfaz que agilice la atención.
- Gestión interna optimizada para **reducir errores de inventario**.

### 3.4 Stack (NO cambiar)
| Capa | Tecnología actual |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 + lucide-react |
| Backend | Node.js + Express 4 + `mssql` (tedious) + JWT + `bcryptjs` |
| Datos | Microsoft SQL Server 2022 (Express) |
| Despliegue | Docker / Docker Compose |

**Permitido añadir** (justificando en `docs/DECISIONES.md`): `react-router-dom`, `@tanstack/react-query`, `zod`, `helmet`, `pino`, `express-rate-limit`, `vitest`, `supertest`, `@playwright/test`, `@testing-library/react`.

### 3.5 Contexto local (Perú)
Moneda **S/ (PEN)**; **IGV 18 %** (el precio de venta incluye IGV, como hoy; permitir marcar productos **no afectos/exonerados** — validar con el contador); documentos **DNI/RUC/CE**; comprobantes **boleta / factura / ticket**; zona horaria **America/Lima (UTC‑5)**; interfaz y nombres de BD **en español**.

---

## 4. DIAGNÓSTICO DEL REPOSITORIO (hecho real)

### 4.1 Lo que ya está bien (conservar)
Contraseñas con bcrypt y JWT; rate limit en login; **venta FEFO transaccional con `UPDLOCK/HOLDLOCK`** y rollback total; kárdex (`movimientos_stock`) y trazabilidad lote→ítem (`items_venta_lotes`); auditoría; baja lógica de productos; consultas **parametrizadas** (no se vio inyección SQL); diseño de matriz RBAC módulo×acción; esquema normalizado en español; layout responsive con dock móvil. Las 3 contraseñas semilla **sí coinciden** con sus hashes bcrypt (comprobado ejecutándolo).

### 4.2 Defectos CRÍTICOS (bloquean el uso)

| # | Defecto | Dónde | Efecto |
|---|---|---|---|
| **C1** [V] | RBAC compara BIT con `=== 1`, pero `mssql/tedious` devuelve **`true/false`** (`readBit → !!value`). | `backend/src/middleware/rbacMiddleware.js:31-34` | **Todo usuario no‑admin recibe 403 en todo.** Solo el administrador raíz funciona. |
| **C2** [V] | `esta_activo !== 1` con booleano → siempre `true`. | `inventoryController.js:285` (`adjustStock`) | **Todo ajuste de stock falla** con "El producto está inactivo", incluso para admin. |
| **C3** | Inserta en `movimientos_stock` usando `@purchaseId` que **nunca se declara** en ese request. | `purchasesController.js:159-160` | **Recibir una compra siempre falla** (rollback). |
| **C4** | `listBatches` selecciona `l.fecha_fabricacion` y `l.costo_unitario`, columnas **inexistentes** en `lotes`. | `inventoryController.js:366-367` vs `database/01_schema.sql:112-126` | `GET /inventory/batches` → 500; "Vence más cercano" queda vacío. |
| **C5** | Docker no crea la BD ni el usuario: solo existe `sa`; el backend usa usuario `novasalud` y BD `NovaSalud`; **ningún script SQL se ejecuta**. | `docker-compose.yml:21-40` | El backend arranca pero **no puede conectar**; la app no es utilizable en Docker. |
| **C6** | `VITE_API_URL` es de *build*, el `environment:` del compose no tiene efecto; nginx sin *fallback* SPA ni proxy `/api`; imagen Node 18 (EOL, bajo el mínimo de Vite 7+/Tailwind 4). | `docker-compose.yml:47-48`, `frontend/Dockerfile` | Front apunta a `localhost:8081` fijo, 404 al refrescar rutas, build puede fallar. |
| **C7** | `createSale` responde `{ saleCode, totalAmount, … }` pero `mapSale` espera `codigo_venta`, `metodo_pago`, `fecha_creacion`. El ticket ejecuta `completedSale.metodoPago.toUpperCase()` sobre `undefined`. | `PharmacyContext.tsx:394-422`, `PointOfSaleView.tsx:655` | Tras cobrar: mensaje "Venta undefined…" y **TypeError que rompe el modal del ticket**. |
| **C8** | `let selectedCustomerId` declarado dentro del componente se reinicia en cada render. | `PointOfSaleView.tsx:40,139,244` | **El cliente nunca se asocia a la venta** (`customerId` llega `undefined`). |
| **C9** | "Nuevo producto" envía **texto libre** como `categoria_id`/`laboratorio_id` (UNIQUEIDENTIFIER); no existen endpoints de categorías/laboratorios/proveedores; `nombre_generico` es NOT NULL y se envía `null`; `adjustStock` exige un lote existente y **no hay forma de crear lotes** fuera de una compra (rota por C3). | `InventoryBatchesView.tsx:93-102`, `inventoryController.js` | **Un producto nuevo no puede crearse ni abastecerse desde la UI.** |
| **C10** | Las alertas **no son automáticas**: la UI dice "generadas automáticamente tras cada venta o ajuste", pero nada llama a `generateAlerts` salvo un botón; solo quien tenga `alerts:create` (en el seed, nadie salvo admin) puede; el temporizador del front solo *recarga*. Además los lotes vencidos siguen `VIGENTE` y **suman stock** (`listProducts` suma `estado='VIGENTE'` sin mirar fecha) mientras `processFEFOTransaction` los rechaza. | `alertsController.js`, `ActiveAlertsView.tsx:64`, `inventoryController.js:25` | **Incumple la condición 2 del caso** y el POS muestra stock que luego rechaza al cobrar. |

### 4.3 Defectos ALTOS

| # | Defecto | Dónde |
|---|---|---|
| **A1** | Token vencido/ inválido responde **403**, pero el interceptor solo cierra sesión con **401** → pantalla rota con sesión "fantasma". | `authMiddleware.js:18`, `frontend/src/services/api.js:29` |
| **A2** | `paymentMethod`, `amountPaid`, `receiptType` se **descartan**; método fijo `'efectivo'`; no se guardan `efectivo_entregado`/`vuelto` (las columnas existen). | `fefoService.js:156`, `salesController.js:9` |
| **A3** | Correlativo con `COUNT(*)+1` → **códigos duplicados bajo concurrencia** (UNIQUE `codigo_venta`); serie fija `BOL-B001` aunque sea factura/ticket. Igual en compras. | `fefoService.js:144-146`, `purchasesController.js:36-38` |
| **A4** | **No existe anulación de venta** aunque el esquema la prevé (`anulado_por_id`, `motivo_anulacion`, `fecha_anulacion`). | `01_schema.sql:173-175` |
| **A5** | **Caja no persiste**: solo escribe en auditoría; sin tabla de turnos, sin arqueo esperado vs contado, ventas no vinculadas a caja, sin UI. | `cashController.js` |
| **A6** | Compras: sin UI ni listado de proveedores; **totales y subtotales los manda el cliente**; la recepción inventa lote `LOT-REC-<Date.now()>` y vencimiento **+1 año**, ignora `cantidad_recibida`, **permite recibir dos veces**. | `purchasesController.js` |
| **A7** | Respaldos: `restoreBackup` borra **padres antes que hijos** (viola FK), **borra la auditoría**, el JSON exporta `password_hash`, `checksum` es un UUID inventado, `listBackups` siempre vacío, sin UI, y el módulo `backups` **no existe** en `modulos_sistema` (no se pueden dar permisos). | `backupController.js` |
| **A8** | UI y permisos desalineados: `tabsByRole` fijo en front; "vendedor" ve *Alertas* pero el seed no le da `alerts` (403); almacén no puede "generar" aunque la UI lo dice; módulo `staff` sin endpoints (no hay gestión de usuarios/permisos); `mustChangePassword` se ignora. | `App.tsx:26-30`, `02_seed.sql:81-90` |
| **A9** | KPIs incorrectos: `lowStockCount`/`expiringSoonCount` = longitud de listas `TOP 10` (tope artificial de 10). | `dashboardController.js:86-89` |
| **A10** | Seguridad: JWT secret **por defecto hardcodeado** en código y compose público; rate limit por `dni+ip` (rotando DNIs se evade) y sin `trust proxy`; `res.json({error: error.message})` **filtra mensajes SQL**; CORS `*` con `credentials`; usuario desactivado conserva acceso hasta expirar el JWT (24 h); sin validación de entrada centralizada; IP/user‑agent de auditoría nunca se guardan; token en `localStorage`. | `authController.js:5`, `docker-compose.yml:33`, `rateLimiter.js`, varios controllers |
| **A11** | Zona horaria: SQL Server en contenedor usa UTC → "ventas de hoy" y vencimientos cambian de día a las **19:00 hora Lima**. | `SYSDATETIME()` en todo el backend |

### 4.4 Defectos MEDIOS y deuda técnica

- **M1** Front repite `=== 1` sobre BIT (`PharmacyContext.tsx:214-216`: receta/controlado/activo siempre `false`); `laboratorio` nunca llega del backend; `getProductStock` devuelve `id` pero la vista usa `loteId`.
- **M2** Historial de ventas: placeholder `V-` pero los códigos son `BOL-B001-…`; la lista no devuelve `subtotal/igv` (muestra 0); sin paginación en UI aunque el backend pagina; sin estado/anulada.
- **M3** El ticket dice **"Boleta Electrónica / comprobante de venta electrónica"** sin integración SUNAT/OSE → **engañoso**; RUC `20601234567` hardcodeado en el front; impresión con `window.open + document.write`.
- **M4** Un producto repartido en 2 lotes genera 2 `items_venta` (uno por lote) → el ticket duplica líneas.
- **M5** `movimientos_stock.referencia_id` queda NULL en ventas; `ENTRADA_COMPRA` no guarda lote; `tipo_movimiento` sin catálogo.
- **M6** Sin `CHECK` (`stock_actual >= 0`, cantidades > 0, precios ≥ 0); faltan índices (`lotes(producto_id, estado, fecha_vencimiento)`).
- **M7** Sin paginación en productos/clientes; búsqueda de productos solo en cliente.
- **M8** UX: fuentes de 10–12 px en acciones críticas (`text-[10px]`, `text-xs`), POS con tarjetas grandes en vez de lista rápida, sin lector de código de barras, sin atajos, sin carrito en espera, sin aviso de receta/controlado, `alert()` nativo.
- **M9** Deuda: `database/nova_salud_database_complete.sql` es **otro esquema** (en inglés, Postgres/MySQL) y contradice el real; `OverviewView.tsx` y `AccessDeniedView.tsx` no se importan; dependencias **sin uso en `frontend/src`** (comprobado por búsqueda): `jspdf`, `jspdf-autotable`, `xlsx`, `recharts`, `motion`, `dotenv`, `tsx`, `autoprefixer`; `msnodesqlv8` **sin uso** en backend (driver ODBC nativo; suele romper `npm install` en Alpine); `xlsx@0.18.5` tiene vulnerabilidades conocidas y ya no se publica en npm; paquete llamado `react-example`; comentarios de AI Studio en `vite.config.ts`; typos ("HASHEADADES", "ejecutir"); el seed deja `debe_cambiar_clave=1` y `03_seed_auth.sql` lo pone en 0.
- **M10** Sin tests, sin CI, sin `.dockerignore`, sin `.gitattributes` (los `.sh` con CRLF rompen en contenedores desde Windows).

---

## 5. ARQUITECTURA OBJETIVO

### 5.1 Principio rector: una sola fuente de verdad para el stock
Crear la vista `vw_stock_productos` (y/o función) que defina **una vez** el stock vendible:
`SUM(stock_actual)` de lotes con `estado='VIGENTE'` **y** `fecha_vencimiento >= hoy` **y** `stock_actual > 0`.
La usan: listado de productos, POS, alertas, dashboard y sugerencias. Así desaparece la discrepancia de C10.

### 5.2 Base de datos (migraciones idempotentes `database/migrations/NNN_*.sql` + tabla `__migraciones`)
Conserva el esquema actual y agrega:

- `lotes`: `fecha_fabricacion DATE NULL`, `costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0`, `fecha_ingreso`; `CHECK (stock_actual >= 0)`; índice `(producto_id, estado, fecha_vencimiento) INCLUDE (stock_actual)`.
- `productos`: `afecto_igv BIT NOT NULL DEFAULT 1`, `ubicacion VARCHAR(60) NULL`; `nombre_generico` pasa a `NULL`-able **o** el backend lo rellena con `nombre`.
- `series_comprobante(tipo, serie, correlativo)` con incremento bajo `UPDLOCK` → fin de `COUNT(*)+1`.
- `ventas`: `tipo_comprobante`, `turno_caja_id`, `duracion_atencion_seg INT NULL` (para **medir** el requisito 3); usar `efectivo_entregado` y `vuelto`; `referencia_pago VARCHAR(50) NULL` (nº operación Yape/tarjeta).
- `movimientos_stock`: poblar `referencia_id` (venta/compra/anulación) y añadir `tipo_referencia`; `CHECK` de `tipo_movimiento` contra catálogo.
- `turnos_caja(id, cajero_id, fecha_apertura, fecha_cierre, fondo_inicial, efectivo_esperado, efectivo_contado, diferencia, estado, observaciones)` y `movimientos_caja(turno_id, tipo INGRESO|EGRESO, monto, motivo)`.
- `configuracion_sistema` (clave/valor): razón social, RUC, dirección, `dias_alerta_vencimiento=30`, `igv=0.18`, `exigir_caja_abierta=1`, `umbral_dni_boleta=700`, `dias_cobertura_reposicion`.
- `modulos_sistema`: añadir `catalog`, `replenishment`, `backups`, `settings`; plantillas de permisos por cargo (admin / vendedor / almacén) en el seed.
- `sugerencias_reposicion` (ya existe): **empezar a usarla**.
- Semillas: `010_base.sql` (módulos, usuarios, permisos) y `020_demo.sql` (≥ 30 productos reales de botica, lotes con vencimientos variados, uno vencido, uno agotado, uno bajo mínimo, 3 proveedores, 5 clientes) cargada solo con `SEED_DEMO=true`.
- Eliminar/archivar `nova_salud_database_complete.sql` → `docs/legacy/`.

### 5.3 Backend (Express)
Estructura: `config/ routes/ controllers/ services/ validators/ middleware/ jobs/ utils/` + `tests/`.

- **Validación** de todo `body/query/params` con `zod` (mensajes en español, 400 con campo y motivo).
- **Errores tipados** (`AppError`, `ValidationError`, `NotFoundError`, `ConflictError`) y un único manejador global: en producción jamás devuelve `error.message` interno; siempre `requestId`.
- **Capa de servicios**: la lógica de negocio sale de los controllers (ventas, stock, compras, alertas, caja).
- **Defensa en profundidad de stock**: además del `UPDLOCK`, `UPDATE … WHERE stock_actual >= @cantidad` y verificar `@@ROWCOUNT`.
- **Booleans**: nunca comparar BIT con `1`; usar `Boolean(x)` o `=== true`. Añadir test que lo fije.
- **Logging** estructurado (`pino`) con `requestId`; `helmet`; CORS restringido por `CORS_ORIGIN` (sin `*` en producción); `trust proxy` configurable; `express.json({limit:'1mb'})`.
- **Auth**: 401 para token ausente/inválido/vencido (unifica con el front); `JWT_SECRET` **obligatorio** (el proceso no arranca sin él ni con valores de ejemplo); verificar `esta_activo` y versión de token (`token_version`) para invalidar al desactivar/cambiar clave; rate limit por IP **y** por DNI; cambio de contraseña obligatorio (`debe_cambiar_clave`) con endpoint y pantalla.
- **Health**: `/api/health` (liveness) y `/api/ready` (consulta la BD).
- **Zona horaria**: `TZ=America/Lima` en `db` y `backend`; documentarlo.
- **Respaldos**: reemplazar el volcado JSON por **`BACKUP DATABASE … WITH CHECKSUM, INIT`** nativo a un volumen compartido (`db_backups`); endpoint para crear/listar/descargar; **retirar el endpoint HTTP de restauración** (peligroso) y documentar el procedimiento operativo probado. Nunca exportar `password_hash`.

### 5.4 Motor de alertas y reposición (condición 2 del caso)
`services/alertsService.js` con una función única `evaluate({productIds?})`:

- **Tipos**: `SIN_STOCK`, `STOCK_BAJO` (stock vendible ≤ `stock_minimo`), `VENCIMIENTO_CERCA` (con severidad por tramos 7/15/30 días, configurable), `VENCIDO`.
- **Disparadores**: (a) **tras cada venta, ajuste, recepción o anulación** solo para los productos afectados (síncrono y barato); (b) **job** cada 15 min y al arrancar (global); (c) el job marca lotes vencidos como `VENCIDO`. Un solo ejecutor a la vez (`sp_getapplock`).
- **Idempotente** (sin duplicados) y **autorresolutivo**: si la condición desaparece (llegó stock, se ajustó), la alerta pasa a `AUTO_RESUELTO`.
- **Tiempo real**: stream **SSE** autenticado (fetch‑streaming o ticket de un solo uso — `EventSource` no envía cabeceras) con eventos `stock.changed` y `alert.created`, con reconexión y **fallback a polling cada 30 s**. Varias cajas ven el mismo stock sin recargar.
- **Reposición sugerida** → `sugerencias_reposicion`:
  `sugerido = ceil(consumo_diario_30d × dias_cobertura) − stock_vendible − pendiente_en_compras_no_recibidas`, acotado por `stock_maximo` si existe; *fallback*: `(stock_maximo ?? 2×stock_minimo) − stock_vendible`.
  Pantalla **Reposición**: lista agrupada por proveedor → botón **"Crear orden de compra"** (una OC por proveedor) → editable antes de confirmar.

### 5.5 Ventas (registro de ventas)
- Un `items_venta` **por producto**; el reparto por lotes va en N filas de `items_venta_lotes`.
- Guardar método de pago, recibido, vuelto, referencia, tipo de comprobante, turno de caja, `duracion_atencion_seg`.
- Correlativo por `series_comprobante` (boleta/factura/ticket con series distintas).
- `factura` exige cliente con **RUC**; boleta sobre el umbral configurado exige DNI (validar la norma con el contador).
- **Anulación** `POST /sales/:id/void` (permiso `pos_sales:delete`, motivo ≥ 5 caracteres): repone stock **a los mismos lotes** vía `items_venta_lotes`, registra kárdex `ENTRADA_ANULACION`, ajusta caja, audita.
- `GET /sales` devuelve `subtotal, igv, estado, método, cajero, cliente` + paginación (`page, limit, total`) y filtros por fecha, método, cajero, estado.
- El ticket **no** dirá "Boleta Electrónica" mientras no exista integración con un OSE/PSE: usar **"NOTA DE VENTA — comprobante interno"** (o implementar la integración, fuera de alcance salvo que se pida).

### 5.6 API: endpoints que faltan (todos con `authenticateToken` + `requirePermission` + validación + auditoría)
- **Catálogos**: `GET/POST/PUT /catalog/categories | laboratories | suppliers`.
- **Inventario**: `POST /inventory/batches` (ingreso de lote → kárdex `ENTRADA`), `GET /inventory/kardex?productId=`, `GET /inventory/products/:id/substitutes` (mismo `nombre_generico` con stock), `PUT /inventory/batches/:id` (cuarentena/baja).
- **Ventas**: `POST /sales/:id/void`; `GET /sales/:id/receipt`.
- **Caja**: `GET /cash/current`, `POST /cash/open` (falla si ya hay turno abierto), `POST /cash/movements`, `POST /cash/close` (calcula esperado), `GET /cash/history`.
- **Compras**: `GET /purchases/:id`; `POST /purchases` (el servidor **recalcula** subtotales/total); `POST /purchases/:id/receive` con `[{itemId, cantidadRecibida, codigoLote, fechaVencimiento, costoUnitario}]` (idempotente, recepción **parcial** → estado `PARCIAL`, rechaza si ya `RECIBIDA`); `POST /purchases/:id/cancel`; `POST /replenishment/generate-orders`; `GET /replenishment/suggestions` (agrupadas por proveedor).
- **Clientes**: `GET /customers?q=&page=`, `GET /customers/by-document/:doc`, `PUT /customers/:id`, `GET /customers/:id/sales`.
- **Usuarios/RBAC** (módulo `staff`): CRUD de usuarios, activar/desactivar, **restablecer contraseña** (temporal + `debe_cambiar_clave`), `PUT /auth/change-password`, `GET/PUT /users/:id/permissions`; el **admin raíz es inmutable** (BR‑SEC‑01).
- **Auditoría**: filtros (usuario, módulo, acción, fecha), paginación, detalle JSON; middleware que registra **IP y user‑agent**.
- **Login** devuelve `permissions` (mapa módulo→acciones); **el front deriva menú y botones de ahí**, no de un `tabsByRole` fijo.

---

## 6. DOCKER (requisitos exactos)

Servicios y comportamiento:

1. **`db`** — `mcr.microsoft.com/mssql/server:2022-latest` (con `platform: linux/amd64`), `MSSQL_SA_PASSWORD` (la variable vigente; `SA_PASSWORD` está obsoleta), `TZ=America/Lima`, `healthcheck` con `sqlcmd -C`, volumen `db_data`, volumen `db_backups`, puerto publicado **solo en `127.0.0.1`**.
2. **`db-init`** — *one‑shot* con la **misma imagen** (ya trae `sqlcmd`) y `entrypoint` propio: espera a `db` *healthy*, crea la BD `NovaSalud`, el **login/usuario `novasalud` con mínimo privilegio** (`db_datareader`, `db_datawriter`, `db_backupoperator` y `GRANT EXECUTE`; **sin** DDL en tiempo de ejecución), aplica `database/migrations/*` en orden registrando en `__migraciones` (**idempotente**: re‑ejecutarlo no rompe nada), carga seeds (`SEED_DEMO` opcional) y hace `chown` de `db_backups` para el uid de `mssql` (10001). `restart: "no"`.
3. **`backend`** — `node:22-alpine`, *multi‑stage*, `npm ci --omit=dev`, **usuario no root**, `HEALTHCHECK` a `/api/ready`, `depends_on: db-init: condition: service_completed_successfully`, **sin `msnodesqlv8`**.
4. **`frontend`** — build con `node:22-alpine` → `nginx:alpine` con `nginx.conf`: *fallback* SPA (`try_files … /index.html`), **proxy `/api` → `backend:8081`** (sin CORS ni URL fija: `VITE_API_URL=/api`), cabeceras de seguridad, `gzip`, caché de assets con *hash*.
5. **Redes/volúmenes** nombrados; límites de memoria razonables; rotación de logs (`json-file` con `max-size`).
6. **`.env.example`** con **marcadores** (`CAMBIAR_…`) y `${VAR:?mensaje}` en el compose para las obligatorias. Variables: `MSSQL_SA_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN` (por defecto `8h`), `CORS_ORIGIN`, `SEED_DEMO`, `TZ`, `MSSQL_PID`, `NODE_ENV`, `FRONTEND_PORT`, `BACKEND_PORT`, `DB_HOST_PORT` (los README las documentan con estos nombres exactos); `scripts/gen-secrets.sh` **y** `scripts/gen-secrets.ps1` (el usuario trabaja probablemente en Windows) generan `JWT_SECRET` y una contraseña SA que cumple la política de SQL Server (≥ 8 caracteres, 3 de 4 clases: mayúscula, minúscula, dígito, símbolo).
7. **`docker-compose.dev.yml`** (override): *bind mounts*, `nodemon` y `vite --host` con *hot reload*; **no** se usa en producción. Además: perfil `test` con un servicio **`db-test`** (SQL Server efímero para la suite del backend) y un **`docker-compose.prod.yml`** opcional con un servicio `caddy` (TLS automático) que sustituye la publicación directa del puerto del frontend.
8. **`.dockerignore`** en `backend/` y `frontend/`; **`.gitattributes`** con `*.sh text eol=lf`.
9. **Respaldos**: `scripts/backup.sh|ps1` y `scripts/restore.sh|ps1` documentados y **probados** (crear → destruir volumen → restaurar → verificar conteos).
10. Mover los secretos hoy visibles en el compose público (`NovaSalud2026!`, `nova_salud_secreto_curso_2026`) fuera del repo y **recomendar rotarlos** (ya están en el historial público).

> Si tu entorno no tiene Docker: valida con `docker compose config`, prueba backend/BD contra una instancia local y **declara explícitamente** qué no pudiste ejecutar.

---

## 7. PLAN POR FASES (cada fase termina con tests verdes y commit)

| Fase | Contenido | Criterio de aceptación |
|---|---|---|
| **0 — Infra** | Sección 6 completa; BD autoinicializada; `.env`/secretos; `.dockerignore`; `.gitattributes` | `docker compose up -d --build` desde clon limpio ⇒ todo `healthy`; login admin OK; `down && up` no pierde datos; `down -v && up` reconstruye todo |
| **1 — Críticos** | C1–C4, C7, C8, A1, A11, booleans en front/back | Tests de regresión: cajero obtiene 200 en POS; `adjustStock` OK; `GET /inventory/batches` 200; ticket muestra código/método/fecha; cliente queda guardado en la venta; token vencido ⇒ login |
| **2 — Inventario** | Catálogos, ingreso de lotes, vista de stock vendible, kárdex, sustitutos, marca automática de `VENCIDO`, CHECKs e índices, paginación/búsqueda en servidor | Crear producto con listas ⇒ registrar lote ⇒ aparece en POS; lote vencido no cuenta; kárdex muestra cada movimiento con su referencia |
| **3 — Alertas y reposición** | Sección 5.4 completa + pantalla Reposición + SSE | Venta que cruza el mínimo ⇒ alerta visible en **≤ 5 s sin clic**; llegar stock ⇒ `AUTO_RESUELTO`; segunda terminal ve el stock bajar sin recargar |
| **4 — Ventas/POS** | Sección 5.5; series; pago real; anulación; historial correcto | 50 ventas concurrentes de la última unidad ⇒ 1 éxito, 49 rechazos limpios; anulación repone a los mismos lotes; sin correlativos duplicados |
| **5 — Caja** | Turnos, movimientos, cierre con arqueo, vínculo con ventas, UI | Cierre muestra esperado vs contado y diferencia; no se vende sin turno abierto (si `exigir_caja_abierta`) |
| **6 — Compras/proveedores** | Sección 5.6; UI completa | Recepción parcial con lote/vencimiento reales; doble recepción rechazada; OC desde sugerencias agrupada por proveedor |
| **7 — Clientes** | Búsqueda por documento, edición, historial; campos de salud **opcionales con consentimiento** y acceso auditado (datos sensibles, Ley 29733: validar con asesor legal) | Alta de cliente en el POS sin salir de la pantalla |
| **8 — Usuarios, seguridad, auditoría, respaldos** | RBAC dinámico, gestión de usuarios, cambio de clave, auditoría con filtros/IP, respaldos nativos | Desactivar usuario ⇒ su token deja de funcionar al instante; restauración probada |
| **9 — Rediseño UX** | Sección 8 completa | Checklist de la sección 8 + `axe-core` sin violaciones críticas en login y POS |
| **10 — Calidad y docs** | Tests, CI, README exactos, `docs/` | Sección 11 y 12 cumplidas |

---

## 8. REDISEÑO DE LA INTERFAZ — directa, óptima, autodidacta, interactiva

### 8.1 Estructura
- **Enrutamiento real** (`react-router-dom`): cada módulo tiene URL, botón atrás y recarga que conserva la pantalla (hoy es un `useState` de pestaña).
- **Navegación**: *rail* lateral colapsable en escritorio, **dock inferior** en móvil; solo los módulos permitidos por `permissions`.
- **Inicio por rol con "siguiente mejor acción"**: tarjetas accionables ("3 productos por reponer → *Crear orden de compra*", "2 lotes vencen esta semana → *Ver lotes*", "Caja sin abrir → *Abrir caja*"). Cajero: abre directamente al POS.
- **Datos**: `@tanstack/react-query` (caché, reintentos, invalidación tras mutaciones) + SSE para tiempo real. Adiós al contexto de 570 líneas que recarga todo (`refreshAll`).

### 8.2 POS (el corazón del requisito 3)
Objetivo medible: **venta de 3 ítems con lector ≤ 20 s; con búsqueda ≤ 45 s**; un cajero nuevo completa su primera venta **sin ayuda en ≤ 2 min** (lo valida el usuario con el guion de 5 tareas del anexo A).

- Una sola pantalla en dos columnas; el **buscador tiene el foco siempre**.
- **Lector de código de barras** (teclado‑wedge: ráfaga de teclas + Enter ⇒ agrega la coincidencia exacta).
- Resultados como **lista compacta** (nombre, concentración, precio, stock vendible, **insignia "vence en N días"** y lote FEFO que saldrá), no tarjetas grandes.
- **Sustitutos**: si no hay stock, botón "Ver alternativas con el mismo genérico".
- Carrito editable con teclado numérico, **deshacer** al quitar, **carrito en espera** (pausar/retomar varios).
- Cliente: buscador por DNI/RUC con **alta rápida en un modal**; "Público general" por defecto.
- Productos con **receta** o **controlados**: confirmación explícita con texto claro antes de agregar.
- Cobro: total grande, **billetes rápidos**, vuelto automático, Yape/tarjeta con campo opcional de nº de operación; al terminar, pantalla de éxito con foco en **"Nueva venta" (Enter)**; ticket 80 mm con CSS `@media print` (no `document.write`).
- **Atajos**: `F2` buscar, `F4` cobrar, `Esc` cerrar/cancelar, `Ctrl+Z` deshacer, `?` ayuda. Se muestran en una barra inferior discreta.
- Medir `duracion_atencion_seg` (primer ítem → cobro) y mostrarla en el panel del administrador: es la **evidencia** de que se redujo el tiempo de atención.

### 8.3 Autodidacta
- **Recorrido guiado** de primer inicio por rol (≤ 5 pasos, omitible, repetible desde el menú "?").
- **Estados vacíos útiles**: explican qué es la pantalla y ofrecen la acción principal ("Aún no hay productos → *Crear el primero*").
- **Glosario en contexto**: tooltips que traducen jerga ("**FEFO**: se vende primero lo que vence antes", "**Kárdex**: historial de cada movimiento de stock", "**Stock mínimo**: al llegar a este número se te avisa para reponer").
- **Errores en lenguaje llano con salida**: "Quedan 3 unidades de Amoxicilina y pediste 5. *¿Vender 3?*".
- **Divulgación progresiva**: campos avanzados (registro sanitario, ubicación, stock máximo) tras "Más datos".
- **Centro de ayuda** con 6 recetas cortas (primera venta, ingresar un lote, reponer, anular, cerrar caja, dar de alta un usuario) y la lista de atajos.
- Confirmaciones destructivas que **dicen la consecuencia** ("Se devolverán 3 unidades al lote L-2027 y se restará S/ 12.00 de la caja").

### 8.4 Diseño y accesibilidad
- Tipografía **≥ 14 px** en cuerpo y acciones; objetivos táctiles **≥ 44 px**; contraste **WCAG AA**; el estado nunca se comunica **solo por color** (icono + texto).
- Responsive real probado a **375 px**; modo oscuro coherente (el código ya usa clases `dark:`).
- Reemplazar `alert()`/`confirm()` por *toasts* y diálogos propios; formularios con validación en línea y `aria-*`.
- Un sistema de componentes pequeño (Button, Input, Select, Dialog, Toast, Badge, EmptyState, Table) en lugar de clases largas repetidas.
- Eliminar código muerto: `OverviewView`, `AccessDeniedView` (o usarlos), dependencias sin uso, comentarios de AI Studio; renombrar el paquete a `novasalud-frontend`; decidir si el i18n se usa o se retira (la app es solo español).

---

## 9. SEGURIDAD — checklist de salida

- [ ] Ningún secreto en el repo ni en la imagen; `JWT_SECRET` obligatorio y ≥ 32 caracteres.
- [ ] 401/403 coherentes; el front cierra sesión en ambos casos de token inválido.
- [ ] RBAC verificado con tests por rol y por acción (incluye el caso BIT de C1).
- [ ] Todo input validado con `zod`; ninguna concatenación de SQL con datos del usuario.
- [ ] Sin `error.message` interno en respuestas de producción.
- [ ] `helmet`, CORS por lista, rate limit por IP y por DNI, `trust proxy` correcto detrás de nginx.
- [ ] Usuario desactivado o con clave cambiada ⇒ tokens previos inválidos (`token_version`).
- [ ] Contraseñas: cambio obligatorio en el primer ingreso, política mínima, bcrypt costo ≥ 10.
- [ ] Auditoría con IP y user‑agent; la auditoría **no** se borra ni se restaura.
- [ ] Respaldos sin hashes de contraseña en claro; volumen de respaldos no público.
- [ ] Puerto 1433 solo en `127.0.0.1`; imágenes con usuario no root.
- [ ] `npm audit --omit=dev` sin vulnerabilidades altas/críticas, o excepciones documentadas.
- [ ] Nota para producción: **TLS obligatorio** (proxy inverso con HTTPS) — documentado en `README.docker.md`.

---

## 10. CALIDAD Y PRUEBAS

- **Backend** (`vitest` + `supertest`) contra un SQL Server efímero (perfil `test` del compose):
  RBAC por rol (regresión C1) · `adjustStock` (C2) · recepción de compras (C3) · lotes (C4) · FEFO multi‑lote · stock insuficiente · **concurrencia: 50 ventas simultáneas de la última unidad ⇒ 1** · correlativos sin duplicados · anulación repone a los mismos lotes · alerta se crea y se autorresuelve · vencidos fuera del stock · doble recepción rechazada · cierre de caja.
- **Frontend** (`vitest` + Testing Library): lógica de carrito, atajos, mapeo de respuestas (regresión C7), asociación de cliente (regresión C8).
- **E2E** (`@playwright/test`): login → venta con lector simulado → stock baja → alerta aparece → anular → stock vuelve.
- **CI** (GitHub Actions): lint/`tsc --noEmit`, tests, `docker compose build`, `npm audit`.
- Cada defecto de la sección 4 debe tener **un test que falle antes y pase después**.

---

## 11. DOCUMENTACIÓN A ENTREGAR

1. **`README.md`** — cómo ejecutar el proyecto (Docker en 5 comandos + ejecución local sin Docker para Windows/macOS/Linux, variables, usuarios demo, estructura, scripts, pruebas, solución de problemas, seguridad previa a producción). *Parte de `README.md` adjunto.*
2. **`README.docker.md`** — todo sobre Docker (arquitectura, servicios, puertos, volúmenes, `.env`, operación diaria, respaldo/restauración, modo desarrollo, producción con TLS, Apple Silicon/Windows, tabla de errores frecuentes). *Parte de `README.docker.md` adjunto.*
3. `docs/DECISIONES.md` (cada decisión no trivial: qué, por qué, alternativa descartada), `docs/API.md` (o OpenAPI), `docs/MANUAL_USUARIO.md` (por rol, con capturas si es posible).

**Regla de oro:** los borradores adjuntos describen el **estado objetivo**. Al final **ejecuta cada comando de ambos README en un clon limpio**, corrige lo que difiera y **borra la nota de "borrador"** del encabezado. Un README con un comando que no funciona es un defecto.

---

## 12. ESCENARIOS DE ACEPTACIÓN (demuéstralos con salida real)

1. **Arranque limpio:** clon nuevo → `cp .env.example .env` + secretos generados → `docker compose up -d --build` → `docker compose ps` todo `healthy` → login en `:3000`.
2. **Persistencia:** `docker compose down && up` conserva datos; `down -v && up` reconstruye con seeds.
3. **RBAC real:** cajero vende; cajero **no** puede abrir Usuarios ni Respaldos (403 y menú oculto); almacén ajusta stock y recibe compras.
4. **Alta de producto→stock:** producto con listas → lote → visible en POS.
5. **Venta FEFO multi‑lote:** producto con 2 lotes, vender más que el primero ⇒ descuenta del que vence antes, el ticket muestra **una** línea y el detalle muestra ambos lotes; el kárdex referencia la venta.
6. **Alerta automática:** esa venta cruza el mínimo ⇒ alerta visible en ≤ 5 s sin pulsar nada; una segunda pestaña/terminal ve el cambio sin recargar.
7. **Concurrencia:** script lanza 50 ventas de la última unidad ⇒ 1 éxito.
8. **Anulación:** repone a los mismos lotes; caja y kárdex coherentes.
9. **Compra:** OC → recepción parcial con lote/vencimiento → stock sube → alerta `AUTO_RESUELTO`; segunda recepción de lo ya recibido, rechazada.
10. **Reposición:** sugerencias → OC por proveedor.
11. **Caja:** abrir → vender (efectivo + Yape) → egreso → cerrar con arqueo; diferencia correcta.
12. **Vencimientos:** lote vencido pasa a `VENCIDO` solo y no se puede vender.
13. **Sesión:** token vencido ⇒ redirige al login sin pantalla rota.
14. **Respaldos:** crear, descargar, restaurar en una BD limpia, verificar conteos.
15. **Móvil y teclado:** flujo de venta completo en 375 px y **solo con teclado**.
16. **Zona horaria:** a las 19:30 hora Lima, "ventas de hoy" sigue siendo el mismo día.

---

## 13. INFORME FINAL (formato obligatorio)

Entrega, en este orden:
1. **Resumen** (≤ 10 líneas): qué cambió y qué se puede hacer ahora que antes no.
2. **Tabla de defectos** C1–C10, A1–A11, M1–M10: estado (✅ corregido / ⚠️ parcial / ❌ pendiente), commit y test que lo cubre.
3. **Evidencia** de los 16 escenarios (comandos y salidas).
4. **Lo que NO pudiste verificar** y por qué (honestidad total).
5. **Decisiones** tomadas y riesgos abiertos (incluye: integración SUNAT/OSE fuera de alcance, normas tributarias y de datos personales a validar con contador/asesor legal).
6. **Pasos manuales** que quedan para el dueño (rotar secretos públicos, configurar TLS, cambiar contraseñas demo, validar con 3 usuarios reales).

---

## ANEXO A — Guion de validación con usuarios reales (lo ejecuta el dueño, no el agente)

Pide a 3 personas **sin explicación previa** que hagan, cronometrando:
1. Iniciar sesión y registrar la **venta** de 3 productos (meta ≤ 45 s con búsqueda).
2. **Cobrar** con Yape y dar el ticket.
3. Registrar la **llegada de un lote** nuevo.
4. Entender una **alerta** y crear la orden de compra.
5. **Anular** una venta.

Anota dónde dudan o se equivocan: cada duda es un defecto de UX a corregir. Meta: ≥ 4 de 5 tareas completadas sin ayuda por persona.

## ANEXO B — Fuera de alcance (salvo petición expresa)
Facturación electrónica SUNAT/OSE, pasarelas de pago reales, multi‑sucursal, app móvil nativa, integración con DIGEMID, escalado horizontal (SSE y jobs asumen **una** instancia de backend; documentarlo).
