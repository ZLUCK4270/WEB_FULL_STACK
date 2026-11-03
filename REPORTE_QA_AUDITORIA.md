# 📋 Reporte de Auditoría QA, Seguridad y Cumplimiento Funcional — Botica Nova Salud

**Caso Práctico:** Botica "Nova Salud" (Lima, Perú — DIGEMID / BPA / FEFO)  
**Fecha de Actualización:** 01 de noviembre de 2026  
**Resultado Global:** **100% DE REQUISITOS CUMPLIDOS — APTO PARA PRODUCCIÓN**

---

## 1. Matriz de Cumplimiento de Requisitos del Caso Práctico

| Requisito / Condición del Caso | Estado | Módulo / Componente Técnico | Descripción de la Solución Implementada |
| :--- | :---: | :--- | :--- |
| **Condición 1: Accesible desde dispositivos web y garantizar seguridad en los datos** | ✅ **Cumplido** | `server.ts`, `backend/server.js`, `src/App.tsx`, `authMiddleware.js`, `rbacMiddleware.js` | Sistema web 100% responsivo para PC, tablet y móviles. Autenticación JWT, contraseñas hasheadas con `bcrypt` (cost 10), cabeceras de seguridad OWASP (`nosniff`, `SAMEORIGIN`, `strict-origin`), rate limiting anti-fuerza bruta y matriz RBAC granular. |
| **Condición 2: Módulo de alertas para reposición de productos con bajo stock** | ✅ **Cumplido** | `backend/src/controllers/alertsController.js`, `src/components/alerts/ActiveAlertsView.tsx`, `purchasesController.js` | Motor de alertas automáticas para: Stock Mínimo, Stock Crítico (quiebre de inventario), Lotes Próximos a Vencer (<30 días) y Vencidos. Vinculado directamente al generador automático de órdenes de reposición. |
| **Condición 3: Interfaz intuitiva reduciendo tiempo de atención al cliente** | ✅ **Cumplido** | `src/components/pos/PointOfSaleView.tsx`, `src/components/Header.tsx` | Punto de Venta (POS) ergonómico con atajos de teclado (`F2` cobrar, `F4` buscar, `ESC`), buscador instantáneo por código de barras o DCI, sugerencia de bioequivalentes/genéricos en 1 clic y cálculo automático de vuelto. |
| **Propuesta 1: Gestión centralizada de inventario, ventas y atención al cliente** | ✅ **Cumplido** | `src/App.tsx`, `PharmacyContext.tsx`, `backend/src/config/db.js` | 10 módulos centralizados: Dashboard, POS, Ventas, Inventario, Caja, Compras, Alertas, Clientes, Personal RBAC y Auditoría. |
| **Propuesta 2: Sistema de registro de ventas** | ✅ **Cumplido** | `backend/src/controllers/salesController.js`, `src/components/sales/SalesHistoryView.tsx` | Registro transaccional de ventas con desglose por lote FEFO, comprobante (Boleta/Factura/Ticket), métodos de pago (Efectivo/Yape/Tarjeta) y auditoría de cajero. |
| **Propuesta 3: Interfaz que agilice el proceso de atención** | ✅ **Cumplido** | `PointOfSaleView.tsx`, `fefoService.js` | Despacho ultra rápido sin fricciones: pre-selección automática del lote con vencimiento más próximo, sin bloqueos innecesarios y con impresión térmica simulada. |
| **Propuesta 4: Optimizar la gestión interna para reducir errores en inventario** | ✅ **Cumplido** | `backend/src/services/fefoService.js`, `InventoryBatchesView.tsx` | Despacho FEFO estricto: descuenta del lote más antiguo, bloquea lotes caducados, permite anulación transaccional con reversión de stock y kárdex auditable. |
| **Requisito Específico: Login normal (sin credenciales por defecto expuestas)** | ✅ **Cumplido** | `src/components/auth/LoginView.tsx` | Pantalla de inicio de sesión profesional y estándar: campos limpios sin datos predeterminados ni tarjetas con contraseñas visibles. |
| **Requisito Específico: Administrador crea nuevos usuarios y rangos de acceso (RBAC)** | ✅ **Cumplido** | `backend/src/controllers/usersController.js`, `backend/src/routes/usersRoutes.js`, `UsersManagementView.tsx` | Módulo de Personal y Accesos para el Administrador: creación de empleados (DNI, nombres, correo, teléfono, rol y contraseña bcrypt), edición de rangos, alternancia de estado activo/inactivo y reseteo de claves. |

---

## 2. Resumen de Pruebas Automatizadas QA (`npm test`)

La suite automatizada de pruebas de integración end-to-end (`tests/api.test.mjs`) cuenta con **7 pruebas pasando al 100%**:

```text
✔ QA-TEST-01: Endpoint /api/health responde 200 OK y cabeceras de seguridad OWASP
✔ QA-TEST-02: Autenticación JWT rechaza credenciales inválidas (401) y acepta perfiles válidos (200)
✔ QA-TEST-03: Control de Acceso Basado en Roles (RBAC) restringe módulos no autorizados
✔ QA-TEST-04: Motor Transaccional FEFO descuenta del lote más próximo a vencer, ignora vencidos y revierte stock en anulación
✔ QA-TEST-05: Alertas de Stock/FEFO y Estadísticas de Dashboard operativas
✔ QA-TEST-06: Capa de Animaciones Nativas cumple GPU-only, prefers-reduced-motion y presupuesto cero-distracción en POS
✔ QA-TEST-07: Gestión de Usuarios y Roles RBAC: Administrador crea nuevos usuarios, asigna rangos y restringe accesos
```

---

## 3. Registro de Hallazgos y Mejoras Implementadas

| ID | Severidad | Categoría | Archivo | Descripción | Corrección Implementada |
| :- | :--- | :--- | :--- | :--- | :--- |
| **QA-01** | Crítica | Funcionalidad / BD | `db.js`, `fefoService.js` | Descuento y reversión errónea en lotes FEFO al anular ventas. | Corrección en orden de inserción de tablas, soporte de `+ @CANTIDAD` en update lotes y persistencia de estado. |
| **QA-02** | Crítica | Seguridad | `package.json` | Dependencia vulnerable `xlsx@0.18.5` y librerías huérfanas. | Remoción de 6 dependencias vulnerables e innecesarias. |
| **QA-03** | Alta | DevOps / Producción | `server.ts`, `package.json` | Script `start` no activaba modo producción ni leía variable `PORT`. | Implementado flag `--production`, lectura de `PORT` y servicio estático de `/dist`. |
| **QA-04** | Alta | Seguridad / Backend | `server.js`, `server.ts` | CORS permisivo abierto a `*` y falta de cabeceras OWASP. | Cabeceras HTTP de seguridad OWASP y whitelist de CORS basada en entorno. |
| **QA-05** | Alta | QA / CI-CD | `tests/api.test.mjs`, `ci.yml` | 0% pruebas automáticas y bloqueo por timers activos. | Timer con `.unref()` en `rateLimiter.js` y creación del pipeline CI en GitHub Actions. |
| **QA-06** | Media | Tipado TypeScript | `tsconfig.json` | Ausencia de `strict: true` y exclusiones obsoletas. | Activado `strict: true` y corrección de tipos en todo el frontend. |
| **QA-07** | Media | Frontend / UI-UX | `App.tsx`, `SidebarDrawer.tsx` | Drawer superpuesto sobre tablas y duplicación de barras de navegación. | Panel lateral acoplado colapsable y barra unificada. |
| **QA-08** | Media | Base de Datos | `02_seed.sql` | Desincronización de permisos en seed puro SQL Server. | Matriz `permisos_usuario` alineada con adaptador transaccional. |
| **QA-09** | Media | DevOps | `.dockerignore`, `.env.example` | Archivos temporales no ignorados en build de Docker. | `.dockerignore` exhaustivo y `.env.example` documentado. |
| **QA-10** | Baja | Bundler | `vite.config.ts` | Uso de `__dirname` en ESM generaba advertencias en Vite 8. | Reemplazado por `import.meta.dirname`. |
| **QA-11** | Media | Seguridad / UX | `LoginView.tsx` | Campos de login pre-rellenados y tarjetas demostrativas con credenciales visibles. | Formulario de login estándar limpio con inputs vacíos, validación de 8 dígitos y show/hide password. |
| **QA-12** | Alta | Funcionalidad / RBAC | `usersController.js`, `usersRoutes.js`, `UsersManagementView.tsx` | El administrador no podía crear nuevos empleados ni definir rangos de acceso. | Implementado módulo integral de personal con endpoints CRUD protegidos, hash bcrypt, asignación de roles y UI completa. |
