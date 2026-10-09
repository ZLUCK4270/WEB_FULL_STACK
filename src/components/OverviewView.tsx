import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Zap, Target, ArrowRight } from 'lucide-react';

interface OverviewViewProps {
  onGoToArchitecture: () => void;
  onGoToMatrix: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onGoToArchitecture,
  onGoToMatrix
}) => {
  const painPoints = [
    {
      title: 'Errores Frecuentes en el Inventario',
      before: 'Control manual en cuadernos o hojas de cálculo desincronizadas. Descuadres entre el físico en estantería y lo anotado.',
      after: 'Registro automatizado con código de barras y trazabilidad por Lote y Fecha de Vencimiento. Precisión del 99.8%.'
    },
    {
      title: 'Desabastecimientos Recurrentes (Quiebres de Stock)',
      before: 'El almacenero se entera de la falta del medicamento solo cuando el cliente lo pide en mostrador. Pérdida de ventas del 22%.',
      after: 'Alertas predictivas automáticas (cron job) al llegar al stock mínimo y generación automática de órdenes de compra sugeridas.'
    },
    {
      title: 'Largos Tiempos de Espera para Clientes',
      before: 'Promedio de 4 a 6 minutos por cliente buscando precios, revisando cajas a mano y buscando vueltos o confirmaciones.',
      after: 'Punto de Venta (POS) en < 3 clics con sugerencia de genéricos por principio activo (DCI) y cobro ágil en menos de 45 segundos.'
    },
    {
      title: 'Pérdidas por Medicamentos Vencidos',
      before: 'Se despachaba sin criterio de fecha de caducidad, dejando lotes antiguos al fondo de la gaveta hasta que expiraban.',
      after: 'Algoritmo FEFO estricto (First Expired, First Out) obligatorio por sistema que bloquea ventas de lotes caducados y prioriza los más próximos.'
    }
  ];

  const businessGoals = [
    { label: 'Tiempo de atención en mostrador', metric: '< 45 seg', improvement: '-80% reducción' },
    { label: 'Venta de productos vencidos', metric: '0% (Cero absoluto)', improvement: 'Bloqueo forzado por sistema' },
    { label: 'Quiebre de stock no previsto', metric: '< 2%', improvement: 'Monitoreo 24/7 con cron' },
    { label: 'Tiempo de onboarding de nuevo cajero', metric: '< 15 minutos', improvement: 'UI intuitiva sin capacitación' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30 mb-4">
            <Target className="h-3.5 w-3.5" />
            Entregable Fase 1: Análisis & Diseño de Software
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Botica "Nova Salud" • Sistema de Gestión Farmacéutica Centralizado
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Solución web y PWA integral orientada a erradicar los desabastecimientos recurrentes, eliminar las pérdidas por medicamentos caducados mediante despacho <strong>FEFO</strong> y reducir el tiempo de atención en mostrador a <strong>menos de 3 clics</strong> con seguridad granular RBAC de 3 capas.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onGoToArchitecture}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/25"
            >
              Ver Diagrama de Arquitectura C4
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onGoToMatrix}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-medium text-xs sm:text-sm transition"
            >
              Probar Simulador de Permisos RBAC
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Métricas Objetivas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {businessGoals.map((g, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{g.label}</p>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">{g.metric}</div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Zap className="w-3 h-3" /> {g.improvement}
            </span>
          </div>
        ))}
      </div>

      {/* Matriz Problema vs Solución de Ingeniería */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Diagnóstico de la Botica: Diagnóstico Operativo vs. Solución de Software
          </h2>
          <span className="text-xs text-slate-500">Fundamentación para Defensa de Título</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {painPoints.map((item, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  {idx + 1}
                </span>
                {item.title}
              </h3>
              <div className="text-xs space-y-2">
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300">
                  <span className="font-bold">❌ Situación Actual:</span> {item.before}
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold">✅ Solución "Nova Salud":</span> {item.after}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan de Fases del Proyecto */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-500" />
          Ruta Metodológica de Entrega por Fases
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500 font-medium space-y-1">
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-bold">FASE ACTUAL</span>
            <div className="font-bold text-emerald-900 dark:text-emerald-200">1. Análisis & Diseño</div>
            <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">Historias de usuario, C4 arquitectónico, matriz RBAC y reglas FEFO.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">SIGUIENTE</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">2. Modelo de Datos & RLS</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Schema Prisma completo, DER relacional y scripts SQL de Row Level Security.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">PENDIENTE</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">3 & 4. Backend NestJS</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Transacciones ACID FEFO, Guards dinámicos, DTOs y cron jobs.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">PENDIENTE</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">5 a 8. Frontend & Tests</div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Next.js PWA, POS interactivo, Playwright E2E y manual de sustentación.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
