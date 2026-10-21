import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product, Batch } from '../../types/pharmacy';
import {
  Package,
  Plus,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FileText,
  X,
  Layers,
  Sparkles,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { exportInventoryToExcel } from '../../utils/excelExport';
import { exportInventoryPDF } from '../../utils/pdfExport';

export const InventoryBatchesView: React.FC = () => {
  const {
    products,
    batches,
    suppliers,
    currentUser,
    systemDate,
    logActivity,
    getProductTotalStock,
    getDaysUntilExpiration,
    receiveNewBatch,
    adjustBatchStock
  } = usePharmacy();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'critical' | 'low_stock' | 'quarantine'>('all');
  const [expandedProduct, setExpandedProduct] = useState<string | null>('prod-1');

  // Export State
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Modals
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedBatchForAdjust, setSelectedBatchForAdjust] = useState<Batch | null>(null);

  // Form State: New Batch
  const [newBatchForm, setNewBatchForm] = useState({
    productId: products[0]?.id || '',
    batchCode: '',
    expirationDate: '',
    stock: 50,
    unitCost: 0.50,
    supplierName: suppliers[0]?.name || ''
  });

  // Form State: Adjust
  const [adjustForm, setAdjustForm] = useState({
    quantityDelta: -1,
    reason: 'Deterioro de empaque / Merma de almacén',
    sendToQuarantine: false
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.laboratory.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const totalStock = getProductTotalStock(p.id);
      const productBatches = batches.filter(b => b.productId === p.id);

      if (filterTab === 'low_stock') {
        return totalStock <= p.minStock;
      }
      if (filterTab === 'critical') {
        return productBatches.some(b => {
          if (b.status !== 'active') return false;
          const days = getDaysUntilExpiration(b.expirationDate);
          return days <= 30 && days > 0;
        });
      }
      if (filterTab === 'quarantine') {
        return productBatches.some(b => b.status === 'quarantine' || b.status === 'expired');
      }
      return true;
    });
  }, [products, batches, searchTerm, filterTab]);

  const [batchError, setBatchError] = useState<string | null>(null);

  // Handle Submit New Batch
  const handleSaveNewBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchForm.productId || !newBatchForm.batchCode.trim() || !newBatchForm.expirationDate) {
      setBatchError('Por favor complete todos los campos obligatorios del lote (código y fecha de vencimiento).');
      return;
    }

    receiveNewBatch({
      productId: newBatchForm.productId,
      batchCode: newBatchForm.batchCode.trim(),
      expirationDate: newBatchForm.expirationDate,
      stock: Number(newBatchForm.stock),
      unitCost: Number(newBatchForm.unitCost),
      supplierName: newBatchForm.supplierName
    });

    setBatchError(null);
    setIsNewBatchModalOpen(false);
    setNewBatchForm({
      productId: products[0]?.id || '',
      batchCode: '',
      expirationDate: '',
      stock: 50,
      unitCost: 0.50,
      supplierName: suppliers[0]?.name || ''
    });
  };

  // Handle Submit Adjust
  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForAdjust) return;

    adjustBatchStock(
      selectedBatchForAdjust.id,
      Number(adjustForm.quantityDelta),
      adjustForm.reason,
      adjustForm.sendToQuarantine
    );

    setIsAdjustModalOpen(false);
    setSelectedBatchForAdjust(null);
  };

  // Open adjust modal for a batch
  const openAdjustForBatch = (batch: Batch) => {
    setSelectedBatchForAdjust(batch);
    setAdjustForm({
      quantityDelta: -Math.min(batch.stock, 5),
      reason: 'Deterioro de empaque / Merma de mostrador',
      sendToQuarantine: false
    });
    setIsAdjustModalOpen(true);
  };

  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const targetBatches = filterTab === 'all'
        ? batches
        : batches.filter(b => {
            const product = products.find(p => p.id === b.productId);
            if (!product) return false;
            if (filterTab === 'low_stock') return getProductTotalStock(product.id) <= product.minStock;
            if (filterTab === 'critical') {
              const days = getDaysUntilExpiration(b.expirationDate);
              return b.status === 'active' && days <= 30 && days > 0;
            }
            if (filterTab === 'quarantine') {
              return b.status === 'quarantine' || b.status === 'expired';
            }
            return true;
          });

      exportInventoryToExcel({
        products: filteredProducts.length > 0 ? filteredProducts : products,
        batches: targetBatches,
        systemDate,
        responsibleName: currentUser.name,
        responsibleRole: currentUser.roleTitle
      });

      logActivity({
        category: 'INVENTARIO',
        action: 'Exportación Excel (.xlsx)',
        description: `Exportación de inventario con detalle de lotes y fechas de caducidad a Excel (.xlsx) por ${currentUser.name}.`,
        severity: 'info'
      });

      setFeedbackToast('Archivo Excel (.xlsx) de inventario generado y descargado exitosamente.');
      setTimeout(() => setFeedbackToast(null), 4500);
    } catch (err) {
      console.error('Error al exportar inventario a Excel:', err);
      setFeedbackToast('Ocurrió un error al generar el archivo Excel (.xlsx).');
      setTimeout(() => setFeedbackToast(null), 4000);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      const targetBatches = filterTab === 'all'
        ? batches
        : batches.filter(b => {
            const product = products.find(p => p.id === b.productId);
            if (!product) return false;
            if (filterTab === 'low_stock') return getProductTotalStock(product.id) <= product.minStock;
            if (filterTab === 'critical') {
              const days = getDaysUntilExpiration(b.expirationDate);
              return b.status === 'active' && days <= 30 && days > 0;
            }
            if (filterTab === 'quarantine') {
              return b.status === 'quarantine' || b.status === 'expired';
            }
            return true;
          });

      const filterLabel = filterTab === 'all'
        ? 'Inventario General Completo'
        : filterTab === 'critical'
        ? 'Lotes Críticos (< 30 Días)'
        : filterTab === 'low_stock'
        ? 'Productos Bajo Stock Mínimo'
        : 'Lotes en Cuarentena DIGEMID';

      exportInventoryPDF({
        products: filteredProducts.length > 0 ? filteredProducts : products,
        batches: targetBatches,
        systemDate,
        responsibleName: currentUser.name,
        responsibleRole: currentUser.roleTitle,
        filterLabel
      });

      logActivity({
        category: 'INVENTARIO',
        action: 'Exportación PDF',
        description: `Exportación oficial de reporte de inventario en PDF por ${currentUser.name}.`,
        severity: 'info'
      });

      setFeedbackToast('Reporte de inventario en PDF generado y descargado exitosamente.');
      setTimeout(() => setFeedbackToast(null), 4500);
    } catch (err) {
      console.error('Error al exportar inventario a PDF:', err);
      setFeedbackToast('Ocurrió un error al generar el archivo PDF.');
      setTimeout(() => setFeedbackToast(null), 4000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              Gestión Integral de Inventario & Lotes FEFO
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-semibold border border-teal-300 dark:border-teal-800">
                DIGEMID Compliant
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control granular de caducidades, trazabilidad de droguería y cálculo en tiempo real de colas FEFO.
            </p>
          </div>
        </div>

        {/* Action Buttons: Excel (.xlsx), PDF, and New Batch */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Excel (.xlsx) button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Exportar reporte de inventario actual a Microsoft Excel (.xlsx) con lotes y caducidades"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>{isExportingExcel ? 'Generando Excel...' : 'Exportar Excel (.xlsx)'}</span>
          </button>

          {/* Export to PDF button */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Exportar reporte de inventario a formato PDF oficial"
          >
            <FileDown className="w-4 h-4 text-slate-300" />
            <span>{isExportingPDF ? 'Generando PDF...' : 'Exportar PDF'}</span>
          </button>

          {/* New Batch button */}
          <button
            type="button"
            onClick={() => setIsNewBatchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ingresar Lote</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-900 dark:text-emerald-100 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedbackToast}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por medicamento, principio activo, código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setFilterTab('critical')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filterTab === 'critical'
                ? 'bg-rose-600 text-white'
                : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Lotes Críticos (&lt;30d)
          </button>
          <button
            onClick={() => setFilterTab('low_stock')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filterTab === 'low_stock'
                ? 'bg-amber-600 text-white'
                : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Bajo Stock Mínimo
          </button>
          <button
            onClick={() => setFilterTab('quarantine')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filterTab === 'quarantine'
                ? 'bg-purple-600 text-white'
                : 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Cuarentena DIGEMID
          </button>
        </div>
      </div>

      {/* Product Catalog with Granular Batches */}
      <div className="space-y-4">
        {filteredProducts.map(product => {
          const totalStock = getProductTotalStock(product.id);
          const isExpanded = expandedProduct === product.id;
          const isLowStock = totalStock <= product.minStock;
          const productBatches = batches.filter(b => b.productId === product.id);

          return (
            <div
              key={product.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition"
            >
              {/* Product Header Row */}
              <div
                onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                className="p-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                        {product.code}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {product.name}
                      </h3>
                      {product.isControlled && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          Controlado
                        </span>
                      )}
                      {product.requiresPrescription && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Receta Médica
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      {product.genericName} • {product.concentration} • {product.laboratory} • Ubicación: {product.location}
                    </p>
                  </div>
                </div>

                {/* Stock & Price Badges */}
                <div className="flex items-center gap-6 self-end md:self-auto text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Precio Venta</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      S/ {product.unitPrice.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Stock Mínimo</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {product.minStock} uds
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Stock Total Vigente</span>
                    <span className={`inline-flex items-center gap-1 font-bold text-sm px-2.5 py-0.5 rounded-full ${
                      totalStock === 0
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {totalStock} uds
                    </span>
                  </div>
                </div>
              </div>

              {/* Batches Table (when expanded) */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-500" />
                      Lotes Registrados para {product.name} (Ordenados por FEFO)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      El algoritmo FEFO siempre despacha automáticamente los lotes de la parte superior.
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Código Lote</th>
                          <th className="py-2.5 px-3">Caducidad (Vence)</th>
                          <th className="py-2.5 px-3">Días Restantes</th>
                          <th className="py-2.5 px-3">Semáforo FEFO</th>
                          <th className="py-2.5 px-3">Stock Disponible</th>
                          <th className="py-2.5 px-3">Costo Compra</th>
                          <th className="py-2.5 px-3">Proveedor / Droguería</th>
                          <th className="py-2.5 px-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {productBatches.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-4 text-center text-slate-400">
                              No hay lotes registrados para este medicamento.
                            </td>
                          </tr>
                        ) : (
                          productBatches
                            .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
                            .map((b, idx) => {
                              const days = getDaysUntilExpiration(b.expirationDate);
                              const isExpired = b.status === 'expired' || days <= 0;
                              const isQuarantine = b.status === 'quarantine';
                              const isCritical = days <= 30 && days > 0;
                              const isWarning = days > 30 && days <= 90;

                              return (
                                <tr key={b.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                                  idx === 0 && !isExpired && !isQuarantine ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                                }`}>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    {idx === 0 && !isExpired && !isQuarantine && (
                                      <span title="Próximo lote en cola FEFO">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                      </span>
                                    )}
                                    {b.batchCode}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                    {b.expirationDate}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {isExpired ? (
                                      <span className="text-rose-600 font-bold">Vencido</span>
                                    ) : (
                                      <span className={`font-medium ${isCritical ? 'text-rose-600 font-bold' : isWarning ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {days} días
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {isQuarantine ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                        <ShieldAlert className="w-3 h-3" /> Cuarentena
                                      </span>
                                    ) : isExpired ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                        Caducado
                                      </span>
                                    ) : isCritical ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                        Crítico (&lt;30d)
                                      </span>
                                    ) : isWarning ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        Atención (30-90d)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        Vigente Óptimo
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                                    {b.stock} / {b.initialStock} uds
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                    S/ {b.unitCost.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                    {b.supplierName}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      onClick={() => openAdjustForBatch(b)}
                                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                                    >
                                      Ajustar / Merma
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Ingreso de Nuevo Lote (Recepción) */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                Registrar Ingreso de Lote (Recepción Almacén)
              </h3>
              <button
                onClick={() => {
                  setIsNewBatchModalOpen(false);
                  setBatchError(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {batchError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{batchError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewBatch} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Medicamento Destino:
                </label>
                <select
                  value={newBatchForm.productId}
                  onChange={e => setNewBatchForm({ ...newBatchForm, productId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.genericName}) - Lab: {p.laboratory}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Código de Lote (Físico en caja):
                  </label>
                  <input
                    type="text"
                    placeholder="LOT-2027-09"
                    value={newBatchForm.batchCode}
                    onChange={e => setNewBatchForm({ ...newBatchForm, batchCode: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Fecha de Vencimiento:
                  </label>
                  <input
                    type="date"
                    value={newBatchForm.expirationDate}
                    onChange={e => setNewBatchForm({ ...newBatchForm, expirationDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Cantidad Recibida (Unidades):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBatchForm.stock}
                    onChange={e => setNewBatchForm({ ...newBatchForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Costo Unitario de Compra (S/):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newBatchForm.unitCost}
                    onChange={e => setNewBatchForm({ ...newBatchForm, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Droguería Proveedora:
                </label>
                <select
                  value={newBatchForm.supplierName}
                  onChange={e => setNewBatchForm({ ...newBatchForm, supplierName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} (RUC: {s.ruc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBatchModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirmar Ingreso al Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ajuste de Stock / Cuarentena */}
      {isAdjustModalOpen && selectedBatchForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Ajuste de Stock / Cuarentena DIGEMID
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
              <div>Lote: <strong className="font-mono">{selectedBatchForAdjust.batchCode}</strong></div>
              <div>Vencimiento: <strong>{selectedBatchForAdjust.expirationDate}</strong></div>
              <div>Stock actual disponible: <strong>{selectedBatchForAdjust.stock} unidades</strong></div>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Variación de Stock (negativo para dar de baja):
                </label>
                <input
                  type="number"
                  max="0"
                  min={-selectedBatchForAdjust.stock}
                  value={adjustForm.quantityDelta}
                  onChange={e => setAdjustForm({ ...adjustForm, quantityDelta: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Motivo de Justificación (Auditoría DIGEMID):
                </label>
                <select
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Deterioro de empaque / Merma de almacén">Deterioro de empaque / Merma de almacén</option>
                  <option value="Rotura accidental de frasco / ampolla">Rotura accidental de frasco / ampolla</option>
                  <option value="Alerta Sanitaria DIGEMID / Cuarentena">Alerta Sanitaria DIGEMID / Cuarentena</option>
                  <option value="Devolución por canje a Droguería">Devolución por canje a Droguería</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="quarantineCheck"
                  checked={adjustForm.sendToQuarantine}
                  onChange={e => setAdjustForm({ ...adjustForm, sendToQuarantine: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <label htmlFor="quarantineCheck" className="text-slate-700 dark:text-slate-300 font-medium">
                  Aislar este lote en Cuarentena (No se venderá en POS)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Registrar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
