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
  concentracion?: string;
  presentacion?: string;
  laboratorio?: string;
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
