import React, { useCallback } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  BellRing,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const ActiveAlertsView: React.FC = () => {
  const {
    alerts,
    pendingAlerts,
    loadAlerts,
    generateAlerts,
    resolveAlert,
    user
  } = usePharmacy();

  const handleRegenerate = useCallback(async () => {
    const result = await generateAlerts();
    if (!result.success) {
      alert(result.error || 'No se pudieron generar las alertas');
    }
  }, [generateAlerts]);

  const handleResolve = useCallback(async (id: string) => {
    const result = await resolveAlert(id);
    if (!result.success) {
      alert(result.error || 'No se pudo resolver la alerta');
    }
  }, [resolveAlert]);

  const typeLabel = (t: string) => {
    if (t === 'STOCK_BAJO') return 'Stock bajo / agotado';
    if (t === 'VENCIMIENTO_CERCA') return 'Vencimiento próximo';
    if (t === 'VENCIDO') return 'Lote vencido';
    return t;
  };

  const typeIcon = (t: string) => {
    if (t === 'STOCK_BAJO') return <AlertTriangle className="w-5 h-5" />;
    if (t === 'VENCIMIENTO_CERCA' || t === 'VENCIDO') return <Clock className="w-5 h-5" />;
    return <ShieldAlert className="w-5 h-5" />;
  };

  const typeColor = (t: string) => {
    if (t === 'STOCK_BAJO') return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200';
    if (t === 'VENCIMIENTO_CERCA') return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200';
    if (t === 'VENCIDO') return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-600" /> Centro de Alertas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stock por debajo del mínimo y lotes próximos a vencer. Generadas automáticamente tras cada venta o ajuste de inventario.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Revisar ahora
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-bold mb-2">
        <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
          Alertas activas: <span className="font-bold">{pendingAlerts}</span>
        </span>
        {pendingAlerts > 0 && (
          <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 font-bold">
            Atención inmediata
          </span>
        )}
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 dark:text-emerald-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sin alertas pendientes ✅</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">El inventario está dentro de los parámetros configurados.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${typeColor(alert.tipo)}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColor(alert.tipo).replace('border-', '')}`}>
                  {typeIcon(alert.tipo)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{typeLabel(alert.tipo)}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {alert.estado === 'PENDIENTE' ? 'Pendiente' : 'Resuelta'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{alert.mensaje}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    {alert.producto && <span>📦 {alert.producto}</span>}
                    {alert.codigoLote && <span>🏷️ {alert.codigoLote}</span>}
                    <span>🕒 {new Date(alert.fechaCreacion).toLocaleString('es-PE')}</span>
                  </div>
                </div>
              </div>
              {alert.estado === 'PENDIENTE' && (
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
                >
                  Marcar como resuelta
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          ¿Quién puede resolver? Cualquier usuario autenticado. ¿Quién puede generar/revisar? {user?.role === 'admin' || user?.role === 'almacen' ? 'Administrador y Almacén.' : 'Solicite al administrador.'}
        </p>
      </div>
    </div>
  );
};
