export interface ErdField {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  fkRef?: string;
  isUnique?: boolean;
  description: string;
}

export interface ErdEntity {
  id: string;
  name: string;
  category: 'Seguridad & RBAC' | 'Inventario & Lotes' | 'Ventas & POS' | 'Compras & Alertas' | 'Auditoría';
  description: string;
  fields: ErdField[];
  relations: string[];
}

export const ERD_ENTITIES: ErdEntity[] = [
  {
    id: 'users_profile',
    name: 'users_profile',
    category: 'Seguridad & RBAC',
    description: 'Perfil extendido del usuario vinculado a auth.users de Supabase. Controla datos personales y estado de cuenta.',
    fields: [
      { name: 'id', type: 'UUID', isPk: true, description: 'ID de Supabase Auth' },
      { name: 'dni', type: 'VARCHAR(12)', isUnique: true, description: 'Documento Nacional de Identidad' },
      { name: 'first_name', type: 'VARCHAR(100)', description: 'Nombres del empleado' },
      { name: 'last_name', type: 'VARCHAR(100)', description: 'Apellidos del empleado' },
      { name: 'email', type: 'VARCHAR(255)', isUnique: true, description: 'Correo electrónico corporativo' },
      { name: 'role_title', type: 'VARCHAR(50)', description: 'Título visual: Cajero, Supervisor, Admin' },
      { name: 'is_root_admin', type: 'BOOLEAN', description: 'Protección inmutable de propietario' },
      { name: 'is_active', type: 'BOOLEAN', description: 'Estado para permitir/bloquear login' },
      { name: 'must_change_password', type: 'BOOLEAN', description: 'Fuerza cambio en primer ingreso' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Fecha de alta en el sistema' }
    ],
    relations: ['1:N con user_permissions', '1:N con sales', '1:N con stock_movements', '1:N con system_audit_logs']
  },
  {
    id: 'modules',
    name: 'modules',
    category: 'Seguridad & RBAC',
    description: 'Catálogo inmutable de los módulos del dashboard administrativo para la matriz RBAC.',
    fields: [
      { name: 'id', type: 'VARCHAR(50)', isPk: true, description: 'Slug del módulo (ej: pos_sales, inventory)' },
      { name: 'name', type: 'VARCHAR(100)', description: 'Nombre descriptivo en pantalla' },
      { name: 'description', type: 'TEXT', description: 'Alcance y funciones del módulo' },
      { name: 'icon', type: 'VARCHAR(50)', description: 'Identificador de icono Lucide' },
      { name: 'sort_order', type: 'INT', description: 'Orden de visualización en menú' }
    ],
    relations: ['1:N con user_permissions']
  },
  {
    id: 'user_permissions',
    name: 'user_permissions',
    category: 'Seguridad & RBAC',
    description: 'Matriz dinámica Módulo × Acción (Ver, Crear, Editar, Eliminar) por cada empleado.',
    fields: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Identificador único' },
      { name: 'user_id', type: 'UUID', isFk: true, fkRef: 'users_profile(id)', description: 'Empleado titular' },
      { name: 'module_id', type: 'VARCHAR(50)', isFk: true, fkRef: 'modules(id)', description: 'Módulo objetivo' },
      { name: 'can_view', type: 'BOOLEAN', description: 'Permiso para consultar datos' },
      { name: 'can_create', type: 'BOOLEAN', description: 'Permiso para crear nuevos registros' },
      { name: 'can_edit', type: 'BOOLEAN', description: 'Permiso para modificar registros' },
      { name: 'can_delete', type: 'BOOLEAN', description: 'Permiso para anular/eliminar' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', description: 'Marca de tiempo de último cambio' }
    ],
    relations: ['N:1 con users_profile', 'N:1 con modules']
  },
  {
    id: 'products',
    name: 'products',
    category: 'Inventario & Lotes',
    description: 'Catálogo de medicamentos y productos farmacéuticos con Principio Activo DCI y condiciones sanitarias.',
    fields: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Identificador del producto' },
      { name: 'barcode', type: 'VARCHAR(50)', isUnique: true, description: 'Código de barras escaneable EAN-13' },
      { name: 'name', type: 'VARCHAR(200)', description: 'Nombre comercial' },
      { name: 'generic_name', type: 'VARCHAR(200)', description: 'Principio activo (DCI) para sugerencias' },
      { name: 'sanitary_registration', type: 'VARCHAR(100)', description: 'Registro Sanitario DIGEMID' },
      { name: 'presentation', type: 'ENUM', description: 'UNIDAD, BLISTER, CAJA, etc.' },
      { name: 'category_id', type: 'UUID', isFk: true, fkRef: 'categories(id)', description: 'Categoría terapéutica' },
      { name: 'laboratory_id', type: 'UUID', isFk: true, fkRef: 'laboratories(id)', description: 'Laboratorio fabricante' },
      { name: 'sale_price', type: 'DECIMAL(10,2)', description: 'Precio de venta al público en S/' },
      { name: 'cost_price', type: 'DECIMAL(10,2)', description: 'Costo promedio ponderado' },
      { name: 'min_stock', type: 'INT', description: 'Umbral disparador de alerta de reposición' },
      { name: 'requires_prescription', type: 'BOOLEAN', description: 'Venta bajo receta médica' },
      { name: 'is_controlled', type: 'BOOLEAN', description: 'Sujeto a control estupefacientes' }
    ],
    relations: ['1:N con batches', '1:N con stock_movements', '1:N con sale_items', '1:N con stock_alerts']
  },
  {
    id: 'batches',
    name: 'batches (lotes)',
    category: 'Inventario & Lotes',
    description: 'Lotes de medicamentos con fecha de vencimiento obligatoria para despacho por orden FEFO.',
    fields: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Identificador del lote' },
      { name: 'product_id', type: 'UUID', isFk: true, fkRef: 'products(id)', description: 'Producto asociado' },
      { name: 'batch_code', type: 'VARCHAR(100)', description: 'Número de lote del fabricante' },
      { name: 'expiration_date', type: 'DATE', description: 'Fecha de caducidad física (clave FEFO)' },
      { name: 'current_stock', type: 'INT', description: 'Unidades disponibles en estantería' },
      { name: 'initial_stock', type: 'INT', description: 'Unidades ingresadas en recepción' },
      { name: 'status', type: 'ENUM', description: 'VIGENTE, PROXIMO_VENCER, VENCIDO, AGOTADO' }
    ],
    relations: ['N:1 con products', '1:N con sale_item_batches', '1:N con stock_movements']
  },
  {
    id: 'sales',
    name: 'sales',
    category: 'Ventas & POS',
    description: 'Cabecera de transacciones de venta en mostrador procesadas en una sola transacción atómica.',
    fields: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Identificador único de venta' },
      { name: 'sale_code', type: 'VARCHAR(50)', isUnique: true, description: 'Número de comprobante (BOL-001-XXXX)' },
      { name: 'cashier_id', type: 'UUID', isFk: true, fkRef: 'users_profile(id)', description: 'Cajero responsable' },
      { name: 'customer_id', type: 'UUID', isFk: true, fkRef: 'customers(id)', description: 'Cliente receptor (opcional)' },
      { name: 'payment_method', type: 'ENUM', description: 'EFECTIVO, TARJETA, YAPE, PLIN' },
      { name: 'total_amount', type: 'DECIMAL(10,2)', description: 'Monto total facturado' },
      { name: 'status', type: 'ENUM', description: 'COMPLETADA, ANULADA' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Instante exacto de la emisión' }
    ],
    relations: ['1:N con sale_items', 'N:1 con users_profile', 'N:1 con customers']
  },
  {
    id: 'sale_items',
    name: 'sale_items',
    category: 'Ventas & POS',
    description: 'Líneas de detalle de la venta (producto, cantidad, precio unitario y subtotal).',
    fields: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Identificador de ítem' },
      { name: 'sale_id', type: 'UUID', isFk: true, fkRef: 'sales(id)', description: 'Venta cabecera' },
      { name: 'product_id', type: 'UUID', isFk: true, fkRef: 'products(id)', description: 'Producto vendido' },
      { name: 'quantity', type: 'INT', description: 'Cantidad total vendida' },
      { name: 'unit_price', type: 'DECIMAL(10,2)', description: 'Precio al momento del cobro' },
      { name: 'subtotal', type: 'DECIMAL(10,2)', description: 'Importe de la línea' }
    ],
    relations: ['N:1 con sales', '1:N con sale_item_batches']
  },
  {
    id: 'sale_item_batches',
    name: 'sale_item_batches (Despacho FEFO)',
    category: 'Ventas & POS',
    description: 'Entidad de trazabilidad exacta: registra qué cantidad de cada lote físico se descontó para surtir la venta.',
    fields: [
      { name: 'id', type: 'UUID', isPk: true, description: 'ID de desglose de lote' },
      { name: 'sale_item_id', type: 'UUID', isFk: true, fkRef: 'sale_items(id)', description: 'Ítem de venta' },
      { name: 'batch_id', type: 'UUID', isFk: true, fkRef: 'batches(id)', description: 'Lote físico descontado' },
      { name: 'quantity', type: 'INT', description: 'Unidades extraídas de este lote específico' }
    ],
    relations: ['N:1 con sale_items', 'N:1 con batches']
  },
  {
    id: 'stock_alerts',
    name: 'stock_alerts',
    category: 'Compras & Alertas',
    description: 'Alertas predictivas generadas por el cron job de NestJS ante bajo stock o proximidad de vencimiento.',
    fields: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Identificador de alerta' },
      { name: 'product_id', type: 'UUID', isFk: true, fkRef: 'products(id)', description: 'Producto comprometido' },
      { name: 'batch_id', type: 'UUID', isFk: true, fkRef: 'batches(id)', description: 'Lote por vencer (opcional)' },
      { name: 'alert_type', type: 'ENUM', description: 'STOCK_BAJO, STOCK_AGOTADO, VENCIMIENTO_30/60/90' },
      { name: 'status', type: 'ENUM', description: 'PENDIENTE, EN_GESTION, ATENDIDA' },
      { name: 'message', type: 'TEXT', description: 'Detalle para el responsable de almacén' }
    ],
    relations: ['N:1 con products', 'N:1 con batches', 'N:1 con users_profile (resolutor)']
  },
  {
    id: 'system_audit_logs',
    name: 'system_audit_logs',
    category: 'Auditoría',
    description: 'Caja negra inmutable protegida por trigger SQL. Graba IP, usuario, tabla y JSON diff de cada cambio.',
    fields: [
      { name: 'id', type: 'UUID', isPk: true, description: 'Identificador inmutable' },
      { name: 'user_id', type: 'UUID', isFk: true, fkRef: 'users_profile(id)', description: 'Actor de la acción' },
      { name: 'action', type: 'VARCHAR(100)', description: 'Verbo de la mutación (UPDATE_PRICE, CANCEL)' },
      { name: 'table_name', type: 'VARCHAR(100)', description: 'Tabla afectada' },
      { name: 'old_data', type: 'JSONB', description: 'Instantánea de valores antes del cambio' },
      { name: 'new_data', type: 'JSONB', description: 'Instantánea de valores posteriores' },
      { name: 'ip_address', type: 'VARCHAR(45)', description: 'Dirección IP del cliente' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Marca de tiempo forense' }
    ],
    relations: ['N:1 con users_profile']
  }
];
