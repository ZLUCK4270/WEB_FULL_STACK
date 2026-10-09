import { SystemModule, UserStory, UseCase, ArchitectureLayer } from '../types/architecture';

export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 'auth_rbac',
    code: 'MOD-01',
    name: 'Autenticación & Matriz RBAC Dinámica',
    icon: 'ShieldCheck',
    badge: 'Seguridad Núcleo',
    description: 'Gestión centralizada de accesos de empleados, emisión de tokens JWT criptográficos, validación de permisos en 3 capas y auditoría de sesiones.',
    responsibilities: [
      'Autenticación robusta de colaboradores sin registro público (alta solo por Administrador).',
      'Forzado de cambio de credencial temporal en primer inicio de sesión.',
      'Control dinámico de permisos Módulo × Acción (Ver, Crear, Editar, Eliminar) en tiempo real.',
      'Detección de fuerza bruta con rate-limiting y bloqueo preventivo tras 5 intentos fallidos.',
      'Cierre automático por inactividad a los 15 minutos de desatención.'
    ],
    keyEntities: ['users_profile', 'modules', 'permissions', 'user_permissions', 'auth_audit_logs'],
    securityLevel: 'Crítico',
    apiEndpoints: [
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/refresh',
      'POST /api/v1/auth/change-temp-password',
      'GET /api/v1/users/permissions/me',
      'PATCH /api/v1/users/:id/permissions'
    ],
    businessRules: [
      'BR-SEC-01: El usuario Administrador Propietario tiene un UUID inmutable y jamás puede ser desactivado ni despojado de permisos.',
      'BR-SEC-02: Ninguna clave service_role de Supabase es expuesta al frontend; toda mutación administrativa se enruta por el Gateway de NestJS.',
      'BR-SEC-03: Los permisos revocados invalidan inmediatamente el cache en memoria del usuario en NestJS vía eventos Redis/Realtime.'
    ]
  },
  {
    id: 'inventory_batches',
    code: 'MOD-02',
    name: 'Inventario Farmacéutico & Gestión de Lotes (FEFO)',
    icon: 'Boxes',
    badge: 'Operación Farmacéutica',
    description: 'Control estricto de medicamentos, principios activos, condiciones de receta médica, lotes y fechas de expiración con despacho ordenado por vencimiento.',
    responsibilities: [
      'Catálogo de productos con código de barras EAN-13, principio activo DCI, laboratorio fabricante y presentación.',
      'Trazabilidad por Lote y Fecha de Vencimiento obligatoria para cada ingreso.',
      'Regla FEFO estricta: el sistema siempre despacha el lote más próximo a vencer que no esté expirado.',
      'Registro de mermas, ajustes de inventario físico y transferencias internas con motivo justificado.',
      'Control de medicamentos controlados (psicotrópicos/estupefacientes) sujetos a receta médica retenida.'
    ],
    keyEntities: ['products', 'categories', 'batches (lotes)', 'stock_movements', 'laboratories'],
    securityLevel: 'Crítico',
    apiEndpoints: [
      'GET /api/v1/products',
      'POST /api/v1/products',
      'GET /api/v1/batches/by-product/:id',
      'POST /api/v1/stock/adjustments',
      'GET /api/v1/products/alternatives-by-dci/:dci'
    ],
    businessRules: [
      'BR-INV-01: No se permite la venta de ningún medicamento cuya fecha de vencimiento sea igual o menor a la fecha actual.',
      'BR-INV-02: Cada producto debe tener un umbral de stock mínimo; si la suma de stock de todos los lotes válidos es menor o igual, entra en estado ALERTA.',
      'BR-INV-03: No se puede eliminar un lote si existen registros históricos de ventas asociados (soft-delete o bloqueo referencial).'
    ]
  },
  {
    id: 'pos_sales',
    code: 'MOD-03',
    name: 'Punto de Venta Rápido (POS) & Atención Express',
    icon: 'ShoppingCart',
    badge: 'Alta Concurrencia',
    description: 'Terminal de atención al cliente optimizado para menos de 3 clics o escaneo de código de barras, transacción atómica FEFO y emisión de comprobante.',
    responsibilities: [
      'Búsqueda predictiva ultrarrápida (<50ms) por nombre comercial, código de barras o principio activo.',
      'Sugerencia automática de alternativas genéricas cuando el producto solicitado está agotado.',
      'Transacción ACID atómica en PostgreSQL: creación de venta, descuento de lotes FEFO y generación de boleta en un solo commit.',
      'Soporte multimoneda y multipago: Efectivo, Tarjeta (POS inalámbrico), Billeteras digitales (Yape / Plin).',
      'Impresión térmica de ticket/boleta (80mm) y cola de eventos para facturación electrónica SUNAT.'
    ],
    keyEntities: ['sales', 'sale_items', 'sale_item_batches', 'payment_transactions', 'electronic_receipts'],
    securityLevel: 'Crítico',
    apiEndpoints: [
      'POST /api/v1/sales/checkout-atomic',
      'GET /api/v1/sales/:id/receipt-pdf',
      'POST /api/v1/sales/:id/cancel-with-reversal',
      'GET /api/v1/sales/daily-summary'
    ],
    businessRules: [
      'BR-POS-01: Si dos cajeros intentan cobrar el último lote disponible simultáneamente, la transacción utiliza SELECT FOR UPDATE en PostgreSQL para evitar sobreventa.',
      'BR-POS-02: La anulación de una venta requiere rol Supervisor/Admin y genera un movimiento de stock inverso automático tipo "DEVOLUCION_CLIENTE".',
      'BR-POS-03: Si el producto requiere receta médica, el POS exige registrar el nombre del médico colegiado y número de colegiatura.'
    ]
  },
  {
    id: 'purchases_suppliers',
    code: 'MOD-04',
    name: 'Compras & Gestión de Laboratorios y Proveedores',
    icon: 'Truck',
    badge: 'Cadena de Suministro',
    description: 'Recepción formal de mercadería, registro de facturas de compra de droguerías y laboratorios, asignación de lotes y cálculo de margen comercial.',
    responsibilities: [
      'Directorio de laboratorios (Bayer, Roche, Farmaindustria, Bagó) y droguerías distribuidoras con RUC y datos de contacto.',
      'Generación de órdenes de compra consolidadas a partir de las sugerencias automáticas de reposición.',
      'Recepción de mercadería con validación física de fechas de vencimiento de cada lote.',
      'Actualización del costo promedio ponderado y margen de ganancia configurado.'
    ],
    keyEntities: ['suppliers', 'purchase_orders', 'purchase_items', 'purchase_receptions'],
    securityLevel: 'Medio',
    apiEndpoints: [
      'GET /api/v1/suppliers',
      'POST /api/v1/purchases/orders',
      'POST /api/v1/purchases/receive-batches',
      'GET /api/v1/purchases/pending-receptions'
    ],
    businessRules: [
      'BR-PUR-01: No se puede recibir un lote farmacéutico cuya fecha de caducidad sea inferior a 180 días desde la fecha de recepción.',
      'BR-PUR-02: Toda compra recepcionada dispara un evento Supabase Realtime para actualizar inmediatamente el stock disponible en los terminales POS.'
    ]
  },
  {
    id: 'alerts_replenishment',
    code: 'MOD-05',
    name: 'Alertas Predictivas de Reposición & Cron Jobs',
    icon: 'BellRing',
    badge: 'Automatización & Realtime',
    description: 'Motor asíncrono con @nestjs/schedule que detecta quiebres de inventario, lotes próximos a expirar y despacha alertas instantáneas vía websockets.',
    responsibilities: [
      'Cron job diario (06:00 AM) de auditoría preventiva de vencimientos a 30, 60 y 90 días.',
      'Cron job periódico (cada 15 min) de revisión de stock mínimo vs stock actual consolidado.',
      'Emisión de alertas clasificadas: CRÍTICO (Agotado), URGENTE (Stock Bajo), PREVENTIVO (Por Vencer).',
      'Generación en 1-clic de pedidos de sugerencia de compra agrupados por proveedor habitual.',
      'Gestión de ciclo de vida de alerta: Pendiente -> En Gestión -> Atendida / Justificada.'
    ],
    keyEntities: ['stock_alerts', 'replenishment_suggestions', 'notification_channels'],
    securityLevel: 'Alto',
    apiEndpoints: [
      'GET /api/v1/alerts/active',
      'PATCH /api/v1/alerts/:id/status',
      'POST /api/v1/alerts/trigger-cron-manual',
      'GET /api/v1/alerts/suggested-order-grouped'
    ],
    businessRules: [
      'BR-ALT-01: El contador de alertas de la cabecera del dashboard debe actualizarse sin recargar página mediante canal Supabase Realtime.',
      'BR-ALT-02: Cuando una venta deja un medicamento en stock cero, la alerta de "STOCK AGOTADO" se dispara sincrónicamente dentro de la misma transacción.'
    ]
  },
  {
    id: 'customers_loyalty',
    code: 'MOD-06',
    name: 'Directorio de Clientes & Historial Farmacológico',
    icon: 'Users',
    badge: 'Atención al Cliente',
    description: 'Padrón de clientes con identificación por DNI/CE, registro rápido en mostrador y trazabilidad de compras para tratamientos prolongados.',
    responsibilities: [
      'Consulta o alta veloz de cliente en el modal de ventas en menos de 10 segundos.',
      'Historial de consumo por paciente (útil para crónicos: hipertensión, diabetes).',
      'Emisión legal de comprobante personalizado con datos fiscales o DNI.',
      'Cumplimiento con normas de protección de datos personales de salud (Habeas Data).'
    ],
    keyEntities: ['customers', 'customer_medical_notes', 'customer_loyalty_points'],
    securityLevel: 'Medio',
    apiEndpoints: [
      'GET /api/v1/customers/by-doc/:docNumber',
      'POST /api/v1/customers/fast-register',
      'GET /api/v1/customers/:id/sales-history'
    ],
    businessRules: [
      'BR-CLI-01: El cliente "Público General" (Sin DNI) solo es admisible para transacciones menores a S/ 700.00 según normativa SUNAT.',
      'BR-CLI-02: No se permite duplicidad de clientes con el mismo número y tipo de documento de identidad.'
    ]
  },
  {
    id: 'reports_bi',
    code: 'MOD-07',
    name: 'Dashboard Ejecutivo & Reportes de Inteligencia',
    icon: 'BarChart3',
    badge: 'Toma de Decisiones',
    description: 'Consola de mando con KPIs en tiempo real, margen bruto, rotación de medicamentos (Curva ABC de Pareto) y exportación a PDF/Excel.',
    responsibilities: [
      'Panel de métricas diarias: Facturación bruta, ticket promedio, medicamentos críticos y margen neto.',
      'Curva ABC de inventario: identificación de medicamentos del 80/20 de facturación para priorizar compras.',
      'Reporte de mermas y pérdidas por medicamentos vencidos para auditoría contable.',
      'Exportación con formato profesional a hojas de cálculo Excel (XLSX) y documentos PDF firmados.'
    ],
    keyEntities: ['daily_financial_closings', 'abc_classification_snapshots', 'audit_reports'],
    securityLevel: 'Alto',
    apiEndpoints: [
      'GET /api/v1/reports/kpis-dashboard',
      'GET /api/v1/reports/sales-by-range',
      'GET /api/v1/reports/abc-inventory-analysis',
      'GET /api/v1/reports/export/pdf-daily-close'
    ],
    businessRules: [
      'BR-REP-01: Los cajeros solo tienen visibilidad de su propio arqueo de caja del turno, mientras los administradores ven el consolidado financiero global.'
    ]
  },
  {
    id: 'audit_forensics',
    code: 'MOD-08',
    name: 'Auditoría Forense & Registro de Trazabilidad',
    icon: 'FileText',
    badge: 'Compliance & Ley',
    description: 'Caja negra inmutable que graba cada inserción, modificación de precios, anulación de tickets y movimiento de stock con IP y timestamp.',
    responsibilities: [
      'Intercepción automática en NestJS vía AuditInterceptor de todas las solicitudes mutadoras (POST, PUT, PATCH, DELETE).',
      'Captura de usuario autenticado, IP de origen, User-Agent, payload anterior y nuevo valor (JSON diff).',
      'Inmutabilidad de la tabla de auditoría: sin permisos de DELETE o UPDATE incluso para administradores.'
    ],
    keyEntities: ['system_audit_logs', 'login_attempts', 'security_events'],
    securityLevel: 'Crítico',
    apiEndpoints: [
      'GET /api/v1/audit/logs',
      'GET /api/v1/audit/security-incidents',
      'GET /api/v1/audit/product-price-history/:productId'
    ],
    businessRules: [
      'BR-AUD-01: Los registros de auditoría no pueden ser purgados; permanecen en PostgreSQL por un plazo mínimo legal de 5 años.',
      'BR-AUD-02: Cualquier intento de borrado manual sobre `system_audit_logs` es prevenido mediante un Trigger PostgreSQL con RAISE EXCEPTION.'
    ]
  }
];

export const USER_STORIES: UserStory[] = [
  {
    id: 'us-01',
    code: 'HU-01',
    module: 'Punto de Venta (POS)',
    title: 'Despacho Atómico con Criterio FEFO en Mostrador',
    role: 'Cajero / Técnico en Farmacia',
    narrative: {
      asA: 'Cajero de la botica Nova Salud',
      iWant: 'Buscar un medicamento y procesar la venta en menos de 3 clics',
      soThat: 'pueda atender a los clientes en cola rápidamente sin temor a entregar un producto vencido ni causar descuadres en el inventario.'
    },
    priority: 'Alta (Must Have)',
    estimationStoryPoints: 8,
    acceptanceCriteria: [
      {
        scenario: 'Despacho automático del lote más próximo a vencer',
        given: 'el producto "Amoxicilina 500mg" cuenta con el Lote A (vence en 3 meses, 20 unid) y Lote B (vence en 12 meses, 50 unid)',
        when: 'el cajero agrega 10 unidades al carrito y confirma el cobro',
        then: 'el sistema descuenta las 10 unidades exclusivamente del Lote A y registra la transacción atómica sin intervención manual de selección de lote.'
      },
      {
        scenario: 'Protección absoluta contra venta de medicamentos vencidos',
        given: 'un producto tiene un lote con fecha de expiración menor a la fecha actual',
        when: 'el cajero intenta escanearlo o agregarlo al pedido',
        then: 'el sistema bloquea la adición, muestra una alerta roja "Lote Vencido - Bloqueado para Venta" y sugiere al instante lotes vigentes o alternativas de la misma DCI.'
      },
      {
        scenario: 'Concurrencia entre múltiples terminales de venta',
        given: 'restan 5 unidades del único lote disponible de "Paracetamol 500mg"',
        when: 'el Cajero 1 y el Cajero 2 intentan cobrar 5 unidades exactamente al mismo segundo',
        then: 'PostgreSQL ejecuta un bloqueo de fila (pessimistic lock) garantizando que la primera transacción se complete con éxito y la segunda rechace la venta por "Stock insuficiente".'
      }
    ]
  },
  {
    id: 'us-02',
    code: 'HU-02',
    module: 'Alertas & Reposición',
    title: 'Notificación Preventiva de Quiebre de Stock y Próximo Vencimiento',
    role: 'Almacenero / Supervisor',
    narrative: {
      asA: 'Responsable de Logística y Almacén',
      iWant: 'recibir alertas automáticas antes de que un medicamento se agote o venza',
      soThat: 'pueda emitir órdenes de compra a laboratorios a tiempo y evitar pérdidas económicas por medicamentos caducados.'
    },
    priority: 'Alta (Must Have)',
    estimationStoryPoints: 5,
    acceptanceCriteria: [
      {
        scenario: 'Detección por cron diario de vencimientos a 30, 60 y 90 días',
        given: 'que el reloj del servidor marca las 06:00:00 AM',
        when: 'el cron job @Cron("0 6 * * *") de NestJS evalúa la tabla de lotes',
        then: 'se generan registros de alerta para lotes en rango de riesgo y se propaga un evento vía Supabase Realtime al panel de notificaciones del supervisor.'
      },
      {
        scenario: 'Generación de lista sugerida agrupada por proveedor',
        given: '5 productos de distintas categorías han traspasado su umbral de stock mínimo',
        when: 'el supervisor hace clic en "Ver Sugerencia de Reposición"',
        then: 'el sistema genera una tabla agrupada por Droguería/Laboratorio con las cantidades ideales a solicitar calculadas según el histórico de ventas de los últimos 30 días.'
      }
    ]
  },
  {
    id: 'us-03',
    code: 'HU-03',
    module: 'Usuarios & Seguridad RBAC',
    title: 'Asignación Dinámica de Permisos Módulo × Acción',
    role: 'Administrador Propietario',
    narrative: {
      asA: 'Administrador único de la botica',
      iWant: 'configurar una matriz de permisos granular (Ver, Crear, Editar, Eliminar) para cada empleado mediante checkboxes',
      soThat: 'pueda delegar funciones operativas a cajeros y almaceneros asegurando que no puedan alterar precios, ver finanzas ni borrar auditorías.'
    },
    priority: 'Alta (Must Have)',
    estimationStoryPoints: 8,
    acceptanceCriteria: [
      {
        scenario: 'Aplicación instantánea sin forzar cierre de sesión',
        given: 'un cajero tiene sesión activa y no cuenta con permiso de "Crear Descuentos"',
        when: 'el administrador marca el permiso en la matriz de usuarios y guarda',
        then: 'en menos de 1 segundo el botón de descuento se habilita en la pantalla del cajero vía WebSocket/Realtime sin requerir recargar la página ni reloguearse.'
      },
      {
        scenario: 'Protección multinivel (Backend + RLS)',
        given: 'un usuario malicioso intenta saltarse la UI y enviar un POST /api/v1/products sin tener el permiso "inventario.crear"',
        when: 'la petición llega al endpoint de NestJS',
        then: 'el PermissionsGuard intercepta la llamada, retorna código HTTP 403 Forbidden y graba un evento de seguridad en la tabla de auditoría con la IP del solicitante.'
      }
    ]
  },
  {
    id: 'us-04',
    code: 'HU-04',
    module: 'Atención al Cliente',
    title: 'Sugerencia Instantánea de Alternativas por Principio Activo (DCI)',
    role: 'Técnico en Farmacia / Cajero',
    narrative: {
      asA: 'Técnico de atención en mostrador',
      iWant: 'que el sistema me muestre alternativas terapéuticas con la misma composición cuando un medicamento de marca esté agotado',
      soThat: 'no pierda la venta y ofrezca una solución de salud inmediata al cliente sin demoras en la atención.'
    },
    priority: 'Alta (Must Have)',
    estimationStoryPoints: 3,
    acceptanceCriteria: [
      {
        scenario: 'Visualización de genéricos y otras marcas equivalentes',
        given: 'un cliente pide "Apronax 550mg" (Naproxeno Sódico) y el stock actual es 0',
        when: 'el cajero presiona "Buscar Alternativa" o el sistema detecta stock cero',
        then: 'se despliega un panel lateral con "Naproxeno 550mg Genérico" y "Flanax 550mg" con stock disponible, precio unitario y presentación.'
      }
    ]
  },
  {
    id: 'us-05',
    code: 'HU-05',
    module: 'Inventario & Lotes',
    title: 'Registro de Ingreso de Mercadería y Verificación Sanitaria',
    role: 'Almacenero',
    narrative: {
      asA: 'Almacenero de Nova Salud',
      iWant: 'registrar facturas de compras asociando el número de lote, fecha de vencimiento y registro sanitario DIGEMID de cada producto',
      soThat: 'el inventario se mantenga legalmente respaldado y ordenado para auditorías de la autoridad de salud.'
    },
    priority: 'Alta (Must Have)',
    estimationStoryPoints: 5,
    acceptanceCriteria: [
      {
        scenario: 'Validación de fecha de vencimiento mínima admisible',
        given: 'un distribuidor entrega un producto cuya fecha de caducidad es en 60 días',
        when: 'el almacenero intenta guardar la recepción',
        then: 'el sistema advierte "Plazo inferior a 180 días. Requiere autorización explícita de Supervisor para recepción de lote próximo".'
      }
    ]
  },
  {
    id: 'us-06',
    code: 'HU-06',
    module: 'Auditoría & Trazabilidad',
    title: 'Registro Inmutable de Movimientos de Dinero y Stock',
    role: 'Auditor Interno / Propietario',
    narrative: {
      asA: 'Propietario de la botica',
      iWant: 'revisar el rastro de cualquier cambio de precio, anulación de boleta o ajuste manual de inventario con usuario, fecha exacta e IP',
      soThat: 'tenga control anti-fraude y cero tolerancia a robos hormiga o manipulaciones.'
    },
    priority: 'Media (Should Have)',
    estimationStoryPoints: 5,
    acceptanceCriteria: [
      {
        scenario: 'Captura de antes y después en edición de precio de producto',
        given: 'un supervisor modifica el precio de venta de un jarabe de S/ 15.00 a S/ 18.00',
        when: 'se envía la mutación PATCH',
        then: 'la base de datos genera una fila en `audit_logs` con `{"old_price": 15.00, "new_price": 18.00}`, el ID del usuario y la fecha UTC exacta.'
      }
    ]
  }
];

export const USE_CASES: UseCase[] = [
  {
    id: 'cu-01',
    code: 'CU-01',
    name: 'Procesar Venta de Mostrador con Despacho FEFO',
    primaryActor: 'Cajero / Técnico en Farmacia',
    secondaryActors: ['Sistema Supabase Realtime', 'Motor de Transacciones PostgreSQL'],
    preconditions: [
      'El usuario ha iniciado sesión y posee el permiso "ventas.crear".',
      'Existe una caja abierta asociada a la sesión del terminal.',
      'Existen productos en catálogo con lotes vigentes.'
    ],
    postconditions: [
      'Se registra la venta y sus detalles en base de datos.',
      'El stock de los lotes involucrados se reduce exactamente según la regla FEFO.',
      'Se genera el comprobante digital con código hash / QR para impresión.',
      'Se emite un evento Realtime para refrescar el stock en todos los terminales conectados.'
    ],
    mainFlow: [
      '1. El cajero ingresa al módulo POS (pantalla optimizada con atajos de teclado F2, F4, F9).',
      '2. Escanea el código de barras o escribe el nombre del producto en el buscador predictivo.',
      '3. El sistema valida existencia de lotes vigentes y añade el producto al carrito con precio vigente.',
      '4. El cajero repite para los demás productos del cliente.',
      '5. Presiona tecla F9 (Cobrar) y selecciona el método de pago (Efectivo, Tarjeta, Yape/Plin).',
      '6. Ingresa el DNI del cliente para boleta (o selecciona "Público General" si el monto es menor a S/ 700).',
      '7. El cajero confirma la transacción.',
      '8. El Backend NestJS ejecuta una transacción aislada (SERIALIZABLE): ordena los lotes por `expiration_date ASC`, bloquea las filas (`FOR UPDATE`), descuenta las cantidades necesarias y confirma el commit.',
      '9. El frontend recibe respuesta positiva en menos de 200ms, limpia el carrito y envía orden de impresión al ticket térmico.'
    ],
    alternativeFlows: [
      {
        condition: 'Stock insuficiente o vencimiento total del producto solicitado',
        steps: [
          '3a. El sistema alerta que no hay stock disponible vigente.',
          '3b. Se despliega automáticamente el cuadro modal con alternativas genéricas que comparten el mismo Principio Activo (DCI).',
          '3c. El cajero ofrece la alternativa al cliente; si acepta, se agrega la alternativa al carrito.'
        ]
      },
      {
        condition: 'Conflicto de concurrencia al momento de confirmar cobro',
        steps: [
          '8a. Otro cajero consumió el último lote una fracción de segundo antes.',
          '8b. La transacción atómica aborta con ROLLBACK de PostgreSQL.',
          '8c. El frontend muestra: "El lote acaba de ser vendido en caja 1. Reintentando cálculo de stock disponible...".'
        ]
      }
    ]
  },
  {
    id: 'cu-02',
    code: 'CU-02',
    name: 'Configuración Dinámica de Permisos de Empleado (RBAC)',
    primaryActor: 'Administrador Propietario',
    preconditions: [
      'El usuario autenticado posee rol de Administrador Propietario inmutable.'
    ],
    postconditions: [
      'Se actualiza la tabla `user_permissions` en Supabase PostgreSQL.',
      'Se emite mensaje Webhook/Realtime que actualiza la sesión activa del empleado de inmediato.'
    ],
    mainFlow: [
      '1. El Administrador navega a "Configuración > Gestión de Usuarios".',
      '2. Selecciona a un empleado o hace clic en "Nuevo Colaborador".',
      '3. Visualiza la matriz interactiva Módulo × Acción (Ver, Crear, Editar, Eliminar).',
      '4. Puede seleccionar una plantilla base (Cajero, Almacenero, Supervisor) para pre-rellenar los checkboxes.',
      '5. Marca o desmarca casillas específicas para ajustar las facultades individuales.',
      '6. Hace clic en "Guardar Permisos".',
      '7. NestJS valida la petición con el PermissionsGuard del Admin, ejecuta la transacción de actualización y publica el evento en Supabase Realtime.',
      '8. El empleado afectado recibe la actualización en vivo: los menús laterales y botones se ocultan o muestran instantáneamente.'
    ],
    alternativeFlows: [
      {
        condition: 'Intento de modificar o degradar al Administrador Propietario',
        steps: [
          '5a. El sistema bloquea los checkboxes del Administrador principal con un candado visual.',
          '5b. Si se envían peticiones HTTP externas para alterar al Admin, el servicio rechaza con HTTP 400 "El Administrador Raíz no puede ser modificado".'
        ]
      }
    ]
  },
  {
    id: 'cu-03',
    code: 'CU-03',
    name: 'Ejecución Automática de Cron de Alertas y Generación de Pedido',
    primaryActor: 'Sistema (@nestjs/schedule Cron)',
    secondaryActors: ['Supervisor de Almacén'],
    preconditions: [
      'El servicio de backend NestJS se encuentra en ejecución continua.',
      'Los parámetros de umbral de días (30/60/90) y stock mínimo están configurados.'
    ],
    postconditions: [
      'Nuevas alertas de estado "PENDIENTE" son insertadas en `stock_alerts`.',
      'Se agrupan sugerencias de reposición por proveedor en `replenishment_suggestions`.'
    ],
    mainFlow: [
      '1. El programador de tareas activa el cron a las 06:00:00 horas.',
      '2. Realiza query optimizada con JOIN entre `products` y `batches` agrupando por suma de stock disponible.',
      '3. Identifica productos donde `SUM(batches.current_stock) <= products.min_stock`.',
      '4. Identifica lotes donde `batches.expiration_date <= NOW() + INTERVAL "90 days"`.',
      '5. Inserta o actualiza los estados en la tabla de alertas.',
      '6. Notifica vía Supabase Realtime al canal privado `tenant:nova-salud:alerts`.',
      '7. Cuando el supervisor ingresa a las 08:00 AM, el indicador de la campana muestra el badge de alertas pendientes.',
      '8. El supervisor abre el centro de alertas y puede hacer clic en "Exportar Orden de Compra Sugerida".'
    ],
    alternativeFlows: []
  }
];

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    layer: 'Capa 1: Presentación & PWA',
    technology: 'Next.js 15 (App Router) + React 19 + Tailwind CSS + shadcn/ui + TanStack Query',
    role: 'Interfaz reactiva, soporte offline para catálogo rápido, diseño responsive para tablets de mostrador y celulares.',
    defenseReason: 'Next.js ofrece Server Components para carga instantánea, SEO para catálogo farmacéutico si se expone online, y PWA para instalación como app nativa en el terminal de caja sin software pesado.',
    securityMeasures: [
      'Next.js Middleware que intercepta cada ruta verificando la presencia del JWT y los claims de permisos.',
      'Renderizado condicional de componentes: los botones de mutación (Crear, Editar, Eliminar) no existen en el DOM si el usuario carece de permiso.',
      'Protección contra inyecciones XSS y saneamiento de inputs en formularios mediante React Hook Form + Zod.'
    ]
  },
  {
    layer: 'Capa 2: Backend API & Negocio',
    technology: 'NestJS con Arquitectura Modular + TypeScript + class-validator + Swagger',
    role: 'Lógica de negocio farmacéutica, cálculo FEFO, aislamiento transaccional, cron jobs (@nestjs/schedule) y orquestación de servicios.',
    defenseReason: 'NestJS proporciona una arquitectura empresarial basada en inyección de dependencias (DI), módulos desacoplados y decoradores limpios que facilitan la defensa ante jurados y el mantenimiento a largo plazo.',
    securityMeasures: [
      'Decorador personalizado `@RequirePermission("modulo", "accion")` que evalúa dinámicamente contra la BD.',
      'Guards globales: JwtAuthGuard, PermissionsGuard, ThrottlerGuard (Rate Limiting para prevenir DoS y fuerza bruta).',
      'Uso exclusivo de la clave `service_role` de Supabase en este entorno seguro de backend, jamás compartida al cliente.'
    ]
  },
  {
    layer: 'Capa 3: Datos, Auth & Tiempo Real',
    technology: 'Supabase (PostgreSQL 15) + Prisma ORM + Supabase Realtime + RLS',
    role: 'Persistencia ACID relacional, control de concurrencia pesimista (SELECT FOR UPDATE), políticas RLS y mensajería en tiempo real por WebSockets.',
    defenseReason: 'PostgreSQL es el estándar de oro en transaccionalidad bancaria y médica. Supabase nos otorga Auth de primer nivel, WebSockets nativos para sincronizar inventario entre cajas y RLS a nivel de motor de base de datos sin costo de infraestructura.',
    securityMeasures: [
      'Row Level Security (RLS) habilitado en el 100% de las tablas sensibles.',
      'Triggers de auditoría a nivel de base de datos para registrar modificaciones de precios y mermas de inventario.',
      'Conexión segura vía SSL/TLS con Prisma ORM con tipado estricto generado en tiempo de compilación.'
    ]
  }
];

export const PRESET_ROLES_PERMISSIONS = {
  administrador: {
    name: 'Administrador (Propietario)',
    desc: 'Acceso irrestricto a todos los módulos y acciones del sistema. Inmutable.',
    permissions: {
      auth_rbac: { view: true, create: true, edit: true, delete: true },
      inventory_batches: { view: true, create: true, edit: true, delete: true },
      pos_sales: { view: true, create: true, edit: true, delete: true },
      purchases_suppliers: { view: true, create: true, edit: true, delete: true },
      alerts_replenishment: { view: true, create: true, edit: true, delete: true },
      customers_loyalty: { view: true, create: true, edit: true, delete: true },
      reports_bi: { view: true, create: true, edit: true, delete: true },
      audit_forensics: { view: true, create: true, edit: true, delete: true },
    }
  },
  supervisor: {
    name: 'Supervisor de Botica',
    desc: 'Control operativo de mostrador, autorización de anulaciones, compras y gestión de alertas.',
    permissions: {
      auth_rbac: { view: true, create: false, edit: false, delete: false },
      inventory_batches: { view: true, create: true, edit: true, delete: false },
      pos_sales: { view: true, create: true, edit: true, delete: true },
      purchases_suppliers: { view: true, create: true, edit: true, delete: false },
      alerts_replenishment: { view: true, create: true, edit: true, delete: false },
      customers_loyalty: { view: true, create: true, edit: true, delete: false },
      reports_bi: { view: true, create: false, edit: false, delete: false },
      audit_forensics: { view: true, create: false, edit: false, delete: false },
    }
  },
  cajero: {
    name: 'Cajero / Mostrador',
    desc: 'Enfocado en atención al cliente, registro rápido de ventas y consulta de alternativas terapéuticas.',
    permissions: {
      auth_rbac: { view: false, create: false, edit: false, delete: false },
      inventory_batches: { view: true, create: false, edit: false, delete: false },
      pos_sales: { view: true, create: true, edit: false, delete: false },
      purchases_suppliers: { view: false, create: false, edit: false, delete: false },
      alerts_replenishment: { view: false, create: false, edit: false, delete: false },
      customers_loyalty: { view: true, create: true, edit: false, delete: false },
      reports_bi: { view: false, create: false, edit: false, delete: false },
      audit_forensics: { view: false, create: false, edit: false, delete: false },
    }
  },
  almacenero: {
    name: 'Almacenero / Logística',
    desc: 'Recepción de mercadería, carga de lotes por proveedor, ajustes de inventario y atención a alertas.',
    permissions: {
      auth_rbac: { view: false, create: false, edit: false, delete: false },
      inventory_batches: { view: true, create: true, edit: true, delete: false },
      pos_sales: { view: false, create: false, edit: false, delete: false },
      purchases_suppliers: { view: true, create: true, edit: true, delete: false },
      alerts_replenishment: { view: true, create: true, edit: true, delete: false },
      customers_loyalty: { view: false, create: false, edit: false, delete: false },
      reports_bi: { view: false, create: false, edit: false, delete: false },
      audit_forensics: { view: false, create: false, edit: false, delete: false },
    }
  }
};
