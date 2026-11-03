import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShoppingCart,
  Package,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  KeyRound,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { usersApi } from '../../services/pharmacyApi';
import { SystemUser, UserRole } from '../../types/pharmacy';
import { usePharmacy } from '../../context/PharmacyContext';

export const UsersManagementView: React.FC = () => {
  const { user: currentUser } = usePharmacy();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Formulario Crear
  const [createDni, setCreateDni] = useState('');
  const [createNombre, setCreateNombre] = useState('');
  const [createApellido, setCreateApellido] = useState('');
  const [createCorreo, setCreateCorreo] = useState('');
  const [createTelefono, setCreateTelefono] = useState('');
  const [createCargo, setCreateCargo] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('vendedor');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Formulario Editar
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('vendedor');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Mensaje de éxito / notificación
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.listUsers();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setNotification({
        message: err.response?.data?.error || 'Error al cargar lista de usuarios',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Manejador del cambio de rol al crear (sugiere cargo)
  const handleRoleChangeCreate = (role: UserRole) => {
    setCreateRole(role);
    if (role === 'admin') {
      setCreateCargo('Q.F. Regente / Administrador General');
    } else if (role === 'almacen') {
      setCreateCargo('Encargado de Almacén y Control BPA');
    } else {
      setCreateCargo('Técnico en Farmacia / Cajero POS');
    }
  };

  const openCreateModal = () => {
    setCreateDni('');
    setCreateNombre('');
    setCreateApellido('');
    setCreateCorreo('');
    setCreateTelefono('');
    setCreateRole('vendedor');
    setCreateCargo('Técnico en Farmacia / Cajero POS');
    setCreatePassword('');
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!/^\d{8}$/.test(createDni.trim())) {
      setCreateError('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }
    if (!createNombre.trim() || !createApellido.trim()) {
      setCreateError('Los nombres y apellidos son requeridos.');
      return;
    }
    if (!createPassword || createPassword.length < 6) {
      setCreateError('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    setCreateLoading(true);
    try {
      await usersApi.createUser({
        dni: createDni.trim(),
        nombre: createNombre.trim(),
        apellido: createApellido.trim(),
        correo: createCorreo.trim() || undefined,
        telefono: createTelefono.trim() || undefined,
        cargo: createCargo.trim() || undefined,
        role: createRole,
        password: createPassword,
        esta_activo: true
      });

      setShowCreateModal(false);
      showToast(`Usuario ${createNombre} ${createApellido} creado exitosamente.`);
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || err.message || 'Error al crear el usuario.');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (targetUser: SystemUser) => {
    setSelectedUser(targetUser);
    setEditNombre(targetUser.nombre);
    setEditApellido(targetUser.apellido);
    setEditCorreo(targetUser.correo || '');
    setEditTelefono(targetUser.telefono || '');
    setEditCargo(targetUser.cargo);
    setEditRole(targetUser.role);
    setEditPassword('');
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError('');

    if (!editNombre.trim() || !editApellido.trim()) {
      setEditError('Los nombres y apellidos son requeridos.');
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setEditError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setEditLoading(true);
    try {
      await usersApi.updateUser(selectedUser.id, {
        nombre: editNombre.trim(),
        apellido: editApellido.trim(),
        correo: editCorreo.trim() || undefined,
        telefono: editTelefono.trim() || undefined,
        cargo: editCargo.trim() || undefined,
        role: editRole,
        password: editPassword.trim() || undefined
      });

      setShowEditModal(false);
      showToast(`Usuario ${editNombre} ${editApellido} actualizado correctamente.`);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.response?.data?.error || err.message || 'Error al actualizar el usuario.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (targetUser: SystemUser) => {
    if (currentUser?.id === targetUser.id) {
      showToast('No puede desactivar su propia cuenta activa actual.', 'error');
      return;
    }

    const actionText = targetUser.esta_activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Está seguro de ${actionText} la cuenta de ${targetUser.name}?`)) {
      return;
    }

    try {
      const res = await usersApi.toggleUserStatus(targetUser.id);
      showToast(`Usuario ${targetUser.name} ${res.esta_activo ? 'activado' : 'desactivado'}.`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al cambiar estado del usuario.', 'error');
    }
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      u.dni.includes(term) ||
      u.name.toLowerCase().includes(term) ||
      (u.correo && u.correo.toLowerCase().includes(term)) ||
      u.cargo.toLowerCase().includes(term);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.esta_activo) ||
      (statusFilter === 'inactive' && !u.esta_activo);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Métricas
  const totalEmployees = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const cashierCount = users.filter((u) => u.role === 'vendedor').length;
  const warehouseCount = users.filter((u) => u.role === 'almacen').length;
  const activeCount = users.filter((u) => u.esta_activo).length;

  return (
    <div className="space-y-6">
      {/* Toast Notificación */}
      {notification && (
        <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            Gestión de Personal & Rangos de Acceso (RBAC)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Administración centralizada de empleados, creación de cuentas y control estricto de roles según normativa de botica.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Recargar usuarios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Empleado / Usuario</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Total Personal
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalEmployees}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Registrados en sistema
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admins / Q.F.
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {adminCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Acceso total irrestricto
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            Caja & Ventas
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {cashierCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            POS, Ventas y Caja
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Almacén & BPA
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {warehouseCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Lotes FEFO y Compras
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Cuentas Activas
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Habilitadas para login
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por DNI, nombres, apellidos o cargo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Todos los Rangos</option>
            <option value="admin">Administrador General</option>
            <option value="vendedor">Cajero POS / Vendedor</option>
            <option value="almacen">Almacén y BPA</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-sm font-semibold">Cargando nómina de empleados...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">No se encontraron usuarios</p>
            <p className="text-xs text-slate-500 mt-1">Pruebe ajustando los filtros de búsqueda o registre un nuevo usuario.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">DNI</th>
                  <th className="px-5 py-3.5">Empleado</th>
                  <th className="px-5 py-3.5">Rango de Acceso (Rol)</th>
                  <th className="px-5 py-3.5">Cargo Funcional</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5">Último Acceso</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {u.dni}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-extrabold uppercase">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                          {u.correo && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {u.correo}
                            </span>
                          )}
                          {u.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.telefono}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            Administrador General
                          </span>
                        ) : u.role === 'almacen' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Almacén & BPA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                            <ShoppingCart className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            Cajero POS / Ventas
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {u.cargo}
                      </td>

                      <td className="px-5 py-4">
                        {u.esta_activo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {u.ultimo_acceso
                          ? new Date(u.ultimo_acceso).toLocaleString('es-PE', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })
                          : 'Sin ingresos'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar usuario y rol"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.esta_activo
                                ? 'border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                            title={u.esta_activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {u.esta_activo ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 sm:p-8 my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Registrar Nuevo Empleado
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cree una cuenta para el nuevo personal y defina su rango de acceso.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  DNI del Empleado (8 dígitos) *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={createDni}
                    onChange={(e) => setCreateDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    maxLength={8}
                    required
                    placeholder="Ej. 74839201"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={createNombre}
                    onChange={(e) => setCreateNombre(e.target.value)}
                    required
                    placeholder="Ej. Mariana"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={createApellido}
                    onChange={(e) => setCreateApellido(e.target.value)}
                    required
                    placeholder="Ej. Ramos Castro"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={createCorreo}
                    onChange={(e) => setCreateCorreo(e.target.value)}
                    placeholder="empleado@novasalud.pe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teléfono Móvil (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={createTelefono}
                    onChange={(e) => setCreateTelefono(e.target.value)}
                    placeholder="987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Selector de Rango de Acceso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Rango de Acceso en el Sistema (Rol RBAC) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRoleChangeCreate('admin')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      createRole === 'admin'
                        ? 'bg-teal-500/10 border-teal-500 text-teal-800 dark:text-teal-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600 mb-1.5" />
                    <div className="text-xs font-bold">Administrador</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Acceso irrestricto</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChangeCreate('vendedor')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      createRole === 'vendedor'
                        ? 'bg-sky-500/10 border-sky-500 text-sky-800 dark:text-sky-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 text-sky-600 mb-1.5" />
                    <div className="text-xs font-bold">Cajero POS</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Ventas, Caja y Clientes</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChangeCreate('almacen')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      createRole === 'almacen'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Package className="w-4 h-4 text-amber-600 mb-1.5" />
                    <div className="text-xs font-bold">Almacén & BPA</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Stock FEFO y Compras</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cargo Descriptivo en la Botica
                </label>
                <input
                  type="text"
                  value={createCargo}
                  onChange={(e) => setCreateCargo(e.target.value)}
                  placeholder="Ej. Técnico de Farmacia / Cajero POS"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña Inicial de Acceso (mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Vista previa de módulos permitidos */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Módulos habilitados para este perfil:
                </span>
                {createRole === 'admin' ? (
                  <span>Acceso total: Panel de Control, POS, Ventas, Inventario FEFO, Caja, Compras, Alertas, Clientes, Personal y Auditoría.</span>
                ) : createRole === 'almacen' ? (
                  <span>Panel de Control, Inventario y Lotes FEFO, Compras y Reposición, Alertas de Stock y Vencimiento.</span>
                ) : (
                  <span>Punto de Venta (POS), Historial de Ventas, Caja Registradora / Turnos, Clientes y Pacientes.</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {createLoading ? 'Creando empleado...' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 sm:p-8 my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Edit2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Editar Empleado / Rol
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Actualice los datos o el rango de acceso de <strong className="text-slate-800 dark:text-slate-200">{selectedUser.name}</strong> (DNI: {selectedUser.dni}).
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={editApellido}
                    onChange={(e) => setEditApellido(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={editCorreo}
                    onChange={(e) => setEditCorreo(e.target.value)}
                    placeholder="correo@novasalud.pe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teléfono Móvil
                  </label>
                  <input
                    type="tel"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    placeholder="987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Rango de Acceso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Rango de Acceso (Rol RBAC) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditRole('admin');
                      if (!editCargo) setEditCargo('Q.F. Regente / Administrador General');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      editRole === 'admin'
                        ? 'bg-teal-500/10 border-teal-500 text-teal-800 dark:text-teal-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600 mb-1.5" />
                    <div className="text-xs font-bold">Administrador</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Acceso irrestricto</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditRole('vendedor');
                      if (!editCargo) setEditCargo('Técnico en Farmacia / Cajero POS');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      editRole === 'vendedor'
                        ? 'bg-sky-500/10 border-sky-500 text-sky-800 dark:text-sky-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 text-sky-600 mb-1.5" />
                    <div className="text-xs font-bold">Cajero POS</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Ventas, Caja y Clientes</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditRole('almacen');
                      if (!editCargo) setEditCargo('Encargado de Almacén y Control BPA');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      editRole === 'almacen'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Package className="w-4 h-4 text-amber-600 mb-1.5" />
                    <div className="text-xs font-bold">Almacén & BPA</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Stock FEFO y Compras</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cargo Descriptivo en la Botica
                </label>
                <input
                  type="text"
                  value={editCargo}
                  onChange={(e) => setEditCargo(e.target.value)}
                  placeholder="Ej. Farmacéutico Asistente"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Restablecer Contraseña (Opcional)</span>
                  <span className="text-[10px] font-normal text-slate-500">Dejar vacío para conservar actual</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="•••••••• (nueva clave)"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {editLoading ? 'Guardando cambios...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

