import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Truck,
  Package,
  ShieldAlert,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';

interface ActiveAlertsViewProps {
  onNavigate?: (tab: string) => void;
}

export const ActiveAlertsView: React.FC<ActiveAlertsViewProps> = ({ onNavigate }) => {
  const { alerts, resolveAlert, generateAlerts } = usePharmacy();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDIENTE' | 'RESUELTA'>('PENDIENTE');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await generateAlerts();
    } finally {
      setEvaluating(false);
    }
  };

  const handleResolve = async (id: string) => {
    setBusyId(id);
    try {
      await resolveAlert(id);
    } finally {
      setBusyId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const isResolved = a.estado === 'RESUELTA' || a.estado === 'RESUELTO';
    if (filterStatus === 'PENDIENTE' && isResolved) return false;
    if (filterStatus === 'RESUELTA' && !isResolved) return false;
    if (filterType !== 'ALL' && a.tipo !== filterType) return false;
    return true;
  });

  const getBadgeStyle = (tipo: string) => {
    if (tipo === 'SIN_STOCK' || tipo.includes('VENCIDO')) {
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (tipo === 'STOCK_BAJO' || tipo.includes('VENCIMIENTO')) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  return (
    <div className="p-5 sm:p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Centro de Alertas de Reposición y Control Sanitario FEFO
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoreo automático de productos con bajo stock, agotados y lotes próximos a vencer o vencidos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            Evaluar Stock Ahora
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('purchases')}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              Generar Orden de Reposición
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['PENDIENTE', 'ALL', 'RESUELTA'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {status === 'PENDIENTE'
                ? 'Pendientes'
                : status === 'RESUELTA'
                ? 'Atendidas'
                : 'Todas'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">Todos los tipos de alerta</option>
            <option value="STOCK_BAJO">Stock Bajo</option>
            <option value="SIN_STOCK">Sin Stock (Agotado)</option>
            <option value="VENCIMIENTO_PROXIMO">Vencimiento Próximo (FEFO)</option>
            <option value="LOTE_VENCIDO">Lote Vencido (Bloqueado)</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              No hay alertas en esta vista
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              El inventario y los lotes FEFO se encuentran al día según el filtro seleccionado.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved =
              alert.estado === 'RESUELTA' || alert.estado === 'RESUELTO';
            const isCritical =
              alert.tipo === 'SIN_STOCK' || alert.tipo.includes('VENCIDO');

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isResolved
                    ? 'border-slate-200/60 dark:border-slate-800/60 opacity-75'
                    : isCritical
                    ? 'border-rose-300 dark:border-rose-900/70 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-amber-300 dark:border-amber-900/70 bg-amber-50/20 dark:bg-amber-950/10'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400'
                    }`}
                  >
                    {alert.tipo.includes('VENC') ? (
                      <Clock className="w-5 h-5" />
                    ) : isCritical ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getBadgeStyle(
                          alert.tipo
                        )}`}
                      >
                        {alert.tipo.replace(/_/g, ' ')}
                      </span>
                      {alert.producto && (
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {alert.producto}
                        </span>
                      )}
                      {alert.codigoLote && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Lote: {alert.codigoLote}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {alert.mensaje}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                      <span>
                        Generada: {new Date(alert.fechaCreacion).toLocaleString('es-PE')}
                      </span>
                      {isResolved && alert.resueltoPor && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ✓ Atendida por {alert.resueltoPor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onNavigate &&
                    (alert.tipo === 'STOCK_BAJO' || alert.tipo === 'SIN_STOCK') && (
                      <button
                        onClick={() => onNavigate('purchases')}
                        className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        Pedir a Proveedor
                      </button>
                    )}

                  {!isResolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={busyId === alert.id}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {busyId === alert.id ? 'Marcando...' : 'Marcar Atendida'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
