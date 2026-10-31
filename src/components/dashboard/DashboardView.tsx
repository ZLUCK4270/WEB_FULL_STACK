import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Clock,
  ShoppingCart,
  Bell,
  ArrowRight,
  Truck,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Sparkles,
  Wallet,
  Award,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { CountUp } from '../common/CountUp';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    products,
    batches,
    sales,
    alerts,
    stats,
    currentShift,
    replenishmentSuggestions,
  } = usePharmacy();

  const activeSales = sales.filter((s) => s.estado === 'COMPLETADA');
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaySales = activeSales.filter((s) => String(s.fecha).slice(0, 10) === todayIso);
  const todayRevenue =
    stats?.salesToday?.total ??
    todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const todayCount = stats?.salesToday?.count ?? todaySales.length;
  const totalRevenue = activeSales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const lowStockProducts = products.filter(
    (p) => p.estaActivo && p.stockTotal <= p.stockMinimo
  );

  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 86400000);

  const expiringBatches = batches
    .filter((b) => {
      if (b.stock <= 0) return false;
      const exp = new Date(b.fechaVencimiento);
      return exp <= in90Days;
    })
    .sort(
      (a, b) =>
        new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    );

  const pendingAlerts = alerts.filter((a) => a.estado === 'PENDIENTE');

  return (
    <div className="space-y-6">
      {/* Banner principal de bienvenida y estado operativo */}
      <div
        data-reveal="up"
        style={{ '--m-g1': '#0f766e', '--m-g2': '#059669' } as React.CSSProperties}
        className="m-gradient-flow bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Control Centralizado en Tiempo Real · FEFO & BPA Activo
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Panel Operativo — Botica Nova Salud
          </h2>
          <p className="text-sm text-teal-100 mt-1 max-w-2xl">
            Monitoreo centralizado de inventario farmacéutico, control de lotes por vencimiento,
            alertas automáticas de reposición y atención rápida en mostrador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('pos')}
            data-ripple
            className="px-4 py-2.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            Ir al Punto de Venta (POS)
          </button>
          <button
            onClick={() => onNavigate('alerts')}
            data-ripple
            className="px-4 py-2.5 rounded-xl bg-teal-900/50 hover:bg-teal-900/70 text-white border border-white/20 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            Alertas Activas ({pendingAlerts.length})
          </button>
        </div>
      </div>

      {/* Tarjetas de KPIs principales */}
      <div data-stagger="80" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('sales')}
          data-reveal="up"
          data-tilt="5"
          data-spotlight
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ventas del Día ({todayCount})
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={todayRevenue} decimals={2} prefix="S/ " />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Acumulado: S/ {totalRevenue.toFixed(2)}</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
              Ver historial <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('alerts')}
          data-reveal="up"
          data-tilt="5"
          data-spotlight
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Stock Crítico / Agotado
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={lowStockProducts.length} /> productos
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{replenishmentSuggestions.length || lowStockProducts.length} sugerencias de compra</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              Reponer <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('inventory')}
          data-reveal="up"
          data-tilt="5"
          data-spotlight
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lotes por Vencer / Vencidos
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            <CountUp value={expiringBatches.length} /> lotes
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Control FEFO automatizado</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              Inspeccionar <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('cash')}
          data-reveal="up"
          data-tilt="5"
          data-spotlight
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Estado de Caja y Catálogo
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {currentShift ? (
              <CountUp value={currentShift.efectivoEsperado} decimals={2} prefix="S/ " />
            ) : (
              'CAJA CERRADA'
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{products.length} medicamentos activos</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
              Arqueo <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Tablas operativas: Productos con bajo stock y Lotes FEFO próximos a vencer */}
      <div data-stagger="120" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos que requieren reposición inmediata */}
        <div data-reveal="up" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Productos con Stock Bajo o Agotado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Alerta preventiva para evitar desabastecimiento en mostrador
              </p>
            </div>
            <button
              onClick={() => onNavigate('purchases')}
              className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100 transition-all cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              Reponer Stock
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                Todos los productos superan el stock mínimo de seguridad.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                    <th className="py-3 px-4">Medicamento</th>
                    <th className="py-3 px-4 text-center">Disponible</th>
                    <th className="py-3 px-4 text-center">Mínimo</th>
                    <th className="py-3 px-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {lowStockProducts.map((product) => {
                    const available = product.stockTotal;
                    const isOut = available <= 0;
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {product.nombre}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            DCI: {product.generico} · {product.laboratorio}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-sm">
                          <span
                            className={
                              isOut
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }
                          >
                            {available}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 font-semibold">
                          {product.stockMinimo}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isOut
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}
                          >
                            {isOut ? 'AGOTADO' : 'STOCK BAJO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Lotes FEFO con vencimiento cercano o vencidos */}
        <div data-reveal="up" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Radar FEFO de Lotes y Vencimientos (≤ 90 días)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prioridad de salida automática y bloqueo sanitario de vencidos
              </p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              Ver Lotes
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {expiringBatches.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                Ningún lote activo vence en los próximos 90 días.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                    <th className="py-3 px-4">Lote / Producto</th>
                    <th className="py-3 px-4 text-center">Vencimiento</th>
                    <th className="py-3 px-4 text-center">Stock</th>
                    <th className="py-3 px-4 text-right">Condición FEFO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {expiringBatches.map((batch) => {
                    const product = products.find((p) => p.id === batch.productId);
                    const daysLeft = Math.ceil(
                      (new Date(batch.fechaVencimiento).getTime() - now.getTime()) / 86400000
                    );
                    const isExpired = daysLeft < 0 || batch.estado === 'VENCIDO';
                    return (
                      <tr
                        key={batch.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {product?.nombre || 'Medicamento'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Lote: {batch.codigoLote}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {String(batch.fechaVencimiento).slice(0, 10)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                          {batch.stock} und.
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isExpired
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}
                          >
                            {isExpired
                              ? 'VENCIDO (BLOQUEADO)'
                              : `VENCE EN ${daysLeft} DÍAS`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Productos más vendidos */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-teal-600" />
              Medicamentos de Mayor Rotación (Top Ventas)
            </h3>
            <span className="text-xs text-slate-400">Últimos 30 días</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.topProducts.slice(0, 4).map((tp, idx) => (
              <div
                key={tp.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-teal-600 dark:text-teal-400">
                    #{idx + 1} Más Vendido
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-1">
                    {tp.nombre}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {tp.cantidadVendida} uds. · S/ {Number(tp.ingresoTotal).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
