export interface SprintWeek {
  week: number;
  sprint: string;
  phaseTitle: string;
  deliverables: string[];
  milestone: string;
  riskMitigation: string;
}

export interface JurySpeechBlock {
  id: string;
  timeRange: string;
  title: string;
  speakerRole: string;
  script: string;
  keyArguments: string[];
  visualCue: string;
}

export const SPRINT_WEEKS: SprintWeek[] = [
  {
    week: 1,
    sprint: 'Sprint 1: Cimientos & Modelo',
    phaseTitle: 'Análisis de Requisitos & Modelado C4',
    deliverables: [
      'Historias de usuario con criterios Gherkin (BDD)',
      'Diagramas de arquitectura C4 (Contexto y Contenedores)',
      'Definición de reglas de negocio farmacéuticas e invariantes FEFO'
    ],
    milestone: 'Aprobación del Documento de Especificación de Software (SRS)',
    riskMitigation: 'Revisión con farmacéutico regente para validar normas DIGEMID.'
  },
  {
    week: 2,
    sprint: 'Sprint 1: Cimientos & Modelo',
    phaseTitle: 'Modelado Relacional & RLS en Supabase',
    deliverables: [
      'Schema Prisma completo con 19 modelos en Tercera Forma Normal (3FN)',
      'Políticas de Row Level Security (RLS) en SQL',
      'Triggers de inmutabilidad en PostgreSQL para auditoría forense'
    ],
    milestone: 'Base de datos aprovisionada y migraciones iniciales ejecutadas',
    riskMitigation: 'Verificación de tipos Decimal(10,2) para evitar redondeos flotantes.'
  },
  {
    week: 3,
    sprint: 'Sprint 2: Seguridad & RBAC',
    phaseTitle: 'Monorepo & Core Backend NestJS',
    deliverables: [
      'Configuración de Turborepo y pnpm workspaces (apps/web, apps/api, packages/shared)',
      'Configuración de PrismaService con Connection Pooling',
      'Seguridad HTTP con Helmet, CORS estricto y ValidationPipe global'
    ],
    milestone: 'Pipeline de compilación de monorepo y Swagger OpenAPI activo',
    riskMitigation: 'Segregación estricta de variables en .env.example.'
  },
  {
    week: 4,
    sprint: 'Sprint 2: Seguridad & RBAC',
    phaseTitle: 'Autenticación & Matriz RBAC Dinámica',
    deliverables: [
      'Integración con Supabase Admin API para alta de colaboradores sin registro público',
      'Decorador @RequirePermission y PermissionsGuard reflexivo en NestJS',
      'Protección del Administrador Propietario inmutable (Regla BR-SEC-01)'
    ],
    milestone: 'Control de acceso granular Módulo × Acción verificado con tests',
    riskMitigation: 'Manejo de contraseñas temporales con cambio forzado al primer login.'
  },
  {
    week: 5,
    sprint: 'Sprint 3: Inventario & Transacción FEFO',
    phaseTitle: 'Catálogo Farmacéutico & Gestión de Lotes',
    deliverables: [
      'Módulo de productos con código EAN, principio activo DCI y laboratorio',
      'Recepción de lotes con validación de caducidad mínima de 180 días',
      'Registro histórico de kárdex en stock_movements'
    ],
    milestone: 'Catálogo precargado y trazabilidad por lote operativa',
    riskMitigation: 'Índice B-Tree compuesto [productId, expirationDate] en batches.'
  },
  {
    week: 6,
    sprint: 'Sprint 3: Inventario & Transacción FEFO',
    phaseTitle: 'Transacción Atómica de Venta FEFO (POS)',
    deliverables: [
      'Lógica SalesService.processSaleAtomic con aislamiento SERIALIZABLE',
      'Bloqueo pesimista con SELECT FOR UPDATE contra condiciones de carrera',
      'Bloqueo estricto de medicamentos vencidos y desglose en sale_item_batches'
    ],
    milestone: 'Motor transaccional probado bajo concurrencia simétrica',
    riskMitigation: 'Rollback automático ante quiebre o interrupción de red.'
  },
  {
    week: 7,
    sprint: 'Sprint 4: Automatización & Realtime',
    phaseTitle: 'Cron Jobs de Inventario (@nestjs/schedule)',
    deliverables: [
      'Cron diario a las 06:00 AM para auditoría de vencimientos a 30, 60 y 90 días',
      'Cron recurrente cada 15 min para detección de stock mínimo consolidado',
      'Deduplicación de alertas para evitar spam en base de datos'
    ],
    milestone: 'Servicio asíncrono de alertas ejecutándose en segundo plano',
    riskMitigation: 'Configuración de zona horaria canónica América/Lima.'
  },
  {
    week: 8,
    sprint: 'Sprint 4: Automatización & Realtime',
    phaseTitle: 'Notificaciones Supabase Realtime & Compras',
    deliverables: [
      'Canales WebSockets (tenant:alerts y tenant:pos-sync)',
      'Generación de lista sugerida de reposición agrupada por Droguería',
      'Actualización en vivo de permisos sin forzar desconexión'
    ],
    milestone: 'Eventos en tiempo real sincronizados entre cajas y almacén',
    riskMitigation: 'Manejo de reconexión automática en WebSockets.'
  },
  {
    week: 9,
    sprint: 'Sprint 5: Frontend Next.js PWA',
    phaseTitle: 'Layout del Dashboard & Middleware Perimetral',
    deliverables: [
      'Next.js 15 App Router con diseño responsive (PC, tablet, celular)',
      'Middleware en Edge para redirección y bloqueo de rutas no autorizadas',
      'Sidebar dinámico que oculta opciones no concedidas en la matriz'
    ],
    milestone: 'Shell del dashboard y navegación protegida completada',
    riskMitigation: 'Zero-Pills: Botones de mutación no existen en el DOM si no hay permiso.'
  },
  {
    week: 10,
    sprint: 'Sprint 5: Frontend Next.js PWA',
    phaseTitle: 'Punto de Venta POS & Matriz RBAC en Caliente',
    deliverables: [
      'Pantalla POS con búsqueda predictiva <50ms y atajos de teclado (F2, F4, F9)',
      'Flujo de cobro completado en menos de 3 clics y menos de 45 segundos',
      'Matriz interactiva Módulo × Acción editable por checkboxes para el Admin'
    ],
    milestone: 'Punto de venta operable en terminales de mostrador',
    riskMitigation: 'Sugerencia automática de alternativas genéricas ante stock 0.'
  },
  {
    week: 11,
    sprint: 'Sprint 6: Calidad & Despliegue',
    phaseTitle: 'Pruebas Integrales QA & Hardening de Seguridad',
    deliverables: [
      'Pruebas unitarias con Jest para transacciones FEFO y Guards RBAC',
      'Prueba End-to-End con Playwright para el flujo de venta completo',
      'Auditoría de seguridad (inyección SQL, XSS, CSRF, Helmet, Throttling)'
    ],
    milestone: '100% de pruebas aprobadas y reporte de cobertura generado',
    riskMitigation: 'Simulación de carga y estrés en la base de datos.'
  },
  {
    week: 12,
    sprint: 'Sprint 6: Calidad & Despliegue',
    phaseTitle: 'Despliegue Gratuito en la Nube & Sustentación',
    deliverables: [
      'Despliegue en producción: Supabase (BD) + Render (API) + Vercel (PWA)',
      'Ejecución del seed de datos de demostración para el jurado',
      'Manual de usuario y guion de sustentación de 5 minutos ensayado'
    ],
    milestone: 'Sistema 100% operativo en producción con costo mensual de $0.00',
    riskMitigation: 'Prueba de contingencia offline local lista en caso de corte de red.'
  }
];

export const JURY_SPEECH_BLOCKS: JurySpeechBlock[] = [
  {
    id: 'block-1',
    timeRange: '0:00 - 1:00',
    title: 'Apertura de Impacto & Problema de Negocio',
    speakerRole: 'Presentador Principal',
    script: 'Señores miembros del jurado, muy buenos días. En el sector farmacéutico minorista, un error de inventario no solo representa una pérdida financiera: puede comprometer la salud pública si se dispensa un medicamento caducado. La botica Nova Salud experimentaba un crecimiento sostenido que sobrepasó su control manual: descuadres de stock, pérdidas del 22% en ventas por quiebres no previstos y tiempos de atención de más de 5 minutos por cliente. Hoy presentamos Nova Salud, un sistema de gestión centralizado tipo dashboard que automatiza las ventas con el criterio FEFO, monitorea el inventario en tiempo real y garantiza seguridad militar en tres capas con un costo operativo de cero dólares.',
    keyArguments: [
      'Impacto en salud pública de medicamentos vencidos.',
      'Pérdida del 22% en ventas por desabastecimiento manual.',
      'Solución integral web responsive y PWA lista para operar.'
    ],
    visualCue: 'Mostrar diapositiva de Diagnóstico: Situación Inicial vs. Objetivos Alcanzados.'
  },
  {
    id: 'block-2',
    timeRange: '1:00 - 2:00',
    title: 'Arquitectura de Tres Capas & Matriz RBAC Dinámica',
    speakerRole: 'Líder Técnico de Software',
    script: 'Para garantizar que el sistema sea inquebrantable, diseñamos un monorepo con Next.js 15, NestJS 10 y PostgreSQL en Supabase. Implementamos el principio de Defensa en Profundidad en tres capas: la Capa 1 es el Middleware de Next.js, que bloquea el acceso a nivel perimetral; la Capa 2 es nuestro PermissionsGuard en NestJS, que evalúa el decorador @RequirePermission contra la base de datos; y la Capa 3 es el kernel de PostgreSQL con Row Level Security (RLS) y triggers inmutables. El Administrador puede encender o apagar permisos mediante una matriz Módulo × Acción que se propaga en menos de un segundo vía WebSockets sin que el empleado cierre sesión.',
    keyArguments: [
      'Seguridad Zero Trust en 3 capas independientes.',
      'Matriz Módulo × Acción con propagación en caliente vía WebSockets.',
      'service_role restringido exclusivamente a NestJS; jamás en el cliente.'
    ],
    visualCue: 'Abrir pantalla de Usuarios, modificar un permiso y mostrar cómo el Sidebar del cajero reacciona en vivo.'
  },
  {
    id: 'block-3',
    timeRange: '2:00 - 3:15',
    title: 'Demostración en Vivo: Algoritmo FEFO & Venta en < 3 Clics',
    speakerRole: 'Ingeniero de Demostración',
    script: 'Procedo a realizar una venta en vivo desde la perspectiva de nuestro cajero. Busco "Amoxicilina 500mg". Observen que el producto cuenta con tres lotes en almacén: un lote próximo a vencer en 30 días, un lote de reserva para el próximo año y un lote caducado hace dos semanas. Al agregar 20 unidades y presionar la tecla F9 para cobrar en efectivo, el sistema completa la transacción en 35 segundos. El ticket impreso demuestra que el motor consumió automáticamente el lote más próximo a caducar. Si un cajero intenta forzar la venta del lote expirado, el sistema lo bloquea de inmediato y sugiere alternativas genéricas con el mismo principio activo.',
    keyArguments: [
      'Criterio FEFO estricto: cero despacho de medicamentos caducados.',
      'Transacción atómica SERIALIZABLE con SELECT FOR UPDATE anti-sobreventa.',
      'Atención en mostrador reducida a menos de 45 segundos.'
    ],
    visualCue: 'Ejecutar cobro en el POS interactivo y mostrar el desglose de lotes en el comprobante generado.'
  },
  {
    id: 'block-4',
    timeRange: '3:15 - 4:15',
    title: 'Monitoreo 24/7 con Cron Jobs & Reposición por Droguería',
    speakerRole: 'Ingeniero de Backend',
    script: 'El segundo gran problema eran los desabastecimientos sorpresa. Hemos implementado un motor asíncrono con @nestjs/schedule. Todos los días a las 06:00 AM, un cron job audita el inventario y clasifica los lotes próximos a vencer a 30, 60 y 90 días, disparando notificaciones instantáneas a los supervisores. Además, cada 15 minutos se evalúa el stock mínimo. Si un producto entra en quiebre, el sistema genera con un solo clic una orden de compra sugerida agrupada por proveedor habitual, calculando la demanda exacta según el consumo del último mes para evitar compras excesivas.',
    keyArguments: [
      'Cron diario a las 06:00 AM y evaluación cada 15 minutos.',
      'Órdenes de compra agrupadas automáticamente por Droguería (Farmaindustria, Bagó).',
      'Deduplicación inteligente de alertas en PostgreSQL.'
    ],
    visualCue: 'Abrir el Centro de Alertas, disparar la auditoría manual y mostrar la lista de compras sugerida.'
  },
  {
    id: 'block-5',
    timeRange: '4:15 - 5:00',
    title: 'Viabilidad Económica ($0/mes), ROI & Conclusión',
    speakerRole: 'Presentador Principal',
    script: 'Finalmente, este proyecto fue concebido para ser viable en el mundo real. Toda la infraestructura se despliega en servicios gratuitos: Supabase aloja PostgreSQL, Render ejecuta el contenedor de NestJS y Vercel sirve la PWA con CDN global. El retorno de inversión es inmediato: se eliminan las pérdidas por mermas de caducidad, se recupera el 22% de ventas perdidas por quiebres y se triplica la velocidad de atención al cliente. Señores miembros del jurado, Nova Salud es una solución de software profesional, limpia, tipada y lista para producción. Quedamos a su disposición para sus preguntas.',
    keyArguments: [
      'Infraestructura en la nube con costo de $0.00 mensual.',
      'Retorno de inversión medible: erradicación de mermas y aumento de rotación.',
      'Código probado con Jest y Playwright bajo estándares SOLID.'
    ],
    visualCue: 'Mostrar resumen de ROI y cuadro comparativo de métricas de negocio.'
  }
];

export const JURY_QA_CARDS = [
  {
    q: '¿Qué sucede si se interrumpe la conexión a internet en medio de una venta?',
    a: 'La venta y el descuento de lotes se ejecutan dentro de una sola transacción atómica de PostgreSQL con aislamiento SERIALIZABLE. Si la conexión se corta antes del commit, el motor de base de datos ejecuta un ROLLBACK automático de inmediato, asegurando que ni el stock del lote quede alterado ni se emita un ticket fantasma.'
  },
  {
    q: '¿Por qué eligieron Supabase Auth en lugar de implementar JWT propio con Passport en NestJS?',
    a: 'Supabase Auth nos proporciona un sistema de identidad auditado con soporte nativo para Refresh Tokens seguros, hashing criptográfico de contraseñas (bcrypt), integración directa con Row Level Security (RLS) en la base de datos y emisión de eventos en tiempo real por WebSockets sin costo alguno ni mantenimiento de infraestructura.'
  },
  {
    q: '¿Cómo protegen la base de datos si alguien accede a las credenciales de un empleado?',
    a: 'Incluso con credenciales válidas, el usuario está restringido en tres capas: el token JWT solo habilita las rutas autorizadas en Next.js Middleware; NestJS valida cada método con el PermissionsGuard; y PostgreSQL aplica Row Level Security (RLS), impidiendo que el usuario pueda consultar o mutar filas ajenas a su rol aunque envíe llamadas directas por curl o Postman.'
  },
  {
    q: '¿Cómo calculan la cantidad sugerida en las órdenes de reposición automática?',
    a: 'El algoritmo evalúa la fórmula: Cantidad Sugerida = (Stock Máximo o min_stock × 3) - Stock Actual Vigente. Adicionalmente, verifica el historial de ventas del último mes para ajustar el pedido a la rotación real y evitar sobrestock innecesario.'
  }
];
