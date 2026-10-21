import React, { useState } from 'react';
import { COMPLETE_SQL_SCRIPT, downloadSqlScript } from '../../utils/sqlScript';
import {
  Database,
  Download,
  Copy,
  Check,
  FileCode,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Table,
  Terminal,
  FileText,
  Server,
  Zap,
  Info
} from 'lucide-react';

export const SqlExportView: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<'all' | 'ddl' | 'inserts' | 'insert_joins'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  // Split script into logical sections for easy previewing
  const getFilteredScript = () => {
    if (selectedSection === 'all') return COMPLETE_SQL_SCRIPT;
    if (selectedSection === 'ddl') {
      const parts = COMPLETE_SQL_SCRIPT.split('-- 2. INSERCIÓN DE DATOS DE SEMILLA');
      return parts[0].trim();
    }
    if (selectedSection === 'inserts') {
      const start = COMPLETE_SQL_SCRIPT.indexOf('-- 2. INSERCIÓN DE DATOS DE SEMILLA');
      const end = COMPLETE_SQL_SCRIPT.indexOf('-- 3. INSERT JOIN: INSERCIONES RELACIONALES CRUZADAS');
      if (start !== -1 && end !== -1) {
        return COMPLETE_SQL_SCRIPT.substring(start, end).trim();
      }
      return COMPLETE_SQL_SCRIPT;
    }
    if (selectedSection === 'insert_joins') {
      const start = COMPLETE_SQL_SCRIPT.indexOf('-- 3. INSERT JOIN: INSERCIONES RELACIONALES CRUZADAS');
      if (start !== -1) {
        return COMPLETE_SQL_SCRIPT.substring(start).trim();
      }
      return COMPLETE_SQL_SCRIPT;
    }
    return COMPLETE_SQL_SCRIPT;
  };

  const handleCopy = () => {
    const textToCopy = getFilteredScript();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentText = getFilteredScript();
  const lineCount = currentText.split('\n').length;
  const sizeKb = (new Blob([currentText]).size / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <Database className="w-3.5 h-3.5" />
              Base de Datos Externa & SQL Standalone
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Scripts SQL, Datos de Semilla & INSERT JOIN
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Todos los datos para insertar de manera externa en PostgreSQL, MySQL, Supabase, Cloud SQL o SQLite.
              Incluye las definiciones de tablas (DDL), inserción de registros completos (INSERT) y sentencias de inserción cruzada relacional (INSERT JOIN).
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono pt-1">
              <FileCode className="w-4 h-4" />
              <span>Archivo físico generado: /database/nova_salud_database_complete.sql</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition shadow-md border border-slate-700 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-400" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => downloadSqlScript()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-950/40 transition active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo .SQL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
            <Table className="w-4 h-4" />
            <span>15 Tablas DDL</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">100% Tipadas</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Claves PK, FK, Índices & Checks</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
            <Server className="w-4 h-4" />
            <span>Datos de Semilla</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">10 Catálogos</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Medicamentos, Lotes FEFO, Turnos</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold mb-1">
            <Zap className="w-4 h-4" />
            <span>INSERT JOIN</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">3 Sentencias</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Márgenes, Consolidado & Alertas</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Seguridad DIGEMID</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">Auditable</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Trazabilidad de ventas y lotes</p>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Todo el Script Completo (.SQL)' },
            { id: 'ddl', label: '1. Tablas & Estructuras (DDL)' },
            { id: 'inserts', label: '2. Datos de Semilla (INSERT)' },
            { id: 'insert_joins', label: '3. Inserciones Cruzadas (INSERT JOIN)' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedSection(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedSection === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>{lineCount} líneas</span>
          <span>•</span>
          <span>{sizeKb} KB</span>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="font-mono text-slate-300 font-bold ml-2">
              nova_salud_database_complete.sql
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copied ? 'Copiado' : 'Copiar Selección'}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadSqlScript()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .SQL</span>
            </button>
          </div>
        </div>

        <pre className="p-5 text-xs text-emerald-300/90 font-mono overflow-x-auto max-h-[600px] leading-relaxed selection:bg-indigo-600 selection:text-white">
          <code>{currentText}</code>
        </pre>
      </div>

      {/* Implementation Guidance Card */}
      <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-3">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 text-sm">
          <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Instrucciones para Inserción y Ejecución Externa:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <strong className="block font-bold text-slate-900 dark:text-white">1. PostgreSQL / Supabase / Cloud SQL:</strong>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              psql -U postgres -d farmacia_db -f database/nova_salud_database_complete.sql
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <strong className="block font-bold text-slate-900 dark:text-white">2. MySQL / MariaDB Workbench:</strong>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              mysql -u root -p farmacia_db &lt; database/nova_salud_database_complete.sql
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <strong className="block font-bold text-slate-900 dark:text-white">3. DBeaver / Navicat / SQLite:</strong>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Abra el editor SQL, pegue el contenido y ejecute con <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono">Ctrl + Enter</kbd>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
