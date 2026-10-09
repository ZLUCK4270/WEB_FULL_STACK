import React from 'react';
import { useWebPush } from '../context/WebPushContext';
import { BellRing, X, AlertTriangle, ShieldAlert, Volume2 } from 'lucide-react';

export const PushToastBanner: React.FC = () => {
  const { activeToast, dismissToast, setIsDrawerOpen } = useWebPush();

  if (!activeToast) return null;

  return (
    <div className="fixed top-24 right-5 z-50 max-w-sm w-full animate-slideIn">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/10 flex items-start gap-3 backdrop-blur-md">
        <div className={`p-2.5 rounded-xl shrink-0 ${
          activeToast.category === 'CRITICO'
            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
            : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
        }`}>
          <BellRing className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              Notificación Push Web
            </span>
            <span className="text-[10px] text-slate-400">Ahora</span>
          </div>

          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {activeToast.title}
          </h4>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
            {activeToast.body}
          </p>

          <div className="mt-2.5 flex items-center justify-between">
            <button
              onClick={() => {
                dismissToast();
                setIsDrawerOpen(true);
              }}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver en Centro de Alertas →
            </button>
            <button
              onClick={dismissToast}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cerrar
            </button>
          </div>
        </div>

        <button
          onClick={dismissToast}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Cerrar toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
