import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { StaffUser } from '../../types/pharmacy';
import { BackupConfigModule } from '../admin/BackupConfigModule';
import { ActivityLogView } from '../admin/ActivityLogView';
import { SqlExportView } from '../admin/SqlExportView';
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
  Activity,
  Trash2,
  Lock,
  UserPlus,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck2,
  Copy,
  FileCode
} from 'lucide-react';

interface StaffRolesViewProps {
  initialSubTab?: 'staff' | 'backups' | 'audit' | 'sql';
}

export const StaffRolesView: React.FC<StaffRolesViewProps> = ({ initialSubTab = 'staff' }) => {
  const {
    staffUsers,
    currentUser,
    switchCurrentUser,
    updateStaffPermissions,
    addStaffUser,
    updateStaffUserPassword,
    deleteStaffUser,
    backupConfig,
    activityLogs
  } = usePharmacy();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'staff' | 'backups' | 'audit' | 'sql'>(
    initialSubTab
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [passwordModalUser, setPasswordModalUser] = useState<StaffUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [showPasswordToggle, setShowPasswordToggle] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // New Collaborator Form State
  const [newName, setNewName] = useState<string>('');
  const [newDni, setNewDni] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<StaffUser['role']>('cajero');
  const [newRoleTitle, setNewRoleTitle] = useState<string>('Técnica en Farmacia / POS');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newColegiatura, setNewColegiatura] = useState<string>('');
  const [newActiveShift, setNewActiveShift] = useState<'mañana' | 'tarde' | 'noche'>('mañana');
  const [newAllowedTabs, setNewAllowedTabs] = useState<string[]>(['pos', 'cash', 'alerts']);

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
    { id: 'audit', name: 'Log de Actividades', desc: 'Trazabilidad y auditoría continua' },
    { id: 'sql', name: 'Scripts SQL & INSERT JOIN', desc: 'Datos externos y DDL' }
  ];

  const handleRoleChangeForNewUser = (role: StaffUser['role']) => {
    setNewRole(role);
    if (role === 'regente') {
      setNewRoleTitle('Farmacéutico Regente Titular');
      setNewAllowedTabs([
        'dashboard',
        'pos',
        'inventory',
        'cash',
        'purchases',
        'alerts',
        'customers',
        'staff',
        'reports',
        'backups',
        'audit'
      ]);
    } else if (role === 'admin') {
      setNewRoleTitle('Administrador General de Operaciones');
      setNewAllowedTabs([
        'dashboard',
        'pos',
        'inventory',
        'cash',
        'purchases',
        'alerts',
        'customers',
        'staff',
        'reports',
        'backups',
        'audit'
      ]);
    } else if (role === 'cajero') {
      setNewRoleTitle('Técnico/a en Farmacia / Cajero POS');
      setNewAllowedTabs(['pos', 'cash', 'customers', 'alerts']);
    } else {
      setNewRoleTitle('Asistente de Almacén & Logística FEFO');
      setNewAllowedTabs(['inventory', 'purchases', 'alerts']);
    }
  };

  const handleToggleModule = (user: StaffUser, moduleId: string) => {
    const isCurrentlyAllowed = user.allowedTabs.includes(moduleId);
    let updatedTabs: string[];

    if (isCurrentlyAllowed) {
      if (user.allowedTabs.length <= 1) return;
      updatedTabs = user.allowedTabs.filter(id => id !== moduleId);
    } else {
      updatedTabs = [...user.allowedTabs, moduleId];
    }

    const updatedPermissions = { ...user.permissions };
    if (moduleId === 'pos') updatedPermissions.canSell = !isCurrentlyAllowed;
    if (moduleId === 'inventory') updatedPermissions.canReceiveBatches = !isCurrentlyAllowed;
    if (moduleId === 'cash') updatedPermissions.canOpenCloseCash = !isCurrentlyAllowed;

    updateStaffPermissions(user.id, updatedTabs, updatedPermissions);
  };

  const handleTogglePermission = (
    user: StaffUser,
    permKey: keyof StaffUser['permissions']
  ) => {
    const updatedPermissions = {
      ...user.permissions,
      [permKey]: !user.permissions[permKey]
    };
    updateStaffPermissions(user.id, user.allowedTabs, updatedPermissions);
  };

  const handleCreateCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setStatusNotification({
        type: 'error',
        message: 'Complete todos los campos obligatorios (Nombre, Usuario y Contraseña).'
      });
      return;
    }

    // Verify username is not taken
    const exists = staffUsers.some(
      u =>
        u.username.toLowerCase() === newUsername.trim().toLowerCase() ||
        (newDni.trim() && u.dni === newDni.trim())
    );
    if (exists) {
      setStatusNotification({
        type: 'error',
        message: `El usuario "@${newUsername}" o DNI "${newDni}" ya se encuentra registrado.`
      });
      return;
    }

    const permissions: StaffUser['permissions'] = {
      canSell: newAllowedTabs.includes('pos'),
      canReceiveBatches: newAllowedTabs.includes('inventory'),
      canAdjustStock: newRole === 'regente' || newRole === 'admin' || newRole === 'almacen',
      canOpenCloseCash: newAllowedTabs.includes('cash'),
      canViewFinancials: newRole === 'admin' || newRole === 'regente',
      canManageStaff: newRole === 'admin',
      canSignDigemidReports: newRole === 'regente'
    };

    const created = addStaffUser({
      name: newName.trim(),
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      role: newRole,
      roleTitle: newRoleTitle.trim(),
      dni: newDni.trim() || '00000000',
      email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@novasalud.pe`,
      colegiatura: newRole === 'regente' && newColegiatura.trim() ? newColegiatura.trim() : undefined,
      activeShift: newActiveShift,
      allowedTabs: newAllowedTabs,
      permissions
    });

    setIsAddModalOpen(false);
    // Reset form
    setNewName('');
    setNewDni('');
    setNewUsername('');
    setNewPassword('');
    setNewEmail('');
    setNewColegiatura('');

    setStatusNotification({
      type: 'success',
      message: `Colaborador ${created.name} (@${created.username}) registrado exitosamente. Ya puede iniciar sesión con la clave asignada.`
    });

    setTimeout(() => {
      setStatusNotification(null);
    }, 5000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordInput.trim()) return;

    const ok = updateStaffUserPassword(passwordModalUser.id, newPasswordInput.trim());
    if (ok) {
      setStatusNotification({
        type: 'success',
        message: `Contraseña actualizada para @${passwordModalUser.username}. Nuevas credenciales listas para inicio de sesión.`
      });
      setPasswordModalUser(null);
      setNewPasswordInput('');
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  const handleDeleteUser = (user: StaffUser) => {
    if (user.id === currentUser.id) {
      setStatusNotification({
        type: 'error',
        message: 'No puede eliminar al usuario que tiene la sesión iniciada actualmente.'
      });
      return;
    }
    if (confirm(`¿Está seguro de dar de baja al colaborador ${user.name} (@${user.username})? Ya no podrá acceder al sistema.`)) {
      const res = deleteStaffUser(user.id);
      if (res.success) {
        setStatusNotification({
          type: 'success',
          message: `Colaborador ${user.name} dado de baja del sistema.`
        });
        setTimeout(() => setStatusNotification(null), 4000);
      } else {
        setStatusNotification({
          type: 'error',
          message: res.error || 'No se pudo eliminar el colaborador.'
        });
      }
    }
  };

  // Filter staff users
  const filteredUsers = staffUsers.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.dni.includes(searchTerm) ||
      u.roleTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
              Registre colaboradores, asigne contraseñas de acceso y configure permisos según su cargo sanitario.
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

      {/* Status Notification Banner */}
      {statusNotification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium animate-in fade-in ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusNotification.message}</span>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="p-1 hover:opacity-70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Panel Subtab Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveAdminSubTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeAdminSubTab === 'staff'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Personal & Permisos</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeAdminSubTab === 'staff'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {staffUsers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubTab('backups')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeAdminSubTab === 'backups'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Respaldos Automáticos & Base de Datos</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeAdminSubTab === 'backups'
                ? 'bg-emerald-800 text-white'
                : backupConfig.enabled
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
            }`}
          >
            {backupConfig.enabled ? 'Auto Activo' : 'Pausado'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeAdminSubTab === 'audit'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Log de Actividades & Trazabilidad</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeAdminSubTab === 'audit'
                ? 'bg-purple-800 text-white'
                : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
            }`}
          >
            {activityLogs.length} en vivo
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubTab('sql')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeAdminSubTab === 'sql'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Scripts SQL & INSERT JOIN</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeAdminSubTab === 'sql'
                ? 'bg-indigo-800 text-white'
                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
            }`}
          >
            .SQL Externo
          </span>
        </button>
      </div>

      {activeAdminSubTab === 'backups' ? (
        <BackupConfigModule />
      ) : activeAdminSubTab === 'audit' ? (
        <ActivityLogView />
      ) : activeAdminSubTab === 'sql' ? (
        <SqlExportView />
      ) : (
        /* Staff Subtab */
        <div className="space-y-5">
          {/* Information Notice for Administrator */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 dark:text-emerald-200">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">
                  Seguridad y Separación de Credenciales:
                </strong>
                Los colaboradores ingresan al sistema mediante la pantalla de login estándar. Como
                administrador, registre aquí los nuevos colaboradores y asígneles su usuario y
                clave inicial para que puedan acceder a sus respectivos turnos.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Registrar Colaborador</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, usuario o DNI..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Rol:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
              >
                <option value="all">Todos los Roles ({staffUsers.length})</option>
                <option value="regente">Regente Titular</option>
                <option value="admin">Administrador General</option>
                <option value="cajero">Cajero / POS</option>
                <option value="almacen">Almacén / Logística</option>
              </select>
            </div>
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredUsers.map(user => {
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
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base text-white shrink-0 ${
                          user.role === 'regente'
                            ? 'bg-emerald-600'
                            : user.role === 'admin'
                            ? 'bg-blue-600'
                            : user.role === 'cajero'
                            ? 'bg-purple-600'
                            : 'bg-amber-600'
                        }`}
                      >
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
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300">
                            @{user.username}
                          </span>
                          <span>• DNI: {user.dni}</span>
                          <span>• Turno: {user.activeShift}</span>
                          {user.colegiatura && (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              • {user.colegiatura}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordModalUser(user);
                          setNewPasswordInput('');
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Cambiar contraseña de acceso"
                      >
                        <Key className="w-4 h-4" />
                      </button>

                      {!isActive && (
                        <>
                          <button
                            type="button"
                            onClick={() => switchCurrentUser(user.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-xs font-extrabold transition shadow-xs flex items-center gap-1 cursor-pointer"
                            title="Cambiar a la sesión de este colaborador"
                          >
                            <span>Asumir</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Dar de baja colaborador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Interactive Module Assignment */}
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

                  {/* Technical Permissions Checklist */}
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
        </div>
      )}

      {/* Modal: Registrar Nuevo Colaborador */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Registrar Nuevo Colaborador
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cree la cuenta de acceso y credenciales que utilizará en la pantalla de login.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCollaborator} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nombres y Apellidos *:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ej: Lic. Elena Morales Pérez"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                </div>

                {/* DNI */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    DNI / Documento *:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={newDni}
                    onChange={e => setNewDni(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 72819203"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                </div>

                {/* Rol Sanitario / Operativo */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Rol en la Botica *:
                  </label>
                  <select
                    value={newRole}
                    onChange={e => handleRoleChangeForNewUser(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium cursor-pointer"
                  >
                    <option value="cajero">Cajero / Técnico en Farmacia POS</option>
                    <option value="almacen">Asistente de Almacén & Logística FEFO</option>
                    <option value="regente">Farmacéutico Regente Titular</option>
                    <option value="admin">Administrador General de Operaciones</option>
                  </select>
                </div>

                {/* Cargo Oficial */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Título o Cargo Oficial:
                  </label>
                  <input
                    type="text"
                    value={newRoleTitle}
                    onChange={e => setNewRoleTitle(e.target.value)}
                    placeholder="Ej: Técnica en Farmacia Turno Mañana"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                </div>

                {/* Nombre de Usuario para Login */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nombre de Usuario (Login) *:
                  </label>
                  <div className="relative">
                    <span className="text-slate-400 text-xs absolute left-3 top-2.5 font-bold">@</span>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      placeholder="ej: emorales"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium font-mono"
                    />
                  </div>
                </div>

                {/* Contraseña Inicial */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contraseña de Acceso Asignada *:
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Ej: farma2026"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium font-mono"
                  />
                </div>

                {/* Turno Habitual */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Turno Asignado:
                  </label>
                  <select
                    value={newActiveShift}
                    onChange={e => setNewActiveShift(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium cursor-pointer"
                  >
                    <option value="mañana">🌅 Turno Mañana (07:00 - 15:00)</option>
                    <option value="tarde">🌇 Turno Tarde (15:00 - 23:00)</option>
                    <option value="noche">🌙 Turno Noche (23:00 - 07:00)</option>
                  </select>
                </div>

                {/* Colegiatura (si es regente) */}
                {newRole === 'regente' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Colegiatura Sanitaria CQFP:
                    </label>
                    <input
                      type="text"
                      value={newColegiatura}
                      onChange={e => setNewColegiatura(e.target.value)}
                      placeholder="Ej: CQFP N° 21045"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Módulos Habilitados */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Módulos a Habilitar en su Panel:
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  {AVAILABLE_MODULES.map(mod => {
                    const isChecked = newAllowedTabs.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (newAllowedTabs.length > 1) {
                              setNewAllowedTabs(newAllowedTabs.filter(id => id !== mod.id));
                            }
                          } else {
                            setNewAllowedTabs([...newAllowedTabs, mod.id]);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {isChecked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{mod.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar y Habilitar Acceso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cambiar Contraseña */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setPasswordModalUser(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Restablecer Contraseña
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Colaborador: {passwordModalUser.name} (@{passwordModalUser.username})
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nueva Contraseña de Acceso:
                </label>
                <div className="relative">
                  <input
                    type={showPasswordToggle ? 'text' : 'password'}
                    required
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    placeholder="Ingrese nueva contraseña"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordToggle(!showPasswordToggle)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPasswordToggle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Esta clave será requerida al colaborador en la pantalla de inicio de sesión.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Guardar Nueva Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
