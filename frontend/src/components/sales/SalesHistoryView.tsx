import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  History,
  Search,
  Calendar,
  Receipt,
  User,
  Clock,
  Eye,
  X,
  CreditCard,
  DollarSign,
  Smartphone,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Download
} from 'lucide-react';
import type { Sale } from '../../types/pharmacy';

export const SalesHistoryView: React.FC = () => {
  const { sales, salesLoading, loadSales, getSale } = usePharmacy();

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadSales({
      search: search.trim() || undefined,
      from: fromDate || undefined,
      to: toDate || undefined
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    loadSales({});
  };

  const handleViewSale = async (id: string) => {
    setDetailLoading(true);
    try {
      const fullSale = await getSale(id);
      setSelectedSale(fullSale);
    } catch {
      // fallback to sale in list
      const inList = sales.find((s) => s.id === id) || null;
      setSelectedSale(inList);
    } finally {
      setDetailLoading(false);
    }
  };

  const getPaymentBadge = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m === 'yape') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          <Smartphone className="w-3 h-3" /> Yape
        </span>
      );
    }
    if (m === 'tarjeta') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          <CreditCard className="w-3 h-3" /> Tarjeta
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
        <DollarSign className="w-3 h-3" /> Efectivo
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Historial de Ventas</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Trazabilidad completa por ticket, cajero, cliente y lotes FEFO dispensados.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código (ej. V-)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              title="Fecha inicial"
            />
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              title="Fecha final"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition cursor-pointer"
              title="Limpiar filtros"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de ventas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {salesLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando historial de ventas...
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            No se encontraron registros de ventas para los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Cajero</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {sale.codigoVenta}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(sale.fecha).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {sale.cliente || 'Público General'}
                      </div>
                      {sale.clienteDoc && (
                        <div className="text-xs text-slate-400">Doc: {sale.clienteDoc}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {sale.cajero || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {getPaymentBadge(sale.metodoPago)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      S/ {sale.total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleViewSale(sale.id)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 transition cursor-pointer"
                        title="Ver detalle de venta"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalle de Venta */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Detalle de Venta {selectedSale.codigoVenta}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(selectedSale.fecha).toLocaleString('es-PE')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {/* Información General */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-0.5">Cliente:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedSale.cliente || 'Público General'}
                  </span>
                  {selectedSale.clienteDoc && (
                    <span className="block text-slate-400">Doc: {selectedSale.clienteDoc}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Cajero responsable:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedSale.cajero || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Método de Pago:</span>
                  {getPaymentBadge(selectedSale.metodoPago)}
                </div>
              </div>

              {/* Items y lotes despachados */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" /> Ítems y Lotes FEFO Asignados
                </h4>

                {detailLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Cargando desglose de lotes...</div>
                ) : (
                  <div className="space-y-2.5">
                    {(selectedSale.items || []).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.productName}
                            </span>
                            {item.codigo && (
                              <span className="text-xs text-slate-400 ml-2 font-mono">[{item.codigo}]</span>
                            )}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            S/ {item.subtotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span>
                            Cantidad: {item.quantity} × S/ {item.unitPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* Desglose de lotes */}
                        {item.batches && item.batches.length > 0 && (
                          <div className="pl-3 border-l-2 border-emerald-500/40 space-y-1 mt-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <Layers className="w-3 h-3" /> Despacho por lote (FEFO):
                            </span>
                            {item.batches.map((b, bIdx) => (
                              <div
                                key={bIdx}
                                className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded"
                              >
                                <span className="font-mono">
                                  Lote: <strong className="text-emerald-700 dark:text-emerald-400">{b.codigoLote}</strong> (Vence: {b.fechaVencimiento})
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {b.cantidad} un.
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col items-end gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between w-48">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    S/ {(selectedSale.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-48">
                  <span>I.G.V. (18%):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    S/ {(selectedSale.igv || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-48 text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    S/ {selectedSale.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-semibold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
