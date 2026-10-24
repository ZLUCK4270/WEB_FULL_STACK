import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BellRing,
  AlertTriangle,
  Clock,
  Users,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tabId: string) => void;
}

const statColor = (label: string) => {
  if (label.includes('VENTAS')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (label.includes('STOCK') || label.includes('ALERTAS')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (label.includes('VENCIMIENTO')) return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { stats, pendingAlerts, loadStats, loadAlerts, user } = usePharmacy();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadAlerts()]);
    setRefreshing(false);
  };

  const formatMoney = (v: number) => `S/ ${(v || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-emerald-600" /> Panel de Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Resumen del día, stock crítico y vencimientos próximos.{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">{user?.name}</span>{' '}
            ({user?.role})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Métricas del día */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Ventas hoy</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.salesToday.count || 0}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                {formatMoney(stats?.salesToday.total || 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Alertas activas</p>
              <h3 className={`text-2xl font-bold mt-1 ${pendingAlerts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {pendingAlerts}
              </h3>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendingAlerts > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <BellRing className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Bajo stock mínimo</p>
              <h3 className={`text-2xl font-bold mt-1 ${(stats?.lowStockCount || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {stats?.lowStockCount || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Por vencer (≤30 días)</p>
              <h3 className={`text-2xl font-bold mt-1 ${(stats?.expiringSoonCount || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {stats?.expiringSoonCount || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* Productos críticos de stock */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Stock bajo o agotado
              </h3>
              {stats.lowStock.length > 0 ? (
                <button
                  onClick={() => onNavigate('inventory')}
                  className="text-xs text-emerald-600 hover:text-emerald-500 font-semibold underline underline-offset-4"
                >
                  Gestionar inventario <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">Producto</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">Código</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">Stock actual</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">Mínimo</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {stats.lowStock.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                        No hay productos bajo stock. ✅
                      </td>
                    </tr>
                  ) : (
                    stats.lowStock.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.nombre}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{p.codigo}</td>
                        <td className="px-4 py-3 font-bold">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.critical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.critical ? '● Agotado' : '● Bajo'}
                          </span>{' '}
                          {p.total_stock} uds.
                        </td>
                        <td className="px-4 py-3 text-slate-500">{p.stock_minimo} uds.</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.critical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.critical ? 'CRÍTICO' : 'BAJO'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Próximos a vencer */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-600" /> Próximos a vencer (≤ 30 días)
                </h3>
              </div>
              <div className="p-4">
                {stats.expiringSoon.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-4">Sin lotes próximos a vencer.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.expiringSoon.map((l) => (
                      <div key={l.loteId} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{l.producto}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">
                              Lote {l.codigoLote} • Stock {l.stock} uds.
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            l.diasRestantes <= 7 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {l.diasRestantes} día(s)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Más vendidos */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Más vendidos (últimos 30 días)</h3>
              </div>
              <div className="p-4">
                {stats.topProducts.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-4">Sin ventas registradas aún.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topProducts.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 w-4 text-center">#{i + 1}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.nombre}</div>
                            <div className="text-[10px] text-slate-500 truncate">{p.codigo}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{p.cantidadVendida} uds.</div>
                          <div className="text-[10px] text-slate-500">{formatMoney(p.ingresoTotal)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
