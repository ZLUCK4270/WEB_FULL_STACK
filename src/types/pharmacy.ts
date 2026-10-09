export type UserRole = 'admin' | 'regente' | 'cajero' | 'almacen';

export interface StaffUser {
  id: string;
  username: string; // Used for login: cmendoza, amorales, rdiaz, ltorres
  password?: string; // Collaborator password
  name: string;
  role: UserRole;
  roleTitle: string;
  dni: string;
  email: string;
  colegiatura?: string; // CQFP for pharmacists
  activeShift: 'mañana' | 'tarde' | 'noche';
  avatarInitials: string;
  allowedTabs: string[]; // List of permitted navigation tabs
  permissions: {
    canSell: boolean;
    canReceiveBatches: boolean;
    canAdjustStock: boolean;
    canOpenCloseCash: boolean;
    canViewFinancials: boolean;
    canManageStaff: boolean;
    canSignDigemidReports: boolean;
  };
}

// RBAC Utility: Check if tab is permitted for user
export const isTabAllowedForUser = (user: StaffUser | null | undefined, tabId: string): boolean => {
  if (!user) return false;
  return user.allowedTabs.includes(tabId);
};

// RBAC Utility: Get default primary tab for user upon login or role switch
export const getDefaultTabForUser = (user: StaffUser | null | undefined): string => {
  if (!user || !user.allowedTabs.length) return 'pos';
  return user.allowedTabs[0];
};

export type MedicineCategory =
  | 'Analgésicos y Antipiréticos'
  | 'Antibióticos y Antimicrobianos'
  | 'Antihipertensivos y Cardiológicos'
  | 'Gastrointestinales'
  | 'Antihistamínicos y Respiratorios'
  | 'Vitaminas y Suplementos'
  | 'Cuidado Personal y Primeros Auxilios';

export interface Batch {
  id: string;
  productId: string;
  batchCode: string;
  expirationDate: string; // YYYY-MM-DD
  stock: number;
  initialStock: number;
  unitCost: number; // Costo de compra en S/
  supplierName: string;
  status: 'active' | 'quarantine' | 'expired';
  quarantineReason?: string;
  receivedDate: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  genericName: string; // DCI
  category: MedicineCategory;
  concentration: string;
  presentation: string; // Caja x 20 tab, Frasco 120ml, etc.
  laboratory: string; // Medifarma, Bagó, AC Farma, Roemmers, etc.
  unitPrice: number; // Precio de venta al público en S/
  minStock: number;
  requiresPrescription: boolean;
  isControlled: boolean; // Psicotrópicos / DIGEMID Lista IV
  location: string; // Estante A-02, Vitrina Controlados, etc.
}

export interface CartItem {
  product: Product;
  quantity: number;
  assignedBatches: {
    batchId: string;
    batchCode: string;
    expirationDate: string;
    quantity: number;
  }[];
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
}

export type ReceiptType = 'boleta' | 'factura' | 'ticket';
export type PaymentMethod = 'efectivo' | 'yape' | 'tarjeta';

export interface Sale {
  id: string;
  receiptType: ReceiptType;
  receiptNumber: string; // B001-000123
  date: string; // ISO
  customerName: string;
  customerDoc: string; // DNI or RUC
  cashierName: string;
  cashierId: string;
  items: {
    productId: string;
    productName: string;
    genericName: string;
    batchCode: string;
    expirationDate: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  igv: number; // 18%
  discountTotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  operationCode?: string; // For Yape/Card
  notes?: string;
}

export interface CashMovement {
  id: string;
  type: 'ingreso' | 'egreso';
  concept: string;
  amount: number;
  category: 'venta' | 'fondo_inicial' | 'retiro' | 'gasto_operativo' | 'pago_proveedor';
  timestamp: string;
  responsibleName: string;
  voucherNumber?: string;
}

export interface CashRegister {
  id: string;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string;
  cashierName: string;
  shift: 'mañana' | 'tarde' | 'noche';
  initialFund: number;
  currentCash: number;
  totalSalesCash: number;
  totalSalesYape: number;
  totalSalesCard: number;
  totalInflow: number;
  totalOutflow: number;
  movements: CashMovement[];
}

export interface Supplier {
  id: string;
  ruc: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  paymentTerms: string; // 'Contado', 'Crédito 15 días', 'Crédito 30 días'
  rating: number;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // OC-2026-0042
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseOrderItem[];
  total: number;
  status: 'pendiente' | 'recibido' | 'cancelado';
  receivedAt?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  docType: 'DNI' | 'RUC';
  docNumber: string;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  allergies?: string[]; // e.g. ["Penicilina", "AINEs"]
  chronicConditions?: string[]; // e.g. ["Hipertensión", "Diabetes Tipo 2"]
  totalPurchases: number;
  lastPurchaseDate?: string;
}

export interface SystemAlert {
  id: string;
  type: 'fefo_warning' | 'stock_low' | 'controlled_rx' | 'cash_notice';
  severity: 'alta' | 'media' | 'baja';
  title: string;
  message: string;
  productId?: string;
  batchId?: string;
  date: string;
  resolved: boolean;
  actionLabel?: string;
  actionType?: 'apply_discount' | 'quarantine' | 'reorder' | 'review';
}

// Backup & Database Snapshot Types
export type BackupFrequency = 'daily' | 'every_12h' | 'every_6h' | 'weekly' | 'on_cash_close';
export type BackupScope = 'all' | 'inventory_only' | 'sales_only';
export type BackupDestination = 'local_vault' | 'browser_download' | 'cloud_mirror';

export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: BackupFrequency;
  scheduledTime: string; // e.g. "23:00"
  selectedDays?: string[];
  includeInventory: boolean;
  includeSales: boolean;
  includeCashRegister: boolean;
  includeCustomers: boolean;
  autoDownload: boolean;
  retentionCopies: number;
  destination: BackupDestination;
  notifyOnCompletion: boolean;
  lastRunTimestamp: string | null;
  nextRunTimestamp: string;
}

export interface BackupRecord {
  id: string;
  filename: string;
  timestamp: string;
  type: 'automatic' | 'manual';
  scope: BackupScope;
  sizeBytes: number;
  formattedSize: string;
  recordCounts: {
    products: number;
    batches: number;
    sales: number;
    cashMovements?: number;
    customers?: number;
  };
  totalSalesAmount: number;
  checksum: string;
  createdBy: string;
  status: 'completado' | 'verificado' | 'restaurado';
  payloadJson?: string;
}

// Activity Log & Audit Trail Types
export type ActivityActionCategory =
  | 'VENTA'
  | 'INVENTARIO'
  | 'PERMISOS'
  | 'CAJA'
  | 'SEGURIDAD'
  | 'RESPALDO';

export type ActivitySeverity = 'info' | 'warning' | 'critical' | 'success';

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO
  timeFormatted: string; // "11:08:45"
  dateFormatted: string; // "2026-10-08"
  category: ActivityActionCategory;
  action: string;
  description: string;
  userId: string;
  userName: string;
  userRoleTitle: string;
  severity: ActivitySeverity;
  metadata?: {
    receiptNumber?: string;
    totalAmount?: number;
    productId?: string;
    productName?: string;
    batchCode?: string;
    stockDelta?: number;
    targetStock?: number;
    affectedUser?: string;
    permissionsChanged?: string[];
    allowedTabsCount?: number;
    reason?: string;
    shift?: string;
    ipAddress?: string;
    voucherNumber?: string;
  };
}
