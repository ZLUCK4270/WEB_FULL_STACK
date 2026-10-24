import React, { useState } from 'react';
import { useWebPush } from '../context/WebPushContext';
import { useI18n } from '../i18n/I18nContext';
import {
  Bell, BellRing, BellOff, X, CheckCircle2, AlertTriangle, AlertCircle,
  Volume2, ShieldAlert, Sparkles, Clock, Trash2, Check, ExternalLink, Timer
} from 'lucide-react';

export const NotificationsDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    permission,
    isSupported,
    requestPermission,
    sendPushAlert,
    notifications,
    unreadCount,
    markAllAsRead,
    clearHistory,
    scheduleBackgroundTest
  } = useWebPush();
  const { language } = useI18n();

  const [testCountdown, setTestCountdown] = useState<number | null>(null);

  if (!isDrawerOpen) return null;

  const handleStartBackgroundTest = () => {
    setTestCountdown(5);
    scheduleBackgroundTest(5);

    const interval = setInterval(() => {
      setTestCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">

          {/* Top Section */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {language === 'en' ? 'Web Push Notifications' : 'Notificaciones Push Web'}
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Background system alerts for Admin' : 'Avisos en segundo plano para el Administrador'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Cerrar notificaciones"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Section with Scrolling */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Permission Status Box */}
            <div className={`p-4 rounded-xl border ${
              permission === 'granted'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {permission === 'granted' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold">
                      {permission === 'granted'
                        ? (language === 'en' ? 'Browser Notifications Allowed' : 'Notificaciones Nativas Permitidas')
                        : (language === 'en' ? 'Permission Required for Background Alerts' : 'Permiso Requerido para Avisos en 2do Plano')}
                    </h4>
                    <p className="text-[11px] opacity-90">
                      {permission === 'granted'
                        ? (language === 'en' ? 'Alerts will pop up even when the browser is minimized.' : 'Recibirás avisos en el sistema operativo aunque minimices el navegador.')
                        : (language === 'en' ? 'Enable native push to monitor inventory while using other apps.' : 'Habilita notificaciones para monitorear el stock mientras trabajas en otras pestañas.')}
                    </p>
                  </div>
                </div>

                {permission !== 'granted' && isSupported && (
                  <button
                    onClick={requestPermission}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-sm shrink-0 transition"
                  >
                    {language === 'en' ? 'Enable' : 'Habilitar'}
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Testing Toolbar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'en' ? 'Simulate Real-time Push Events:' : 'Simular Eventos Push en Tiempo Real:'}
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    sendPushAlert({
                      title: 'Alerta de Stock Mínimo (Reposición)',
                      body: 'Amoxicilina 500mg está en 8 unidades. Ha alcanzado el punto de reorden con Droguería Bagó.',
                      category: 'ALTO',
                      productCode: 'AMX-500'
                    });
                  }}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-left transition font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Stock Mínimo</span>
                </button>

                <button
                  onClick={() => {
                    sendPushAlert({
                      title: 'Alerta Crítica: Lote Vencido Bloqueado',
                      body: 'El lote LOT-2025-09B de Ibuprofeno 400mg ha vencido. Bloqueado en todas las terminales POS.',
                      category: 'CRITICO',
                      productCode: 'IBU-400',
                      batchCode: 'LOT-2025-09B'
                    });
                  }}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-left transition font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Lote Vencido</span>
                </button>
              </div>

              {/* Background 5s Countdown Test */}
              <div className="pt-1">
                <button
                  onClick={handleStartBackgroundTest}
                  disabled={testCountdown !== null}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>
                    {testCountdown !== null
                      ? (language === 'en' ? `Minimice la ventana... (${testCountdown}s)` : `Minimice o cambie de pestaña... (${testCountdown}s)`)
                      : (language === 'en' ? 'Test Background Push (5s Countdown)' : 'Probar Notificación en Segundo Plano (5s)')}
                  </span>
                </button>
              </div>
            </div>

            {/* Notifications History Feed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'en' ? 'Notifications Feed' : 'Historial de Avisos Despachados'} ({notifications.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="hover:text-indigo-600 transition flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>{language === 'en' ? 'Mark read' : 'Leídas'}</span>
                  </button>
                  <button
                    onClick={clearHistory}
                    className="hover:text-rose-600 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{language === 'en' ? 'Clear' : 'Limpiar'}</span>
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  {language === 'en' ? 'No notifications yet' : 'No hay notificaciones recientes'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.category === 'CRITICO'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : item.category === 'ALTO'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {item.category}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.body}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          {item.productCode && <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{item.productCode}</span>}
                          {item.batchCode && <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-600">{item.batchCode}</span>}
                        </div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">Web Notification API</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center text-xs text-slate-500">
            <span>Servicio conectado a Supabase Realtime & Cron Jobs</span>
          </div>

        </div>
      </div>
    </div>
  );
};
