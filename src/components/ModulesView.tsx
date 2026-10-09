import React, { useState } from 'react';
import { SYSTEM_MODULES } from '../data/phase1Data';
import { Pill, ShieldCheck, Boxes, ShoppingCart, Truck, BellRing, Users, BarChart3, FileText, ChevronRight } from 'lucide-react';

export const ModulesView: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(SYSTEM_MODULES[0].id);

  const selectedModule = SYSTEM_MODULES.find(m => m.id === selectedModuleId) || SYSTEM_MODULES[0];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5" />;
      case 'Boxes': return <Boxes className="w-5 h-5" />;
      case 'ShoppingCart': return <ShoppingCart className="w-5 h-5" />;
      case 'Truck': return <Truck className="w-5 h-5" />;
      case 'BellRing': return <BellRing className="w-5 h-5" />;
      case 'Users': return <Users className="w-5 h-5" />;
      case 'BarChart3': return <BarChart3 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="h-6 w-6 text-emerald-500" />
            Desglose de los 8 Módulos Funcionales
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Especificación técnica formal: responsabilidades, entidades del modelo relacional, endpoints y reglas de negocio farmacéuticas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module Sidebar List */}
        <div className="lg:col-span-4 space-y-2">
          {SYSTEM_MODULES.map((mod) => {
            const isSelected = mod.id === selectedModuleId;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleId(mod.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {getIcon(mod.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{mod.code}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      mod.securityLevel === 'Crítico'
                        ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        : mod.securityLevel === 'Alto'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {mod.securityLevel}
                    </span>
                  </div>
                  <div className="font-semibold text-xs truncate text-slate-900 dark:text-white">{mod.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{mod.badge}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Module Detail */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedModule.code}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {selectedModule.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedModule.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Nivel de Seguridad:</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                selectedModule.securityLevel === 'Crítico'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : selectedModule.securityLevel === 'Alto'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
              }`}>
                {selectedModule.securityLevel}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {selectedModule.description}
          </p>

          {/* Responsabilidades */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Responsabilidades Operativas del Módulo
            </h4>
            <div className="space-y-1.5">
              {selectedModule.responsibilities.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reglas de Negocio */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Reglas de Negocio Inviolables (Invariants)
            </h4>
            <div className="space-y-2">
              {selectedModule.businessRules.map((rule, i) => (
                <div key={i} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 font-medium">
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {/* Endpoints de la API & Entidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Endpoints NestJS OpenAPI / Swagger
              </h5>
              <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                {selectedModule.apiEndpoints.map((ep, i) => (
                  <div key={i} className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 truncate">
                    {ep}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Entidades Clave del Schema Prisma
              </h5>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedModule.keyEntities.map((ent, i) => (
                  <span key={i} className="px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono text-xs">
                    {ent}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
