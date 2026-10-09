import React, { useState } from 'react';
import { MONOREPO_FILES, MonorepoFile } from '../data/monorepoData';
import { FolderTree, FileCode, Terminal, Copy, Check, ShieldAlert, Cpu, ExternalLink, Play } from 'lucide-react';

export const Phase3MonorepoView: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(MONOREPO_FILES[0].path);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'files' | 'scripts' | 'env_matrix'>('files');
  const [simulatedScript, setSimulatedScript] = useState<string>('pnpm dev');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const selectedFile = MONOREPO_FILES.find(f => f.path === selectedFilePath) || MONOREPO_FILES[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runScriptSimulation = (command: string) => {
    setSimulatedScript(command);
    setIsRunning(true);
    setTerminalOutput([`$ ${command}`, '⚡ Orquestador Turborepo v2.4.2 iniciando pipeline...']);

    setTimeout(() => {
      if (command.includes('dev')) {
        setTerminalOutput([
          `$ ${command}`,
          '⚡ Orquestador Turborepo v2.4.2 iniciando tareas en paralelo:',
          ' • @nova-salud/api: nest start --watch (Puerto 4000) [LISTO]',
          ' • @nova-salud/web: next dev (Puerto 3000) [LISTO]',
          '✔ Prisma Client generado automáticamente con schema.prisma',
          '✔ NestJS conectado a PostgreSQL (Supabase Connection Pooler)',
          '✔ WebSockets de Supabase Realtime sincronizados',
          '🚀 Aplicación disponible en http://localhost:3000 (POS & Dashboard)'
        ]);
      } else if (command.includes('build')) {
        setTerminalOutput([
          `$ ${command}`,
          '⚡ Turborepo compilando monorepo...',
          ' • @nova-salud/shared: Compilación TypeScript exitosa (dist/index.d.ts)',
          ' • @nova-salud/api: NestJS compilado con éxito (dist/main.js - 0 advertencias)',
          ' • @nova-salud/web: Next.js 15 compilación SSG/SSR completada (.next/)',
          '✔ Cache hit para paquetes no modificados (Aceleración 8.4x)',
          '✨ Build exitoso en 1.84s listo para despliegue en Vercel & Render'
        ]);
      } else if (command.includes('migrate')) {
        setTerminalOutput([
          `$ ${command}`,
          'Prisma Migrate v6.3.1',
          'Conectando a base de datos PostgreSQL en Supabase...',
          'Aplicando migración: 20261008000000_init_nova_salud_schema',
          '✔ 19 tablas relacionales creadas',
          '✔ 12 índices B-tree creados (incluyendo idx_batches_fefo_order)',
          '✔ Políticas RLS y Triggers inmutables ejecutados',
          '✔ Todo sincronizado con la base de datos de producción.'
        ]);
      }
      setIsRunning(false);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              Fase 3: Arquitectura Monorepo
            </span>
            <span className="text-xs text-slate-500">Turborepo + pnpm Workspaces</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            Estructura del Monorepo (/apps/web y /apps/api) & Configuración Inicial
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organización desacoplada de alto rendimiento: Frontend Next.js 15 PWA, Backend NestJS 10, Prisma ORM y contratos TypeScript compartidos.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'files'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Archivos del Monorepo
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'scripts'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Consola de Scripts
          </button>
          <button
            onClick={() => setActiveTab('env_matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'env_matrix'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Matriz de .env & Seguridad
          </button>
        </div>
      </div>

      {/* TAB 1: ARCHIVOS DEL MONOREPO */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* File Explorer Tree */}
          <div className="lg:col-span-4 space-y-2">
            <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Árbol de Directorios</span>
              <span className="text-[10px] text-slate-500 font-mono">pnpm-workspace</span>
            </div>

            <div className="space-y-1">
              {MONOREPO_FILES.map((file) => {
                const isSelected = file.path === selectedFilePath;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex flex-col gap-0.5 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white ring-1 ring-sky-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs truncate">{file.path}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {file.category.split('/')[0]}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {file.description}
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  {selectedFile.category}
                </span>
                <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {selectedFile.path}
                </h3>
              </div>
              <button
                onClick={() => handleCopy(selectedFile.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '¡Copiado!' : 'Copiar Archivo'}
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {selectedFile.description}
            </p>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed border border-slate-800">
              <pre>{selectedFile.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONSOLA DE SCRIPTS Y RUNNER */}
      {activeTab === 'scripts' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  Terminal de Ejecución Unificada de Turborepo
                </h3>
                <p className="text-xs text-slate-500">
                  Simula la ejecución de comandos orquestados en paralelo para Frontend, Backend y Base de Datos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { cmd: 'pnpm dev', label: 'Desarrollo en Paralelo (Web + API)', desc: 'Lanza Next.js :3000 y NestJS :4000 simultáneamente' },
                { cmd: 'pnpm build', label: 'Compilación de Producción', desc: 'Cache incremental con Turbo Pipeline' },
                { cmd: 'pnpm db:migrate', label: 'Migraciones Prisma en Supabase', desc: 'Aplica tablas, índices y RLS' },
              ].map((s) => (
                <button
                  key={s.cmd}
                  onClick={() => runScriptSimulation(s.cmd)}
                  disabled={isRunning}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition"
                >
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                    <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                    {s.cmd}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
                </button>
              ))}
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs min-h-[220px] max-h-[350px] overflow-y-auto space-y-1.5 border border-slate-800">
              <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 uppercase font-bold flex items-center justify-between">
                <span>Turborepo Output Console</span>
                {isRunning && <span className="text-emerald-400 animate-pulse">Ejecutando...</span>}
              </div>
              {terminalOutput.length === 0 ? (
                <div className="text-slate-500 italic py-6 text-center">
                  Selecciona uno de los comandos superiores para probar la compilación y orquestación del monorepo...
                </div>
              ) : (
                terminalOutput.map((line, idx) => (
                  <div key={idx} className={line.startsWith('$') ? 'text-sky-400 font-bold' : line.startsWith('✔') ? 'text-emerald-400' : 'text-slate-300'}>
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MATRIZ DE VARIABLES DE ENTORNO */}
      {activeTab === 'env_matrix' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Matriz de Variables de Entorno & Aislamiento de Secretos
            </h3>
            <p className="text-xs text-slate-500">
              Garantía estricta para la defensa de título: qué variables son públicas, cuáles residen solo en NestJS y por qué.
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Variable de Entorno</th>
                  <th className="py-2.5 px-3">Destino</th>
                  <th className="py-2.5 px-3">Nivel de Exposición</th>
                  <th className="py-2.5 px-3">Justificación de Seguridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400">SUPABASE_SERVICE_ROLE_KEY</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">apps/api (NestJS)</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">100% SECRETO</span></td>
                  <td className="py-2.5 px-3 font-sans text-xs text-slate-600 dark:text-slate-400">Anula las políticas RLS. Jamás debe compartirse al bundle del frontend en Next.js.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">DATABASE_URL / DIRECT_URL</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">apps/api & Prisma</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">SECRETO INTERNO</span></td>
                  <td className="py-2.5 px-3 font-sans text-xs text-slate-600 dark:text-slate-400">Credenciales del pooler de PostgreSQL para transacciones atómicas FEFO.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-sky-600 dark:text-sky-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">apps/web (Next.js)</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold">PÚBLICA SEGURA</span></td>
                  <td className="py-2.5 px-3 font-sans text-xs text-slate-600 dark:text-slate-400">Controlada por RLS. El usuario solo lee lo que sus políticas SQL le permiten.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">NEXT_PUBLIC_API_URL</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">apps/web (Next.js)</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">PÚBLICA</span></td>
                  <td className="py-2.5 px-3 font-sans text-xs text-slate-600 dark:text-slate-400">URL del Gateway de NestJS (http://localhost:4000/api/v1 o dominio de Render).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
