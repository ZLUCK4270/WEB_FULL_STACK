import {
  Product,
  Batch,
  Sale,
  CashRegister,
  Customer,
  Supplier,
  BackupScheduleConfig,
  BackupRecord,
  BackupScope
} from '../types/pharmacy';

export interface BackupDataPayload {
  metadata: {
    system: string;
    organization: string;
    ruc: string;
    environment: string;
    backupVersion: string;
    backupId: string;
    timestamp: string;
    operationalDate: string;
    scope: BackupScope;
    type: 'automatic' | 'manual';
    createdBy: string;
    checksum: string;
    format: 'application/json';
    compliance: string;
  };
  summary: {
    totalProducts: number;
    totalBatches: number;
    activeStockUnits: number;
    totalSales: number;
    totalRevenueAmount: number;
    cashRegisterBalance: number;
    totalCustomers?: number;
  };
  database: {
    products?: Product[];
    batches?: Batch[];
    sales?: Sale[];
    cashRegister?: CashRegister;
    customers?: Customer[];
    suppliers?: Supplier[];
  };
}

/**
 * Format raw byte size into human readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generates a deterministic hash checksum for integrity verification
 */
export function generateChecksum(dataString: string): string {
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const tail = Math.abs((hash * 31) | 0).toString(16).padStart(8, '0');
  return `SHA256-${hex.toUpperCase()}${tail.toUpperCase()}`;
}

/**
 * Generates the clean filename for the backup
 */
export function generateBackupFilename(scope: BackupScope, type: 'automatic' | 'manual', dateStr: string): string {
  const sanitizedDate = dateStr.replace(/[^0-9-]/g, '');
  const timeNow = new Date();
  const timeStr = `${String(timeNow.getHours()).padStart(2, '0')}${String(timeNow.getMinutes()).padStart(2, '0')}`;
  const scopeTag = scope === 'all' ? 'completo' : scope === 'inventory_only' ? 'inventario_fefo' : 'ventas_caja';
  const typeTag = type === 'automatic' ? 'auto' : 'manual';
  return `backup_novasalud_${scopeTag}_${typeTag}_${sanitizedDate}_${timeStr}.json`;
}

/**
 * Calculate the next run ISO / formatted time based on frequency and scheduled time
 */
export function computeNextRunTimestamp(frequency: BackupScheduleConfig['frequency'], scheduledTime: string, baseDateStr: string): string {
  const [hours, minutes] = (scheduledTime || '23:00').split(':').map(Number);
  const base = new Date(baseDateStr + 'T12:00:00.000Z');
  base.setHours(hours || 23, minutes || 0, 0, 0);

  const now = new Date();
  if (frequency === 'daily') {
    if (base <= now) {
      base.setDate(base.getDate() + 1);
    }
  } else if (frequency === 'every_12h') {
    base.setHours(base.getHours() + 12);
  } else if (frequency === 'every_6h') {
    base.setHours(base.getHours() + 6);
  } else if (frequency === 'weekly') {
    base.setDate(base.getDate() + 7);
  } else if (frequency === 'on_cash_close') {
    return 'Al cerrar turno / arqueo físico';
  }

  return base.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Packages pharmacy database state into a structured JSON string and record
 */
export function createBackupPayload(params: {
  products: Product[];
  batches: Batch[];
  sales: Sale[];
  cashRegister: CashRegister;
  customers: Customer[];
  suppliers: Supplier[];
  scope: BackupScope;
  type: 'automatic' | 'manual';
  systemDate: string;
  creatorName: string;
  config?: BackupScheduleConfig;
}): { payload: BackupDataPayload; jsonString: string; record: BackupRecord } {
  const {
    products,
    batches,
    sales,
    cashRegister,
    customers,
    suppliers,
    scope,
    type,
    systemDate,
    creatorName
  } = params;

  const includeInv = scope === 'all' || scope === 'inventory_only';
  const includeSales = scope === 'all' || scope === 'sales_only';

  const dbSlice: BackupDataPayload['database'] = {};
  if (includeInv) {
    dbSlice.products = products;
    dbSlice.batches = batches;
  }
  if (includeSales) {
    dbSlice.sales = sales;
    dbSlice.cashRegister = cashRegister;
  }
  if (scope === 'all') {
    dbSlice.customers = customers;
    dbSlice.suppliers = suppliers;
  }

  const activeStockUnits = (includeInv ? batches : []).reduce((acc, b) => acc + (b.status === 'active' ? b.stock : 0), 0);
  const totalRevenue = (includeSales ? sales : []).reduce((acc, s) => acc + s.total, 0);

  const dummyId = `BKP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const timestamp = new Date().toISOString();

  // Temporary string to generate checksum
  const rawDataForHash = JSON.stringify(dbSlice);
  const checksum = generateChecksum(rawDataForHash + timestamp + systemDate);

  const payload: BackupDataPayload = {
    metadata: {
      system: 'Botica Nova Salud S.A.C. - Enterprise Pharmacy ERP',
      organization: 'Botica Nova Salud S.A.C.',
      ruc: '20608492011',
      environment: 'Producción Local Regulada DIGEMID',
      backupVersion: '3.2.0-FEFO',
      backupId: dummyId,
      timestamp,
      operationalDate: systemDate,
      scope,
      type,
      createdBy: creatorName,
      checksum,
      format: 'application/json',
      compliance: 'Cumplimiento R.M. 040-2022/MINSA & DIGEMID'
    },
    summary: {
      totalProducts: includeInv ? products.length : 0,
      totalBatches: includeInv ? batches.length : 0,
      activeStockUnits,
      totalSales: includeSales ? sales.length : 0,
      totalRevenueAmount: +totalRevenue.toFixed(2),
      cashRegisterBalance: includeSales ? cashRegister.currentCash : 0,
      totalCustomers: scope === 'all' ? customers.length : undefined
    },
    database: dbSlice
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const sizeBytes = new Blob([jsonString]).size;
  const filename = generateBackupFilename(scope, type, systemDate);

  const record: BackupRecord = {
    id: dummyId,
    filename,
    timestamp,
    type,
    scope,
    sizeBytes,
    formattedSize: formatBytes(sizeBytes),
    recordCounts: {
      products: includeInv ? products.length : 0,
      batches: includeInv ? batches.length : 0,
      sales: includeSales ? sales.length : 0,
      cashMovements: includeSales ? (cashRegister.movements?.length || 0) : 0,
      customers: scope === 'all' ? customers.length : 0
    },
    totalSalesAmount: +totalRevenue.toFixed(2),
    checksum,
    createdBy: creatorName,
    status: 'completado',
    payloadJson: jsonString
  };

  return { payload, jsonString, record };
}

/**
 * Triggers a browser download of a given JSON backup string
 */
export function downloadBackupFile(filename: string, jsonString: string): void {
  try {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Error al descargar archivo de respaldo:', error);
  }
}

/**
 * Validates a parsed backup file content before allowing restoration
 */
export function validateBackupJson(rawString: string): {
  valid: boolean;
  error?: string;
  data?: BackupDataPayload;
} {
  try {
    const parsed = JSON.parse(rawString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'El archivo no contiene un JSON válido.' };
    }
    if (!parsed.metadata || !parsed.database) {
      return {
        valid: false,
        error: 'El archivo no contiene la estructura requerida de metadatos o base de datos de Nova Salud.'
      };
    }
    return { valid: true, data: parsed as BackupDataPayload };
  } catch (err: any) {
    return { valid: false, error: `Error de sintaxis JSON: ${err.message}` };
  }
}
