// Utility providing the complete SQL Script for external database operations
// DDL, Seeds (INSERT), and Relational INSERT JOIN statements

export const COMPLETE_SQL_SCRIPT = `-- ==============================================================================
-- SISTEMA DE GESTIÓN FARMACÉUTICA & BOTICAS: "BOTICA NOVA SALUD S.A.C."
-- RUC: 20601234567 | Lima, Perú
-- SCRIPT COMPLETO DE BASE DE DATOS: DDL, INSERTS DE SEMILLA & INSERT JOIN
-- Compatible con: PostgreSQL 14+, MySQL 8+, SQLite 3+, Supabase & Cloud SQL
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ESTRUCTURA DE TABLAS (DDL)
-- ------------------------------------------------------------------------------

-- Tabla 1: Colaboradores, Usuarios y Roles Sanitarios (RBAC)
CREATE TABLE IF NOT EXISTS staff_users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    dni VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'regente', 'admin', 'cajero', 'almacen'
    role_title VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    colegiatura VARCHAR(50), -- Colegiatura Químico Farmacéutico (CQFP)
    active_shift VARCHAR(20) DEFAULT 'mañana',
    avatar_initials VARCHAR(5),
    allowed_tabs TEXT,
    can_sell BOOLEAN DEFAULT FALSE,
    can_receive_batches BOOLEAN DEFAULT FALSE,
    can_adjust_stock BOOLEAN DEFAULT FALSE,
    can_open_close_cash BOOLEAN DEFAULT FALSE,
    can_view_financials BOOLEAN DEFAULT FALSE,
    can_manage_staff BOOLEAN DEFAULT FALSE,
    can_sign_digemid_reports BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 2: Droguerías y Proveedores Farmacéuticos
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    ruc VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(255),
    contact_person VARCHAR(100),
    payment_terms VARCHAR(50),
    rating DECIMAL(3,2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 3: Catálogo Oficial de Medicamentos
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200) NOT NULL, -- DCI
    category VARCHAR(100) NOT NULL,
    concentration VARCHAR(100),
    presentation VARCHAR(150),
    laboratory VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    min_stock INT DEFAULT 10,
    requires_prescription BOOLEAN DEFAULT FALSE,
    is_controlled BOOLEAN DEFAULT FALSE,
    location VARCHAR(100),
    sanitary_registration VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 4: Lotes de Medicamentos con Trazabilidad FEFO & Caducidades
CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    batch_code VARCHAR(50) NOT NULL,
    expiration_date DATE NOT NULL,
    received_date DATE DEFAULT CURRENT_DATE,
    stock INT NOT NULL DEFAULT 0,
    initial_stock INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    supplier_name VARCHAR(150),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'quarantine'
    quarantine_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_batches_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabla 5: Clientes y Pacientes
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    doc_type VARCHAR(20) NOT NULL,
    doc_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(255),
    allergies TEXT,
    chronic_conditions TEXT,
    total_purchases DECIMAL(12,2) DEFAULT 0.00,
    last_purchase_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 6: Turnos de Caja & Arqueos Físicos
CREATE TABLE IF NOT EXISTS cash_registers (
    id VARCHAR(50) PRIMARY KEY,
    is_open BOOLEAN DEFAULT TRUE,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    cashier_name VARCHAR(150) NOT NULL,
    shift VARCHAR(20) DEFAULT 'mañana',
    initial_fund DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    current_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_sales_cash DECIMAL(10,2) DEFAULT 0.00,
    total_sales_yape DECIMAL(10,2) DEFAULT 0.00,
    total_sales_card DECIMAL(10,2) DEFAULT 0.00,
    total_inflow DECIMAL(10,2) DEFAULT 0.00,
    total_outflow DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 7: Movimientos de Caja
CREATE TABLE IF NOT EXISTS cash_movements (
    id VARCHAR(50) PRIMARY KEY,
    cash_register_id VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    concept VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responsible_name VARCHAR(150) NOT NULL,
    voucher_number VARCHAR(50),
    CONSTRAINT fk_movements_register FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE CASCADE
);

-- Tabla 8: Órdenes de Compra con Droguerías
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(50) PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendiente',
    received_at DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Tabla 9: Detalle de Ítems de Órdenes de Compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabla 10: Comprobantes Electrónicos de Venta
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    receipt_type VARCHAR(20) NOT NULL,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_name VARCHAR(150) NOT NULL DEFAULT 'Público General',
    customer_doc VARCHAR(20) NOT NULL DEFAULT '00000000',
    cashier_name VARCHAR(150) NOT NULL,
    cashier_id VARCHAR(50),
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    discount_total DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) DEFAULT 0.00,
    operation_code VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 11: Detalle de Venta con Asignación de Lote FEFO
CREATE TABLE IF NOT EXISTS sale_items (
    id VARCHAR(50) PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    batch_code VARCHAR(50) NOT NULL,
    expiration_date DATE NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabla 12: Log de Actividades y Trazabilidad Continua
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    time_formatted VARCHAR(20) NOT NULL,
    date_formatted DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    action VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role_title VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'info',
    metadata_json TEXT
);

-- Tabla 13: Tabla Relacional para Análisis de Márgenes (Destino de INSERT JOIN)
CREATE TABLE IF NOT EXISTS sales_relational_margin_analysis (
    id VARCHAR(50) PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
    sale_date TIMESTAMP NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    batch_code VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_sale DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    gross_margin DECIMAL(10,2) NOT NULL,
    margin_percent DECIMAL(5,2) NOT NULL,
    cashier_name VARCHAR(150) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 14: Tabla Consolidada de Lotes FEFO por Producto (Destino de INSERT JOIN)
CREATE TABLE IF NOT EXISTS product_fefo_consolidated (
    product_id VARCHAR(50) PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    total_active_stock INT NOT NULL,
    active_batches_count INT NOT NULL,
    earliest_batch_code VARCHAR(50),
    earliest_expiration_date DATE,
    average_unit_cost DECIMAL(10,2),
    stock_status VARCHAR(50),
    last_evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 15: Alertas Sanitarias Automatizadas de Lotes (Destino de INSERT JOIN)
CREATE TABLE IF NOT EXISTS batch_health_alerts (
    id VARCHAR(50) PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    batch_code VARCHAR(50) NOT NULL,
    expiration_date DATE NOT NULL,
    days_remaining INT NOT NULL,
    stock INT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    action_required VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. INSERCIÓN DE DATOS DE SEMILLA (INSERTS)
-- ==============================================================================

-- 2.1 Colaboradores (staff_users)
INSERT INTO staff_users (id, username, password, name, dni, role, role_title, email, colegiatura, active_shift, avatar_initials, allowed_tabs, can_sell, can_receive_batches, can_adjust_stock, can_open_close_cash, can_view_financials, can_manage_staff, can_sign_digemid_reports) VALUES
('usr-1', 'cmendoza', 'regente2026', 'Dr. Carlos Mendoza Flores', '43928172', 'regente', 'Farmacéutico Regente Titular', 'cmendoza@novasalud.pe', 'CQFP N° 18492', 'mañana', 'CM', '["dashboard","pos","inventory","cash","purchases","alerts","customers","staff","reports","backups","audit"]', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('usr-2', 'amorales', 'caja2026', 'Ana Morales Quispe', '71829341', 'cajero', 'Técnica en Farmacia / Cajera POS', 'amorales@novasalud.pe', NULL, 'mañana', 'AM', '["pos","cash","customers","alerts"]', TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE),
('usr-3', 'rdiaz', 'admin2026', 'Lic. Roberto Díaz Salazar', '10928374', 'admin', 'Administrador General de Operaciones', 'rdiaz@novasalud.pe', NULL, 'mañana', 'RD', '["dashboard","pos","inventory","cash","purchases","alerts","customers","staff","reports","backups","audit"]', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
('usr-4', 'ltorres', 'almacen2026', 'Luis Torres Valdivia', '76543210', 'almacen', 'Asistente de Almacén y Logística', 'ltorres@novasalud.pe', NULL, 'mañana', 'LT', '["inventory","purchases","alerts"]', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE);

-- 2.2 Droguerías (suppliers)
INSERT INTO suppliers (id, ruc, name, phone, email, address, contact_person, payment_terms, rating) VALUES
('sup-1', '20100123456', 'Droguería Suiza Lab S.A.C.', '(01) 419-5000', 'pedidos@suizalab.com.pe', 'Av. Elmer Faucett 1920, Callao', 'Ing. Martín Solari', 'Crédito 30 días', 4.90),
('sup-2', '20100234567', 'Medifarma Perú S.A.', '(01) 619-2000', 'ventas@medifarma.com.pe', 'Jr. Ecuador 787, Lima', 'Lic. Patricia Vega', 'Crédito 15 días', 4.80),
('sup-3', '20251239871', 'Alfaro Distribuciones Farmacéuticas', '(01) 326-1144', 'atencion@alfarodist.com.pe', 'Av. Nicolás Arriola 1420, San Luis, Lima', 'Carlos Alfaro', 'Contado contra entrega', 4.60),
('sup-4', '20100876543', 'Farmaindustria S.A.', '(01) 513-8600', 'contacto@farmaindustria.com.pe', 'Av. Mariscal Miller 2151, Lince, Lima', 'Dra. Elena Ruiz', 'Crédito 30 días', 4.70);

-- 2.3 Medicamentos (products)
INSERT INTO products (id, code, name, generic_name, category, concentration, presentation, laboratory, unit_price, min_stock, requires_prescription, is_controlled, location, sanitary_registration) VALUES
('prod-1', 'MED-001', 'Amoxicilina 500mg', 'Amoxicilina Trihidrato', 'Antibióticos y Antimicrobianos', '500 mg', 'Caja x 100 cápsulas', 'Medifarma Perú', 1.20, 80, TRUE, FALSE, 'Estante A-01 (Antibióticos)', 'NG-19283-PE'),
('prod-2', 'MED-002', 'Paracetamol 500mg', 'Paracetamol (Acetaminofén)', 'Analgésicos y Antipiréticos', '500 mg', 'Caja x 100 tabletas', 'AC Farma', 0.50, 150, FALSE, FALSE, 'Estante A-03 (Mostrador Rápido)', 'EE-08271-PE'),
('prod-3', 'MED-003', 'Ibuprofeno 400mg', 'Ibuprofeno', 'Analgésicos y Antipiréticos', '400 mg', 'Caja x 100 tabletas recubiertas', 'Farmaindustria S.A.', 0.80, 100, FALSE, FALSE, 'Estante A-04 (Analgésicos)', 'EN-11920-PE'),
('prod-4', 'MED-004', 'Losartán Potásico 50mg', 'Losartán Potásico', 'Antihipertensivos y Cardiológicos', '50 mg', 'Caja x 30 tabletas', 'Bagó del Perú', 1.50, 60, TRUE, FALSE, 'Estante B-02 (Cardiovasculares)', 'EN-09182-PE'),
('prod-5', 'MED-005', 'Omeprazol 20mg', 'Omeprazol', 'Gastrointestinales', '20 mg', 'Caja x 30 cápsulas con microgránulos', 'Medifarma Perú', 1.10, 70, FALSE, FALSE, 'Estante C-01 (Gastro)', 'EE-14920-PE'),
('prod-6', 'MED-006', 'Cetirizina 10mg', 'Cetirizina Diclorhidrato', 'Antihistamínicos y Respiratorios', '10 mg', 'Caja x 20 tabletas', 'Roemmers', 1.00, 50, FALSE, FALSE, 'Estante C-03 (Alergias)', 'NG-22019-PE'),
('prod-7', 'MED-007', 'Azitromicina 500mg', 'Azitromicina Dihidrato', 'Antibióticos y Antimicrobianos', '500 mg', 'Caja x 3 tabletas', 'Medifarma Perú', 6.50, 30, TRUE, FALSE, 'Estante A-02 (Antibióticos)', 'EN-18290-PE'),
('prod-8', 'MED-008', 'Clonazepam 2mg', 'Clonazepam', 'Analgésicos y Antipiréticos', '2 mg', 'Caja x 30 comprimidos ranurados', 'Roche Farma', 2.80, 25, TRUE, TRUE, 'Vitrina de Seguridad (Controlados Lista IV)', 'EE-00192-PE'),
('prod-9', 'MED-009', 'Complejo B Forte', 'Tiamina + Piridoxina + Cianocobalamina', 'Vitaminas y Suplementos', '100mg + 100mg + 1000mcg', 'Caja x 3 ampollas inyectables', 'Bagó del Perú', 12.00, 20, FALSE, FALSE, 'Estante D-01 (Inyectables)', 'NG-09182-PE'),
('prod-10', 'MED-010', 'Alcohol Medicinal 70° (1 Litro)', 'Alcohol Etílico 70° GL', 'Cuidado Personal y Primeros Auxilios', '70%', 'Frasco x 1000 ml', 'Laboratorios Alkofarma', 9.50, 15, FALSE, FALSE, 'Almacén Central / Primeros Auxilios', 'DM-08192-PE');

-- 2.4 Lotes FEFO (batches)
INSERT INTO batches (id, product_id, batch_code, expiration_date, received_date, stock, initial_stock, unit_cost, supplier_name, status, quarantine_reason) VALUES
('bat-101', 'prod-1', 'LOT-AMX-2026-11', '2026-11-20', '2025-11-10', 24, 100, 0.65, 'Medifarma Perú S.A.', 'active', NULL),
('bat-102', 'prod-1', 'LOT-AMX-2027-04', '2027-04-15', '2026-04-02', 90, 120, 0.68, 'Medifarma Perú S.A.', 'active', NULL),
('bat-103', 'prod-1', 'LOT-AMX-2025-05', '2025-05-15', '2024-05-01', 12, 100, 0.60, 'Medifarma Perú S.A.', 'expired', 'Fecha de caducidad vencida según auditoría DIGEMID'),
('bat-201', 'prod-2', 'LOT-PAR-2026-12', '2026-12-10', '2025-12-05', 85, 200, 0.22, 'Alfaro Distribuciones Farmacéuticas', 'active', NULL),
('bat-202', 'prod-2', 'LOT-PAR-2027-08', '2027-08-30', '2026-08-12', 180, 200, 0.24, 'Alfaro Distribuciones Farmacéuticas', 'active', NULL),
('bat-301', 'prod-3', 'LOT-IBU-2026-10', '2026-10-25', '2025-10-18', 22, 150, 0.38, 'Farmaindustria S.A.', 'active', NULL),
('bat-302', 'prod-3', 'LOT-IBU-2027-11', '2027-11-15', '2026-05-10', 130, 150, 0.40, 'Farmaindustria S.A.', 'active', NULL),
('bat-401', 'prod-4', 'LOT-LOS-2027-06', '2027-06-30', '2026-06-15', 75, 100, 0.72, 'Droguería Suiza Lab S.A.C.', 'active', NULL),
('bat-501', 'prod-5', 'LOT-OME-2027-03', '2027-03-12', '2026-03-01', 82, 100, 0.48, 'Medifarma Perú S.A.', 'active', NULL),
('bat-urg-24h', 'prod-5', 'LOT-OME-24H-CRIT', '2026-10-12', '2025-10-09', 8, 40, 0.48, 'Medifarma Perú S.A.', 'active', NULL),
('bat-601', 'prod-6', 'LOT-CET-2027-05', '2027-05-20', '2026-02-15', 18, 80, 0.45, 'Alfaro Distribuciones Farmacéuticas', 'active', NULL),
('bat-701', 'prod-7', 'LOT-AZI-2027-09', '2027-09-18', '2026-07-10', 36, 50, 3.20, 'Medifarma Perú S.A.', 'active', NULL),
('bat-801', 'prod-8', 'LOT-CLO-2027-12', '2027-12-05', '2026-01-20', 28, 30, 1.40, 'Droguería Suiza Lab S.A.C.', 'active', NULL),
('bat-901', 'prod-9', 'LOT-CPB-2027-07', '2027-07-28', '2026-04-12', 24, 30, 6.50, 'Droguería Suiza Lab S.A.C.', 'active', NULL),
('bat-1001', 'prod-10', 'LOT-ALC-2028-02', '2028-02-28', '2026-02-10', 19, 25, 5.20, 'Alfaro Distribuciones Farmacéuticas', 'active', NULL);

-- 2.5 Clientes (customers)
INSERT INTO customers (id, doc_type, doc_number, full_name, phone, email, address, allergies, chronic_conditions, total_purchases, last_purchase_date) VALUES
('cust-1', 'DNI', '41928374', 'María Elena Salazar Ponce', '987 654 321', 'msalazar@gmail.com', 'Jr. Los Álamos 452, Breña, Lima', 'Penicilina, Sulfa', 'Hipertensión Arterial', 450.80, '2026-10-06'),
('cust-2', 'DNI', '10293847', 'Jorge Luis Huamán Ramos', '992 113 445', 'jhuaman@hotmail.com', 'Av. Brasil 1820, Jesús María', NULL, 'Diabetes Tipo 2', 620.00, '2026-10-07'),
('cust-3', 'RUC', '20601928374', 'Clínica Dental San Juan E.I.R.L.', '(01) 424-8899', 'compras@dentalsanjuan.pe', 'Av. Arica 650, Breña', NULL, NULL, 1850.50, '2026-10-05');

-- 2.6 Caja (cash_registers & movements)
INSERT INTO cash_registers (id, is_open, opened_at, cashier_name, shift, initial_fund, current_cash, total_sales_cash, total_sales_yape, total_sales_card, total_inflow, total_outflow) VALUES
('caja-01', TRUE, '2026-10-07 08:00:00', 'Ana Morales Quispe', 'mañana', 250.00, 238.00, 13.00, 56.00, 19.00, 263.00, 25.00);

INSERT INTO cash_movements (id, cash_register_id, type, concept, amount, category, timestamp, responsible_name, voucher_number) VALUES
('mov-1', 'caja-01', 'ingreso', 'Fondo de Apertura de Caja (Sencillo)', 250.00, 'fondo_inicial', '2026-10-07 08:00:00', 'Ana Morales Quispe', NULL),
('mov-2', 'caja-01', 'egreso', 'Compra de rollos térmicos para ticketera POS', 25.00, 'gasto_operativo', '2026-10-07 10:30:00', 'Ana Morales Quispe', 'B003-882');

-- 2.7 Órdenes de Compra (purchase_orders & items)
INSERT INTO purchase_orders (id, order_number, supplier_id, supplier_name, date, total, status, received_at, notes) VALUES
('oc-1', 'OC-2026-0041', 'sup-3', 'Alfaro Distribuciones Farmacéuticas', '2026-10-05', 89.00, 'pendiente', NULL, 'Reposición urgente por quiebre de stock de Cetirizina.'),
('oc-2', 'OC-2026-0040', 'sup-2', 'Medifarma Perú S.A.', '2026-09-28', 116.40, 'recibido', '2026-10-01', 'Pedido mensual habitual.');

INSERT INTO purchase_order_items (id, order_id, product_id, product_name, quantity, unit_cost, subtotal) VALUES
('oci-1', 'oc-1', 'prod-6', 'Cetirizina 10mg', 100, 0.45, 45.00),
('oci-2', 'oc-1', 'prod-2', 'Paracetamol 500mg', 200, 0.22, 44.00),
('oci-3', 'oc-2', 'prod-1', 'Amoxicilina 500mg', 120, 0.65, 78.00),
('oci-4', 'oc-2', 'prod-5', 'Omeprazol 20mg', 80, 0.48, 38.40);

-- 2.8 Ventas & Detalle FEFO (sales & sale_items)
INSERT INTO sales (id, receipt_type, receipt_number, date, customer_name, customer_doc, cashier_name, cashier_id, subtotal, igv, discount_total, total, payment_method, amount_paid, change_amount, operation_code, notes) VALUES
('sale-1', 'boleta', 'B001-000481', '2026-10-07 09:15:00', 'María Elena Salazar Ponce', '41928374', 'Ana Morales Quispe', 'usr-2', 47.46, 8.54, 0.00, 56.00, 'yape', 56.00, 0.00, 'OP-983141', 'Paciente con receta médica'),
('sale-2', 'boleta', 'B001-000482', '2026-10-07 10:45:00', 'Público General', '00000000', 'Ana Morales Quispe', 'usr-2', 11.02, 1.98, 0.00, 13.00, 'efectivo', 20.00, 7.00, NULL, 'Venta en mostrador'),
('sale-3', 'ticket', 'T001-001209', '2026-10-07 11:30:00', 'Jorge Luis Huamán Ramos', '10293847', 'Ana Morales Quispe', 'usr-2', 16.10, 2.90, 0.00, 19.00, 'tarjeta', 19.00, 0.00, 'VISA-4421', 'Ticket emitido en caja rápida');

INSERT INTO sale_items (id, sale_id, product_id, product_name, generic_name, batch_code, expiration_date, quantity, unit_price, subtotal) VALUES
('si-1', 'sale-1', 'prod-4', 'Losartán Potásico 50mg', 'Losartán Potásico', 'LOT-LOS-2027-06', '2027-06-30', 30, 1.50, 45.00),
('si-2', 'sale-1', 'prod-5', 'Omeprazol 20mg', 'Omeprazol', 'LOT-OME-2027-03', '2027-03-12', 10, 1.10, 11.00),
('si-3', 'sale-2', 'prod-2', 'Paracetamol 500mg', 'Paracetamol (Acetaminofén)', 'LOT-PAR-2026-12', '2026-12-10', 10, 0.50, 5.00),
('si-4', 'sale-2', 'prod-3', 'Ibuprofeno 400mg', 'Ibuprofeno', 'LOT-IBU-2026-10', '2026-10-25', 10, 0.80, 8.00),
('si-5', 'sale-3', 'prod-10', 'Alcohol Medicinal 70° (1 Litro)', 'Alcohol Etílico 70° GL', 'LOT-ALC-2028-02', '2028-02-28', 2, 9.50, 19.00);

-- 2.9 Auditoría de Operaciones (activity_logs)
INSERT INTO activity_logs (id, timestamp, time_formatted, date_formatted, category, action, description, user_id, user_name, user_role_title, severity) VALUES
('act-001', '2026-10-07 08:00:05', '08:00:05', '2026-10-07', 'CAJA', 'Apertura de Turno & Fondo Inicial', 'Apertura de turno Mañana con fondo inicial de S/ 250.00 en gaveta principal.', 'usr-2', 'Ana Morales Quispe', 'Técnica en Farmacia / Cajera POS', 'info'),
('act-002', '2026-10-07 09:15:30', '09:15:30', '2026-10-07', 'VENTA', 'Dispensación POS FEFO', 'Venta Boleta B001-000481 emitida por S/ 56.00 pagada con Yape.', 'usr-2', 'Ana Morales Quispe', 'Técnica en Farmacia / Cajera POS', 'success'),
('act-003', '2026-10-07 10:45:12', '10:45:12', '2026-10-07', 'VENTA', 'Dispensación POS FEFO', 'Venta Boleta B001-000482 emitida por S/ 13.00 con vuelto S/ 7.00.', 'usr-2', 'Ana Morales Quispe', 'Técnica en Farmacia / Cajera POS', 'success'),
('act-004', '2026-10-07 11:30:15', '11:30:15', '2026-10-07', 'VENTA', 'Dispensación POS FEFO', 'Ticket T001-001209 emitido por S/ 19.00 cobrado con Tarjeta VISA.', 'usr-2', 'Ana Morales Quispe', 'Técnica en Farmacia / Cajera POS', 'info'),
('act-005', '2026-10-07 14:00:00', '14:00:00', '2026-10-07', 'PERMISOS', 'Auditoría de Roles DIGEMID', 'Inspección de accesos efectuada por Dirección Técnica Regente.', 'usr-1', 'Dr. Carlos Mendoza Flores', 'Farmacéutico Regente Titular', 'info');

-- ==============================================================================
-- 3. INSERT JOIN: INSERCIONES RELACIONALES CRUZADAS & CONSECUTIVAS
-- ==============================================================================

-- 3.1 INSERT JOIN: Análisis de Márgenes de Venta vs Costos de Lote
-- Cruce: sale_items JOIN sales JOIN products JOIN batches
INSERT INTO sales_relational_margin_analysis (
    id, sale_id, receipt_number, sale_date, product_id, product_name, batch_code,
    quantity, unit_price, unit_cost, total_sale, total_cost, gross_margin, margin_percent,
    cashier_name, payment_method
)
SELECT
    ('MARG-' || si.id) AS id,
    s.id AS sale_id,
    s.receipt_number,
    s.date AS sale_date,
    p.id AS product_id,
    p.name AS product_name,
    si.batch_code,
    si.quantity,
    si.unit_price,
    b.unit_cost,
    si.subtotal AS total_sale,
    (si.quantity * b.unit_cost) AS total_cost,
    (si.subtotal - (si.quantity * b.unit_cost)) AS gross_margin,
    ROUND(CAST(((si.subtotal - (si.quantity * b.unit_cost)) / NULLIF(si.subtotal, 0)) * 100 AS NUMERIC), 2) AS margin_percent,
    s.cashier_name,
    s.payment_method
FROM sale_items si
INNER JOIN sales s ON si.sale_id = s.id
INNER JOIN products p ON si.product_id = p.id
INNER JOIN batches b ON (p.id = b.product_id AND si.batch_code = b.batch_code);

-- 3.2 INSERT JOIN: Consolidado de Inventario FEFO por Producto
-- Cruce: products LEFT JOIN batches (agrupación y cálculo automático de stock)
INSERT INTO product_fefo_consolidated (
    product_id, product_code, product_name, category, sale_price,
    total_active_stock, active_batches_count, earliest_batch_code,
    earliest_expiration_date, average_unit_cost, stock_status
)
SELECT
    p.id AS product_id,
    p.code AS product_code,
    p.name AS product_name,
    p.category,
    p.unit_price AS sale_price,
    COALESCE(SUM(CASE WHEN b.status = 'active' THEN b.stock ELSE 0 END), 0) AS total_active_stock,
    COUNT(CASE WHEN b.status = 'active' THEN 1 END) AS active_batches_count,
    MIN(CASE WHEN b.status = 'active' THEN b.batch_code END) AS earliest_batch_code,
    MIN(CASE WHEN b.status = 'active' THEN b.expiration_date END) AS earliest_expiration_date,
    ROUND(CAST(AVG(CASE WHEN b.status = 'active' THEN b.unit_cost END) AS NUMERIC), 2) AS average_unit_cost,
    CASE
        WHEN COALESCE(SUM(CASE WHEN b.status = 'active' THEN b.stock ELSE 0 END), 0) = 0 THEN 'QUIEBRE DE STOCK'
        WHEN COALESCE(SUM(CASE WHEN b.status = 'active' THEN b.stock ELSE 0 END), 0) <= p.min_stock THEN 'BAJO STOCK'
        ELSE 'ÓPTIMO'
    END AS stock_status
FROM products p
LEFT JOIN batches b ON p.id = b.product_id
GROUP BY p.id, p.code, p.name, p.category, p.unit_price, p.min_stock;

-- 3.3 INSERT JOIN: Detección Automática de Lotes Próximos a Vencer
-- Cruce: batches JOIN products
INSERT INTO batch_health_alerts (
    id, batch_id, product_name, batch_code, expiration_date, days_remaining, stock, severity, action_required
)
SELECT
    ('ALT-' || b.id) AS id,
    b.id AS batch_id,
    p.name AS product_name,
    b.batch_code,
    b.expiration_date,
    CAST((b.expiration_date - CURRENT_DATE) AS INT) AS days_remaining,
    b.stock,
    CASE
        WHEN (b.expiration_date - CURRENT_DATE) <= 1 THEN 'CRÍTICO'
        WHEN (b.expiration_date - CURRENT_DATE) <= 30 THEN 'ALTO'
        ELSE 'MODERADO'
    END AS severity,
    CASE
        WHEN (b.expiration_date - CURRENT_DATE) <= 1 THEN 'DISPENSACIÓN PRIORITARIA O MERMA INMEDIATA (24H)'
        WHEN (b.expiration_date - CURRENT_DATE) <= 30 THEN 'APLICAR ROTACIÓN RÁPIDA / DESCUENTO POS'
        ELSE 'CONTROL FEFO RUTINARIO'
    END AS action_required
FROM batches b
INNER JOIN products p ON b.product_id = p.id
WHERE b.status = 'active'
  AND (b.expiration_date - CURRENT_DATE) <= 90;
`;

export const downloadSqlScript = (filename: string = 'nova_salud_database_complete.sql') => {
  const blob = new Blob([COMPLETE_SQL_SCRIPT], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
