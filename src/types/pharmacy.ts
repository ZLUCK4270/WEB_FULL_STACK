export type UserRole = 'admin' | 'vendedor' | 'almacen';

export interface AuthUser {
  id: string;
  dni: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  isRootAdmin: boolean;
  mustChangePassword: boolean;
}

export interface Batch {
  id: string;
  productId: string;
  codigoLote: string;
  fechaVencimiento: string; // YYYY-MM-DD
  stock: number;
  estado: 'VIGENTE' | 'AGOTADO' | 'VENCIDO';
}

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  generico?: string;
  categoria?: string;
  categoriaId?: string;
  concentracion?: string;
  presentacion?: string;
  laboratorio?: string;
  laboratorioId?: string;
  precio: number;
  costo: number;
  stockMinimo: number;
  stockTotal: number;
  stockVigente: number;
  lowStock: boolean;
  requiereReceta: boolean;
  controlado: boolean;
  estaActivo: boolean;
  fechaActualizacion?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ReceiptType = 'boleta' | 'factura' | 'ticket';
export type PaymentMethod = 'efectivo' | 'yape' | 'tarjeta';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  codigo?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  batches: { loteId: string; codigoLote: string; fechaVencimiento: string; cantidad: number }[];
}

export interface Sale {
  id: string;
  codigoVenta: string;
  fecha: string;
  cliente?: string;
  clienteDoc?: string;
  clienteId?: string;
  cajero: string;
  cajeroId: string;
  metodoPago: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: 'COMPLETADA' | 'ANULADA';
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  anuladoPor?: string;
  items: SaleItem[];
}

export interface Customer {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombreCompleto: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}

export interface SystemAlert {
  id: string;
  tipo: string;
  estado: string;
  mensaje: string;
  productoId?: string;
  producto?: string;
  codigoBarras?: string;
  loteId?: string;
  codigoLote?: string;
  fechaVencimiento?: string;
  fechaCreacion: string;
  resueltoPor?: string;
}

export interface DashboardStats {
  salesToday: { count: number; total: number };
  lowStockCount: number;
  lowStock: { id: string; codigo: string; nombre: string; stock_minimo: number; total_stock: number; critical: boolean }[];
  expiringSoonCount: number;
  expiringSoon: { loteId: string; codigoLote: string; productoId: string; producto: string; fechaVencimiento: string; stock: number; diasRestantes: number }[];
  topProducts: { id: string; nombre: string; codigo: string; cantidadVendida: number; ingresoTotal: number }[];
  pendingAlerts: number;
}

export interface Category {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
}

export interface Laboratory {
  id: string;
  nombre: string;
  pais?: string;
}

export interface Supplier {
  id: string;
  ruc: string;
  razonSocial: string;
  contacto?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}

export interface CashShift {
  id: string;
  cajeroId: string;
  cajeroNombre?: string;
  fechaApertura: string;
  fechaCierre?: string | null;
  fondoInicial: number;
  efectivoEsperado: number;
  efectivoContado?: number | null;
  diferencia?: number | null;
  totalVentasEfectivo: number;
  totalIngresosExtra: number;
  totalEgresosExtra: number;
  estado: 'ABIERTO' | 'CERRADO';
  observaciones?: string | null;
}

export interface CashMovement {
  id: string;
  turnoId: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  motivo: string;
  fecha: string;
  usuarioNombre?: string;
}

export interface PurchaseItem {
  id?: string;
  productoId: string;
  productoNombre?: string;
  codigoBarras?: string;
  cantidad: number;
  cantidadRecibida?: number;
  precioUnitario: number;
  subtotal: number;
  codigoLote?: string;
  fechaVencimiento?: string;
}

export interface PurchaseOrder {
  id: string;
  codigoCompra: string;
  proveedorId: string;
  proveedorNombre: string;
  compradorNombre?: string;
  montoTotal: number;
  numeroFactura?: string | null;
  fechaFactura?: string | null;
  fechaCreacion: string;
  notas?: string | null;
  estado: 'REGISTRADA' | 'PARCIAL' | 'RECIBIDA' | 'CANCELADA';
  items: PurchaseItem[];
}

export interface KardexMovement {
  id: string;
  productoId: string;
  productoNombre: string;
  codigoBarras: string;
  loteId?: string;
  codigoLote?: string;
  tipoMovimiento: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  usuarioNombre: string;
  fecha: string;
  referenciaId?: string;
}

export interface ReplenishmentSuggestion {
  productoId: string;
  nombre: string;
  codigoBarras: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  cantidadSugerida: number;
  proveedorId?: string;
  proveedorNombre?: string;
  proveedorRuc?: string;
}

export interface AuditLog {
  id: string;
  usuario: string;
  accion: string;
  modulo: string;
  tablaAfectada: string;
  registroId?: string;
  datosNuevos?: string;
  fecha: string;
}
