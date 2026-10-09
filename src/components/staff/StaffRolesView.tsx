import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { StaffUser } from '../../types/pharmacy';
import { BackupConfigModule } from '../admin/BackupConfigModule';
import { ActivityLogView } from '../admin/ActivityLogView';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Key,
  Award,
  Clock,
  Layers,
  ArrowRight,
  Settings,
  Plus,
  Check,
  X,
  Sparkles,
  Database,
  Users,
  Activity
} from 'lucide-react';

interface StaffRolesViewProps {
  initialSubTab?: 'staff' | 'backups' | 'audit';
}

export const StaffRolesView: React.FC<StaffRolesViewProps> = ({ initialSubTab = 'staff' }) => {
  const { staffUsers, currentUser, switchCurrentUser, updateStaffPermissions, backupConfig, activityLogs } = usePharmacy();
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'staff' | 'backups' | 'audit'>(initialSubTab);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Sync with initialSubTab prop if changed from external navigation
  useEffect(() => {
    if (initialSubTab) {
      setActiveAdminSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const permissionLabels: { [key in keyof StaffUser['permissions']]: string } = {
    canSell: 'Venta & Cobro en Mostrador (POS)',
    canReceiveBatches: 'Recepción & Registro de Lotes en Almacén',
    canAdjustStock: 'Ajuste de Stock, Mermas & Cuarentena',
    canOpenCloseCash: 'Apertura, Movimientos & Cierre de Caja',
    canViewFinancials: 'Acceso a Márgenes, Costos & Reportes Financieros',
    canManageStaff: 'Administración de Personal & Roles',
    canSignDigemidReports: 'Firma & Responsabilidad Técnica DIGEMID'
  };

  const AVAILABLE_MODULES = [
    { id: 'dashboard', name: 'Panel General', desc: 'Métricas e ingresos' },
    { id: 'pos', name: 'Punto de Venta (POS)', desc: 'Dispensación y boletas' },
    { id: 'inventory', name: 'Inventario & FEFO', desc: 'Lotes y fechas de expiración' },
    { id: 'cash', name: 'Caja & Arqueo', desc: 'Cuadre físico de efectivo' },
    { id: 'purchases', name: 'Compras & Droguerías', desc: 'Órdenes de reposición' },
    { id: 'alerts', name: 'Alertas Activas', desc: 'Vencimientos y quiebres' },
    { id: 'customers', name: 'Pacientes & Clientes', desc: 'Fichas y recetas' },
    { id: 'staff', name: 'Personal & Permisos', desc: 'Configuración de equipo' },
    { id: 'reports', name: 'Reportes DIGEMID', desc: 'Libros oficiales sanitarios' },
    { id: 'backups', name: 'Respaldos & BD', desc: 'Copias de seguridad automáticas' },
    { id: 'audit', name: 'Log de Actividades', desc: 'Trazabilidad y auditoría continua' }
  ];

  const handleToggleModule = (user: StaffUser, moduleId: string) => {
    const isCurrentlyAllowed = user.allowedTabs.includes(moduleId);
    let updatedTabs: string[];

    if (isCurrentlyAllowed) {
      // Do not remove if it's the last remaining tab
      if (user.allowedTabs.length <= 1) return;
      updatedTabs = user.allowedTabs.filter(id => id !== moduleId);
    } else {
      updatedTabs = [...user.allowedTabs, moduleId];
    }

    // Automatically align technical permission if relevant
    const updatedPermissions = { ...user.permissions };
    if (moduleId === 'pos') updatedPermissions.canSell = !isCurrentlyAllowed;
    if (moduleId === 'inventory') updatedPermissions.canReceiveBatches = !isCurrentlyAllowed;
    if (moduleId === 'cash') updatedPermissions.canOpenCloseCash = !isCurrentlyAllowed;

    updateStaffPermissions(user.id, updatedTabs, updatedPermissions);
  };

  const handleTogglePermission = (user: StaffUser, permKey: keyof StaffUser['permissions']) => {
    const updatedPermissions = {
      ...user.permissions,
      [permKey]: !user.permissions[permKey]
    };
    updateStaffPermissions(user.id, user.allowedTabs, updatedPermissions);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Gestión de Personal & Asignación de Módulos
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold border border-emerald-300">
                Panel Administrador
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalice y asigne qué módulos y funciones operativas tiene habilitado cada colaborador de la botica.
            </p>
          </div>
        </div>

        {/* Current Active Staff Badge */}
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Administrador en Sesión:</div>
            <strong className="text-slate-900 dark:text-white font-bold">{currentUser.name}</strong>
            <span className="text-emerald-600 font-semibold ml-1">({currentUser.roleTitle})</span>
          </div>
        </div>
      </div>

      {/* Admin Panel Subtab Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveAdminSubTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeAdminSubTab === 'staff'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Personal & Permisos</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeAdminSubTab === 'staff' ? 'bg-emerald-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {staffUsers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubTab('backups')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeAdminSubTab === 'backups'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Respaldos Automáticos & Base de Datos</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeAdminSubTab === 'backups'
              ? 'bg-emerald-800 text-white'
              : backupConfig.enabled
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
          }`}>
            {backupConfig.enabled ? 'Auto Activo' : 'Pausado'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeAdminSubTab === 'audit'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Log de Actividades & Trazabilidad</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeAdminSubTab === 'audit'
              ? 'bg-purple-800 text-white'
              : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
          }`}>
            {activityLogs.length} en vivo
          </span>
        </button>
      </div>

      {activeAdminSubTab === 'backups' ? (
        <BackupConfigModule />
      ) : activeAdminSubTab === 'audit' ? (
        <ActivityLogView />
      ) : (
        /* Staff Grid with Interactive Module Configuration */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {staffUsers.map(user => {
          const isActive = currentUser.id === user.id;

          return (
            <div
              key={user.id}
              className={`p-6 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-5 transition ${
                isActive
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Header of Collaborator Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base text-white ${
                    user.role === 'regente'
                      ? 'bg-emerald-600'
                      : user.role === 'admin'
                      ? 'bg-blue-600'
                      : user.role === 'cajero'
                      ? 'bg-purple-600'
                      : 'bg-amber-600'
                  }`}>
                    {user.avatarInitials}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {user.name}
                      </h3>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Sesión Actual
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {user.roleTitle}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>Usuario: @{user.username}</span>
                      <span>• DNI: {user.dni}</span>
                      <span>• Turno: {user.activeShift}</span>
                      {user.colegiatura && <span className="font-semibold text-emerald-600">• {user.colegiatura}</span>}
                    </div>
                  </div>
                </div>

                {!isActive && (
                  <button
                    onClick={() => switchCurrentUser(user.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Asumir Turno</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Interactive Module Assignment (Requested: Gestión directa por el Administrador) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Módulos Asignados en su Panel Lateral:
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (Clic para habilitar o remover)
                  </span>
                </div>

                {/* Module Toggle Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_MODULES.map(mod => {
                    const isAssigned = user.allowedTabs.includes(mod.id);

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleToggleModule(user, mod.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                          isAssigned
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title={`${isAssigned ? 'Quitar acceso a' : 'Conceder acceso a'} ${mod.name}`}
                      >
                        {isAssigned ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{mod.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Technical Permissions Checklist (Clickable to customize) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Permisos Operativos Asignados:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(user.permissions).map(([permKey, hasPerm]) => {
                    const key = permKey as keyof StaffUser['permissions'];

                    return (
                      <div
                        key={permKey}
                        onClick={() => handleTogglePermission(user, key)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          hasPerm
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 hover:opacity-100'
                        }`}
                        title="Clic para alternar este permiso"
                      >
                        <span className="text-[11px] font-medium leading-tight select-none">
                          {permissionLabels[key]}
                        </span>
                        {hasPerm ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-[10px] shrink-0 font-bold">
                            ✕
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
