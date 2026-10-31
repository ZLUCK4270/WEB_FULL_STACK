import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  X,
  Clock,
  User,
  Database,
  RefreshCw,
  FileCode
} from 'lucide-react';
import type { AuditLog } from '../../types/pharmacy';

export const AuditView: React.FC = () => {
  const { auditLogs, auditLoading, loadAuditLogs } = usePharmacy();
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadAuditLogs(selectedModule ? { module: selectedModule } : {});
  }, [loadAuditLogs, selectedModule]);

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.usuario.toLowerCase().includes(term) ||
      log.accion.toLowerCase().includes(term) ||
      log.modulo.toLowerCase().includes(term) ||
      log.tablaAfectada.toLowerCase().includes(term)
    );
  });

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('INICIO')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
    }
    if (act.includes('CREAR') || act.includes('VENTA') || act.includes('COMPRA') || act.includes('APERTURA')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    }
    if (act.includes('ANULACION') || act.includes('ELIMINAR') || act.includes('CIERRE')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Auditoría y Seguridad del Sistema</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pistas de auditoría inmutables para cumplimiento normativo DIGEMID y SUNAT.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadAuditLogs(selectedModule ? { module: selectedModule } : {})}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar Pistas
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o tabla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="">Todos los Módulos</option>
          <option value="auth">Autenticación (auth)</option>
          <option value="sales">Ventas (sales)</option>
          <option value="inventory">Inventario (inventory)</option>
          <option value="cash">Caja Registradora (cash)</option>
          <option value="purchases">Compras (purchases)</option>
        </select>
      </div>

      {/* Tabla de Auditoría */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Tabla Afectada</th>
                <th className="py-3 px-4 text-center">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {auditLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">Cargando registros de auditoría...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">No se encontraron eventos de auditoría.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.fecha).toLocaleString('es-PE')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {log.usuario}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                        {log.modulo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getActionBadge(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      {log.tablaAfectada}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Ver payload del evento"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detalle de Evento de Auditoría */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-500" />
                Detalle del Registro de Auditoría
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Usuario:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedLog.usuario}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Fecha y Hora:</span>
                <strong className="text-slate-800 dark:text-slate-200">{new Date(selectedLog.fecha).toLocaleString('es-PE')}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Módulo:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedLog.modulo}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Acción:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedLog.accion}</strong>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Datos Registrados (Payload JSON):
              </span>
              <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56">
                {(() => {
                  try {
                    const parsed = JSON.parse(selectedLog.datosNuevos || '{}');
                    return JSON.stringify(parsed, null, 2);
                  } catch {
                    return selectedLog.datosNuevos || 'Sin datos adicionales';
                  }
                })()}
              </pre>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
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
