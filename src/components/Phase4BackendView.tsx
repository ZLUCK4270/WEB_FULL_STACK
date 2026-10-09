import React, { useState } from 'react';
import { BACKEND_CODE_FILES, BackendModuleFile } from '../data/backendCodeData';
import { Server, ShieldCheck, ShoppingCart, Key, FileCode2, Copy, Check, Play, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const Phase4BackendView: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>(BACKEND_CODE_FILES[0].id);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'code_explorer' | 'api_tester'>('api_tester');

  // Interactive Swagger Simulator State
  const [testEndpoint, setTestEndpoint] = useState<string>('POST /api/v1/sales/checkout');
  const [simulatedRole, setSimulatedRole] = useState<'cajero' | 'almacenero' | 'supervisor' | 'admin'>('cajero');
  const [requestItemCount, setRequestItemCount] = useState<number>(15);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const selectedFile = BACKEND_CODE_FILES.find(f => f.id === selectedFileId) || BACKEND_CODE_FILES[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeApiSimulation = () => {
    setIsSimulating(true);

    setTimeout(() => {
      if (testEndpoint === 'POST /api/v1/sales/checkout') {
        if (simulatedRole === 'almacenero') {
          // PermissionsGuard blocks!
          setApiResponse({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Acceso Denegado: Su cuenta no cuenta con la facultad "CREATE" en el módulo "pos_sales"',
            timestamp: new Date().toISOString(),
            path: '/api/v1/sales/checkout',
            guardCheck: 'PermissionsGuard (@RequirePermission("pos_sales", "create")) -> RECHAZADO'
          });
        } else {
          // Cajero, Supervisor, Admin -> Allowed!
          const batchAUnits = Math.min(10, requestItemCount);
          const batchBUnits = requestItemCount - batchAUnits;

          setApiResponse({
            statusCode: 201,
            data: {
              saleId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
              saleCode: 'BOL-B001-00004523',
              status: 'COMPLETADA',
              cashierRole: simulatedRole.toUpperCase(),
              paymentMethod: 'EFECTIVO',
              subtotal: (requestItemCount * 1.5).toFixed(2),
              taxAmount: ((requestItemCount * 1.5) * 0.18).toFixed(2),
              totalAmount: (requestItemCount * 1.5).toFixed(2),
              createdAt: new Date().toISOString(),
              fefoDeductionPlan: [
                {
                  batchCode: 'LOTE-2026-11 (Vence en 1.5 meses)',
                  deductedUnits: batchAUnits,
                  remainingBatchStock: 10 - batchAUnits,
                  action: 'Prioridad 1 en cola FEFO'
                },
                ...(batchBUnits > 0 ? [{
                  batchCode: 'LOTE-2027-04 (Vence en 6 meses)',
                  deductedUnits: batchBUnits,
                  remainingBatchStock: 30 - batchBUnits,
                  action: 'Prioridad 2 en cola FEFO'
                }] : []),
              ],
              securityAudit: {
                evaluatedGuard: 'PermissionsGuard -> 200 OK',
                isolationLevel: 'SERIALIZABLE',
                pessimisticLock: 'SELECT FOR UPDATE exitoso',
                realtimeBroadcast: 'Canal stock_updates emitido'
              }
            }
          });
        }
      } else if (testEndpoint === 'POST /api/v1/users') {
        if (simulatedRole !== 'admin') {
          setApiResponse({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Acceso Denegado: Solo el Administrador Propietario puede dar de alta nuevos empleados con Supabase Admin API.',
            timestamp: new Date().toISOString(),
            guardCheck: 'PermissionsGuard (@RequirePermission("auth_rbac", "create")) -> RECHAZADO'
          });
        } else {
          setApiResponse({
            statusCode: 201,
            message: 'Colaborador creado exitosamente con cambio de clave obligatorio.',
            user: {
              id: '99e8d7c6-b5a4-3f2e-1d0c-a9b8c7d6e5f4',
              dni: '74859632',
              fullName: 'Marcos Soto Benavides',
              email: 'm.soto@novasalud.pe',
              roleTitle: 'Cajero Mostrador',
              mustChangePassword: true,
              supabaseAuthStatus: 'User Provisioned in Supabase Auth'
            }
          });
        }
      }
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Fase 4: Backend NestJS 10 Core
            </span>
            <span className="text-xs text-slate-500">Arquitectura Modular & Transacciones FEFO</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Backend NestJS: Módulos, @RequirePermission Guard & Lógica Transaccional FEFO
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Controladores, servicios inyectables con Prisma, DTOs validados con class-validator y bloqueo pesimista en PostgreSQL.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('api_tester')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'api_tester'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-500" />
            Playground Swagger API
          </button>
          <button
            onClick={() => setActiveSubTab('code_explorer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'code_explorer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Código Fuente NestJS
          </button>
        </div>
      </div>

      {/* SUBTAB 1: PLAYGROUND SWAGGER API */}
      {activeSubTab === 'api_tester' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-500" />
                  Simulador en Vivo de Endpoints NestJS + Guard de Permisos
                </h3>
                <p className="text-xs text-slate-500">
                  Prueba la interceptación en tiempo real del PermissionsGuard y el despacho atómico FEFO.
                </p>
              </div>
            </div>

            {/* Configuración de Petición */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  1. Endpoint a Probar:
                </label>
                <select
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 font-mono"
                >
                  <option value="POST /api/v1/sales/checkout">POST /api/v1/sales/checkout (Venta FEFO)</option>
                  <option value="POST /api/v1/users">POST /api/v1/users (Crear Usuario Supabase)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  2. Rol del Empleado Autenticado:
                </label>
                <select
                  value={simulatedRole}
                  onChange={(e) => setSimulatedRole(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 font-semibold capitalize"
                >
                  <option value="cajero">Cajero (Tiene permiso de ventas)</option>
                  <option value="almacenero">Almacenero (NO tiene permiso de ventas)</option>
                  <option value="supervisor">Supervisor de Botica</option>
                  <option value="admin">Administrador Propietario (Acceso total)</option>
                </select>
              </div>

              {testEndpoint === 'POST /api/v1/sales/checkout' && (
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    3. Unidades Solicitadas:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={requestItemCount}
                    onChange={(e) => setRequestItemCount(parseInt(e.target.value) || 1)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
              )}
            </div>

            <button
              onClick={executeApiSimulation}
              disabled={isSimulating}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ejecutando Pipeline NestJS (Pipes, Guards, Prisma Transaction)...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Enviar Petición HTTP al Endpoint de NestJS
                </>
              )}
            </button>

            {/* Consola de Respuesta */}
            <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs border border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">
                  Respuesta HTTP del Servidor NestJS
                </span>
                {apiResponse && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    apiResponse.statusCode >= 200 && apiResponse.statusCode < 300
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    HTTP {apiResponse.statusCode} {apiResponse.statusCode === 201 ? 'CREATED' : 'FORBIDDEN'}
                  </span>
                )}
              </div>

              {!apiResponse ? (
                <div className="text-slate-500 italic py-6 text-center">
                  Presiona "Enviar Petición HTTP" para observar la validación del Guard y la respuesta JSON...
                </div>
              ) : (
                <pre className="overflow-x-auto max-h-[360px] text-[11px] leading-relaxed text-emerald-300">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CÓDIGO FUENTE NESTJS */}
      {activeSubTab === 'code_explorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* File selector */}
          <div className="lg:col-span-4 space-y-2">
            <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Módulos de Backend NestJS</span>
              <span className="text-[10px] text-slate-500 font-mono">TypeScript</span>
            </div>

            <div className="space-y-1">
              {BACKEND_CODE_FILES.map((file) => {
                const isSelected = file.id === selectedFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex flex-col gap-0.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white ring-1 ring-emerald-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{file.moduleName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                        .ts
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {file.filePath}
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {selectedFile.moduleName}
                </span>
                <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {selectedFile.filePath}
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
