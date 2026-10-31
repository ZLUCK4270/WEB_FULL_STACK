import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  History,
  Search,
  Calendar,
  Receipt,
  Clock,
  Eye,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Package,
  Layers,
  Printer,
  Ban,
  AlertTriangle,
  CheckCircle2,
  Download
} from 'lucide-react';
import type { Sale } from '../../types/pharmacy';

export const SalesHistoryView: React.FC = () => {
  const { sales, salesLoading, loadSales, getSale, voidSale, user } = usePharmacy();

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Anulación de venta
  const [voidingSale, setVoidingSale] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoidingSubmitting, setIsVoidingSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Ticket para reimpresión
  const [printSale, setPrintSale] = useState<Sale | null>(null);

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
      const inList = sales.find((s) => s.id === id) || null;
      setSelectedSale(inList);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidingSale) return;
    if (!voidReason || voidReason.trim().length < 5) {
      setActionError('Debe ingresar un motivo de anulación detallado (mínimo 5 caracteres).');
      return;
    }

    setActionError(null);
    setIsVoidingSubmitting(true);
    try {
      const res = await voidSale(voidingSale.id, voidReason.trim());
      if (res.success) {
        setActionSuccess(`Venta ${voidingSale.codigoVenta} anulada correctamente. Stock devuelto al inventario.`);
        setVoidingSale(null);
        setVoidReason('');
        if (selectedSale?.id === voidingSale.id) {
          setSelectedSale(null);
        }
      } else {
        setActionError(res.error || 'Error al anular la venta.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error al anular la venta.');
    } finally {
      setIsVoidingSubmitting(false);
    }
  };

  const exportToCSV = () => {
    if (sales.length === 0) return;
    const headers = ['Codigo Venta', 'Fecha', 'Cliente', 'Doc Cliente', 'Cajero', 'Metodo Pago', 'Estado', 'Subtotal', 'IGV', 'Total'];
    const rows = sales.map(s => [
      s.codigoVenta,
      s.fecha,
      `"${s.cliente || 'Publico General'}"`,
      s.clienteDoc || '',
      `"${s.cajero || ''}"`,
      s.metodoPago,
      s.estado,
      s.subtotal.toFixed(2),
      s.igv.toFixed(2),
      s.total.toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ventas_NovaSalud_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentBadge = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m === 'yape') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          <QrCode className="w-3 h-3 text-purple-600" /> Yape
        </span>
      );
    }
    if (m === 'tarjeta') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          <CreditCard className="w-3 h-3 text-blue-600" /> Tarjeta
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
        <Banknote className="w-3 h-3 text-emerald-600" /> Efectivo
      </span>
    );
  };

  const canVoid = user?.role === 'admin' || user?.isRootAdmin;

  return (
    <div className="space-y-5">
      {/* Notificaciones */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold">×</button>
        </div>
      )}
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 font-bold">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Historial y Trazabilidad de Ventas</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registro legal de boletas, facturas, comprobantes FEFO y anulación de ventas con reintegro de stock.
            </p>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          disabled={sales.length === 0}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código (ej. BOL-B001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              title="Fecha inicial"
            />
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              title="Fecha final"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition"
              title="Limpiar filtros"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de ventas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {salesLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando historial de ventas...
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            No se encontraron registros de ventas para los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Cajero</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {sales.map((sale) => {
                  const isAnulada = sale.estado === 'ANULADA';
                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                        isAnulada ? 'bg-rose-50/30 dark:bg-rose-950/20 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {sale.codigoVenta}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isAnulada
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {sale.estado || 'COMPLETADA'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
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
                          <div className="text-[10px] text-slate-400">Doc: {sale.clienteDoc}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {sale.cajero || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {getPaymentBadge(sale.metodoPago)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold ${isAnulada ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        S/ {sale.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewSale(sale.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition"
                            title="Ver detalle de venta"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPrintSale(sale)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition"
                            title="Reimprimir ticket"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isAnulada && canVoid && (
                            <button
                              onClick={() => {
                                setVoidingSale(sale);
                                setVoidReason('');
                                setActionError(null);
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 transition"
                              title="Anular venta y reingresar stock"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Confirmar Anulación de Venta */}
      {voidingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Ban className="w-5 h-5" />
                Anular Comprobante de Venta
              </h3>
              <button onClick={() => setVoidingSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-1">
              <p className="font-bold">¿Está seguro de anular la venta {voidingSale.codigoVenta}?</p>
              <p>Monto: <strong>S/ {voidingSale.total.toFixed(2)}</strong>. Esta acción reingresará de forma automática el stock a los lotes originales correspondientes y registrará el movimiento en auditoría y kárdex.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Motivo de anulación (obligatorio, mín. 5 caracteres):
              </label>
              <textarea
                rows={3}
                required
                placeholder="Ej. Devolución de producto por error en receta médica o cliente desistió."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidingSale(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                disabled={isVoidingSubmitting || voidReason.trim().length < 5}
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50"
              >
                {isVoidingSubmitting ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle de Venta */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Detalle de Venta {selectedSale.codigoVenta}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedSale.estado === 'ANULADA'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {selectedSale.estado || 'COMPLETADA'}
                    </span>
                  </div>
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
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {selectedSale.estado === 'ANULADA' && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 space-y-0.5">
                  <div className="font-bold">Comprobante Anulado</div>
                  <div>Motivo: {selectedSale.motivoAnulacion || 'Sin motivo especificado'}</div>
                  {selectedSale.fechaAnulacion && (
                    <div className="text-[10px] opacity-80">Fecha de anulación: {new Date(selectedSale.fechaAnulacion).toLocaleString('es-PE')}</div>
                  )}
                </div>
              )}

              {/* Información General */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" /> Ítems y Lotes FEFO Asignados
                </h4>

                {detailLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Cargando desglose de lotes...</div>
                ) : (
                  <div className="space-y-2">
                    {(selectedSale.items || []).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.productName}
                            </span>
                            {item.codigo && (
                              <span className="text-[10px] text-slate-400 ml-2 font-mono">[{item.codigo}]</span>
                            )}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            S/ {item.subtotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 mb-1.5">
                          Cantidad: {item.quantity} × S/ {item.unitPrice.toFixed(2)}
                        </div>

                        {item.batches && item.batches.length > 0 && (
                          <div className="pl-2.5 border-l-2 border-emerald-500/40 space-y-1 mt-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <Layers className="w-3 h-3" /> Despacho por lote (FEFO):
                            </span>
                            {item.batches.map((b, bIdx) => (
                              <div
                                key={bIdx}
                                className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded"
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
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-col items-end gap-1 text-xs text-slate-600 dark:text-slate-400">
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
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setPrintSale(selectedSale)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Ticket
              </button>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reimpresión de Ticket */}
      {printSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 font-mono text-xs space-y-4">
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <div className="font-bold text-sm tracking-wider uppercase">Botica Nova Salud S.A.C.</div>
              <div className="text-[10px] text-slate-600">RUC: 20601234567 • San Isidro, Lima</div>
              <div className="pt-1.5 font-bold text-xs uppercase text-emerald-700">COPIA DE COMPROBANTE</div>
              <div className="font-bold text-xs">{printSale.codigoVenta}</div>
            </div>

            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div>Fecha: {new Date(printSale.fecha).toLocaleString('es-PE')}</div>
              <div>Cajero: {printSale.cajero}</div>
              <div>Cliente: {printSale.cliente || 'Público General'}</div>
              <div>Doc: {printSale.clienteDoc || '-'}</div>
              <div>Estado: {printSale.estado || 'COMPLETADA'}</div>
              <div>Pago: {String(printSale.metodoPago || 'efectivo').toUpperCase()}</div>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3 max-h-48 overflow-y-auto">
              {(printSale.items || []).map((it: any, idx: number) => (
                <div key={idx} className="space-y-0.5 text-[10px]">
                  <div className="grid grid-cols-12 font-medium">
                    <span className="col-span-6 line-clamp-1">{it.productName || it.producto}</span>
                    <span className="col-span-2 text-center">{it.quantity || it.cantidad}</span>
                    <span className="col-span-4 text-right">S/ {(it.subtotal || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[11px]">
              <div>Op. Gravada: S/ {(printSale.subtotal || 0).toFixed(2)}</div>
              <div>IGV (18%): S/ {(printSale.igv || 0).toFixed(2)}</div>
              <div className="font-bold text-sm text-slate-900 pt-1">TOTAL: S/ {(printSale.total || 0).toFixed(2)}</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrintSale(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
