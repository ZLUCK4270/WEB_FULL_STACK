import React, { useState } from 'react';
import { useWebPush } from '../context/WebPushContext';
import { PHASE5_CODE_FILES, CronAlertFile } from '../data/phase5AlertsData';
import { BellRing, Clock, Wifi, Package, CheckCircle2, AlertTriangle, AlertCircle, Play, RefreshCw, Copy, Check, FileCode2, ExternalLink, Truck, Bell } from 'lucide-react';

interface MockAlert {
  id: string;
  productName: string;
  genericName: string;
  batchCode?: string;
  alertType: 'MEDICAMENTO_VENCIDO' | 'VENCIMIENTO_30_DIAS' | 'STOCK_AGOTADO' | 'STOCK_BAJO';
  severity: 'CRITICO' | 'ALTO' | 'MEDIO';
  status: 'PENDIENTE' | 'EN_GESTION' | 'ATENDIDA';
  message: string;
  timeAgo: string;
}

export const Phase5AlertsView: React.FC = () => {
  const { sendPushAlert, permission, requestPermission } = useWebPush();
  const [activeSubTab, setActiveSubTab] = useState<'realtime_dashboard' | 'suggested_orders' | 'code_viewer'>('realtime_dashboard');
  const [selectedFileId, setSelectedFileId] = useState<string>(PHASE5_CODE_FILES[0].id);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCronRunning, setIsCronRunning] = useState<boolean>(false);
  const [realtimeBroadcastEvent, setRealtimeBroadcastEvent] = useState<any>(null);

  const initialAlerts: MockAlert[] = [
    {
      id: 'alt-01',
      productName: 'Ibuprofeno 400mg Tabletas',
      genericName: 'Ibuprofeno',
      batchCode: 'LOT-2025-09B',
      alertType: 'MEDICAMENTO_VENCIDO',
      severity: 'CRITICO',
      status: 'PENDIENTE',
      message: 'CRÍTICO: El lote LOT-2025-09B ha vencido. Bloqueado automáticamente para venta en mostrador.',
      timeAgo: 'Hace 3 min (Cron 06:00 AM)'
    },
    {
      id: 'alt-02',
      productName: 'Amoxicilina + Ácido Clavulánico 500/125mg',
      genericName: 'Amoxicilina / Ác. Clavulánico',
      batchCode: 'LOT-2026-11A',
      alertType: 'VENCIMIENTO_30_DIAS',
      severity: 'ALTO',
      status: 'PENDIENTE',
      message: 'URGENTE: El lote LOT-2026-11A vence en menos de 30 días (2026-11-05). Priorizar en venta FEFO.',
      timeAgo: 'Hace 3 min'
    },
    {
      id: 'alt-03',
      productName: 'Paracetamol 500mg Genérico',
      genericName: 'Paracetamol',
      alertType: 'STOCK_AGOTADO',
      severity: 'CRITICO',
      status: 'PENDIENTE',
      message: 'QUIEBRE TOTAL: Stock en 0 unidades en todos los lotes vigentes. Demanda alta no cubierta.',
      timeAgo: 'Hace 12 min'
    },
    {
      id: 'alt-04',
      productName: 'Loratadina 10mg Comprimidos',
      genericName: 'Loratadina',
      alertType: 'STOCK_BAJO',
      severity: 'MEDIO',
      status: 'EN_GESTION',
      message: 'REPOSICIÓN: Quedan 8 unidades disponibles (Umbral de stock mínimo configurado: 25 unidades).',
      timeAgo: 'Hace 28 min'
    }
  ];

  const [alerts, setAlerts] = useState<MockAlert[]>(initialAlerts);

  const selectedFile = PHASE5_CODE_FILES.find(f => f.id === selectedFileId) || PHASE5_CODE_FILES[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerManualCron = () => {
    setIsCronRunning(true);
    setRealtimeBroadcastEvent(null);

    setTimeout(() => {
      const newAlert: MockAlert = {
        id: `alt-${Date.now().toString().slice(-4)}`,
        productName: 'Omeprazol 20mg Cápsulas',
        genericName: 'Omeprazol',
        batchCode: 'LOT-2026-10-C',
        alertType: 'VENCIMIENTO_30_DIAS',
        severity: 'ALTO',
        status: 'PENDIENTE',
        message: 'URGENTE: El lote LOT-2026-10-C vence en 24 días. Detectado en auditoría manual instantánea.',
        timeAgo: 'Justo ahora (Auditoría Manual)'
      };

      setAlerts(prev => [newAlert, ...prev]);
      setRealtimeBroadcastEvent({
        channel: 'tenant:nova-salud:alerts',
        event: 'NEW_STOCK_ALERT',
        timestamp: new Date().toLocaleTimeString(),
        payload: {
          product: 'Omeprazol 20mg Cápsulas',
          type: 'VENCIMIENTO_30_DIAS',
          severity: 'ALTO'
        }
      });

      // Disparar Notificación Push Web al Administrador
      sendPushAlert({
        title: '¡Auditoría Cron: Omeprazol 20mg Lote LOT-2026-10-C!',
        body: 'El lote LOT-2026-10-C vence en 24 días. Priorizado automáticamente para salida FEFO.',
        category: 'ALTO',
        productCode: 'OME-020',
        batchCode: 'LOT-2026-10-C'
      });

      setIsCronRunning(false);
    }, 800);
  };

  const handleUpdateStatus = (id: string, newStatus: 'EN_GESTION' | 'ATENDIDA') => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const pendingCount = alerts.filter(a => a.status === 'PENDIENTE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Fase 5: Automatización & Realtime
            </span>
            <span className="text-xs text-slate-500">@nestjs/schedule + Supabase Realtime</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="h-6 w-6 text-amber-500" />
            Cron de Alertas de Reposición & Notificaciones en Tiempo Real
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoreo 24/7 de vencimientos a 30/60/90 días, quiebres de stock mínimo y órdenes sugeridas agrupadas por droguería.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('realtime_dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'realtime_dashboard'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            Centro de Alertas & WebSocket
          </button>
          <button
            onClick={() => setActiveSubTab('suggested_orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'suggested_orders'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-blue-500" />
            Sugerencia de Compras
          </button>
          <button
            onClick={() => setActiveSubTab('code_viewer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'code_viewer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Código Fuente NestJS
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CENTRO DE ALERTAS & WEBSOCKET SIMULATOR */}
      {activeSubTab === 'realtime_dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Realtime Event Toast if broadcasted */}
          {realtimeBroadcastEvent && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs shadow-lg flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 animate-pulse" />
                <div>
                  <span className="font-bold">WEBSOCKET BROADCAST EMITIDO:</span> Canal{' '}
                  <code className="bg-emerald-800 px-1 rounded">{realtimeBroadcastEvent.channel}</code>
                  {' '}- {realtimeBroadcastEvent.payload.product} ({realtimeBroadcastEvent.payload.type})
                </div>
              </div>
              <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded font-mono">
                {realtimeBroadcastEvent.timestamp}
              </span>
            </div>
          )}

          {/* KPI and Manual Trigger Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Alertas Pendientes</span>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <BellRing className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Cron Job Programado</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  @Cron('0 6 * * *')
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block">Activo (Diario 06:00 AM)</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-center">
              <button
                onClick={handleTriggerManualCron}
                disabled={isCronRunning}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isCronRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Evaluando Base de Datos...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Disparar Cron Manualmente Ahora
                  </>
                )}
              </button>
              <span className="text-[10px] text-slate-400 text-center mt-1">
                POST /api/v1/alerts/trigger-cron-manual (Emite Push)
              </span>
            </div>
          </div>

          {/* Web Push Notification Banner Integration */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-600 text-white">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  Servicio de Notificaciones Push en Navegador (Web Notifications API)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Permite recibir avisos sonoros y emergentes incluso con el dashboard minimizado o en otra pestaña.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                permission === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
              }`}>
                {permission === 'granted' ? '🔔 Segundo Plano Activo' : '⚠️ Permiso Pendiente'}
              </span>

              {permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition"
                >
                  Activar Push
                </button>
              )}
            </div>
          </div>

          {/* Alerts Feed */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-500" />
                Bandeja de Notificaciones en Tiempo Real
              </h3>
              <span className="text-xs text-slate-500">
                {alerts.length} alertas registradas en base de datos
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    alert.status === 'ATENDIDA'
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-60'
                      : alert.severity === 'CRITICO'
                      ? 'border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20'
                      : 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alert.severity === 'CRITICO'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {alert.alertType.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {alert.productName}
                      </span>
                      {alert.batchCode && (
                        <span className="font-mono text-[11px] text-slate-500">
                          ({alert.batchCode})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {alert.message}
                    </p>
                    <div className="text-[11px] text-slate-400">
                      {alert.timeAgo} • Estado: <strong className="text-slate-700 dark:text-slate-300">{alert.status}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {alert.status === 'PENDIENTE' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'EN_GESTION')}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition"
                      >
                        En Gestión
                      </button>
                    )}
                    {alert.status !== 'ATENDIDA' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'ATENDIDA')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition"
                      >
                        Marcar Atendida
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SUGERENCIA DE COMPRAS AGRUPADA POR PROVEEDOR */}
      {activeSubTab === 'suggested_orders' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm animate-fadeIn">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Generación Automática de Órdenes de Reposición
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Lista de Compras Sugerida Agrupada por Droguería / Laboratorio
            </h3>
            <p className="text-xs text-slate-500">
              Cálculo automatizado a partir del historial de ventas de los últimos 30 días para evitar quiebres y compras excesivas.
            </p>
          </div>

          <div className="space-y-4">
            {/* Grupo 1: Farmaindustria */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    Droguería Farmaindustria S.A.
                  </h4>
                  <p className="text-[11px] text-slate-500">RUC: 20100123456 • Tel: (01) 513-8000</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Estimado</span>
                  <span className="font-bold text-sm text-emerald-600">S/ 1,420.00</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>• <strong>Amoxicilina + Ác. Clavulánico 500/125mg</strong> (Caja x 30)</span>
                  <span className="font-mono">Pedir: <strong>25 cajas</strong> @ S/ 32.00 = S/ 800.00</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>• <strong>Ibuprofeno 400mg</strong> (Caja x 100 tabletas)</span>
                  <span className="font-mono">Pedir: <strong>20 cajas</strong> @ S/ 31.00 = S/ 620.00</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => alert('Orden de compra generada en formato borrador (Módulo MOD-04 Compras).')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                >
                  Generar Orden de Compra (OC-2026-0085)
                </button>
              </div>
            </div>

            {/* Grupo 2: Laboratorios Bagó */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    Laboratorios Bagó del Perú S.A.
                  </h4>
                  <p className="text-[11px] text-slate-500">RUC: 20256489712 • Tel: (01) 611-7400</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Estimado</span>
                  <span className="font-bold text-sm text-emerald-600">S/ 680.00</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>• <strong>Paracetamol 500mg Genérico</strong> (Caja x 100)</span>
                  <span className="font-mono">Pedir: <strong>40 cajas</strong> @ S/ 17.00 = S/ 680.00</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => alert('Orden de compra generada en formato borrador (Módulo MOD-04 Compras).')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                >
                  Generar Orden de Compra (OC-2026-0086)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CÓDIGO FUENTE NESTJS */}
      {activeSubTab === 'code_viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* File selector */}
          <div className="lg:col-span-4 space-y-2">
            <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Archivos Fase 5 (Cron & Realtime)</span>
              <span className="text-[10px] text-slate-500 font-mono">TypeScript</span>
            </div>

            <div className="space-y-1">
              {PHASE5_CODE_FILES.map((file) => {
                const isSelected = file.id === selectedFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex flex-col gap-0.5 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-slate-900 dark:text-white ring-1 ring-amber-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{file.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                        .ts
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {file.path}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Code Viewer */}
          <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {selectedFile.name}
                </span>
                <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {selectedFile.path}
                </h3>
              </div>
              <button
                onClick={() => handleCopy(selectedFile.code)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '¡Copiado!' : 'Copiar Código'}
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {selectedFile.description}
            </p>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[520px] leading-relaxed border border-slate-800">
              <pre>{selectedFile.code}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
