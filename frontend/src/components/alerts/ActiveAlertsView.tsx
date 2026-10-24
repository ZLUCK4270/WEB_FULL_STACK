import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useWebPush } from '../../context/WebPushContext';
import {
  BellRing,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Send,
  Pill,
  ExternalLink
} from 'lucide-react';

export const ActiveAlertsView: React.FC = () => {
  const { alerts, resolveAlertAction } = usePharmacy();
  const { permission, requestPermission, sendPushAlert } = useWebPush();

  const handleTestNotification = () => {
    sendPushAlert({
      title: '🚨 Alerta FEFO Crítica: Lote LOT-IBU-2026-10',
      body: '22 unidades de Ibuprofeno 400mg vencen en menos de 20 días. Se recomienda liquidar o devolver a droguería.',
      category: 'CRITICO',
      batchCode: 'LOT-IBU-2026-10'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Centro de Alertas & Monitoreo Operacional
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold border border-rose-300">
                {alerts.length} Alertas Activas
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vigilancia sanitaria continua de vencimientos FEFO, umbrales de seguridad y fiscalización DIGEMID.
            </p>
          </div>
        </div>

        {/* Web Push Trigger */}
        <div className="flex items-center gap-2">
          {permission !== 'granted' ? (
            <button
              onClick={requestPermission}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <BellRing className="w-4 h-4" />
              Activar Notificaciones Web
            </button>
          ) : (
            <button
              onClick={handleTestNotification}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              Probar Push en Navegador
            </button>
          )}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {alerts.map(alert => {
          const isFefo = alert.type === 'fefo_warning';
          const isStock = alert.type === 'stock_low';
          const isControlled = alert.type === 'controlled_rx';

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                alert.severity === 'alta'
                  ? 'border-rose-300 dark:border-rose-900/60'
                  : 'border-amber-300 dark:border-amber-900/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isFefo
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : isStock
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                }`}>
                  {isFefo ? <Clock className="w-5 h-5" /> : isStock ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {alert.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                      alert.severity === 'alta'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      Prioridad {alert.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                    {alert.message}
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    Detectado: {new Date(alert.date).toLocaleTimeString('es-PE')} • Sensor de Monitoreo Activo
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {alert.actionLabel && (
                <div className="self-end md:self-auto shrink-0">
                  <button
                    onClick={() => resolveAlertAction(alert.id, alert.actionType || '')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 ${
                      isFefo
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : isStock
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {alert.actionLabel}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
