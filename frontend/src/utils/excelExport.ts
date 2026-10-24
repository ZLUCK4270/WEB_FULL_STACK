import * as XLSX from 'xlsx';
import { Product, Batch } from '../types/pharmacy';

export interface InventoryExportOptions {
  products: Product[];
  batches: Batch[];
  systemDate: string;
  responsibleName?: string;
  responsibleRole?: string;
}

/**
 * Calculates days between system date and expiration date.
 */
const calculateDaysUntilExpiration = (expirationDate: string, systemDateStr: string): number => {
  const baseDate = new Date(systemDateStr.includes('T') ? systemDateStr : `${systemDateStr}T00:00:00`);
  const expDate = new Date(expirationDate.includes('T') ? expirationDate : `${expirationDate}T23:59:59`);
  const diffTime = expDate.getTime() - baseDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Formats batch status into a clear, standardized pharmaceutical text label.
 */
const getBatchExpirationStatusLabel = (batch: Batch, daysRemaining: number): {
  label: string;
  severity: 'normal' | 'warning' | 'critical' | 'expired' | 'quarantine';
} => {
  if (batch.status === 'quarantine') {
    return { label: 'CUARENTENA DIGEMID', severity: 'quarantine' };
  }
  if (batch.status === 'expired' || daysRemaining <= 0) {
    return { label: 'VENCIDO - NO DISPENSAR', severity: 'expired' };
  }
  if (daysRemaining <= 30) {
    return { label: 'CRÍTICO (< 30 DÍAS)', severity: 'critical' };
  }
  if (daysRemaining <= 90) {
    return { label: 'PRÓXIMO A VENCER (31-90 DÍAS)', severity: 'warning' };
  }
  return { label: 'VIGENTE Y CONFORME', severity: 'normal' };
};

/**
 * Exports the current pharmaceutical inventory with granular batches and FEFO expirations to an Excel (.xlsx) file.
 */
export const exportInventoryToExcel = (options: InventoryExportOptions): void => {
  const {
    products,
    batches,
    systemDate,
    responsibleName = 'Dr. Carlos Mendoza Flores',
    responsibleRole = 'Regente Farmacéutico'
  } = options;

  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.id, p));

  // --- SHEET 1: DETALLE DE LOTES Y CADUCIDADES FEFO ---
  const batchesDataRows = batches.map((batch, index) => {
    const product = productMap.get(batch.productId);
    const daysRemaining = calculateDaysUntilExpiration(batch.expirationDate, systemDate);
    const statusInfo = getBatchExpirationStatusLabel(batch, daysRemaining);
    const totalCostValue = +(batch.stock * batch.unitCost).toFixed(2);
    const totalSaleValue = product ? +(batch.stock * product.unitPrice).toFixed(2) : 0;

    return {
      'Ítem': index + 1,
      'Código SKU': product?.code || 'N/A',
      'Medicamento Comercial': product?.name || 'Medicamento Desconocido',
      'DCI / Principio Activo': product?.genericName || '',
      'Concentración': product?.concentration || '',
      'Presentación': product?.presentation || '',
      'Laboratorio': product?.laboratory || '',
      'Familia / Categoría': product?.category || '',
      'Lote / Serie': batch.batchCode,
      'Proveedor / Droguería': batch.supplierName,
      'Fecha Recepción': batch.receivedDate,
      'Fecha de Vencimiento': batch.expirationDate,
      'Días Restantes': daysRemaining,
      'Estado del Lote': statusInfo.label,
      'Stock Actual (Uds)': batch.stock,
      'Stock Inicial (Uds)': batch.initialStock,
      'Costo Compra Unit. (S/)': Number(batch.unitCost.toFixed(2)),
      'Valorización Costo (S/)': totalCostValue,
      'Precio Venta Unit. (S/)': product ? Number(product.unitPrice.toFixed(2)) : 0,
      'Valorización Venta (S/)': totalSaleValue,
      'Ubicación Física': product?.location || 'Almacén',
      'Controlado (Lista IV)': product?.isControlled ? 'SÍ' : 'NO',
      'Receta Médica': product?.requiresPrescription ? 'OBLIGATORIA' : 'VENTA LIBRE'
    };
  });

  const wsBatches = XLSX.utils.json_to_sheet(batchesDataRows);

  // Set column widths for Sheet 1
  wsBatches['!cols'] = [
    { wch: 6 },  // Ítem
    { wch: 12 }, // Código SKU
    { wch: 32 }, // Medicamento Comercial
    { wch: 28 }, // DCI
    { wch: 18 }, // Concentración
    { wch: 18 }, // Presentación
    { wch: 20 }, // Laboratorio
    { wch: 28 }, // Categoría
    { wch: 16 }, // Lote
    { wch: 24 }, // Proveedor
    { wch: 14 }, // Fecha Recepción
    { wch: 18 }, // Fecha Vencimiento
    { wch: 14 }, // Días Restantes
    { wch: 26 }, // Estado del Lote
    { wch: 16 }, // Stock Actual
    { wch: 16 }, // Stock Inicial
    { wch: 18 }, // Costo Unit.
    { wch: 20 }, // Valor Costo
    { wch: 18 }, // Precio Venta
    { wch: 20 }, // Valor Venta
    { wch: 16 }, // Ubicación
    { wch: 18 }, // Controlado
    { wch: 16 }  // Receta
  ];

  // --- SHEET 2: RESUMEN DE PRODUCTOS (SKU) ---
  const productsSummaryRows = products.map((product, index) => {
    const productBatches = batches.filter(b => b.productId === product.id && b.status === 'active');
    const totalStock = productBatches.reduce((acc, b) => acc + b.stock, 0);
    const isLowStock = totalStock <= product.minStock;
    const isOutOfStock = totalStock === 0;

    // FEFO: Sort active batches with stock > 0 by expiration date ascending
    const sortedFefo = [...productBatches]
      .filter(b => b.stock > 0)
      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

    const nextBatch = sortedFefo[0];
    const daysToNextExp = nextBatch ? calculateDaysUntilExpiration(nextBatch.expirationDate, systemDate) : null;

    let stockStatus = 'CONFORME';
    if (isOutOfStock) {
      stockStatus = 'SIN STOCK (QUIEBRE)';
    } else if (isLowStock) {
      stockStatus = 'BAJO STOCK MÍNIMO';
    }

    const totalValuation = +(totalStock * product.unitPrice).toFixed(2);

    return {
      'N°': index + 1,
      'Código': product.code,
      'Medicamento': product.name,
      'DCI': product.genericName,
      'Concentración': product.concentration,
      'Presentación': product.presentation,
      'Laboratorio': product.laboratory,
      'Categoría': product.category,
      'Stock Total': totalStock,
      'Stock Mínimo': product.minStock,
      'Estado Abastecimiento': stockStatus,
      'Lotes Activos': productBatches.length,
      'Lote Próximo (FEFO)': nextBatch ? nextBatch.batchCode : 'Sin lotes disponibles',
      'Fecha Próx. Vencimiento': nextBatch ? nextBatch.expirationDate : 'N/A',
      'Días para Vencer': daysToNextExp !== null ? daysToNextExp : 'N/A',
      'Precio Venta (S/)': Number(product.unitPrice.toFixed(2)),
      'Valorización Total (S/)': totalValuation,
      'Ubicación Almacén': product.location,
      'Psicotrópico': product.isControlled ? 'SÍ' : 'NO'
    };
  });

  const wsProducts = XLSX.utils.json_to_sheet(productsSummaryRows);

  wsProducts['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 32 },
    { wch: 26 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 }
  ];

  // --- SHEET 3: FICHA DE CONTROL Y AUDITORÍA ---
  const totalStockUnits = batches.reduce((acc, b) => acc + (b.status === 'active' ? b.stock : 0), 0);
  const totalCostValuation = batches.reduce((acc, b) => acc + (b.status === 'active' ? b.stock * b.unitCost : 0), 0);
  const criticalBatchesCount = batches.filter(b => {
    if (b.status !== 'active') return false;
    const days = calculateDaysUntilExpiration(b.expirationDate, systemDate);
    return days <= 30 && days > 0;
  }).length;
  const expiredBatchesCount = batches.filter(b => {
    const days = calculateDaysUntilExpiration(b.expirationDate, systemDate);
    return b.status === 'expired' || days <= 0;
  }).length;
  const quarantineBatchesCount = batches.filter(b => b.status === 'quarantine').length;

  const metadataAoa = [
    ['BOTICA NOVA SALUD S.A.C. - SISTEMA DE CONTROL FARMACÉUTICO'],
    ['REPORTE OFICIAL DE INVENTARIO Y FECHAS DE CADUCIDAD FEFO'],
    [''],
    ['PARÁMETROS DE LA AUDITORÍA', 'VALOR REGISTRADO'],
    ['Fecha de Gestión Operativa (Rotativa):', systemDate],
    ['Fecha y Hora de Emisión:', new Date().toLocaleString('es-PE')],
    ['Responsable Farmacéutico:', `${responsibleName} (${responsibleRole})`],
    ['Establecimiento Farmacéutico:', 'Botica Nova Salud - Sede Principal'],
    ['Certificación Normativa:', 'Cumplimiento BPA / DIGEMID D.S. N° 014-2011-SA'],
    [''],
    ['INDICADORES CONSOLIDADOS DEL INVENTARIO', 'VALOR'],
    ['Total de Medicamentos / SKUs Registrados:', products.length],
    ['Total de Lotes Registrados en Base de Datos:', batches.length],
    ['Total de Unidades Físicas Disponibles:', totalStockUnits],
    ['Valorización Total del Stock al Costo (S/):', `S/ ${totalCostValuation.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ['Lotes Críticos próximos a vencer (< 30 días):', criticalBatchesCount],
    ['Lotes en Cuarentena DIGEMID:', quarantineBatchesCount],
    ['Lotes Vencidos / Bloqueados:', expiredBatchesCount],
    [''],
    ['NOTAS TÉCNICAS:', ''],
    ['1. La dispensación en el sistema POS se rige bajo la regla FEFO (First Expired, First Out).'],
    ['2. Todo lote con menos de 30 días para su caducidad debe ser priorizado o devuelto a droguería según política de canjes.']
  ];

  const wsMeta = XLSX.utils.aoa_to_sheet(metadataAoa);
  wsMeta['!cols'] = [{ wch: 45 }, { wch: 45 }];

  // --- CREATE WORKBOOK AND APPEND SHEETS ---
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, wsBatches, 'Lotes_FEFO_Caducidad');
  XLSX.utils.book_append_sheet(workbook, wsProducts, 'Resumen_SKU_Inventario');
  XLSX.utils.book_append_sheet(workbook, wsMeta, 'Ficha_Auditoria_BPA');

  // Trigger Excel file download
  const cleanDate = systemDate.replace(/[^0-9-]/g, '_');
  const filename = `Reporte_Inventario_Lotes_FEFO_${cleanDate}.xlsx`;
  XLSX.writeFile(workbook, filename);
};
