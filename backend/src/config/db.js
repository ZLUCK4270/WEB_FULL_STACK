const { v4: uuidv4 } = require('uuid');

// ==============================================================================
// NOVA SALUD - BASE DE DATOS TRANSACCIONAL EN MEMORIA / ADAPTADOR SQL
// Caso Práctico: Botica Nova Salud (Lima, Perú - Estándar DIGEMID / BPA / FEFO)
// ==============================================================================

const now = new Date();
const todayStr = now.toISOString().split('T')[0];
const exp18Days = new Date(now.getTime() + 18 * 86400000).toISOString().split('T')[0];
const exp25Days = new Date(now.getTime() + 25 * 86400000).toISOString().split('T')[0];
const exp45Days = new Date(now.getTime() + 45 * 86400000).toISOString().split('T')[0];
const exp180Days = new Date(now.getTime() + 180 * 86400000).toISOString().split('T')[0];
const exp1Year = new Date(now.getTime() + 365 * 86400000).toISOString().split('T')[0];
const expExpired = new Date(now.getTime() - 15 * 86400000).toISOString().split('T')[0];
const exp2Days = new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0];

// Categorías Farmacológicas
const CAT_ANTIBIOTICOS = '11111111-0000-0000-0000-000000000001';
const CAT_ANALGESICOS  = '11111111-0000-0000-0000-000000000002';
const CAT_GASTRO       = '11111111-0000-0000-0000-000000000003';
const CAT_RESPIRATORIO = '11111111-0000-0000-0000-000000000004';
const CAT_CARDIO       = '11111111-0000-0000-0000-000000000005';
const CAT_PSICOTROPICO = '11111111-0000-0000-0000-000000000006';

// Laboratorios Farmacéuticos
const LAB_FARMA     = '22222222-0000-0000-0000-000000000001';
const LAB_BAGO      = '22222222-0000-0000-0000-000000000002';
const LAB_GENFAR    = '22222222-0000-0000-0000-000000000003';
const LAB_MEDIFARMA = '22222222-0000-0000-0000-000000000004';
const LAB_PORTUGAL  = '22222222-0000-0000-0000-000000000005';

// Droguerías / Proveedores Mayoristas
const PROV_DROGUERIA = '33333333-0000-0000-0000-000000000001';
const PROV_QUIMICA   = '33333333-0000-0000-0000-000000000002';
const PROV_ALBIS     = '33333333-0000-0000-0000-000000000003';

// Productos Farmacéuticos (incluye pares Genérico / Comercial con mismo DCI para Sustitutos POS)
const PROD_AMOX      = '44444444-0000-0000-0000-000000000001';
const PROD_IBU       = '44444444-0000-0000-0000-000000000002';
const PROD_OME       = '44444444-0000-0000-0000-000000000003';
const PROD_AMOX_COM  = '44444444-0000-0000-0000-000000000004';
const PROD_PARA_GEN  = '44444444-0000-0000-0000-000000000005';
const PROD_PANADOL   = '44444444-0000-0000-0000-000000000006';
const PROD_LOSARTAN  = '44444444-0000-0000-0000-000000000007';
const PROD_CETIRIZ   = '44444444-0000-0000-0000-000000000008';
const PROD_AZITRO    = '44444444-0000-0000-0000-000000000009';
const PROD_CLONA     = '44444444-0000-0000-0000-000000000010';
const PROD_IBU_COM   = '44444444-0000-0000-0000-000000000011';
const PROD_OME_COM   = '44444444-0000-0000-0000-000000000012';

const USER_ADMIN   = 'a0000000-0000-0000-0000-000000000001';
const USER_CAJERO  = 'b0000000-0000-0000-0000-000000000002';
const USER_ALMACEN = 'c0000000-0000-0000-0000-000000000003';

const tables = {
  perfiles_usuario: [
    {
      id: USER_ADMIN,
      dni: '10203040',
      nombre: 'Carlos Alberto',
      apellido: 'Mendoza Vera',
      correo: 'admin@novasalud.pe',
      telefono: '987654321',
      cargo: 'Q.F. Regente / Administrador General',
      es_administrador_raiz: 1,
      esta_activo: 1,
      debe_cambiar_clave: 0,
      password_hash: '$2a$10$01GD43MmqDILyzT2xgz7BeIN0ACKB2l930g7NX8659wN/5JFL/wqK', // regente2026
      ultimo_acceso: new Date(now.getTime() - 1800000).toISOString(),
      ip_ultimo_acceso: '192.168.1.10',
      fecha_creacion: new Date(now.getTime() - 90 * 86400000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: USER_CAJERO,
      dni: '71829304',
      nombre: 'Juan Manuel',
      apellido: 'Pérez García',
      correo: 'cajero@novasalud.pe',
      telefono: '912345678',
      cargo: 'Técnico en Farmacia / Cajero POS',
      es_administrador_raiz: 0,
      esta_activo: 1,
      debe_cambiar_clave: 0,
      password_hash: '$2a$10$DGVYCJeNI5SsHohZcXHc.u.FAh58KzD.bbUSzIQow2.GDSLBrPfQi', // caja2026
      ultimo_acceso: new Date(now.getTime() - 3600000).toISOString(),
      ip_ultimo_acceso: '192.168.1.15',
      fecha_creacion: new Date(now.getTime() - 60 * 86400000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: USER_ALMACEN,
      dni: '76543210',
      nombre: 'Luis Enrique',
      apellido: 'Torres Valdivia',
      correo: 'almacen@novasalud.pe',
      telefono: '998877665',
      cargo: 'Jefe de Almacén y Control BPA',
      es_administrador_raiz: 0,
      esta_activo: 1,
      debe_cambiar_clave: 0,
      password_hash: '$2a$10$QZx7MFTDSuEudgEyvU9OQex8qZXTaYFPQ692VF3pzrnqjZBKQ3Bam', // almacen2026
      ultimo_acceso: new Date(now.getTime() - 7200000).toISOString(),
      ip_ultimo_acceso: '192.168.1.22',
      fecha_creacion: new Date(now.getTime() - 60 * 86400000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    }
  ],
  modulos_sistema: [
    { id: 'dashboard', nombre: 'Dashboard Resumen', descripcion: 'Vista general del negocio', icono: 'LayoutDashboard', orden: 1, esta_activo: 1 },
    { id: 'pos_sales', nombre: 'Punto de Venta (POS)', descripcion: 'Ventas y despacho FEFO', icono: 'ShoppingCart', orden: 2, esta_activo: 1 },
    { id: 'inventory', nombre: 'Inventario & Lotes FEFO', descripcion: 'Control de stock y vencimientos', icono: 'Boxes', orden: 3, esta_activo: 1 },
    { id: 'cash', nombre: 'Caja Registradora', descripcion: 'Apertura, cierre y arqueo', icono: 'CreditCard', orden: 4, esta_activo: 1 },
    { id: 'purchases', nombre: 'Compras & Proveedores', descripcion: 'Órdenes de compra', icono: 'Truck', orden: 5, esta_activo: 1 },
    { id: 'alerts', nombre: 'Centro de Alertas', descripcion: 'Stock bajo y vencimientos', icono: 'BellRing', orden: 6, esta_activo: 1 },
    { id: 'customers', nombre: 'Clientes', descripcion: 'Registro y atención al cliente', icono: 'Users', orden: 7, esta_activo: 1 },
    { id: 'staff', nombre: 'Usuarios & RBAC', descripcion: 'Matriz de permisos', icono: 'ShieldCheck', orden: 8, esta_activo: 1 },
    { id: 'audit', nombre: 'Auditoría Forense', descripcion: 'Bitácora de acciones', icono: 'FileText', orden: 9, esta_activo: 1 },
    { id: 'backups', nombre: 'Respaldos', descripcion: 'Copias de seguridad del sistema', icono: 'Database', orden: 10, esta_activo: 1 }
  ],
  permisos_usuario: [
    // Permisos de Cajero (POS, Ventas, Clientes, Caja, Alertas, consulta de Inventario)
    { id: uuidv4(), usuario_id: USER_CAJERO, modulo_id: 'dashboard', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: USER_CAJERO, modulo_id: 'pos_sales', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 1 },
    { id: uuidv4(), usuario_id: USER_CAJERO, modulo_id: 'customers', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: USER_CAJERO, modulo_id: 'inventory', puede_ver: 1, puede_crear: 0, puede_editar: 0, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: USER_CAJERO, modulo_id: 'cash', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: USER_CAJERO, modulo_id: 'alerts', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
    // Permisos de Almacén (Inventario, Lotes FEFO, Kárdex, Compras, Proveedores, Alertas)
    { id: uuidv4(), usuario_id: USER_ALMACEN, modulo_id: 'dashboard', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: USER_ALMACEN, modulo_id: 'inventory', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 1 },
    { id: uuidv4(), usuario_id: USER_ALMACEN, modulo_id: 'purchases', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 1 },
    { id: uuidv4(), usuario_id: USER_ALMACEN, modulo_id: 'alerts', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 1 }
  ],
  categorias: [
    { id: CAT_ANTIBIOTICOS, nombre: 'Antibióticos & Antimicrobianos', slug: 'antibioticos', descripcion: 'Tratamiento de infecciones bacterianas sistémicas', esta_activa: 1 },
    { id: CAT_ANALGESICOS,  nombre: 'Analgésicos, Antipiréticos & AINEs', slug: 'analgesicos', descripcion: 'Alivio del dolor agudo, fiebre e inflamación', esta_activa: 1 },
    { id: CAT_GASTRO,       nombre: 'Gastroenterología & Antiácidos', slug: 'gastro', descripcion: 'Inhibidores de bomba de protones y protectores gástricos', esta_activa: 1 },
    { id: CAT_RESPIRATORIO, nombre: 'Respiratorios & Antihistamínicos', slug: 'respiratorio', descripcion: 'Control de alergias, rinitis y cuadros bronquiales', esta_activa: 1 },
    { id: CAT_CARDIO,       nombre: 'Cardiovasculares & Antihipertensivos', slug: 'cardio', descripcion: 'Control de presión arterial y riesgo coronario', esta_activa: 1 },
    { id: CAT_PSICOTROPICO, nombre: 'Sistema Nervioso (Controlados)', slug: 'psicotropicos', descripcion: 'Ansiolíticos y medicamentos sujetos a fiscalización', esta_activa: 1 }
  ],
  laboratorios: [
    { id: LAB_FARMA,     nombre: 'Farmaindustria S.A.', pais: 'Perú', esta_activo: 1 },
    { id: LAB_BAGO,      nombre: 'Laboratorios Bagó del Perú S.A.', pais: 'Argentina / Perú', esta_activo: 1 },
    { id: LAB_GENFAR,    nombre: 'Genfar Perú S.A.', pais: 'Colombia / Perú', esta_activo: 1 },
    { id: LAB_MEDIFARMA, nombre: 'Medifarma S.A.', pais: 'Perú', esta_activo: 1 },
    { id: LAB_PORTUGAL,  nombre: 'Laboratorios Portugal S.R.L.', pais: 'Perú', esta_activo: 1 }
  ],
  proveedores: [
    {
      id: PROV_DROGUERIA,
      ruc: '20100123456',
      razon_social: 'Droguería Distribuidora Nova Farma S.A.C.',
      razonSocial: 'Droguería Distribuidora Nova Farma S.A.C.',
      contacto: 'Lic. Miguel Falconí',
      telefono: '(01) 513-8000',
      correo: 'ventas@novafarma.pe',
      direccion: 'Av. Industrial 1420, Cercado de Lima',
      esta_activo: 1
    },
    {
      id: PROV_QUIMICA,
      ruc: '20509988771',
      razon_social: 'Distribuidora Química Suiza S.A.C.',
      razonSocial: 'Distribuidora Química Suiza S.A.C.',
      contacto: 'Dra. Patricia Arana',
      telefono: '(01) 211-4000',
      correo: 'pedidos@quimicasuiza.pe',
      direccion: 'Av. República de Panamá 2577, La Victoria',
      esta_activo: 1
    },
    {
      id: PROV_ALBIS,
      ruc: '20418140551',
      razon_social: 'Droguería Inretail Pharma / Albis S.A.C.',
      razonSocial: 'Droguería Inretail Pharma / Albis S.A.C.',
      contacto: 'Ing. Roberto Castañeda',
      telefono: '(01) 612-5000',
      correo: 'distribucion@albis.com.pe',
      direccion: 'Calle Los Negocios 420, Surquillo',
      esta_activo: 1
    }
  ],
  productos: [
    {
      id: PROD_AMOX,
      codigo_barras: '7750123456789',
      nombre: 'Amoxicilina 500mg Cápsulas (Genérico)',
      nombre_generico: 'Amoxicilina',
      nombre_comercial: 'Amoxicilina Genfar',
      concentracion: '500 mg',
      presentacion: 'Blíster x 10 cáp.',
      registro_sanitario: 'EN-04521-DIGEMID',
      categoria_id: CAT_ANTIBIOTICOS,
      laboratorio_id: LAB_GENFAR,
      precio_venta: 3.50,
      costo: 1.40,
      stock_minimo: 30,
      stock_maximo: 180,
      requiere_receta: 1,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_AMOX_COM,
      codigo_barras: '7750123456790',
      nombre: 'Amoxil 500mg Cápsulas (Marca)',
      nombre_generico: 'Amoxicilina',
      nombre_comercial: 'Amoxil',
      concentracion: '500 mg',
      presentacion: 'Caja x 30 cáp.',
      registro_sanitario: 'EE-08812-DIGEMID',
      categoria_id: CAT_ANTIBIOTICOS,
      laboratorio_id: LAB_FARMA,
      precio_venta: 18.50,
      costo: 10.20,
      stock_minimo: 15,
      stock_maximo: 80,
      requiere_receta: 1,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_IBU,
      codigo_barras: '7750987654321',
      nombre: 'Ibuprofeno 400mg Tabletas Recubiertas',
      nombre_generico: 'Ibuprofeno',
      nombre_comercial: 'Ibuprofeno Portugal',
      concentracion: '400 mg',
      presentacion: 'Blíster x 10 tab.',
      registro_sanitario: 'EN-01298-DIGEMID',
      categoria_id: CAT_ANALGESICOS,
      laboratorio_id: LAB_PORTUGAL,
      precio_venta: 2.50,
      costo: 0.90,
      stock_minimo: 40,
      stock_maximo: 200,
      requiere_receta: 0,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_IBU_COM,
      codigo_barras: '7750987654399',
      nombre: 'Doloral 400mg Tabletas (Marca)',
      nombre_generico: 'Ibuprofeno',
      nombre_comercial: 'Doloral',
      concentracion: '400 mg',
      presentacion: 'Blíster x 10 tab.',
      registro_sanitario: 'EN-03341-DIGEMID',
      categoria_id: CAT_ANALGESICOS,
      laboratorio_id: LAB_MEDIFARMA,
      precio_venta: 6.00,
      costo: 2.80,
      stock_minimo: 25,
      stock_maximo: 120,
      requiere_receta: 0,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_OME,
      codigo_barras: '7750112233445',
      nombre: 'Omeprazol 20mg Cápsulas Lib. Retardada',
      nombre_generico: 'Omeprazol',
      nombre_comercial: 'Omeprazol Farmaindustria',
      concentracion: '20 mg',
      presentacion: 'Blíster x 10 cáp.',
      registro_sanitario: 'EN-05190-DIGEMID',
      categoria_id: CAT_GASTRO,
      laboratorio_id: LAB_FARMA,
      precio_venta: 3.00,
      costo: 1.10,
      stock_minimo: 35,
      stock_maximo: 200,
      requiere_receta: 0,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_OME_COM,
      codigo_barras: '7750112233499',
      nombre: 'Ulcozol 20mg Cápsulas (Marca Bagó)',
      nombre_generico: 'Omeprazol',
      nombre_comercial: 'Ulcozol',
      concentracion: '20 mg',
      presentacion: 'Caja x 14 cáp.',
      registro_sanitario: 'EE-06720-DIGEMID',
      categoria_id: CAT_GASTRO,
      laboratorio_id: LAB_BAGO,
      precio_venta: 19.00,
      costo: 11.00,
      stock_minimo: 15,
      stock_maximo: 80,
      requiere_receta: 0,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_PARA_GEN,
      codigo_barras: '7750445566771',
      nombre: 'Paracetamol 500mg Tabletas (Genérico)',
      nombre_generico: 'Paracetamol',
      nombre_comercial: 'Paracetamol Portugal',
      concentracion: '500 mg',
      presentacion: 'Blíster x 10 tab.',
      registro_sanitario: 'EN-00982-DIGEMID',
      categoria_id: CAT_ANALGESICOS,
      laboratorio_id: LAB_PORTUGAL,
      precio_venta: 1.50,
      costo: 0.50,
      stock_minimo: 50,
      stock_maximo: 300,
      requiere_receta: 0,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_PANADOL,
      codigo_barras: '7750445566778',
      nombre: 'Panadol Forte 500mg Tabletas',
      nombre_generico: 'Paracetamol',
      nombre_comercial: 'Panadol Forte',
      concentracion: '500 mg',
      presentacion: 'Blíster x 10 tab.',
      registro_sanitario: 'EE-02411-DIGEMID',
      categoria_id: CAT_ANALGESICOS,
      laboratorio_id: LAB_MEDIFARMA,
      precio_venta: 7.50,
      costo: 4.10,
      stock_minimo: 30,
      stock_maximo: 150,
      requiere_receta: 0,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_LOSARTAN,
      codigo_barras: '7750778899001',
      nombre: 'Losartán Potásico 50mg Tabletas Recubiertas',
      nombre_generico: 'Losartán Potásico',
      nombre_comercial: 'Losartán Genfar',
      concentracion: '50 mg',
      presentacion: 'Caja x 30 tab.',
      registro_sanitario: 'EE-04119-DIGEMID',
      categoria_id: CAT_CARDIO,
      laboratorio_id: LAB_GENFAR,
      precio_venta: 12.00,
      costo: 5.50,
      stock_minimo: 25,
      stock_maximo: 120,
      requiere_receta: 1,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_CETIRIZ,
      codigo_barras: '7750778899002',
      nombre: 'Cetirizina 10mg Tabletas Antihistamínico',
      nombre_generico: 'Cetirizina',
      nombre_comercial: 'Hiserpan',
      concentracion: '10 mg',
      presentacion: 'Blíster x 10 tab.',
      registro_sanitario: 'EN-03185-DIGEMID',
      categoria_id: CAT_RESPIRATORIO,
      laboratorio_id: LAB_MEDIFARMA,
      precio_venta: 4.00,
      costo: 1.50,
      stock_minimo: 30,
      stock_maximo: 150,
      requiere_receta: 0,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_AZITRO,
      codigo_barras: '7750778899003',
      nombre: 'Azitromicina 500mg Tabletas Recubiertas',
      nombre_generico: 'Azitromicina',
      nombre_comercial: 'Azitromicina Bagó',
      concentracion: '500 mg',
      presentacion: 'Blíster x 3 tab.',
      registro_sanitario: 'EE-07120-DIGEMID',
      categoria_id: CAT_ANTIBIOTICOS,
      laboratorio_id: LAB_BAGO,
      precio_venta: 9.50,
      costo: 4.20,
      stock_minimo: 25,
      stock_maximo: 100,
      requiere_receta: 1,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_CLONA,
      codigo_barras: '7750778899004',
      nombre: 'Clonazepam 2mg Tabletas (Fiscalizado)',
      nombre_generico: 'Clonazepam',
      nombre_comercial: 'Clonoten',
      concentracion: '2 mg',
      presentacion: 'Blíster x 10 tab.',
      registro_sanitario: 'EN-09104-DIGEMID',
      categoria_id: CAT_PSICOTROPICO,
      laboratorio_id: LAB_FARMA,
      precio_venta: 8.00,
      costo: 3.20,
      stock_minimo: 20,
      stock_maximo: 80,
      requiere_receta: 1,
      es_controlado: 1,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    }
  ],
  lotes: [
    // Amoxicilina Genérico: 1 lote próximo a vencer (FEFO Prioridad 1), 1 lote reserva (FEFO Prioridad 2), 1 lote vencido bloqueado
    {
      id: '55555555-0000-0000-0000-000000000001',
      producto_id: PROD_AMOX,
      codigo_lote: 'LOTE-AMX-2026-PRIORIDAD-1',
      fecha_vencimiento: exp25Days,
      stock_actual: 25,
      stock_inicial: 60,
      ubicacion: 'Estante A-1',
      proveedor_id: PROV_DROGUERIA,
      estado: 'VIGENTE'
    },
    {
      id: '55555555-0000-0000-0000-000000000002',
      producto_id: PROD_AMOX,
      codigo_lote: 'LOTE-AMX-2027-RESERVA-2',
      fecha_vencimiento: exp1Year,
      stock_actual: 95,
      stock_inicial: 100,
      ubicacion: 'Estante A-1',
      proveedor_id: PROV_DROGUERIA,
      estado: 'VIGENTE'
    },
    {
      id: '55555555-0000-0000-0000-000000000003',
      producto_id: PROD_AMOX,
      codigo_lote: 'LOTE-AMX-VENCIDO-BLOQ',
      fecha_vencimiento: expExpired,
      stock_actual: 12,
      stock_inicial: 40,
      ubicacion: 'Área Cuarentena / Baja',
      proveedor_id: PROV_DROGUERIA,
      estado: 'VENCIDO'
    },
    // Amoxil Marca (Sustituto de Amoxicilina)
    {
      id: '55555555-0000-0000-0000-000000000006',
      producto_id: PROD_AMOX_COM,
      codigo_lote: 'LOTE-AMOXIL-2027-01',
      fecha_vencimiento: exp1Year,
      stock_actual: 34,
      stock_inicial: 40,
      ubicacion: 'Estante A-2',
      proveedor_id: PROV_QUIMICA,
      estado: 'VIGENTE'
    },
    // Ibuprofeno Genérico (Bajo Stock: 18 <= 40 y vence en 18 días)
    {
      id: '55555555-0000-0000-0000-000000000004',
      producto_id: PROD_IBU,
      codigo_lote: 'LOTE-IBU-2026-10',
      fecha_vencimiento: exp18Days,
      stock_actual: 18,
      stock_inicial: 120,
      ubicacion: 'Estante B-1',
      proveedor_id: PROV_DROGUERIA,
      estado: 'VIGENTE'
    },
    // Doloral Marca (Sustituto de Ibuprofeno con buen stock)
    {
      id: '55555555-0000-0000-0000-000000000007',
      producto_id: PROD_IBU_COM,
      codigo_lote: 'LOTE-DOL-2027-05',
      fecha_vencimiento: exp1Year,
      stock_actual: 65,
      stock_inicial: 80,
      ubicacion: 'Estante B-2',
      proveedor_id: PROV_QUIMICA,
      estado: 'VIGENTE'
    },
    // Omeprazol Genérico (Bajo Stock crítico: 9 <= 35 y vence en 2 días)
    {
      id: '55555555-0000-0000-0000-000000000005',
      producto_id: PROD_OME,
      codigo_lote: 'LOTE-OME-CRITICO-01',
      fecha_vencimiento: exp2Days,
      stock_actual: 9,
      stock_inicial: 80,
      ubicacion: 'Estante C-1',
      proveedor_id: PROV_DROGUERIA,
      estado: 'VIGENTE'
    },
    // Ulcozol Marca (Sustituto de Omeprazol)
    {
      id: '55555555-0000-0000-0000-000000000008',
      producto_id: PROD_OME_COM,
      codigo_lote: 'LOTE-ULC-2027-09',
      fecha_vencimiento: exp1Year,
      stock_actual: 42,
      stock_inicial: 50,
      ubicacion: 'Estante C-2',
      proveedor_id: PROV_QUIMICA,
      estado: 'VIGENTE'
    },
    // Paracetamol Genérico (2 lotes FEFO)
    {
      id: '55555555-0000-0000-0000-000000000009',
      producto_id: PROD_PARA_GEN,
      codigo_lote: 'LOTE-PAR-2026-A',
      fecha_vencimiento: exp45Days,
      stock_actual: 40,
      stock_inicial: 100,
      ubicacion: 'Estante B-3',
      proveedor_id: PROV_ALBIS,
      estado: 'VIGENTE'
    },
    {
      id: '55555555-0000-0000-0000-000000000010',
      producto_id: PROD_PARA_GEN,
      codigo_lote: 'LOTE-PAR-2027-B',
      fecha_vencimiento: exp1Year,
      stock_actual: 140,
      stock_inicial: 150,
      ubicacion: 'Estante B-3',
      proveedor_id: PROV_ALBIS,
      estado: 'VIGENTE'
    },
    // Panadol Forte (Sustituto de Paracetamol)
    {
      id: '55555555-0000-0000-0000-000000000011',
      producto_id: PROD_PANADOL,
      codigo_lote: 'LOTE-PND-2027-04',
      fecha_vencimiento: exp180Days,
      stock_actual: 75,
      stock_inicial: 100,
      ubicacion: 'Estante B-4',
      proveedor_id: PROV_QUIMICA,
      estado: 'VIGENTE'
    },
    // Losartán 50mg (Bajo stock: 12 <= 25)
    {
      id: '55555555-0000-0000-0000-000000000012',
      producto_id: PROD_LOSARTAN,
      codigo_lote: 'LOTE-LOS-2027-02',
      fecha_vencimiento: exp180Days,
      stock_actual: 12,
      stock_inicial: 60,
      ubicacion: 'Estante D-1',
      proveedor_id: PROV_ALBIS,
      estado: 'VIGENTE'
    },
    // Cetirizina 10mg (Stock saludable)
    {
      id: '55555555-0000-0000-0000-000000000013',
      producto_id: PROD_CETIRIZ,
      codigo_lote: 'LOTE-CET-2027-08',
      fecha_vencimiento: exp1Year,
      stock_actual: 88,
      stock_inicial: 100,
      ubicacion: 'Estante E-1',
      proveedor_id: PROV_DROGUERIA,
      estado: 'VIGENTE'
    },
    // Azitromicina 500mg (SIN STOCK = 0 para demostrar alerta crítica de agotado y sugerencia de reposición)
    {
      id: '55555555-0000-0000-0000-000000000014',
      producto_id: PROD_AZITRO,
      codigo_lote: 'LOTE-AZI-2026-AGOTADO',
      fecha_vencimiento: exp180Days,
      stock_actual: 0,
      stock_inicial: 50,
      ubicacion: 'Estante A-3',
      proveedor_id: PROV_QUIMICA,
      estado: 'AGOTADO'
    },
    // Clonazepam 2mg Controlado
    {
      id: '55555555-0000-0000-0000-000000000015',
      producto_id: PROD_CLONA,
      codigo_lote: 'LOTE-CLN-CTRL-2027',
      fecha_vencimiento: exp1Year,
      stock_actual: 32,
      stock_inicial: 40,
      ubicacion: 'Gaveta bajo llave G-1',
      proveedor_id: PROV_DROGUERIA,
      estado: 'VIGENTE'
    }
  ],
  clientes: [
    {
      id: '66666666-0000-0000-0000-000000000001',
      tipo_documento: 'DNI',
      numero_documento: '45892134',
      nombre_completo: 'Rosa María Chávez Ortiz',
      telefono: '984512367',
      correo: 'rosa.chavez@gmail.com',
      direccion: 'Jr. Los Álamos 340, San Juan de Lurigancho',
      fecha_creacion: new Date(now.getTime() - 30 * 86400000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: '66666666-0000-0000-0000-000000000002',
      tipo_documento: 'DNI',
      numero_documento: '41256398',
      nombre_completo: 'Jorge Luis Huamán Quispe',
      telefono: '991234561',
      correo: 'jhuaman@outlook.com',
      direccion: 'Av. Las Flores de Primavera 1210, SJL',
      fecha_creacion: new Date(now.getTime() - 25 * 86400000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: '66666666-0000-0000-0000-000000000003',
      tipo_documento: 'RUC',
      numero_documento: '20601425369',
      nombre_completo: 'Policlínico San Gabriel S.A.C.',
      telefono: '(01) 459-2210',
      correo: 'logistica@policlinicosangabriel.pe',
      direccion: 'Av. Próceres de la Independencia 1890, Lima',
      fecha_creacion: new Date(now.getTime() - 20 * 86400000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: '66666666-0000-0000-0000-000000000004',
      tipo_documento: 'DNI',
      numero_documento: '70458912',
      nombre_completo: 'Lucía Fernanda Paredes Ríos',
      telefono: '945678123',
      correo: 'lucia.paredes@pucp.edu.pe',
      direccion: 'Calle Las Begonias 215, Jesús María',
      fecha_creacion: new Date(now.getTime() - 10 * 86400000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: '66666666-0000-0000-0000-000000000005',
      tipo_documento: 'DNI',
      numero_documento: '08451263',
      nombre_completo: 'César Augusto Villavicencio Salazar',
      telefono: '978451230',
      correo: 'cvillavicencio@yahoo.es',
      direccion: 'Urb. Zárate Calle 4 N° 188, SJL',
      fecha_creacion: new Date(now.getTime() - 5 * 86400000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    }
  ],
  turnos_caja: [
    {
      id: '77777777-0000-0000-0000-000000000000',
      cajero_id: USER_CAJERO,
      fecha_apertura: new Date(now.getTime() - 86400000 - 28800000).toISOString(),
      fecha_cierre: new Date(now.getTime() - 86400000).toISOString(),
      fondo_inicial: 150.00,
      efectivo_esperado: 485.50,
      efectivo_contado: 485.50,
      diferencia: 0.00,
      estado: 'CERRADO',
      observaciones: 'Cierre de turno anterior cuadrado sin diferencias'
    },
    {
      id: '77777777-0000-0000-0000-000000000001',
      cajero_id: USER_ADMIN,
      fecha_apertura: `${todayStr}T08:00:00.000Z`,
      fecha_cierre: null,
      fondo_inicial: 150.00,
      efectivo_esperado: 193.50, // 150.00 fondo + 18.50 (Venta 1 efectivo) + 25.00 (Venta 3 efectivo)
      efectivo_contado: null,
      diferencia: null,
      estado: 'ABIERTO',
      observaciones: 'Turno operativo actual en Caja Principal #01'
    }
  ],
  movimientos_caja: [
    {
      id: uuidv4(),
      turno_id: '77777777-0000-0000-0000-000000000001',
      tipo: 'INGRESO',
      monto: 150.00,
      motivo: 'Apertura de turno - Fondo sencillo inicial',
      fecha: `${todayStr}T08:00:00.000Z`
    }
  ],
  compras: [
    {
      id: '88888888-0000-0000-0000-000000000000',
      codigo_compra: 'OC-2026-00000001',
      proveedor_id: PROV_QUIMICA,
      comprador_id: USER_ALMACEN,
      numero_factura: 'F001-0004190',
      fecha_factura: new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0],
      monto_total: 410.00,
      notas: 'Abastecimiento mensual de analgésicos y antihistamínicos recibido conforme BPA',
      estado: 'RECIBIDA',
      fecha_creacion: new Date(now.getTime() - 5 * 86400000).toISOString()
    },
    {
      id: '88888888-0000-0000-0000-000000000001',
      codigo_compra: 'OC-2026-00000002',
      proveedor_id: PROV_DROGUERIA,
      comprador_id: USER_ADMIN,
      numero_factura: 'F002-0008942',
      fecha_factura: todayStr,
      monto_total: 185.00,
      notas: 'Orden urgente para reponer Omeprazol 20mg e Ibuprofeno 400mg con bajo stock',
      estado: 'REGISTRADA',
      fecha_creacion: new Date(now.getTime() - 7200000).toISOString()
    }
  ],
  items_compra: [
    {
      id: '88888889-0000-0000-0000-000000000001',
      compra_id: '88888888-0000-0000-0000-000000000000',
      producto_id: PROD_PANADOL,
      cantidad: 100,
      cantidad_recibida: 100,
      precio_unitario: 4.10,
      subtotal: 410.00
    },
    {
      id: '88888889-0000-0000-0000-000000000002',
      compra_id: '88888888-0000-0000-0000-000000000001',
      producto_id: PROD_OME,
      cantidad: 100,
      cantidad_recibida: 0,
      precio_unitario: 1.10,
      subtotal: 110.00
    },
    {
      id: '88888889-0000-0000-0000-000000000003',
      compra_id: '88888888-0000-0000-0000-000000000001',
      producto_id: PROD_IBU,
      cantidad: 80,
      cantidad_recibida: 0,
      precio_unitario: 0.90,
      subtotal: 72.00
    }
  ],
  ventas: [
    {
      id: '99999999-0000-0000-0000-000000000001',
      codigo_venta: 'B001-00000001',
      cajero_id: USER_CAJERO,
      cliente_id: '66666666-0000-0000-0000-000000000001',
      subtotal: 15.68,
      monto_igv: 2.82,
      monto_descuento: 0,
      monto_total: 18.50,
      metodo_pago: 'efectivo',
      tipo_comprobante: 'boleta',
      monto_pagado: 20.00,
      monto_vuelto: 1.50,
      estado: 'COMPLETADA',
      motivo_anulacion: null,
      fecha_anulacion: null,
      anulado_por_id: null,
      fecha_creacion: `${todayStr}T09:15:00.000Z`
    },
    {
      id: '99999999-0000-0000-0000-000000000002',
      codigo_venta: 'F001-00000002',
      cajero_id: USER_ADMIN,
      cliente_id: '66666666-0000-0000-0000-000000000003',
      subtotal: 49.15,
      monto_igv: 8.85,
      monto_descuento: 0,
      monto_total: 58.00,
      metodo_pago: 'yape',
      tipo_comprobante: 'factura',
      monto_pagado: 58.00,
      monto_vuelto: 0.00,
      estado: 'COMPLETADA',
      motivo_anulacion: null,
      fecha_anulacion: null,
      anulado_por_id: null,
      fecha_creacion: `${todayStr}T11:30:00.000Z`
    },
    {
      id: '99999999-0000-0000-0000-000000000003',
      codigo_venta: 'B001-00000003',
      cajero_id: USER_CAJERO,
      cliente_id: '66666666-0000-0000-0000-000000000002',
      subtotal: 21.19,
      monto_igv: 3.81,
      monto_descuento: 0,
      monto_total: 25.00,
      metodo_pago: 'efectivo',
      tipo_comprobante: 'boleta',
      monto_pagado: 30.00,
      monto_vuelto: 5.00,
      estado: 'COMPLETADA',
      motivo_anulacion: null,
      fecha_anulacion: null,
      anulado_por_id: null,
      fecha_creacion: `${todayStr}T13:20:00.000Z`
    },
    {
      id: '99999999-0000-0000-0000-000000000004',
      codigo_venta: 'B001-00000004',
      cajero_id: USER_CAJERO,
      cliente_id: '66666666-0000-0000-0000-000000000004',
      subtotal: 10.17,
      monto_igv: 1.83,
      monto_descuento: 0,
      monto_total: 12.00,
      metodo_pago: 'tarjeta',
      tipo_comprobante: 'boleta',
      monto_pagado: 12.00,
      monto_vuelto: 0.00,
      estado: 'ANULADA',
      motivo_anulacion: 'Cliente solicitó cambio de presentación antes de retirarse',
      fecha_anulacion: `${todayStr}T14:10:00.000Z`,
      anulado_por_id: USER_ADMIN,
      fecha_creacion: `${todayStr}T14:00:00.000Z`
    }
  ],
  items_venta: [
    // Items de Venta 1 (18.50: 3 Amoxicilina Genérico = 10.50 + 2 Cetirizina = 8.00)
    {
      id: '99999991-0000-0000-0000-000000000001',
      venta_id: '99999999-0000-0000-0000-000000000001',
      producto_id: PROD_AMOX,
      precio_unitario: 3.50,
      cantidad: 3,
      descuento: 0,
      subtotal: 10.50
    },
    {
      id: '99999991-0000-0000-0000-000000000002',
      venta_id: '99999999-0000-0000-0000-000000000001',
      producto_id: PROD_CETIRIZ,
      precio_unitario: 4.00,
      cantidad: 2,
      descuento: 0,
      subtotal: 8.00
    },
    // Items de Venta 2 (58.00: 2 Amoxil Marca = 37.00 + 6 Paracetamol = 9.00 + 1 Losartán = 12.00)
    {
      id: '99999991-0000-0000-0000-000000000003',
      venta_id: '99999999-0000-0000-0000-000000000002',
      producto_id: PROD_AMOX_COM,
      precio_unitario: 18.50,
      cantidad: 2,
      descuento: 0,
      subtotal: 37.00
    },
    {
      id: '99999991-0000-0000-0000-000000000004',
      venta_id: '99999999-0000-0000-0000-000000000002',
      producto_id: PROD_PARA_GEN,
      precio_unitario: 1.50,
      cantidad: 6,
      descuento: 0,
      subtotal: 9.00
    },
    {
      id: '99999991-0000-0000-0000-000000000005',
      venta_id: '99999999-0000-0000-0000-000000000002',
      producto_id: PROD_LOSARTAN,
      precio_unitario: 12.00,
      cantidad: 1,
      descuento: 0,
      subtotal: 12.00
    },
    // Items de Venta 3 (25.00: 2 Panadol Forte = 15.00 + 4 Ibuprofeno = 10.00)
    {
      id: '99999991-0000-0000-0000-000000000006',
      venta_id: '99999999-0000-0000-0000-000000000003',
      producto_id: PROD_PANADOL,
      precio_unitario: 7.50,
      cantidad: 2,
      descuento: 0,
      subtotal: 15.00
    },
    {
      id: '99999991-0000-0000-0000-000000000007',
      venta_id: '99999999-0000-0000-0000-000000000003',
      producto_id: PROD_IBU,
      precio_unitario: 2.50,
      cantidad: 4,
      descuento: 0,
      subtotal: 10.00
    },
    // Item de Venta 4 Anulada
    {
      id: '99999991-0000-0000-0000-000000000008',
      venta_id: '99999999-0000-0000-0000-000000000004',
      producto_id: PROD_IBU_COM,
      precio_unitario: 6.00,
      cantidad: 2,
      descuento: 0,
      subtotal: 12.00
    }
  ],
  items_venta_lotes: [
    { id: uuidv4(), item_venta_id: '99999991-0000-0000-0000-000000000001', lote_id: '55555555-0000-0000-0000-000000000001', cantidad: 3 },
    { id: uuidv4(), item_venta_id: '99999991-0000-0000-0000-000000000002', lote_id: '55555555-0000-0000-0000-000000000013', cantidad: 2 },
    { id: uuidv4(), item_venta_id: '99999991-0000-0000-0000-000000000003', lote_id: '55555555-0000-0000-0000-000000000006', cantidad: 2 },
    { id: uuidv4(), item_venta_id: '99999991-0000-0000-0000-000000000004', lote_id: '55555555-0000-0000-0000-000000000009', cantidad: 6 },
    { id: uuidv4(), item_venta_id: '99999991-0000-0000-0000-000000000005', lote_id: '55555555-0000-0000-0000-000000000012', cantidad: 1 },
    { id: uuidv4(), item_venta_id: '99999991-0000-0000-0000-000000000006', lote_id: '55555555-0000-0000-0000-000000000011', cantidad: 2 },
    { id: uuidv4(), item_venta_id: '99999991-0000-0000-0000-000000000007', lote_id: '55555555-0000-0000-0000-000000000004', cantidad: 4 },
    { id: uuidv4(), item_venta_id: '99999991-0000-0000-0000-000000000008', lote_id: '55555555-0000-0000-0000-000000000007', cantidad: 2 }
  ],
  movimientos_stock: [
    {
      id: uuidv4(),
      producto_id: PROD_PANADOL,
      producto_nombre: 'Panadol Forte 500mg Tabletas',
      codigo_barras: '7750445566778',
      lote_id: '55555555-0000-0000-0000-000000000011',
      codigo_lote: 'LOTE-PND-2027-04',
      usuario_id: USER_ALMACEN,
      usuario_nombre: 'Luis Enrique Torres Valdivia',
      tipo_movimiento: 'ENTRADA_COMPRA',
      cantidad: 100,
      stock_anterior: 0,
      stock_nuevo: 100,
      motivo: 'Recepción OC-2026-00000001 (Factura F001-0004190)',
      referencia_id: '88888888-0000-0000-0000-000000000000',
      fecha: new Date(now.getTime() - 5 * 86400000).toISOString()
    },
    {
      id: uuidv4(),
      producto_id: PROD_AMOX,
      producto_nombre: 'Amoxicilina 500mg Cápsulas (Genérico)',
      codigo_barras: '7750123456789',
      lote_id: '55555555-0000-0000-0000-000000000001',
      codigo_lote: 'LOTE-AMX-2026-PRIORIDAD-1',
      usuario_id: USER_CAJERO,
      usuario_nombre: 'Juan Manuel Pérez García',
      tipo_movimiento: 'SALIDA_VENTA',
      cantidad: 3,
      stock_anterior: 28,
      stock_nuevo: 25,
      motivo: 'Despacho FEFO automático en Venta B001-00000001',
      referencia_id: '99999999-0000-0000-0000-000000000001',
      fecha: new Date(now.getTime() - 10800000).toISOString()
    },
    {
      id: uuidv4(),
      producto_id: PROD_PARA_GEN,
      producto_nombre: 'Paracetamol 500mg Tabletas (Genérico)',
      codigo_barras: '7750445566771',
      lote_id: '55555555-0000-0000-0000-000000000009',
      codigo_lote: 'LOTE-PAR-2026-A',
      usuario_id: USER_ADMIN,
      usuario_nombre: 'Carlos Alberto Mendoza Vera',
      tipo_movimiento: 'SALIDA_VENTA',
      cantidad: 6,
      stock_anterior: 46,
      stock_nuevo: 40,
      motivo: 'Despacho FEFO automático en Venta F001-00000002',
      referencia_id: '99999999-0000-0000-0000-000000000002',
      fecha: new Date(now.getTime() - 7200000).toISOString()
    },
    {
      id: uuidv4(),
      producto_id: PROD_IBU,
      producto_nombre: 'Ibuprofeno 400mg Tabletas Recubiertas',
      codigo_barras: '7750987654321',
      lote_id: '55555555-0000-0000-0000-000000000004',
      codigo_lote: 'LOTE-IBU-2026-10',
      usuario_id: USER_CAJERO,
      usuario_nombre: 'Juan Manuel Pérez García',
      tipo_movimiento: 'SALIDA_VENTA',
      cantidad: 4,
      stock_anterior: 22,
      stock_nuevo: 18,
      motivo: 'Despacho FEFO automático en Venta B001-00000003',
      referencia_id: '99999999-0000-0000-0000-000000000003',
      fecha: new Date(now.getTime() - 3600000).toISOString()
    },
    {
      id: uuidv4(),
      producto_id: PROD_IBU_COM,
      producto_nombre: 'Doloral 400mg Tabletas (Marca)',
      codigo_barras: '7750987654399',
      lote_id: '55555555-0000-0000-0000-000000000007',
      codigo_lote: 'LOTE-DOL-2027-05',
      usuario_id: USER_ADMIN,
      usuario_nombre: 'Carlos Alberto Mendoza Vera',
      tipo_movimiento: 'ENTRADA_ANULACION',
      cantidad: 2,
      stock_anterior: 63,
      stock_nuevo: 65,
      motivo: 'Reingreso automático por anulación de Venta B001-00000004',
      referencia_id: '99999999-0000-0000-0000-000000000004',
      fecha: new Date(now.getTime() - 1800000).toISOString()
    }
  ],
  alertas_stock: [],
  registros_auditoria_sistema: [
    {
      id: uuidv4(),
      usuario_id: USER_ADMIN,
      accion: 'APERTURA_CAJA',
      modulo: 'cash',
      tabla_afectada: 'turnos_caja',
      registro_id: '77777777-0000-0000-0000-000000000001',
      datos_nuevos: JSON.stringify({ fondoInicial: 150.0, estado: 'ABIERTO' }),
      fecha_creacion: new Date(now.getTime() - 14400000).toISOString()
    },
    {
      id: uuidv4(),
      usuario_id: USER_CAJERO,
      accion: 'CREAR_VENTA',
      modulo: 'pos_sales',
      tabla_afectada: 'ventas',
      registro_id: '99999999-0000-0000-0000-000000000001',
      datos_nuevos: JSON.stringify({ codigoVenta: 'B001-00000001', total: 18.5, metodoPago: 'efectivo' }),
      fecha_creacion: new Date(now.getTime() - 10800000).toISOString()
    },
    {
      id: uuidv4(),
      usuario_id: USER_ADMIN,
      accion: 'CREAR_ORDEN_COMPRA',
      modulo: 'purchases',
      tabla_afectada: 'compras',
      registro_id: '88888888-0000-0000-0000-000000000001',
      datos_nuevos: JSON.stringify({ codigoCompra: 'OC-2026-00000002', montoTotal: 185.0 }),
      fecha_creacion: new Date(now.getTime() - 7200000).toISOString()
    },
    {
      id: uuidv4(),
      usuario_id: USER_ADMIN,
      accion: 'ANULAR_VENTA',
      modulo: 'pos_sales',
      tabla_afectada: 'ventas',
      registro_id: '99999999-0000-0000-0000-000000000004',
      datos_nuevos: JSON.stringify({ codigoVenta: 'B001-00000004', motivo: 'Cliente solicitó cambio de presentación antes de retirarse' }),
      fecha_creacion: new Date(now.getTime() - 1800000).toISOString()
    }
  ],
  sugerencias_reposicion: []
};

// Evaluate and synchronize alerts automatically
function evaluateAlerts(targetProductIds = null, force = false) {
  const prods = targetProductIds && targetProductIds.length > 0
    ? tables.productos.filter(p => targetProductIds.includes(p.id))
    : tables.productos;

  const todayIso = new Date().toISOString().split('T')[0];

  for (const p of prods) {
    if (p.esta_activo !== 1) continue;

    const totalStock = tables.lotes
      .filter(l => l.producto_id === p.id && l.estado === 'VIGENTE' && l.fecha_vencimiento >= todayIso)
      .reduce((sum, l) => sum + (parseInt(l.stock_actual, 10) || 0), 0);

    // If stock is healthy (> stock_minimo), auto-resolve any pending low stock or out of stock alert!
    if (totalStock > p.stock_minimo) {
      tables.alertas_stock.forEach(a => {
        if (a.producto_id === p.id && (a.tipo_alerta === 'STOCK_BAJO' || a.tipo_alerta === 'SIN_STOCK') && a.estado === 'PENDIENTE') {
          a.estado = 'RESUELTA';
          a.fecha_resolucion = new Date().toISOString();
          a.mensaje += ' [Auto-resuelto por reposición de stock]';
        }
      });
    } else {
      // Stock is <= stock_minimo
      const alertType = totalStock === 0 ? 'SIN_STOCK' : 'STOCK_BAJO';
      const message = totalStock === 0
        ? `SIN STOCK: "${p.nombre}" se encuentra agotado (0 uds. disponibles). Requiere orden de compra inmediata.`
        : `STOCK BAJO: "${p.nombre}" tiene ${totalStock} uds. disponibles (mínimo de seguridad: ${p.stock_minimo}).`;

      const existingPending = tables.alertas_stock.find(
        a => a.producto_id === p.id && a.tipo_alerta === alertType && a.estado === 'PENDIENTE'
      );
      const existingResolved = tables.alertas_stock.find(
        a => a.producto_id === p.id && a.tipo_alerta === alertType && (a.estado === 'RESUELTA' || a.estado === 'RESUELTO')
      );

      if (existingPending) {
        existingPending.mensaje = message;
      } else if (existingResolved) {
        if (force) {
          existingResolved.estado = 'PENDIENTE';
          existingResolved.mensaje = message;
          existingResolved.fecha_resolucion = null;
          existingResolved.resuelto_por_id = null;
        }
      } else {
        tables.alertas_stock.push({
          id: uuidv4(),
          producto_id: p.id,
          lote_id: null,
          tipo_alerta: alertType,
          estado: 'PENDIENTE',
          mensaje: message,
          origen_disparador: 'AUTO_EVALUACION',
          fecha_creacion: new Date().toISOString(),
          fecha_resolucion: null,
          resuelto_por_id: null
        });
      }
    }
  }

  // Check expiring and expired lots
  const thirtyDaysAhead = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  tables.lotes.forEach(l => {
    const p = tables.productos.find(pr => pr.id === l.producto_id);
    if (!p || p.esta_activo !== 1) return;
    if (targetProductIds && targetProductIds.length > 0 && !targetProductIds.includes(p.id)) return;

    if (l.stock_actual > 0) {
      if (l.fecha_vencimiento < todayIso || l.estado === 'VENCIDO') {
        l.estado = 'VENCIDO';
        const msg = `LOTE VENCIDO (BLOQUEADO EN POS): Lote "${l.codigo_lote}" de "${p.nombre}" (${l.stock_actual} uds.) venció el ${l.fecha_vencimiento}.`;
        const pendingLotAlert = tables.alertas_stock.find(a => a.lote_id === l.id && (a.tipo_alerta === 'VENCIDO' || a.tipo_alerta === 'LOTE_VENCIDO') && a.estado === 'PENDIENTE');
        const resolvedLotAlert = tables.alertas_stock.find(a => a.lote_id === l.id && (a.tipo_alerta === 'VENCIDO' || a.tipo_alerta === 'LOTE_VENCIDO') && (a.estado === 'RESUELTA' || a.estado === 'RESUELTO'));
        if (!pendingLotAlert) {
          if (resolvedLotAlert) {
            if (force) {
              resolvedLotAlert.estado = 'PENDIENTE';
              resolvedLotAlert.mensaje = msg;
              resolvedLotAlert.fecha_resolucion = null;
              resolvedLotAlert.resuelto_por_id = null;
            }
          } else {
            tables.alertas_stock.push({
              id: uuidv4(),
              producto_id: p.id,
              lote_id: l.id,
              tipo_alerta: 'LOTE_VENCIDO',
              estado: 'PENDIENTE',
              mensaje: msg,
              origen_disparador: 'AUTO_EVALUACION',
              fecha_creacion: new Date().toISOString(),
              fecha_resolucion: null,
              resuelto_por_id: null
            });
          }
        }
      } else if (l.estado === 'VIGENTE' && l.fecha_vencimiento <= thirtyDaysAhead) {
        const diffDays = Math.max(0, Math.ceil((new Date(l.fecha_vencimiento) - new Date(todayIso)) / 86400000));
        const msg = `PRIORIDAD FEFO — VENCE EN ${diffDays} DÍA(S): Lote "${l.codigo_lote}" de "${p.nombre}" (${l.stock_actual} uds.).`;
        const pendingExpAlert = tables.alertas_stock.find(a => a.lote_id === l.id && (a.tipo_alerta === 'VENCIMIENTO_CERCA' || a.tipo_alerta === 'VENCIMIENTO_PROXIMO') && a.estado === 'PENDIENTE');
        const resolvedExpAlert = tables.alertas_stock.find(a => a.lote_id === l.id && (a.tipo_alerta === 'VENCIMIENTO_CERCA' || a.tipo_alerta === 'VENCIMIENTO_PROXIMO') && (a.estado === 'RESUELTA' || a.estado === 'RESUELTO'));
        if (!pendingExpAlert) {
          if (resolvedExpAlert) {
            if (force) {
              resolvedExpAlert.estado = 'PENDIENTE';
              resolvedExpAlert.mensaje = msg;
              resolvedExpAlert.fecha_resolucion = null;
              resolvedExpAlert.resuelto_por_id = null;
            }
          } else {
            tables.alertas_stock.push({
              id: uuidv4(),
              producto_id: p.id,
              lote_id: l.id,
              tipo_alerta: 'VENCIMIENTO_PROXIMO',
              estado: 'PENDIENTE',
              mensaje: msg,
              origen_disparador: 'AUTO_EVALUACION',
              fecha_creacion: new Date().toISOString(),
              fecha_resolucion: null,
              resuelto_por_id: null
            });
          }
        }
      }
    }
  });
}
evaluateAlerts();

// Helper to calculate total valid stock for a product
function calculateTotalStock(productId) {
  const todayIso = new Date().toISOString().split('T')[0];
  return tables.lotes
    .filter(l => l.producto_id === productId && l.estado === 'VIGENTE' && l.fecha_vencimiento >= todayIso)
    .reduce((sum, l) => sum + (parseInt(l.stock_actual, 10) || 0), 0);
}

class MockRequest {
  constructor() {
    this.inputs = {};
  }

  input(name, typeOrValue, value) {
    if (value === undefined) {
      this.inputs[name] = typeOrValue;
    } else {
      this.inputs[name] = value;
    }
    return this;
  }

  async query(sqlText) {
    const sql = sqlText.trim();
    const upper = sql.toUpperCase();
    const inputs = this.inputs;

    // 1. SELECT perfiles_usuario WHERE dni = @dni
    if (upper.includes('FROM PERFILES_USUARIO') && upper.includes('WHERE DNI = @DNI')) {
      const user = tables.perfiles_usuario.find(u => String(u.dni).trim() === String(inputs.dni).trim());
      return { recordset: user ? [{ ...user }] : [], rowsAffected: [user ? 1 : 0] };
    }

    // 2. UPDATE perfiles_usuario SET ultimo_acceso = ... WHERE id = @id
    if (upper.startsWith('UPDATE PERFILES_USUARIO')) {
      const user = tables.perfiles_usuario.find(u => u.id === inputs.id);
      if (user) {
        user.ultimo_acceso = new Date().toISOString();
        user.fecha_actualizacion = new Date().toISOString();
      }
      return { recordset: [], rowsAffected: [user ? 1 : 0] };
    }

    // 3. RBAC Check: SELECT puede_ver, puede_crear... FROM permisos_usuario
    if (upper.includes('FROM PERMISOS_USUARIO') && upper.includes('WHERE USUARIO_ID = @USUARIOID')) {
      const match = tables.permisos_usuario.filter(
        p => p.usuario_id === inputs.usuarioId && p.modulo_id === inputs.moduloId
      );
      return { recordset: match.map(p => ({ ...p })), rowsAffected: [match.length] };
    }

    // 4. SELECT clientes
    if (upper.includes('FROM CLIENTES')) {
      if (upper.includes('WHERE NUMERO_DOCUMENTO = @DOCNUMBER') || upper.includes('WHERE NUMERO_DOCUMENTO = @DOC')) {
        const doc = inputs.docNumber || inputs.doc;
        const found = tables.clientes.filter(c => c.numero_documento === doc);
        return { recordset: found.map(c => ({ ...c })), rowsAffected: [found.length] };
      }
      if (upper.includes('WHERE ID = @CUSTOMERID') || upper.includes('WHERE ID = @ID')) {
        const id = inputs.customerId || inputs.id;
        const found = tables.clientes.filter(c => c.id === id);
        return { recordset: found.map(c => ({ ...c })), rowsAffected: [found.length] };
      }
      return { recordset: tables.clientes.map(c => ({ ...c })), rowsAffected: [tables.clientes.length] };
    }

    // 5. INSERT INTO clientes
    if (upper.startsWith('INSERT INTO CLIENTES')) {
      const newId = uuidv4();
      const newCust = {
        id: newId,
        tipo_documento: inputs.docType || 'DNI',
        numero_documento: inputs.docNumber,
        nombre_completo: inputs.fullName,
        telefono: inputs.phone || null,
        correo: inputs.email || null,
        direccion: inputs.address || null,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      };
      tables.clientes.push(newCust);
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 6. SELECT id FROM lotes WHERE producto_id = @productoId AND codigo_lote = @codigoLote
    if (upper.includes('FROM LOTES') && (upper.includes('CODIGO_LOTE = @CODIGOLOTE') || upper.includes('CODIGO_LOTE = @BATCHCODE'))) {
      const prodId = inputs.productoId || inputs.productId;
      const code = inputs.codigoLote || inputs.batchCode;
      const match = tables.lotes.filter(l => l.producto_id === prodId && l.codigo_lote === code);
      return { recordset: match.map(l => ({ id: l.id })), rowsAffected: [match.length] };
    }

    // 7. FEFO lotes query or all batches for a product
    if (upper.includes('FROM LOTES') && (upper.includes('WHERE PRODUCTO_ID = @PRODUCTID') || upper.includes('WHERE PRODUCTO_ID = @PRODUCTOID'))) {
      const prodId = inputs.productId || inputs.productoId;
      if (upper.includes("AND ESTADO = 'VIGENTE'") || upper.includes('FECHA_VENCIMIENTO >') || upper.includes('FECHA_VENCIMIENTO >=')) {
        const nowIso = new Date().toISOString().split('T')[0];
        const valid = tables.lotes
          .filter(l => l.producto_id === prodId && l.estado === 'VIGENTE' && l.stock_actual > 0 && l.fecha_vencimiento >= nowIso)
          .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
        return { recordset: valid.map(l => ({ ...l })), rowsAffected: [valid.length] };
      }
      const allForProd = tables.lotes
        .filter(l => l.producto_id === prodId)
        .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
      return { recordset: allForProd.map(l => ({ ...l })), rowsAffected: [allForProd.length] };
    }

    // 8. UPDATE lotes SET stock_actual = ... WHERE id = @loteId
    if (upper.startsWith('UPDATE LOTES')) {
      const lote = tables.lotes.find(l => l.id === (inputs.loteId || inputs.id));
      if (lote) {
        if (inputs.cantidad !== undefined) {
          if (upper.includes('STOCK_ACTUAL + @CANTIDAD')) {
            lote.stock_actual = lote.stock_actual + inputs.cantidad;
            if (lote.estado === 'AGOTADO' && lote.stock_actual > 0) lote.estado = 'VIGENTE';
          } else {
            lote.stock_actual = Math.max(0, lote.stock_actual - inputs.cantidad);
            if (lote.stock_actual === 0) lote.estado = 'AGOTADO';
          }
        } else if (inputs.stockNuevo !== undefined) {
          lote.stock_actual = inputs.stockNuevo;
          if (lote.stock_actual === 0) lote.estado = 'AGOTADO';
          else if (lote.estado === 'AGOTADO' && lote.stock_actual > 0) lote.estado = 'VIGENTE';
        }
        lote.fecha_actualizacion = new Date().toISOString();
        evaluateAlerts([lote.producto_id]);
      }
      return { recordset: [], rowsAffected: [lote ? 1 : 0] };
    }

    // 9. SELECT productos
    if (upper.includes('FROM PRODUCTOS')) {
      if (upper.includes('WHERE ID = @PRODUCTID') || upper.includes('WHERE ID = @ID') || upper.includes('WHERE P.ID = @ID')) {
        const id = inputs.productId || inputs.id;
        const prod = tables.productos.find(p => p.id === id);
        return { recordset: prod ? [{ ...prod }] : [], rowsAffected: [prod ? 1 : 0] };
      }
      if (upper.includes('WHERE CODIGO_BARRAS = @CODIGO_BARRAS')) {
        const prod = tables.productos.find(p => p.codigo_barras === inputs.codigo_barras);
        return { recordset: prod ? [{ id: prod.id }] : [], rowsAffected: [prod ? 1 : 0] };
      }
      // Check for low stock alert or dashboard query:
      if (upper.includes('<= P.STOCK_MINIMO')) {
        const lowProds = tables.productos.filter(p => p.esta_activo === 1).map(p => {
          const totalStock = calculateTotalStock(p.id);
          return {
            id: p.id,
            producto_id: p.id,
            nombre: p.nombre,
            producto_nombre: p.nombre,
            codigo_barras: p.codigo_barras,
            stock_minimo: p.stock_minimo,
            total_stock: totalStock,
            stock_total: totalStock,
            critical: totalStock === 0
          };
        }).filter(p => p.total_stock <= p.stock_minimo);
        return { recordset: lowProds, rowsAffected: [lowProds.length] };
      }
      // General listProducts
      let list = tables.productos.filter(p => p.esta_activo === 1);
      if (inputs.q) {
        const q = String(inputs.q).replace(/%/g, '').toLowerCase();
        list = list.filter(p =>
          (p.nombre && p.nombre.toLowerCase().includes(q)) ||
          (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q)) ||
          (p.nombre_generico && p.nombre_generico.toLowerCase().includes(q))
        );
      }
      const mapped = list.map(p => {
        const cat = tables.categorias.find(c => c.id === p.categoria_id);
        const lab = tables.laboratorios.find(l => l.id === p.laboratorio_id);
        const totalStock = calculateTotalStock(p.id);
        return {
          id: p.id,
          codigo_barras: p.codigo_barras,
          nombre: p.nombre,
          nombre_generico: p.nombre_generico,
          nombre_comercial: p.nombre_comercial,
          concentracion: p.concentracion,
          presentacion: p.presentacion,
          registro_sanitario: p.registro_sanitario,
          laboratorio: lab ? lab.nombre : '',
          categoria_id: p.categoria_id,
          laboratorio_id: p.laboratorio_id,
          precio_venta: p.precio_venta,
          costo: p.costo,
          precio_costo: p.costo,
          stock_minimo: p.stock_minimo,
          stock_maximo: p.stock_maximo,
          requiere_receta: p.requiere_receta,
          es_controlado: p.es_controlado,
          controlado: p.es_controlado,
          esta_activo: p.esta_activo,
          fecha_actualizacion: p.fecha_actualizacion,
          categoria: cat ? cat.nombre : 'General',
          total_stock: totalStock,
          stock_total: totalStock,
          stock_vigente: totalStock,
          low_stock: totalStock <= p.stock_minimo,
          bajo_stock: totalStock <= p.stock_minimo
        };
      });
      return { recordset: mapped, rowsAffected: [mapped.length] };
    }

    // 10. INSERT INTO productos
    if (upper.startsWith('INSERT INTO PRODUCTOS')) {
      const newId = uuidv4();
      const newProd = {
        id: newId,
        codigo_barras: inputs.codigo_barras,
        nombre: inputs.nombre,
        nombre_generico: inputs.nombre_generico || inputs.nombre,
        nombre_comercial: inputs.nombre_comercial || null,
        concentracion: inputs.concentracion || null,
        presentacion: inputs.presentacion || 'UNIDAD',
        registro_sanitario: inputs.registro_sanitario || null,
        categoria_id: inputs.categoria_id || CAT_ANALGESICOS,
        laboratorio_id: inputs.laboratorio_id || LAB_FARMA,
        precio_venta: parseFloat(inputs.precio_venta) || 0,
        costo: parseFloat(inputs.costo) || 0,
        stock_minimo: parseInt(inputs.stock_minimo, 10) || 0,
        stock_maximo: inputs.stock_maximo ? parseInt(inputs.stock_maximo, 10) : 200,
        requiere_receta: inputs.requiere_receta ? 1 : 0,
        es_controlado: inputs.es_controlado ? 1 : 0,
        esta_activo: 1,
        fecha_actualizacion: new Date().toISOString()
      };
      tables.productos.push(newProd);
      evaluateAlerts([newId]);
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 11. UPDATE productos
    if (upper.startsWith('UPDATE PRODUCTOS')) {
      const prod = tables.productos.find(p => p.id === inputs.id);
      if (prod) {
        if (inputs.nombre !== undefined) prod.nombre = inputs.nombre;
        if (inputs.codigo_barras !== undefined) prod.codigo_barras = inputs.codigo_barras;
        if (inputs.nombre_generico !== undefined) prod.nombre_generico = inputs.nombre_generico;
        if (inputs.concentracion !== undefined) prod.concentracion = inputs.concentracion;
        if (inputs.presentacion !== undefined) prod.presentacion = inputs.presentacion;
        if (inputs.precio_venta !== undefined) prod.precio_venta = parseFloat(inputs.precio_venta);
        if (inputs.costo !== undefined) prod.costo = parseFloat(inputs.costo);
        if (inputs.stock_minimo !== undefined) prod.stock_minimo = parseInt(inputs.stock_minimo, 10);
        if (inputs.categoria_id !== undefined) prod.categoria_id = inputs.categoria_id;
        if (inputs.laboratorio_id !== undefined) prod.laboratorio_id = inputs.laboratorio_id;
        if (inputs.esta_activo !== undefined) prod.esta_activo = inputs.esta_activo;
        prod.fecha_actualizacion = new Date().toISOString();
        evaluateAlerts([prod.id]);
      }
      return { recordset: [], rowsAffected: [prod ? 1 : 0] };
    }

    // 12. List batches (inventoryController / dashboardController)
    if (upper.includes('FROM LOTES L') && upper.includes('JOIN PRODUCTOS P')) {
      if (upper.includes('DATEDIFF(DAY') && upper.includes('FECHA_VENCIMIENTO <=')) {
        const nowIso = new Date().toISOString().split('T')[0];
        const thirtyDaysAhead = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        const expiring = tables.lotes
          .filter(l => {
            const p = tables.productos.find(pr => pr.id === l.producto_id);
            return l.estado === 'VIGENTE' && l.stock_actual > 0 && p && p.esta_activo === 1 &&
              l.fecha_vencimiento >= nowIso && l.fecha_vencimiento <= thirtyDaysAhead;
          })
          .map(l => {
            const p = tables.productos.find(pr => pr.id === l.producto_id);
            const diffDays = Math.max(0, Math.ceil((new Date(l.fecha_vencimiento) - new Date(nowIso)) / 86400000));
            return {
              lote_id: l.id,
              codigo_lote: l.codigo_lote,
              fecha_vencimiento: l.fecha_vencimiento,
              stock_actual: l.stock_actual,
              producto_id: p.id,
              producto: p.nombre,
              producto_nombre: p.nombre,
              dias_restantes: diffDays
            };
          });
        return { recordset: expiring, rowsAffected: [expiring.length] };
      }

      const batches = tables.lotes.map(l => {
        const p = tables.productos.find(pr => pr.id === l.producto_id);
        const prov = tables.proveedores.find(pr => pr.id === l.proveedor_id);
        return {
          id: l.id,
          producto_id: l.producto_id,
          codigo_lote: l.codigo_lote,
          fecha_vencimiento: l.fecha_vencimiento,
          stock_actual: l.stock_actual,
          stock_inicial: l.stock_inicial,
          ubicacion: l.ubicacion || 'Almacén General',
          estado: l.estado,
          producto: p ? p.nombre : 'Producto',
          producto_nombre: p ? p.nombre : 'Producto',
          codigo_barras: p ? p.codigo_barras : '',
          proveedor: prov ? prov.razon_social : 'Droguería Distribuidora'
        };
      });
      return { recordset: batches, rowsAffected: [batches.length] };
    }

    // 13. INSERT INTO lotes
    if (upper.startsWith('INSERT INTO LOTES')) {
      const newId = uuidv4();
      const prodId = inputs.productoId || inputs.productId;
      const newLote = {
        id: newId,
        producto_id: prodId,
        codigo_lote: inputs.codigoLote || inputs.batchCode,
        fecha_vencimiento: inputs.fechaVencimiento || inputs.expiryDate,
        stock_actual: parseInt(inputs.stockInicial || inputs.stockActual || inputs.quantity, 10) || 0,
        stock_inicial: parseInt(inputs.stockInicial || inputs.stockActual || inputs.quantity, 10) || 0,
        ubicacion: inputs.ubicacion || 'Almacén BPA',
        proveedor_id: inputs.proveedorId || PROV_DROGUERIA,
        estado: 'VIGENTE'
      };
      tables.lotes.push(newLote);
      evaluateAlerts([prodId]);
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 14. INSERT INTO movimientos_stock
    if (upper.startsWith('INSERT INTO MOVIMIENTOS_STOCK')) {
      const prodId = inputs.productoId || inputs.productId;
      const p = tables.productos.find(pr => pr.id === prodId);
      const l = tables.lotes.find(lot => lot.id === inputs.loteId);
      const u = tables.perfiles_usuario.find(usr => usr.id === inputs.usuarioId);
      const newMov = {
        id: uuidv4(),
        producto_id: prodId,
        producto_nombre: p ? p.nombre : 'Producto',
        codigo_barras: p ? p.codigo_barras : '',
        lote_id: inputs.loteId,
        codigo_lote: l ? l.codigo_lote : '',
        usuario_id: inputs.usuarioId,
        usuario_nombre: u ? `${u.nombre} ${u.apellido}` : 'Sistema',
        tipo_movimiento: inputs.tipo || inputs.tipo_movimiento || 'SALIDA_VENTA',
        cantidad: inputs.cantidad,
        stock_anterior: inputs.stockAnterior || 0,
        stock_nuevo: inputs.stockNuevo || 0,
        motivo: inputs.motivo || 'Movimiento de inventario',
        referencia_id: inputs.referenciaId || null,
        fecha: new Date().toISOString()
      };
      tables.movimientos_stock.push(newMov);
      return { recordset: [{ id: newMov.id }], rowsAffected: [1] };
    }

    // 15. COUNT(*) FROM ventas
    if (upper.includes('SELECT COUNT(*) AS TOTAL FROM VENTAS')) {
      return { recordset: [{ total: tables.ventas.length }], rowsAffected: [1] };
    }

    // 16. INSERT INTO ventas
    if (upper.startsWith('INSERT INTO VENTAS')) {
      const newId = uuidv4();
      const newSale = {
        id: newId,
        codigo_venta: inputs.saleCode,
        cajero_id: inputs.cashierId,
        cliente_id: inputs.customerId || null,
        subtotal: parseFloat(inputs.subtotal) || 0,
        monto_igv: parseFloat(inputs.taxAmount) || 0,
        monto_descuento: 0,
        monto_total: parseFloat(inputs.totalAmount) || 0,
        metodo_pago: inputs.paymentMethod || 'efectivo',
        tipo_comprobante: inputs.receiptType || 'boleta',
        monto_pagado: parseFloat(inputs.amountPaid) || parseFloat(inputs.totalAmount) || 0,
        monto_vuelto: Math.max(0, (parseFloat(inputs.amountPaid) || 0) - (parseFloat(inputs.totalAmount) || 0)),
        estado: 'COMPLETADA',
        motivo_anulacion: null,
        fecha_anulacion: null,
        anulado_por_id: null,
        fecha_creacion: new Date().toISOString()
      };
      tables.ventas.push(newSale);

      // Link sale to current open shift in cash register if cash
      if (newSale.metodo_pago === 'efectivo') {
        const activeShift = tables.turnos_caja.find(s => s.estado === 'ABIERTO');
        if (activeShift) {
          activeShift.efectivo_esperado = parseFloat((activeShift.efectivo_esperado + newSale.monto_total).toFixed(2));
        }
      }

      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 17. INSERT INTO items_venta_lotes (evaluar antes que items_venta por prefijo común)
    if (upper.startsWith('INSERT INTO ITEMS_VENTA_LOTES')) {
      const newItemLote = {
        id: uuidv4(),
        item_venta_id: inputs.itemVentaId,
        lote_id: inputs.loteId,
        cantidad: inputs.cantidad
      };
      tables.items_venta_lotes.push(newItemLote);
      return { recordset: [], rowsAffected: [1] };
    }

    // 18. INSERT INTO items_venta
    if (upper.startsWith('INSERT INTO ITEMS_VENTA')) {
      const newId = uuidv4();
      const newItem = {
        id: newId,
        venta_id: inputs.saleId,
        producto_id: inputs.productId,
        precio_unitario: parseFloat(inputs.precioUnitario) || 0,
        cantidad: parseInt(inputs.cantidad, 10) || 0,
        descuento: 0,
        subtotal: parseFloat(inputs.subtotal) || 0
      };
      tables.items_venta.push(newItem);
      evaluateAlerts([inputs.productId]);
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 19. Dashboard stats for sales today
    if (upper.includes('FROM VENTAS') && upper.includes('CAST(FECHA_CREACION AS DATE) = CAST(SYSDATETIME() AS DATE)')) {
      const todayIso = new Date().toISOString().split('T')[0];
      const todaySales = tables.ventas.filter(v => v.fecha_creacion.startsWith(todayIso) && v.estado === 'COMPLETADA');
      const totalAmount = todaySales.reduce((sum, v) => sum + (parseFloat(v.monto_total) || 0), 0);
      return { recordset: [{ cantidad: todaySales.length, total: totalAmount }], rowsAffected: [1] };
    }

    // 20. SELECT ventas
    if (upper.includes('FROM VENTAS')) {
      if (inputs.id || upper.includes('WHERE V.ID = @ID') || upper.includes('WHERE ID = @ID')) {
        const targetId = inputs.id;
        const v = tables.ventas.find(s => s.id === targetId);
        if (!v) return { recordset: [], rowsAffected: [0] };
        const u = tables.perfiles_usuario.find(usr => usr.id === v.cajero_id);
        const c = tables.clientes.find(cli => cli.id === v.cliente_id);
        const an = v.anulado_por_id ? tables.perfiles_usuario.find(usr => usr.id === v.anulado_por_id) : null;
        return {
          recordset: [{
            ...v,
            cajero: u ? `${u.nombre} ${u.apellido}` : 'Cajero',
            cliente: c ? c.nombre_completo : null,
            cliente_doc: c ? c.numero_documento : null,
            anulado_por: an ? `${an.nombre} ${an.apellido}` : null
          }],
          rowsAffected: [1]
        };
      }

      let salesList = [...tables.ventas].reverse();
      if (inputs.search) {
        const s = String(inputs.search).replace(/%/g, '').toLowerCase();
        salesList = salesList.filter(v => v.codigo_venta.toLowerCase().includes(s));
      }
      if (inputs.from) {
        salesList = salesList.filter(v => v.fecha_creacion.slice(0, 10) >= String(inputs.from).slice(0, 10));
      }
      if (inputs.to) {
        salesList = salesList.filter(v => v.fecha_creacion.slice(0, 10) <= String(inputs.to).slice(0, 10));
      }
      const mapped = salesList.map(v => {
        const u = tables.perfiles_usuario.find(usr => usr.id === v.cajero_id);
        const c = tables.clientes.find(cli => cli.id === v.cliente_id);
        const items = tables.items_venta.filter(iv => iv.venta_id === v.id).map(iv => {
          const p = tables.productos.find(pr => pr.id === iv.producto_id);
          const batchAssignments = tables.items_venta_lotes.filter(b => b.item_venta_id === iv.id).map(b => {
            const l = tables.lotes.find(lot => lot.id === b.lote_id);
            return {
              lote_id: b.lote_id,
              codigo_lote: l ? l.codigo_lote : '',
              fecha_vencimiento: l ? l.fecha_vencimiento : '',
              cantidad: b.cantidad
            };
          });
          return {
            id: iv.id,
            producto_id: iv.producto_id,
            producto: p ? p.nombre : 'Producto',
            productName: p ? p.nombre : 'Producto',
            codigo_barras: p ? p.codigo_barras : '',
            precio_unitario: iv.precio_unitario,
            unitPrice: iv.precio_unitario,
            cantidad: iv.cantidad,
            quantity: iv.cantidad,
            subtotal: iv.subtotal,
            batches: batchAssignments
          };
        });
        return {
          id: v.id,
          codigo_venta: v.codigo_venta,
          fecha_creacion: v.fecha_creacion,
          subtotal: v.subtotal,
          monto_igv: v.monto_igv,
          monto_total: v.monto_total,
          monto_pagado: v.monto_pagado,
          monto_vuelto: v.monto_vuelto,
          metodo_pago: v.metodo_pago,
          tipo_comprobante: v.tipo_comprobante,
          estado: v.estado,
          motivo_anulacion: v.motivo_anulacion,
          fecha_anulacion: v.fecha_anulacion,
          cajero_id: v.cajero_id,
          cajero: u ? `${u.nombre} ${u.apellido}` : 'Cajero',
          cliente_id: v.cliente_id,
          cliente: c ? c.nombre_completo : null,
          cliente_doc: c ? c.numero_documento : null,
          items
        };
      });
      return { recordset: mapped, rowsAffected: [mapped.length] };
    }

    // 20.b UPDATE ventas
    if (upper.startsWith('UPDATE VENTAS')) {
      const saleId = inputs.saleId || inputs.id;
      const v = tables.ventas.find(s => s.id === saleId);
      if (v) {
        v.estado = inputs.estado || 'ANULADA';
        v.motivo_anulacion = inputs.reason || inputs.motivo || v.motivo_anulacion;
        v.fecha_anulacion = new Date().toISOString();
        v.anulado_por_id = inputs.userId || inputs.usuarioId || null;

        // Si la venta fue en efectivo, descontar del arqueo de la caja abierta
        if (v.metodo_pago === 'efectivo') {
          const shift = tables.turnos_caja.find(s => s.estado === 'ABIERTO');
          if (shift) {
            shift.efectivo_esperado = Math.max(0, parseFloat((shift.efectivo_esperado - v.monto_total).toFixed(2)));
          }
        }
      }
      return { recordset: [], rowsAffected: [v ? 1 : 0] };
    }

    // 21. SELECT items_venta iv JOIN productos p ... WHERE iv.venta_id = @id
    if (upper.includes('FROM ITEMS_VENTA IV') && upper.includes('WHERE IV.VENTA_ID = @ID')) {
      const items = tables.items_venta.filter(iv => iv.venta_id === inputs.id).map(iv => {
        const p = tables.productos.find(pr => pr.id === iv.producto_id);
        const batchAssignments = tables.items_venta_lotes.filter(b => b.item_venta_id === iv.id).map(b => {
          const l = tables.lotes.find(lot => lot.id === b.lote_id);
          return {
            lote_id: b.lote_id,
            codigo_lote: l ? l.codigo_lote : '',
            fecha_vencimiento: l ? l.fecha_vencimiento : '',
            cantidad: b.cantidad
          };
        });
        return {
          id: iv.id,
          producto_id: iv.producto_id,
          producto: p ? p.nombre : 'Producto',
          productName: p ? p.nombre : 'Producto',
          codigo_barras: p ? p.codigo_barras : '',
          precio_unitario: iv.precio_unitario,
          unitPrice: iv.precio_unitario,
          cantidad: iv.cantidad,
          quantity: iv.cantidad,
          subtotal: iv.subtotal,
          batches: batchAssignments
        };
      });
      return { recordset: items, rowsAffected: [items.length] };
    }

    // 21.b SELECT items_venta_lotes ivl JOIN items_venta iv WHERE iv.venta_id = @saleId
    if (upper.includes('FROM ITEMS_VENTA_LOTES IVL')) {
      const saleId = inputs.saleId || inputs.id;
      const saleItems = tables.items_venta.filter(iv => iv.venta_id === saleId);
      const rows = [];
      for (const item of saleItems) {
        const prod = tables.productos.find(p => p.id === item.producto_id);
        const itemLotes = tables.items_venta_lotes.filter(ivl => ivl.item_venta_id === item.id);
        for (const il of itemLotes) {
          rows.push({
            producto_id: item.producto_id,
            lote_id: il.lote_id,
            cantidad: il.cantidad,
            producto_nombre: prod ? prod.nombre : 'Producto'
          });
        }
      }
      return { recordset: rows, rowsAffected: [rows.length] };
    }

    // 22. Dashboard top selling products
    if (upper.includes('FROM ITEMS_VENTA IV') && upper.includes('TOP 10')) {
      const prodCounts = {};
      tables.items_venta.forEach(iv => {
        const sale = tables.ventas.find(s => s.id === iv.venta_id);
        if (sale && sale.estado === 'ANULADA') return;
        if (!prodCounts[iv.producto_id]) {
          prodCounts[iv.producto_id] = { qty: 0, subtotal: 0 };
        }
        prodCounts[iv.producto_id].qty += iv.cantidad;
        prodCounts[iv.producto_id].subtotal += iv.subtotal;
      });
      const top = Object.keys(prodCounts)
        .filter(pid => pid && pid !== 'undefined' && pid !== 'null')
        .map(pid => {
          const p = tables.productos.find(pr => pr.id === pid);
          return {
            id: pid,
            nombre: p ? p.nombre : 'Producto',
            codigo_barras: p ? p.codigo_barras : '',
            cantidad_vendida: prodCounts[pid].qty,
            ingreso_total: prodCounts[pid].subtotal
          };
        }).sort((a, b) => b.cantidad_vendida - a.cantidad_vendida).slice(0, 10);
      return { recordset: top, rowsAffected: [top.length] };
    }

    // 23. Alertas
    if (upper.includes('FROM ALERTAS_STOCK')) {
      if (upper.includes('COUNT(*)')) {
        const count = tables.alertas_stock.filter(a => a.estado === 'PENDIENTE').length;
        return { recordset: [{ c: count, pendingCount: count, pendingAlerts: count }], rowsAffected: [1] };
      }
      if (upper.includes('WHERE PRODUCTO_ID = @PRODUCTOID AND TIPO_ALERTA = @TIPO')) {
        const found = tables.alertas_stock.filter(
          a => a.producto_id === inputs.productoId && a.tipo_alerta === inputs.tipo && a.estado === 'PENDIENTE'
        );
        return { recordset: found.map(a => ({ id: a.id })), rowsAffected: [found.length] };
      }
      const list = tables.alertas_stock.map(a => {
        const p = tables.productos.find(pr => pr.id === a.producto_id);
        const l = a.lote_id ? tables.lotes.find(lot => lot.id === a.lote_id) : null;
        const u = a.resuelto_por_id ? tables.perfiles_usuario.find(usr => usr.id === a.resuelto_por_id) : null;
        return {
          id: a.id,
          tipo_alerta: a.tipo_alerta,
          estado: a.estado,
          mensaje: a.mensaje,
          producto_id: a.producto_id,
          producto: p ? p.nombre : null,
          producto_nombre: p ? p.nombre : null,
          codigo_barras: p ? p.codigo_barras : null,
          lote_id: a.lote_id,
          codigo_lote: l ? l.codigo_lote : null,
          fecha_vencimiento: l ? l.fecha_vencimiento : null,
          fecha_creacion: a.fecha_creacion,
          fecha_resolucion: a.fecha_resolucion,
          resuelto_por_id: a.resuelto_por_id,
          resuelto_por: u ? `${u.nombre} ${u.apellido}` : null,
          resuelto_por_nombre: u ? `${u.nombre} ${u.apellido}` : null
        };
      });
      return { recordset: list, rowsAffected: [list.length] };
    }

    // 24. INSERT INTO alertas_stock
    if (upper.startsWith('INSERT INTO ALERTAS_STOCK')) {
      const newId = uuidv4();
      const newAlert = {
        id: newId,
        producto_id: inputs.productoId,
        lote_id: inputs.loteId || null,
        tipo_alerta: inputs.tipo,
        estado: inputs.estado || 'PENDIENTE',
        mensaje: inputs.mensaje,
        origen_disparador: inputs.origen || 'SISTEMA',
        fecha_creacion: new Date().toISOString(),
        fecha_resolucion: null,
        resuelto_por_id: null
      };
      tables.alertas_stock.push(newAlert);
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 25. UPDATE alertas_stock SET estado = 'RESUELTA' WHERE id = @id
    if (upper.startsWith('UPDATE ALERTAS_STOCK')) {
      const alert = tables.alertas_stock.find(a => a.id === inputs.id);
      if (alert) {
        alert.estado = 'RESUELTA';
        alert.fecha_resolucion = new Date().toISOString();
        alert.resuelto_por_id = inputs.userId || inputs.usuarioId || null;
      }
      return { recordset: alert ? [{ ...alert }] : [], rowsAffected: [alert ? 1 : 0] };
    }

    // 26. INSERT INTO registros_auditoria_sistema
    if (upper.startsWith('INSERT INTO REGISTROS_AUDITORIA_SISTEMA')) {
      const log = {
        id: uuidv4(),
        usuario_id: inputs.usuarioId,
        accion: inputs.accion,
        modulo: inputs.modulo,
        tabla_afectada: inputs.tablaAfectada,
        registro_id: inputs.registroId,
        datos_nuevos: inputs.datosNuevos,
        fecha_creacion: new Date().toISOString()
      };
      tables.registros_auditoria_sistema.push(log);
      return { recordset: [{ id: log.id }], rowsAffected: [1] };
    }

    // 27. SELECT audit logs
    if (upper.includes('FROM REGISTROS_AUDITORIA_SISTEMA')) {
      const logs = [...tables.registros_auditoria_sistema].reverse().slice(0, 100).map(a => {
        const u = tables.perfiles_usuario.find(usr => usr.id === a.usuario_id);
        return {
          id: a.id,
          usuario_id: a.usuario_id,
          accion: a.accion,
          modulo: a.modulo,
          tabla_afectada: a.tabla_afectada,
          registro_id: a.registro_id,
          datos_nuevos: a.datos_nuevos,
          fecha_creacion: a.fecha_creacion,
          usuario: u ? `${u.nombre} ${u.apellido}` : 'Sistema'
        };
      });
      return { recordset: logs, rowsAffected: [logs.length] };
    }

    // 28. SELECT categorias
    if (upper.includes('FROM CATEGORIAS')) {
      return { recordset: tables.categorias.map(c => ({ ...c })), rowsAffected: [tables.categorias.length] };
    }

    // 29. SELECT laboratorios
    if (upper.includes('FROM LABORATORIOS')) {
      return { recordset: tables.laboratorios.map(l => ({ ...l })), rowsAffected: [tables.laboratorios.length] };
    }

    // 30. SELECT proveedores
    if (upper.includes('FROM PROVEEDORES')) {
      return {
        recordset: tables.proveedores.map(p => ({ ...p, razonSocial: p.razon_social })),
        rowsAffected: [tables.proveedores.length]
      };
    }

    // 31. SELECT turnos_caja
    if (upper.includes('FROM TURNOS_CAJA')) {
      if (upper.includes("WHERE ESTADO = 'ABIERTO'")) {
        const shift = tables.turnos_caja.find(s => s.estado === 'ABIERTO');
        if (!shift) return { recordset: [], rowsAffected: [0] };
        const u = tables.perfiles_usuario.find(usr => usr.id === shift.cajero_id);
        return {
          recordset: [{ ...shift, cajero_nombre: u ? `${u.nombre} ${u.apellido}` : 'Cajero' }],
          rowsAffected: [1]
        };
      }
      const history = [...tables.turnos_caja].reverse().map(s => {
        const u = tables.perfiles_usuario.find(usr => usr.id === s.cajero_id);
        return { ...s, cajero_nombre: u ? `${u.nombre} ${u.apellido}` : 'Cajero' };
      });
      return { recordset: history, rowsAffected: [history.length] };
    }

    // 32. INSERT INTO turnos_caja
    if (upper.startsWith('INSERT INTO TURNOS_CAJA')) {
      const newId = uuidv4();
      const shift = {
        id: newId,
        cajero_id: inputs.cajeroId,
        fecha_apertura: new Date().toISOString(),
        fecha_cierre: null,
        fondo_inicial: parseFloat(inputs.fondoInicial) || 0,
        efectivo_esperado: parseFloat(inputs.fondoInicial) || 0,
        efectivo_contado: null,
        diferencia: null,
        estado: 'ABIERTO',
        observaciones: inputs.observaciones || null
      };
      tables.turnos_caja.push(shift);
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 33. UPDATE turnos_caja
    if (upper.startsWith('UPDATE TURNOS_CAJA')) {
      const shift = tables.turnos_caja.find(s => s.id === inputs.id || s.estado === 'ABIERTO');
      if (shift) {
        if (inputs.fechaCierre) shift.fecha_cierre = inputs.fechaCierre;
        if (inputs.efectivoContado !== undefined) shift.efectivo_contado = parseFloat(inputs.efectivoContado);
        if (inputs.diferencia !== undefined) shift.diferencia = parseFloat(inputs.diferencia);
        if (inputs.estado) shift.estado = inputs.estado;
        if (inputs.observaciones !== undefined) shift.observaciones = inputs.observaciones;
      }
      return { recordset: [], rowsAffected: [shift ? 1 : 0] };
    }

    // 34. SELECT movimientos_caja
    if (upper.includes('FROM MOVIMIENTOS_CAJA')) {
      return { recordset: [...tables.movimientos_caja].reverse(), rowsAffected: [tables.movimientos_caja.length] };
    }

    // 35. INSERT INTO movimientos_caja
    if (upper.startsWith('INSERT INTO MOVIMIENTOS_CAJA')) {
      const newId = uuidv4();
      const mov = {
        id: newId,
        turno_id: inputs.turnoId,
        tipo: inputs.tipo || 'INGRESO',
        monto: parseFloat(inputs.monto) || 0,
        motivo: inputs.motivo,
        fecha: new Date().toISOString()
      };
      tables.movimientos_caja.push(mov);

      // Adjust shift expected cash
      const shift = tables.turnos_caja.find(s => s.id === inputs.turnoId);
      if (shift) {
        if (mov.tipo === 'INGRESO') {
          shift.efectivo_esperado = parseFloat((shift.efectivo_esperado + mov.monto).toFixed(2));
        } else {
          shift.efectivo_esperado = parseFloat((shift.efectivo_esperado - mov.monto).toFixed(2));
        }
      }
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 36. SELECT compras
    if (upper.includes('FROM COMPRAS')) {
      const mapPurchaseItems = (compraId) => {
        return tables.items_compra.filter(it => it.compra_id === compraId).map(it => {
          const p = tables.productos.find(pr => pr.id === it.producto_id);
          return {
            ...it,
            productoId: it.producto_id,
            productoNombre: p ? p.nombre : 'Producto',
            producto_nombre: p ? p.nombre : 'Producto',
            codigoBarras: p ? p.codigo_barras : '',
            cantidad: it.cantidad,
            cantidadRecibida: it.cantidad_recibida || 0,
            costoUnitario: it.precio_unitario,
            precio_unitario: it.precio_unitario,
            subtotal: it.subtotal
          };
        });
      };

      if (upper.includes('WHERE P.ID = @ID') || upper.includes('WHERE ID = @ID')) {
        const id = inputs.id;
        const c = tables.compras.find(comp => comp.id === id);
        if (!c) return { recordset: [], rowsAffected: [0] };
        const prov = tables.proveedores.find(p => p.id === c.proveedor_id);
        const buyer = tables.perfiles_usuario.find(u => u.id === c.comprador_id);
        const items = mapPurchaseItems(c.id);
        return {
          recordset: [{
            ...c,
            proveedor: prov ? prov.razon_social : 'Proveedor',
            proveedor_nombre: prov ? prov.razon_social : 'Proveedor',
            comprador: buyer ? `${buyer.nombre} ${buyer.apellido}` : 'Comprador',
            comprador_nombre: buyer ? `${buyer.nombre} ${buyer.apellido}` : 'Comprador',
            items
          }],
          rowsAffected: [1]
        };
      }
      const list = [...tables.compras].reverse().map(c => {
        const prov = tables.proveedores.find(p => p.id === c.proveedor_id);
        const buyer = tables.perfiles_usuario.find(u => u.id === c.comprador_id);
        const items = mapPurchaseItems(c.id);
        return {
          id: c.id,
          codigo_compra: c.codigo_compra,
          proveedor_id: c.proveedor_id,
          proveedor: prov ? prov.razon_social : 'Proveedor',
          proveedor_nombre: prov ? prov.razon_social : 'Proveedor',
          comprador_id: c.comprador_id,
          comprador: buyer ? `${buyer.nombre} ${buyer.apellido}` : 'Comprador',
          comprador_nombre: buyer ? `${buyer.nombre} ${buyer.apellido}` : 'Comprador',
          monto_total: c.monto_total,
          numero_factura: c.numero_factura,
          fecha_factura: c.fecha_factura,
          estado: c.estado,
          fecha_creacion: c.fecha_creacion,
          notas: c.notas,
          items
        };
      });
      return { recordset: list, rowsAffected: [list.length] };
    }

    // 37. INSERT INTO compras
    if (upper.startsWith('INSERT INTO COMPRAS')) {
      const newId = uuidv4();
      const count = tables.compras.length + 1;
      const code = inputs.purchaseCode || `OC-2026-${String(count).padStart(8, '0')}`;
      const newComp = {
        id: newId,
        codigo_compra: code,
        proveedor_id: inputs.supplierId,
        comprador_id: inputs.buyerId,
        numero_factura: inputs.invoiceNumber || null,
        fecha_factura: inputs.invoiceDate || null,
        monto_total: parseFloat(inputs.totalAmount) || 0,
        notas: inputs.notes || null,
        estado: 'REGISTRADA',
        fecha_creacion: new Date().toISOString()
      };
      tables.compras.push(newComp);
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 38. INSERT INTO items_compra
    if (upper.startsWith('INSERT INTO ITEMS_COMPRA')) {
      const newId = uuidv4();
      const item = {
        id: newId,
        compra_id: inputs.purchaseId,
        producto_id: inputs.productId,
        cantidad: parseInt(inputs.quantity, 10) || 0,
        cantidad_recibida: 0,
        precio_unitario: parseFloat(inputs.unitPrice) || 0,
        subtotal: parseFloat(inputs.subtotal) || 0
      };
      tables.items_compra.push(item);
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 39. Generic backup SELECT * FROM [tableName] or SELECT * FROM tableName
    const selectMatch = sql.match(/SELECT\s+\*\s+FROM\s+\[?([a-zA-Z0-9_]+)\]?/i);
    if (selectMatch) {
      const tblName = selectMatch[1].toLowerCase();
      if (tables[tblName]) {
        return { recordset: tables[tblName].map(r => ({ ...r })), rowsAffected: [tables[tblName].length] };
      }
    }

    // 40. Generic backup DELETE FROM [tableName]
    const deleteMatch = sql.match(/DELETE\s+FROM\s+\[?([a-zA-Z0-9_]+)\]?/i);
    if (deleteMatch) {
      const tblName = deleteMatch[1].toLowerCase();
      if (tables[tblName]) {
        const count = tables[tblName].length;
        tables[tblName] = [];
        return { recordset: [], rowsAffected: [count] };
      }
    }

    return { recordset: [], rowsAffected: [0] };
  }
}

class MockTransaction {
  constructor(pool) {
    this.pool = pool;
  }
  async begin() {
    return this;
  }
  async commit() {
    return this;
  }
  async rollback() {
    return this;
  }
  request() {
    return this.pool.request();
  }
}

class MockConnectionPool {
  constructor() {}
  async connect() {
    return this;
  }
  async close() {
    return this;
  }
  request() {
    return new MockRequest();
  }
}

const mockPoolInstance = new MockConnectionPool();

const sql = {
  ConnectionPool: MockConnectionPool,
  Request: MockRequest,
  Transaction: MockTransaction
};

async function getPool() {
  return mockPoolInstance;
}

async function closePool() {
  return mockPoolInstance.close();
}

module.exports = {
  sql,
  getPool,
  closePool,
  mockTables: tables,
  evaluateAlerts,
  calculateTotalStock
};
