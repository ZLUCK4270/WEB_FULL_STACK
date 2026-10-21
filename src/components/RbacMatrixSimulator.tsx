import React, { useState } from 'react';
import { PRESET_ROLES_PERMISSIONS, SYSTEM_MODULES } from '../data/phase1Data';
import { ShieldCheck, Lock, Unlock, Eye, PlusCircle, Edit3, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

type RoleKey = 'administrador' | 'supervisor' | 'cajero' | 'almacenero' | 'custom';

export const RbacMatrixSimulator: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('cajero');
  const [matrix, setMatrix] = useState<any>(JSON.parse(JSON.stringify(PRESET_ROLES_PERMISSIONS.cajero.permissions)));
  const [testAction, setTestAction] = useState<{ module: string; action: 'view' | 'create' | 'edit' | 'delete' }>({
    module: 'pos_sales',
    action: 'delete'
  });
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  const handleSelectPreset = (role: RoleKey) => {
    setSelectedRole(role);
    if (role !== 'custom') {
      const presetData = PRESET_ROLES_PERMISSIONS[role].permissions;
      setMatrix(JSON.parse(JSON.stringify(presetData)));
      triggerRealtimeToast(`Rol cargado: ${PRESET_ROLES_PERMISSIONS[role].name}`);
    }
  };

  const handleToggle = (moduleId: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    if (selectedRole === 'administrador') {
      triggerRealtimeToast('Regla BR-SEC-01: El Administrador Propietario posee acceso total inmutable y no puede ser modificado.');
      return;
    }

    setMatrix((prev: any) => {
      const updated = { ...prev };
      if (!updated[moduleId]) {
        updated[moduleId] = { view: false, create: false, edit: false, delete: false };
      }
      updated[moduleId][action] = !updated[moduleId][action];
      return updated;
    });

    setSelectedRole('custom');
    triggerRealtimeToast(`Permiso modificado en tiempo real para '${moduleId}.${action}' (Supabase Realtime event emitido)`);
  };

  const triggerRealtimeToast = (msg: string) => {
    setRealtimeNotice(msg);
    setTimeout(() => {
      setRealtimeNotice(null);
    }, 3500);
  };

  // Evaluate test action
  const hasPermission = matrix[testAction.module]?.[testAction.action] ?? false;

  return (
    <div className="space-y-6">
      {/* Realtime broadcast banner */}
      {realtimeNotice && (
        <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="font-semibold">EVENTO EN TIEMPO REAL:</span> {realtimeNotice}
          </div>
          <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded font-mono">canal: user_permissions:update</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            Simulador Interactivo de Matriz RBAC (Módulo × Acción)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Experimenta cómo los permisos dinámicos se aplican instantáneamente en Frontend, NestJS Guard y PostgreSQL RLS.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs">
          {(['administrador', 'supervisor', 'cajero', 'almacenero', 'custom'] as RoleKey[]).map((r) => (
            <button
              key={r}
              onClick={() => handleSelectPreset(r)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                selectedRole === r
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r === 'custom' ? 'Personalizado' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Permission Table (Col 8) */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Configuración de Permisos para:
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {selectedRole === 'custom' ? 'Usuario con Perfil Personalizado' : PRESET_ROLES_PERMISSIONS[selectedRole].name}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Haz clic en cualquier checkbox para modificar la matriz en caliente.
              </p>
            </div>
            {selectedRole === 'administrador' && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                <Lock className="w-3 h-3" /> Admin Inmutable
              </span>
            )}
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 font-semibold">Módulo del Negocio</th>
                <th className="py-2.5 text-center font-semibold"><Eye className="w-3.5 h-3.5 inline mr-1 text-slate-400" />Ver</th>
                <th className="py-2.5 text-center font-semibold"><PlusCircle className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />Crear</th>
                <th className="py-2.5 text-center font-semibold"><Edit3 className="w-3.5 h-3.5 inline mr-1 text-blue-500" />Editar</th>
                <th className="py-2.5 text-center font-semibold"><Trash2 className="w-3.5 h-3.5 inline mr-1 text-rose-500" />Eliminar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {SYSTEM_MODULES.map((mod) => {
                const currentActions = matrix[mod.id] || { view: false, create: false, edit: false, delete: false };
                return (
                  <tr key={mod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">{mod.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{mod.code}</div>
                    </td>
                    {(['view', 'create', 'edit', 'delete'] as const).map((action) => (
                      <td key={action} className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={currentActions[action]}
                          disabled={selectedRole === 'administrador'}
                          onChange={() => handleToggle(mod.id, action)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed accent-emerald-600"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Live Simulation & 3-layer Testing (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-500" />
              Probar Petición en Vivo
            </h3>

            <div className="space-y-2 text-xs">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Módulo a consultar:</label>
              <select
                value={testAction.module}
                onChange={(e) => setTestAction({ ...testAction, module: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
              >
                {SYSTEM_MODULES.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <label className="text-slate-600 dark:text-slate-400 font-medium pt-1 block">Acción a ejecutar:</label>
              <div className="grid grid-cols-2 gap-2">
                {(['view', 'create', 'edit', 'delete'] as const).map((act) => (
                  <button
                    key={act}
                    onClick={() => setTestAction({ ...testAction, action: act })}
                    className={`p-2 rounded-lg text-xs capitalize font-medium border text-center transition ${
                      testAction.action === act
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {act === 'view' ? 'Ver' : act === 'create' ? 'Crear' : act === 'edit' ? 'Editar' : 'Eliminar'}
                  </button>
                ))}
              </div>
            </div>

            {/* Resultado de la evaluación en las 3 capas */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Resultado de Autorización:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                  hasPermission
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {hasPermission ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {hasPermission ? 'PERMITIDO' : 'DENEGADO (403)'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Capa 1 */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400">1. Frontend UI / Botón:</span>
                  <span className={hasPermission ? 'text-emerald-600 font-semibold' : 'text-slate-400 italic'}>
                    {hasPermission ? 'Visible en pantalla' : 'Oculto / Bloqueado'}
                  </span>
                </div>
                {/* Capa 2 */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400">2. NestJS Guard:</span>
                  <span className={hasPermission ? 'text-emerald-600 font-semibold font-mono' : 'text-rose-600 font-semibold font-mono'}>
                    {hasPermission ? '200 OK (Pass)' : '403 Forbidden'}
                  </span>
                </div>
                {/* Capa 3 */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400">3. Supabase RLS:</span>
                  <span className={hasPermission ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                    {hasPermission ? 'Row concedida' : '0 rows returned / Deny'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
