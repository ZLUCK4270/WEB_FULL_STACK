-- ==============================================================================
-- NOVA SALUD - ESQUEMA DE BASE DE DATOS EN MICROSOFT SQL SERVER
-- Nombres de tablas y columnas en ESPAÑOL
-- ==============================================================================

-- 1. PERFILES DE USUARIO
CREATE TABLE perfiles_usuario (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    dni VARCHAR(12) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20) NULL,
    cargo VARCHAR(50) NOT NULL DEFAULT 'Cajero',
    es_administrador_raiz BIT NOT NULL DEFAULT 0,
    esta_activo BIT NOT NULL DEFAULT 1,
    debe_cambiar_clave BIT NOT NULL DEFAULT 1,
    ultimo_acceso DATETIME2 NULL,
    ip_ultimo_acceso VARCHAR(45) NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- 2. MÓDULOS DEL SISTEMA
CREATE TABLE modulos_sistema (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    icono VARCHAR(50) NULL,
    orden INT NOT NULL DEFAULT 0,
    esta_activo BIT NOT NULL DEFAULT 1
);

-- 3. PERMISOS DE USUARIO (Matriz RBAC Módulo × Acción)
CREATE TABLE permisos_usuario (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    usuario_id UNIQUEIDENTIFIER NOT NULL,
    modulo_id VARCHAR(50) NOT NULL,
    puede_ver BIT NOT NULL DEFAULT 0,
    puede_crear BIT NOT NULL DEFAULT 0,
    puede_editar BIT NOT NULL DEFAULT 0,
    puede_eliminar BIT NOT NULL DEFAULT 0,
    otorgado_por_id UNIQUEIDENTIFIER NULL,
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_permisos_usuario FOREIGN KEY (usuario_id) REFERENCES perfiles_usuario(id),
    CONSTRAINT fk_permisos_modulo FOREIGN KEY (modulo_id) REFERENCES modulos_sistema(id),
    CONSTRAINT uq_usuario_modulo UNIQUE (usuario_id, modulo_id)
);

-- 4. CATEGORÍAS
CREATE TABLE categorias (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    esta_activa BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- 5. LABORATORIOS
CREATE TABLE laboratorios (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    nombre VARCHAR(150) NOT NULL UNIQUE,
    pais VARCHAR(100) NULL,
    esta_activo BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- 6. PROVEEDORES
CREATE TABLE proveedores (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ruc VARCHAR(11) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    contacto VARCHAR(150) NULL,
    telefono VARCHAR(30) NULL,
    correo VARCHAR(150) NULL,
    direccion TEXT NULL,
    esta_activo BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- 7. PRODUCTOS
CREATE TABLE productos (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    codigo_barras VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    nombre_generico VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(150) NULL,
    concentracion VARCHAR(100) NULL,
    presentacion VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
    registro_sanitario VARCHAR(100) NULL,
    categoria_id UNIQUEIDENTIFIER NOT NULL,
    laboratorio_id UNIQUEIDENTIFIER NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    costo DECIMAL(10,2) NOT NULL,
    stock_minimo INT NOT NULL DEFAULT 10,
    stock_maximo INT NULL,
    requiere_receta BIT NOT NULL DEFAULT 0,
    es_controlado BIT NOT NULL DEFAULT 0,
    imagen_url TEXT NULL,
    esta_activo BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    CONSTRAINT fk_producto_laboratorio FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id)
);

-- 8. LOTES (Control FEFO y vencimiento)
CREATE TABLE lotes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    producto_id UNIQUEIDENTIFIER NOT NULL,
    codigo_lote VARCHAR(100) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_inicial INT NOT NULL,
    proveedor_id UNIQUEIDENTIFIER NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'VIGENTE',
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_lote_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
    CONSTRAINT fk_lote_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    CONSTRAINT uq_producto_lote UNIQUE (producto_id, codigo_lote)
);

-- 9. MOVIMIENTOS DE STOCK (Kárdex)
CREATE TABLE movimientos_stock (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    producto_id UNIQUEIDENTIFIER NOT NULL,
    lote_id UNIQUEIDENTIFIER NULL,
    usuario_id UNIQUEIDENTIFIER NOT NULL,
    tipo_movimiento VARCHAR(30) NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    motivo TEXT NOT NULL,
    referencia_id UNIQUEIDENTIFIER NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
    CONSTRAINT fk_movimiento_lote FOREIGN KEY (lote_id) REFERENCES lotes(id),
    CONSTRAINT fk_movimiento_usuario FOREIGN KEY (usuario_id) REFERENCES perfiles_usuario(id)
);

-- 10. CLIENTES
CREATE TABLE clientes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tipo_documento VARCHAR(10) NOT NULL DEFAULT 'DNI',
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    nombre_completo VARCHAR(200) NOT NULL,
    telefono VARCHAR(30) NULL,
    correo VARCHAR(150) NULL,
    direccion TEXT NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- 11. VENTAS (Punto de Venta)
CREATE TABLE ventas (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    codigo_venta VARCHAR(50) NOT NULL UNIQUE,
    cajero_id UNIQUEIDENTIFIER NOT NULL,
    cliente_id UNIQUEIDENTIFIER NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA',
    metodo_pago VARCHAR(20) NOT NULL DEFAULT 'EFECTIVO',
    subtotal DECIMAL(10,2) NOT NULL,
    monto_igv DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_descuento DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_total DECIMAL(10,2) NOT NULL,
    efectivo_entregado DECIMAL(10,2) NULL,
    vuelto DECIMAL(10,2) NULL,
    anulado_por_id UNIQUEIDENTIFIER NULL,
    motivo_anulacion TEXT NULL,
    fecha_anulacion DATETIME2 NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_venta_cajero FOREIGN KEY (cajero_id) REFERENCES perfiles_usuario(id),
    CONSTRAINT fk_venta_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_venta_anulado_por FOREIGN KEY (anulado_por_id) REFERENCES perfiles_usuario(id)
);

-- 12. ÍTEMS DE VENTA
CREATE TABLE items_venta (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    venta_id UNIQUEIDENTIFIER NOT NULL,
    producto_id UNIQUEIDENTIFIER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_item_venta_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_venta_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- 13. ÍTEMS DE VENTA POR LOTE (Despacho FEFO exacto)
CREATE TABLE items_venta_lotes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    item_venta_id UNIQUEIDENTIFIER NOT NULL,
    lote_id UNIQUEIDENTIFIER NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT fk_ivl_item FOREIGN KEY (item_venta_id) REFERENCES items_venta(id) ON DELETE CASCADE,
    CONSTRAINT fk_ivl_lote FOREIGN KEY (lote_id) REFERENCES lotes(id)
);

-- 14. COMPRAS (Órdenes a proveedores)
CREATE TABLE compras (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    codigo_compra VARCHAR(50) NOT NULL UNIQUE,
    proveedor_id UNIQUEIDENTIFIER NOT NULL,
    comprador_id UNIQUEIDENTIFIER NOT NULL,
    numero_factura VARCHAR(50) NULL,
    fecha_factura DATE NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA',
    monto_total DECIMAL(10,2) NOT NULL,
    notas TEXT NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_compra_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    CONSTRAINT fk_compra_comprador FOREIGN KEY (comprador_id) REFERENCES perfiles_usuario(id)
);

-- 15. ÍTEMS DE COMPRA
CREATE TABLE items_compra (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    compra_id UNIQUEIDENTIFIER NOT NULL,
    producto_id UNIQUEIDENTIFIER NOT NULL,
    cantidad_ordenada INT NOT NULL,
    cantidad_recibida INT NOT NULL DEFAULT 0,
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_item_compra_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_compra_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- 16. ALERTAS DE STOCK
CREATE TABLE alertas_stock (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    producto_id UNIQUEIDENTIFIER NOT NULL,
    lote_id UNIQUEIDENTIFIER NULL,
    tipo_alerta VARCHAR(30) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    mensaje TEXT NOT NULL,
    origen_disparador VARCHAR(20) NOT NULL DEFAULT 'CRON_JOB',
    resuelto_por_id UNIQUEIDENTIFIER NULL,
    fecha_resolucion DATETIME2 NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_alerta_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
    CONSTRAINT fk_alerta_lote FOREIGN KEY (lote_id) REFERENCES lotes(id),
    CONSTRAINT fk_alerta_resuelto_por FOREIGN KEY (resuelto_por_id) REFERENCES perfiles_usuario(id)
);

-- 17. SUGERENCIAS DE REPOSICIÓN
CREATE TABLE sugerencias_reposicion (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    proveedor_id UNIQUEIDENTIFIER NOT NULL,
    producto_id UNIQUEIDENTIFIER NOT NULL,
    cantidad_sugerida INT NOT NULL,
    costo_estimado DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'SUGERIDO',
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_sugerencia_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    CONSTRAINT fk_sugerencia_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- 18. REGISTROS DE AUDITORÍA FORENSE
CREATE TABLE registros_auditoria_sistema (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    usuario_id UNIQUEIDENTIFIER NULL,
    accion VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id VARCHAR(100) NULL,
    datos_anteriores NVARCHAR(MAX) NULL,
    datos_nuevos NVARCHAR(MAX) NULL,
    direccion_ip VARCHAR(45) NULL,
    user_agent NVARCHAR(MAX) NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES perfiles_usuario(id)
);

-- Índices recomendados
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_lotes_vencimiento ON lotes(fecha_vencimiento);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_creacion);
CREATE INDEX idx_movimientos_stock_fecha ON movimientos_stock(fecha_creacion);
CREATE INDEX idx_alertas_estado ON alertas_stock(estado);
CREATE INDEX idx_auditoria_fecha ON registros_auditoria_sistema(fecha_creacion);

PRINT 'Esquema de Nova Salud creado correctamente en SQL Server.';
