const { v4: uuidv4 } = require('uuid');

// ==============================================================================
// NOVA SALUD - ENTORNO IN-MEMORY DB / SQL ADAPTER PARA AI STUDIO
// ==============================================================================

const now = new Date();
const exp30Days = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];
const exp1Year = new Date(now.getTime() + 365 * 86400000).toISOString().split('T')[0];
const expExpired = new Date(now.getTime() - 15 * 86400000).toISOString().split('T')[0];
const exp24h = new Date(now.getTime() + 18 * 3600000).toISOString().split('T')[0];

const CAT_ANTIBIOTICOS = '11111111-0000-0000-0000-000000000001';
const CAT_ANALGESICOS = '11111111-0000-0000-0000-000000000002';
const CAT_GASTRO = '11111111-0000-0000-0000-000000000003';

const LAB_FARMA = '22222222-0000-0000-0000-000000000001';
const LAB_BAGO = '22222222-0000-0000-0000-000000000002';

const PROV_DROGUERIA = '33333333-0000-0000-0000-000000000001';

const PROD_AMOX = '44444444-0000-0000-0000-000000000001';
const PROD_IBU = '44444444-0000-0000-0000-000000000002';
const PROD_OME = '44444444-0000-0000-0000-000000000003';

const tables = {
  perfiles_usuario: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      dni: '10203040',
      nombre: 'Carlos Alberto',
      apellido: 'Mendoza Vera',
      correo: 'admin@novasalud.pe',
      telefono: '987654321',
      cargo: 'Administrador Propietario',
      es_administrador_raiz: 1,
      esta_activo: 1,
      debe_cambiar_clave: 0,
      password_hash: '$2a$10$01GD43MmqDILyzT2xgz7BeIN0ACKB2l930g7NX8659wN/5JFL/wqK', // regente2026
      ultimo_acceso: null,
      ip_ultimo_acceso: null,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      dni: '71829304',
      nombre: 'Juan Manuel',
      apellido: 'Pérez García',
      correo: 'cajero@novasalud.pe',
      telefono: '912345678',
      cargo: 'Cajero / Atención Mostrador',
      es_administrador_raiz: 0,
      esta_activo: 1,
      debe_cambiar_clave: 0,
      password_hash: '$2a$10$DGVYCJeNI5SsHohZcXHc.u.FAh58KzD.bbUSzIQow2.GDSLBrPfQi', // caja2026
      ultimo_acceso: null,
      ip_ultimo_acceso: null,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      dni: '76543210',
      nombre: 'Luis',
      apellido: 'Torres Valdivia',
      correo: 'almacen@novasalud.pe',
      telefono: '99887766',
      cargo: 'Almacén y Logística',
      es_administrador_raiz: 0,
      esta_activo: 1,
      debe_cambiar_clave: 0,
      password_hash: '$2a$10$QZx7MFTDSuEudgEyvU9OQex8qZXTaYFPQ692VF3pzrnqjZBKQ3Bam', // almacen2026
      ultimo_acceso: null,
      ip_ultimo_acceso: null,
      fecha_creacion: new Date().toISOString(),
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
    { id: uuidv4(), usuario_id: 'b0000000-0000-0000-0000-000000000002', modulo_id: 'pos_sales', puede_ver: 1, puede_crear: 1, puede_editar: 0, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: 'b0000000-0000-0000-0000-000000000002', modulo_id: 'customers', puede_ver: 1, puede_crear: 1, puede_editar: 0, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: 'b0000000-0000-0000-0000-000000000002', modulo_id: 'inventory', puede_ver: 1, puede_crear: 0, puede_editar: 0, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: 'b0000000-0000-0000-0000-000000000002', modulo_id: 'cash', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: 'b0000000-0000-0000-0000-000000000002', modulo_id: 'alerts', puede_ver: 1, puede_crear: 1, puede_editar: 0, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: 'c0000000-0000-0000-0000-000000000003', modulo_id: 'inventory', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: 'c0000000-0000-0000-0000-000000000003', modulo_id: 'purchases', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 },
    { id: uuidv4(), usuario_id: 'c0000000-0000-0000-0000-000000000003', modulo_id: 'alerts', puede_ver: 1, puede_crear: 1, puede_editar: 1, puede_eliminar: 0 }
  ],
  categorias: [
    { id: CAT_ANTIBIOTICOS, nombre: 'Antibióticos & Antimicrobianos', slug: 'antibioticos', descripcion: 'Tratamiento de infecciones bacterianas', esta_activa: 1 },
    { id: CAT_ANALGESICOS, nombre: 'Analgésicos & Antipiréticos', slug: 'analgesicos', descripcion: 'Control de dolor y fiebre', esta_activa: 1 },
    { id: CAT_GASTRO, nombre: 'Gastroenterología & Antiácidos', slug: 'gastro', descripcion: 'Inhibidores de bomba y protectores gástricos', esta_activa: 1 }
  ],
  laboratorios: [
    { id: LAB_FARMA, nombre: 'Farmaindustria S.A.', pais: 'Perú', esta_activo: 1 },
    { id: LAB_BAGO, nombre: 'Laboratorios Bagó del Perú S.A.', pais: 'Argentina / Perú', esta_activo: 1 }
  ],
  proveedores: [
    { id: PROV_DROGUERIA, ruc: '20100123456', razon_social: 'Droguería Distribuidora Nova Farma S.A.C.', contacto: 'Lic. Miguel Falconí', telefono: '(01) 513-8000', correo: 'ventas@novafarma.pe', direccion: 'Av. Industrial 1420, Lima', esta_activo: 1 },
    { id: '33333333-0000-0000-0000-000000000002', ruc: '20509988771', razon_social: 'Distribuidora Química Suiza S.A.C.', contacto: 'Dra. Patricia Arana', telefono: '(01) 411-9000', correo: 'pedidos@quimicasuiza.pe', direccion: 'Av. República de Panamá 2577, Lima', esta_activo: 1 }
  ],
  productos: [
    {
      id: PROD_AMOX,
      codigo_barras: '7750123456789',
      nombre: 'Amoxicilina 500mg Cápsulas',
      nombre_generico: 'Amoxicilina',
      nombre_comercial: 'Amoxil',
      concentracion: '500 mg',
      presentacion: 'CAJA',
      registro_sanitario: 'EE-04521-DIGEMID',
      categoria_id: CAT_ANTIBIOTICOS,
      laboratorio_id: LAB_FARMA,
      precio_venta: 0.80,
      costo: 0.35,
      stock_minimo: 30,
      stock_maximo: 150,
      requiere_receta: 1,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_IBU,
      codigo_barras: '7750987654321',
      nombre: 'Ibuprofeno 400mg Tabletas',
      nombre_generico: 'Ibuprofeno',
      nombre_comercial: 'Doloral',
      concentracion: '400 mg',
      presentacion: 'BLISTER',
      registro_sanitario: 'EE-01298-DIGEMID',
      categoria_id: CAT_ANALGESICOS,
      laboratorio_id: LAB_BAGO,
      precio_venta: 0.50,
      costo: 0.20,
      stock_minimo: 50,
      stock_maximo: 200,
      requiere_receta: 0,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: PROD_OME,
      codigo_barras: '7750112233445',
      nombre: 'Omeprazol 20mg Cápsulas',
      nombre_generico: 'Omeprazol',
      nombre_comercial: null,
      concentracion: '20 mg',
      presentacion: 'CAJA',
      registro_sanitario: null,
      categoria_id: CAT_GASTRO,
      laboratorio_id: LAB_FARMA,
      precio_venta: 1.10,
      costo: 0.48,
      stock_minimo: 70,
      stock_maximo: 200,
      requiere_receta: 0,
      es_controlado: 0,
      esta_activo: 1,
      fecha_actualizacion: new Date().toISOString()
    }
  ],
  lotes: [
    {
      id: '55555555-0000-0000-0000-000000000001',
      producto_id: PROD_AMOX,
      codigo_lote: 'LOTE-AMX-2026-PRIORIDAD-1',
      fecha_vencimiento: exp30Days,
      stock_actual: 25,
      stock_inicial: 50,
      proveedor_id: PROV_DROGUERIA,
      estado: 'VIGENTE'
    },
    {
      id: '55555555-0000-0000-0000-000000000002',
      producto_id: PROD_AMOX,
      codigo_lote: 'LOTE-AMX-2027-RESERVA-2',
      fecha_vencimiento: exp1Year,
      stock_actual: 100,
      stock_inicial: 100,
      proveedor_id: PROV_DROGUERIA,
      estado: 'VIGENTE'
    },
    {
      id: '55555555-0000-0000-0000-000000000003',
      producto_id: PROD_AMOX,
      codigo_lote: 'LOTE-AMX-VENCIDO-BLOQUEADO',
      fecha_vencimiento: expExpired,
      stock_actual: 10,
      stock_inicial: 50,
      proveedor_id: PROV_DROGUERIA,
      estado: 'VENCIDO'
    },
    {
      id: '55555555-0000-0000-0000-000000000004',
      producto_id: PROD_IBU,
      codigo_lote: 'LOTE-IBU-2026-10',
      fecha_vencimiento: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
      stock_actual: 22,
      stock_inicial: 150,
      proveedor_id: PROV_DROGUERIA,
      estado: 'VIGENTE'
    },
    {
      id: '55555555-0000-0000-0000-000000000005',
      producto_id: PROD_OME,
      codigo_lote: 'LOTE-OME-24H-CRIT',
      fecha_vencimiento: exp24h,
      stock_actual: 8,
      stock_inicial: 40,
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
      direccion: 'Jr. Los Álamos 340, Breña',
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    }
  ],
  turnos_caja: [
    {
      id: '77777777-0000-0000-0000-000000000001',
      cajero_id: 'a0000000-0000-0000-0000-000000000001',
      fecha_apertura: new Date(Date.now() - 3600000).toISOString(),
      fecha_cierre: null,
      fondo_inicial: 150.00,
      efectivo_esperado: 150.00,
      efectivo_contado: null,
      diferencia: null,
      estado: 'ABIERTO',
      observaciones: 'Turno de apertura en caja principal'
    }
  ],
  movimientos_caja: [
    {
      id: uuidv4(),
      turno_id: '77777777-0000-0000-0000-000000000001',
      tipo: 'INGRESO',
      monto: 150.00,
      motivo: 'Apertura de turno - fondo inicial',
      fecha: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  compras: [
    {
      id: '88888888-0000-0000-0000-000000000001',
      codigo_compra: 'OC-2026-00000001',
      proveedor_id: PROV_DROGUERIA,
      comprador_id: 'a0000000-0000-0000-0000-000000000001',
      numero_factura: 'F001-0004521',
      fecha_factura: new Date().toISOString().split('T')[0],
      monto_total: 44.00,
      notas: 'Orden de reposición de antibióticos y gastro',
      estado: 'REGISTRADA',
      fecha_creacion: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  items_compra: [
    {
      id: uuidv4(),
      compra_id: '88888888-0000-0000-0000-000000000001',
      producto_id: PROD_OME,
      cantidad: 50,
      cantidad_recibida: 0,
      precio_unitario: 0.48,
      subtotal: 24.00
    },
    {
      id: uuidv4(),
      compra_id: '88888888-0000-0000-0000-000000000001',
      producto_id: PROD_IBU,
      cantidad: 100,
      cantidad_recibida: 0,
      precio_unitario: 0.20,
      subtotal: 20.00
    }
  ],
  ventas: [],
  items_venta: [],
  items_venta_lotes: [],
  movimientos_stock: [],
  alertas_stock: [],
  registros_auditoria_sistema: [],
  sugerencias_reposicion: []
};

// Evaluate and synchronize alerts automatically
function evaluateAlerts(targetProductIds = null) {
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
        ? `SIN STOCK: "${p.nombre}" no tiene unidades disponibles para la venta.`
        : `STOCK BAJO: "${p.nombre}" tiene ${totalStock} uds. (mínimo configurado: ${p.stock_minimo}).`;

      const existing = tables.alertas_stock.find(
        a => a.producto_id === p.id && a.tipo_alerta === alertType && a.estado === 'PENDIENTE'
      );

      if (!existing) {
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

  // Check expiring lots
  const thirtyDaysAhead = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  tables.lotes.forEach(l => {
    const p = tables.productos.find(pr => pr.id === l.producto_id);
    if (!p || p.esta_activo !== 1) return;

    if (l.estado === 'VIGENTE' && l.stock_actual > 0) {
      if (l.fecha_vencimiento < todayIso) {
        l.estado = 'VENCIDO';
        const msg = `LOTE VENCIDO: Lote "${l.codigo_lote}" de "${p.nombre}" (${l.stock_actual} uds.) está vencido.`;
        if (!tables.alertas_stock.some(a => a.lote_id === l.id && a.tipo_alerta === 'VENCIDO' && a.estado === 'PENDIENTE')) {
          tables.alertas_stock.push({
            id: uuidv4(),
            producto_id: p.id,
            lote_id: l.id,
            tipo_alerta: 'VENCIDO',
            estado: 'PENDIENTE',
            mensaje: msg,
            origen_disparador: 'AUTO_EVALUACION',
            fecha_creacion: new Date().toISOString(),
            fecha_resolucion: null,
            resuelto_por_id: null
          });
        }
      } else if (l.fecha_vencimiento <= thirtyDaysAhead) {
        const diffDays = Math.max(0, Math.ceil((new Date(l.fecha_vencimiento) - new Date(todayIso)) / 86400000));
        const msg = `VENCE EN ${diffDays} DÍA(S): Lote "${l.codigo_lote}" de "${p.nombre}" (${l.stock_actual} uds.) vence pronto.`;
        if (!tables.alertas_stock.some(a => a.lote_id === l.id && a.tipo_alerta === 'VENCIMIENTO_CERCA' && a.estado === 'PENDIENTE')) {
          tables.alertas_stock.push({
            id: uuidv4(),
            producto_id: p.id,
            lote_id: l.id,
            tipo_alerta: 'VENCIMIENTO_CERCA',
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

    // 6. FEFO lotes query for a product
    if (upper.includes('FROM LOTES') && upper.includes('WHERE PRODUCTO_ID = @PRODUCTID')) {
      if (upper.includes("AND ESTADO = 'VIGENTE'") || upper.includes('FECHA_VENCIMIENTO >') || upper.includes('FECHA_VENCIMIENTO >=')) {
        const nowIso = new Date().toISOString().split('T')[0];
        const valid = tables.lotes
          .filter(l => l.producto_id === inputs.productId && l.estado === 'VIGENTE' && l.stock_actual > 0 && l.fecha_vencimiento >= nowIso)
          .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
        return { recordset: valid.map(l => ({ ...l })), rowsAffected: [valid.length] };
      }
    }

    // 7. SELECT id FROM lotes WHERE producto_id = @productoId AND codigo_lote = @codigoLote
    if (upper.includes('FROM LOTES') && upper.includes('WHERE PRODUCTO_ID = @PRODUCTOID') && upper.includes('CODIGO_LOTE = @CODIGOLOTE')) {
      const match = tables.lotes.filter(l => l.producto_id === inputs.productoId && l.codigo_lote === inputs.codigoLote);
      return { recordset: match.map(l => ({ id: l.id })), rowsAffected: [match.length] };
    }

    // 8. UPDATE lotes SET stock_actual = ... WHERE id = @loteId
    if (upper.startsWith('UPDATE LOTES')) {
      const lote = tables.lotes.find(l => l.id === inputs.loteId);
      if (lote) {
        if (inputs.cantidad !== undefined) {
          lote.stock_actual = Math.max(0, lote.stock_actual - inputs.cantidad);
          if (lote.stock_actual === 0) lote.estado = 'AGOTADO';
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
          concentracion: p.concentracion,
          presentacion: p.presentacion,
          laboratorio: lab ? lab.nombre : '',
          categoria_id: p.categoria_id,
          laboratorio_id: p.laboratorio_id,
          precio_venta: p.precio_venta,
          costo: p.costo,
          stock_minimo: p.stock_minimo,
          stock_maximo: p.stock_maximo,
          requiere_receta: p.requiere_receta,
          es_controlado: p.es_controlado,
          esta_activo: p.esta_activo,
          fecha_actualizacion: p.fecha_actualizacion,
          categoria: cat ? cat.nombre : 'General',
          total_stock: totalStock,
          low_stock: totalStock <= p.stock_minimo
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

    // 12. List batches (inventoryController)
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
          estado: l.estado,
          producto: p ? p.nombre : 'Producto',
          codigo_barras: p ? p.codigo_barras : '',
          proveedor: prov ? prov.razon_social : 'Droguería Distribuidora'
        };
      });
      return { recordset: batches, rowsAffected: [batches.length] };
    }

    // 13. INSERT INTO lotes
    if (upper.startsWith('INSERT INTO LOTES')) {
      const newId = uuidv4();
      const newLote = {
        id: newId,
        producto_id: inputs.productoId,
        codigo_lote: inputs.codigoLote,
        fecha_vencimiento: inputs.fechaVencimiento,
        stock_actual: parseInt(inputs.stockInicial || inputs.stockActual, 10) || 0,
        stock_inicial: parseInt(inputs.stockInicial, 10) || 0,
        proveedor_id: inputs.proveedorId || PROV_DROGUERIA,
        estado: 'VIGENTE'
      };
      tables.lotes.push(newLote);
      evaluateAlerts([inputs.productoId]);
      return { recordset: [{ id: newId }], rowsAffected: [1] };
    }

    // 14. INSERT INTO movimientos_stock
    if (upper.startsWith('INSERT INTO MOVIMIENTOS_STOCK')) {
      const p = tables.productos.find(pr => pr.id === inputs.productoId);
      const l = tables.lotes.find(lot => lot.id === inputs.loteId);
      const u = tables.perfiles_usuario.find(usr => usr.id === inputs.usuarioId);
      const newMov = {
        id: uuidv4(),
        producto_id: inputs.productoId,
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

    // 17. INSERT INTO items_venta
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

    // 18. INSERT INTO items_venta_lotes
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
      const mapped = salesList.map(v => {
        const u = tables.perfiles_usuario.find(usr => usr.id === v.cajero_id);
        const c = tables.clientes.find(cli => cli.id === v.cliente_id);
        return {
          id: v.id,
          codigo_venta: v.codigo_venta,
          fecha_creacion: v.fecha_creacion,
          subtotal: v.subtotal,
          monto_igv: v.monto_igv,
          monto_total: v.monto_total,
          metodo_pago: v.metodo_pago,
          tipo_comprobante: v.tipo_comprobante,
          estado: v.estado,
          motivo_anulacion: v.motivo_anulacion,
          fecha_anulacion: v.fecha_anulacion,
          cajero: u ? `${u.nombre} ${u.apellido}` : 'Cajero',
          cliente: c ? c.nombre_completo : null,
          cliente_doc: c ? c.numero_documento : null
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
          unitPrice: iv.precio_unitario,
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
      if (upper.includes('COUNT(*) AS PENDINGCOUNT')) {
        const count = tables.alertas_stock.filter(a => a.estado === 'PENDIENTE').length;
        return { recordset: [{ pendingCount: count }], rowsAffected: [1] };
      }
      if (upper.includes('WHERE PRODUCTO_ID = @PRODUCTOID AND TIPO_ALERTA = @TIPO AND ESTADO = @ESTADO') ||
          upper.includes('WHERE PRODUCTO_ID = @PRODUCTOID AND TIPO_ALERTA = @TIPO AND ESTADO = \'PENDIENTE\'')) {
        const found = tables.alertas_stock.filter(
          a => a.producto_id === inputs.productoId && a.tipo_alerta === inputs.tipo && a.estado === 'PENDIENTE'
        );
        return { recordset: found.map(a => ({ id: a.id })), rowsAffected: [found.length] };
      }
      const list = tables.alertas_stock.map(a => {
        const p = tables.productos.find(pr => pr.id === a.producto_id);
        const l = a.lote_id ? tables.lotes.find(lot => lot.id === a.lote_id) : null;
        return {
          id: a.id,
          tipo_alerta: a.tipo_alerta,
          estado: a.estado,
          mensaje: a.mensaje,
          producto_id: a.producto_id,
          producto: p ? p.nombre : null,
          codigo_barras: p ? p.codigo_barras : null,
          lote_id: a.lote_id,
          codigo_lote: l ? l.codigo_lote : null,
          fecha_vencimiento: l ? l.fecha_vencimiento : null,
          fecha_creacion: a.fecha_creacion,
          resuelto_por: a.resuelto_por_id
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
        alert.resuelto_por_id = inputs.usuarioId || null;
      }
      return { recordset: [], rowsAffected: [alert ? 1 : 0] };
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
      return { recordset: tables.proveedores.map(p => ({ ...p })), rowsAffected: [tables.proveedores.length] };
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
      if (upper.includes('WHERE P.ID = @ID') || upper.includes('WHERE ID = @ID')) {
        const id = inputs.id;
        const c = tables.compras.find(comp => comp.id === id);
        if (!c) return { recordset: [], rowsAffected: [0] };
        const prov = tables.proveedores.find(p => p.id === c.proveedor_id);
        const buyer = tables.perfiles_usuario.find(u => u.id === c.comprador_id);
        const items = tables.items_compra.filter(it => it.compra_id === c.id).map(it => {
          const p = tables.productos.find(pr => pr.id === it.producto_id);
          return {
            ...it,
            productoNombre: p ? p.nombre : 'Producto',
            codigoBarras: p ? p.codigo_barras : ''
          };
        });
        return {
          recordset: [{
            ...c,
            proveedor: prov ? prov.razon_social : 'Proveedor',
            proveedor_nombre: prov ? prov.razon_social : 'Proveedor',
            comprador: buyer ? `${buyer.nombre} ${buyer.apellido}` : 'Comprador',
            items
          }],
          rowsAffected: [1]
        };
      }
      const list = [...tables.compras].reverse().map(c => {
        const prov = tables.proveedores.find(p => p.id === c.proveedor_id);
        const buyer = tables.perfiles_usuario.find(u => u.id === c.comprador_id);
        return {
          id: c.id,
          codigo_compra: c.codigo_compra,
          proveedor_id: c.proveedor_id,
          proveedor: prov ? prov.razon_social : 'Proveedor',
          proveedor_nombre: prov ? prov.razon_social : 'Proveedor',
          comprador: buyer ? `${buyer.nombre} ${buyer.apellido}` : 'Comprador',
          monto_total: c.monto_total,
          numero_factura: c.numero_factura,
          fecha_factura: c.fecha_factura,
          estado: c.estado,
          fecha_creacion: c.fecha_creacion,
          notas: c.notas
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
