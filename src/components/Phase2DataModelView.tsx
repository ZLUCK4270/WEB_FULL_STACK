import React, { useState } from 'react';
import { ERD_ENTITIES, ErdEntity } from '../data/erdData';
import { Database, FileCode2, ShieldAlert, Key, Link2, Copy, Check, Filter, Layers, Server } from 'lucide-react';

export const Phase2DataModelView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'erd_explorer' | 'prisma_schema' | 'rls_sql'>('erd_explorer');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(ERD_ENTITIES[0].id);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const filteredEntities = selectedCategory === 'all'
    ? ERD_ENTITIES
    : ERD_ENTITIES.filter(e => e.category === selectedCategory);

  const selectedEntity = ERD_ENTITIES.find(e => e.id === selectedEntityId) || ERD_ENTITIES[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              Fase 2: Modelo de Datos Relacional
            </span>
            <span className="text-xs text-slate-500">PostgreSQL 15 / Supabase</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Diagrama Entidad-Relación, Schema Prisma & Políticas RLS
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Diseño relacional de alta normalización (3FN), trazabilidad FEFO por lotes, matriz de permisos en base de datos y triggers de inmutabilidad.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('erd_explorer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'erd_explorer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Explorador DER
          </button>
          <button
            onClick={() => setActiveSubTab('prisma_schema')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'prisma_schema'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            schema.prisma
          </button>
          <button
            onClick={() => setActiveSubTab('rls_sql')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'rls_sql'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Políticas RLS en SQL
          </button>
        </div>
      </div>

      {/* SUBTAB 1: EXPLORADOR ENTIDAD-RELACIÓN */}
      {activeSubTab === 'erd_explorer' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Domain Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Filter className="w-4 h-4 text-purple-500" />
              <span>Filtrar por Dominio:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['all', 'Seguridad & RBAC', 'Inventario & Lotes', 'Ventas & POS', 'Compras & Alertas', 'Auditoría'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg transition font-medium ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'Todas las Tablas (10)' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Entity List */}
            <div className="lg:col-span-4 space-y-2">
              {filteredEntities.map((ent) => {
                const isSelected = ent.id === selectedEntityId;
                return (
                  <button
                    key={ent.id}
                    onClick={() => setSelectedEntityId(ent.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-slate-900 dark:text-white ring-1 ring-purple-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        {ent.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {ent.description}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 font-medium">
                      {ent.fields.length} cols
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Entity Detailed Schema */}
            <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {selectedEntity.category}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Tabla PostgreSQL</span>
                  </div>
                  <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    public.{selectedEntity.name}
                  </h3>
                </div>
                <div className="text-right text-xs text-slate-500">
                  Total de Atributos: <strong className="text-slate-900 dark:text-white">{selectedEntity.fields.length}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                {selectedEntity.description}
              </p>

              {/* Columns Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Estructura de Columnas & Tipos de Datos
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Columna</th>
                        <th className="py-2.5 px-3">Tipo PostgreSQL</th>
                        <th className="py-2.5 px-3">Restricciones</th>
                        <th className="py-2.5 px-3">Propósito en el Negocio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {selectedEntity.fields.map((f, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {f.isPk && <span title="Primary Key"><Key className="w-3 h-3 text-amber-500" /></span>}
                            {f.isFk && <span title="Foreign Key"><Link2 className="w-3 h-3 text-sky-500" /></span>}
                            {f.name}
                          </td>
                          <td className="py-2.5 px-3 text-purple-700 dark:text-purple-300">{f.type}</td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {f.isPk ? <span className="text-amber-600 font-bold">PRIMARY KEY</span> : null}
                            {f.isFk ? <span className="text-sky-600 font-bold ml-1">FK ({f.fkRef})</span> : null}
                            {f.isUnique ? <span className="text-emerald-600 font-bold ml-1">UNIQUE</span> : null}
                            {!f.isPk && !f.isFk && !f.isUnique ? '-' : null}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-xs text-slate-600 dark:text-slate-300">{f.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cardinalidad & Relaciones */}
              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 space-y-2">
                <h5 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-purple-600" />
                  Cardinalidad & Relaciones con otras tablas
                </h5>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedEntity.relations.map((rel, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-mono text-[11px]">
                      {rel}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SCHEMA.PRISMA CODE VIEWER */}
      {activeSubTab === 'prisma_schema' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-emerald-500" />
                Archivo /prisma/schema.prisma (Listo para migración)
              </h3>
              <p className="text-xs text-slate-500">
                19 modelos completos, enums farmacéuticos, índices de rendimiento y claves foráneas.
              </p>
            </div>
            <button
              onClick={() => handleCopy('Prisma schema copiado')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? '¡Copiado!' : 'Copiar Archivo'}
            </button>
          </div>

          <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[580px] leading-relaxed border border-slate-800">
            <pre>{`// BOTICA NOVA SALUD - SCHEMA PRISMA
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Modelos principales:
// 1. UserProfile (RBAC + Supabase Auth)
// 2. Module & UserPermission (Matriz dinámica Módulo x Acción)
// 3. Product, Category, Laboratory, Supplier (Catálogo farmacéutico)
// 4. Batch (Lotes con fecha de vencimiento y algoritmo FEFO)
// 5. Sale, SaleItem, SaleItemBatch (Transacción atómica de mostrador POS)
// 6. StockMovement (Kárdex inmutable trazable)
// 7. StockAlert & ReplenishmentSuggestion (Cron jobs @nestjs/schedule)
// 8. SystemAuditLog (Auditoría inmutable protegida por trigger SQL)
... archivo completo disponible en /prisma/schema.prisma`}</pre>
          </div>
        </div>
      )}

      {/* SUBTAB 3: RLS POLICIES & TRIGGERS SQL */}
      {activeSubTab === 'rls_sql' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-500" />
                Script SQL: Row Level Security (RLS) & Triggers Forenses
              </h3>
              <p className="text-xs text-slate-500">
                Políticas de seguridad a nivel de motor PostgreSQL y función public.has_permission(module, action).
              </p>
            </div>
            <button
              onClick={() => handleCopy('SQL RLS copiado')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? '¡Copiado!' : 'Copiar Script SQL'}
            </button>
          </div>

          <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[580px] leading-relaxed border border-slate-800">
            <pre>{`-- 1. FUNCIÓN DE AUTORIZACIÓN DINÁMICA
CREATE OR REPLACE FUNCTION public.has_permission(p_module_id VARCHAR, p_action VARCHAR)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
...
-- 2. POLÍTICA RLS SOBRE INVENTARIO Y LOTES
CREATE POLICY "batches_select_policy" ON public.batches
  FOR SELECT TO authenticated
  USING (public.has_permission('inventory_batches', 'view') OR public.has_permission('pos_sales', 'view'));

-- 3. TRIGGER DE INMUTABILIDAD FORENSE
CREATE TRIGGER trg_protect_audit_logs
  BEFORE UPDATE OR DELETE ON public.system_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_tampering();
... archivo completo disponible en /prisma/rls_policies.sql`}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
