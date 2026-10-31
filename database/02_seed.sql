-- ==============================================================================
-- NOVA SALUD - DATOS SEMILLA (SEED) PARA SQL SERVER
-- ==============================================================================

-- Módulos del sistema
INSERT INTO modulos_sistema (id, nombre, descripcion, icono, orden, esta_activo) VALUES
('dashboard', 'Dashboard Resumen', 'Vista general del negocio', 'LayoutDashboard', 1, 1),
('pos_sales', 'Punto de Venta (POS)', 'Ventas y despacho FEFO', 'ShoppingCart', 2, 1),
('inventory', 'Inventario & Lotes FEFO', 'Control de stock y vencimientos', 'Boxes', 3, 1),
('cash', 'Caja Registradora', 'Apertura, cierre y arqueo', 'CreditCard', 4, 1),
('purchases', 'Compras & Proveedores', 'Órdenes de compra', 'Truck', 5, 1),
('alerts', 'Centro de Alertas', 'Stock bajo y vencimientos', 'BellRing', 6, 1),
('customers', 'Clientes', 'Registro y atención al cliente', 'Users', 7, 1),
('staff', 'Usuarios & RBAC', 'Matriz de permisos', 'ShieldCheck', 8, 1),
('audit', 'Auditoría Forense', 'Bitácora de acciones', 'FileText', 9, 1),
('backups', 'Respaldos', 'Copias de seguridad del sistema', 'Database', 10, 1);

-- Usuario Administrador Raíz (inmutable)
INSERT INTO perfiles_usuario (id, dni, nombre, apellido, correo, telefono, cargo, es_administrador_raiz, esta_activo, debe_cambiar_clave) VALUES
('a0000000-0000-0000-0000-000000000001', '10203040', 'Carlos Alberto', 'Mendoza Vera', 'admin@novasalud.pe', '987654321', 'Q.F. Regente / Administrador General', 1, 1, 0);

-- Usuario Cajero
INSERT INTO perfiles_usuario (id, dni, nombre, apellido, correo, telefono, cargo, es_administrador_raiz, esta_activo, debe_cambiar_clave) VALUES
('b0000000-0000-0000-0000-000000000002', '71829304', 'Juan Manuel', 'Pérez García', 'cajero@novasalud.pe', '912345678', 'Técnico en Farmacia / Cajero POS', 0, 1, 0);

-- Usuario Almacén
INSERT INTO perfiles_usuario (id, dni, nombre, apellido, correo, telefono, cargo, es_administrador_raiz, esta_activo, debe_cambiar_clave) VALUES
('c0000000-0000-0000-0000-000000000003', '76543210', 'Luis Enrique', 'Torres Valdivia', 'almacen@novasalud.pe', '998877665', 'Jefe de Almacén y Control BPA', 0, 1, 0);

-- Categorías
DECLARE @catAntibioticos UNIQUEIDENTIFIER = NEWID();
DECLARE @catAnalgesicos UNIQUEIDENTIFIER = NEWID();
DECLARE @catGastro UNIQUEIDENTIFIER = NEWID();

INSERT INTO categorias (id, nombre, slug, descripcion, esta_activa) VALUES
(@catAntibioticos, 'Antibióticos & Antimicrobianos', 'antibioticos', 'Tratamiento de infecciones bacterianas', 1),
(@catAnalgesicos, 'Analgésicos & Antipiréticos', 'analgesicos', 'Control de dolor y fiebre', 1),
(@catGastro, 'Gastroenterología & Antiácidos', 'gastro', 'Inhibidores de bomba y protectores gástricos', 1);

-- Laboratorios
DECLARE @labFarmaindustria UNIQUEIDENTIFIER = NEWID();
DECLARE @labBago UNIQUEIDENTIFIER = NEWID();

INSERT INTO laboratorios (id, nombre, pais, esta_activo) VALUES
(@labFarmaindustria, 'Farmaindustria S.A.', 'Perú', 1),
(@labBago, 'Laboratorios Bagó del Perú S.A.', 'Argentina / Perú', 1);

-- Proveedores
DECLARE @supDrogueria UNIQUEIDENTIFIER = NEWID();

INSERT INTO proveedores (id, ruc, razon_social, contacto, telefono, correo, direccion, esta_activo) VALUES
(@supDrogueria, '20100123456', 'Droguería Distribuidora Nova Farma S.A.C.', 'Lic. Miguel Falconí', '(01) 513-8000', 'ventas@novafarma.pe', 'Av. Industrial 1420, Lima', 1);

-- Productos
DECLARE @prodAmoxicilina UNIQUEIDENTIFIER = NEWID();
DECLARE @prodIbuprofeno UNIQUEIDENTIFIER = NEWID();
DECLARE @prodOmeprazol UNIQUEIDENTIFIER = NEWID();

INSERT INTO productos (id, codigo_barras, nombre, nombre_generico, nombre_comercial, concentracion, presentacion, registro_sanitario, categoria_id, laboratorio_id, precio_venta, costo, stock_minimo, stock_maximo, requiere_receta, es_controlado, esta_activo) VALUES
(@prodAmoxicilina, '7750123456789', 'Amoxicilina 500mg Cápsulas', 'Amoxicilina', 'Amoxil', '500 mg', 'CAJA', 'EE-04521-DIGEMID', @catAntibioticos, @labFarmaindustria, 3.50, 1.40, 30, 180, 1, 0, 1),
(@prodIbuprofeno, '7750987654321', 'Ibuprofeno 400mg Tabletas', 'Ibuprofeno', 'Doloral', '400 mg', 'BLISTER', 'EE-01298-DIGEMID', @catAnalgesicos, @labBago, 2.50, 0.90, 40, 200, 0, 0, 1),
(@prodOmeprazol, '7750112233445', 'Omeprazol 20mg Cápsulas', 'Omeprazol', NULL, '20 mg', 'CAJA', NULL, @catGastro, @labFarmaindustria, 3.00, 1.10, 35, 160, 0, 0, 1);

-- Lotes FEFO
DECLARE @exp30Days DATE = DATEADD(DAY, 30, CAST(GETDATE() AS DATE));
DECLARE @exp1Year DATE = DATEADD(YEAR, 1, CAST(GETDATE() AS DATE));
DECLARE @expExpired DATE = DATEADD(DAY, -15, CAST(GETDATE() AS DATE));
DECLARE @exp24h DATE = CAST(DATEADD(HOUR, 18, GETDATE()) AS DATE);

INSERT INTO lotes (producto_id, codigo_lote, fecha_vencimiento, stock_actual, stock_inicial, proveedor_id, estado) VALUES
(@prodAmoxicilina, 'LOTE-AMX-2026-PRIORIDAD-1', @exp30Days, 25, 50, @supDrogueria, 'VIGENTE'),
(@prodAmoxicilina, 'LOTE-AMX-2027-RESERVA-2', @exp1Year, 100, 100, @supDrogueria, 'VIGENTE'),
(@prodAmoxicilina, 'LOTE-AMX-VENCIDO-BLOQUEADO', @expExpired, 10, 50, @supDrogueria, 'VENCIDO'),
(@prodIbuprofeno, 'LOTE-IBU-2026-10', DATEADD(DAY, 25, CAST(GETDATE() AS DATE)), 22, 150, @supDrogueria, 'VIGENTE'),
(@prodOmeprazol, 'LOTE-OME-24H-CRIT', @exp24h, 8, 40, @supDrogueria, 'VIGENTE');

-- Cliente de ejemplo
INSERT INTO clientes (id, tipo_documento, numero_documento, nombre_completo, telefono, correo, direccion) VALUES
(NEWID(), 'DNI', '45892134', 'Rosa María Chávez Ortiz', '984512367', 'rosa.chavez@gmail.com', 'Jr. Los Álamos 340, Breña');

-- Permisos para el Cajero (POS, Ventas, Caja, Clientes, Alertas e Inventario lectura)
INSERT INTO permisos_usuario (usuario_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar, otorgado_por_id) VALUES
('b0000000-0000-0000-0000-000000000002', 'dashboard', 1, 0, 0, 0, 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'pos_sales', 1, 1, 1, 1, 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'cash', 1, 1, 1, 0, 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'customers', 1, 1, 1, 0, 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'inventory', 1, 0, 0, 0, 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'alerts', 1, 1, 1, 0, 'a0000000-0000-0000-0000-000000000001');

-- Permisos para Almacén
INSERT INTO permisos_usuario (usuario_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar, otorgado_por_id) VALUES
('c0000000-0000-0000-0000-000000000003', 'dashboard', 1, 0, 0, 0, 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000003', 'inventory', 1, 1, 1, 1, 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000003', 'purchases', 1, 1, 1, 1, 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000003', 'alerts', 1, 1, 1, 1, 'a0000000-0000-0000-0000-000000000001');

PRINT 'Datos semilla insertados correctamente.';
