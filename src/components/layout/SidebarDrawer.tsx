import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useI18n } from '../../i18n/I18nContext';
import { isTabAllowedForUser, getDefaultTabForUser } from '../../types/pharmacy';
import {
  Pill,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Banknote,
  Truck,
  BellRing,
  Users,
  ShieldCheck,
  FileText,
  LogOut,
  X,
  ChevronRight,
  Database,
  Activity
} from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab
}) => {
  const { currentUser, cashRegister, alerts, logout, switchCurrentUser, staffUsers } = usePharmacy();
  const { t } = useI18n();

  const allNavigationItems = [
    {
      id: 'dashboard',
      label: t('tab_dashboard'),
      description: 'Métricas comerciales, Recharts y flujo operativo en tiempo real',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'pos',
      label: t('tab_pos'),
      description: 'Dispensación rápida con asignación automática FEFO y comprobantes',
      icon: ShoppingCart,
      badge: 'FEFO Activo'
    },
    {
      id: 'inventory',
      label: t('tab_inventory'),
      description: 'Control de lotes, fechas de vencimiento, mermas y cuarentena',
      icon: Package,
      badge: null
    },
    {
      id: 'cash',
      label: t('tab_cash'),
      description: 'Apertura de turno, gastos menores y arqueo físico de caja',
      icon: Banknote,
      badge: cashRegister.isOpen ? `S/ ${cashRegister.currentCash.toFixed(2)}` : 'Cerrada'
    },
    {
      id: 'purchases',
      label: t('tab_purchases'),
      description: 'Droguerías, sugerencias de reposición y órdenes de compra',
      icon: Truck,
      badge: null
    },
    {
      id: 'alerts',
      label: t('tab_alerts'),
      description: 'Vencimientos críticos <30d y quiebres de mostrador',
      icon: BellRing,
      badge: alerts.length > 0 ? `${alerts.length} alertas` : null,
      badgeAlert: alerts.length > 0
    },
    {
      id: 'customers',
      label: t('tab_customers'),
      description: 'Fichas de pacientes, historial de compras y alergias',
      icon: Users,
      badge: null
    },
    {
      id: 'staff',
      label: t('tab_staff'),
      description: 'Personal de botica y asignación de permisos del sistema',
      icon: ShieldCheck,
      badge: null
    },
    {
      id: 'reports',
      label: t('tab_reports'),
      description: 'Libro oficial de psicotrópicos DIGEMID y balance regulatorio',
      icon: FileText,
      badge: 'DIGEMID'
    },
    {
      id: 'backups',
      label: '💾 Respaldos & Base de Datos',
      description: 'Programación de copias automáticas y descarga manual de inventario y ventas',
      icon: Database,
      badge: 'Admin'
    },
    {
      id: 'audit',
      label: '📋 Log de Actividades & Trazabilidad',
      description: 'Registro en tiempo real de ventas, inventario y cambios de permisos',
      icon: Activity,
      badge: 'Live'
    }
  ];

  // ONLY show the modules this collaborator has access to - Omit completely any non-assigned module
  const allowedItems = allNavigationItems.filter(item => isTabAllowedForUser(currentUser, item.id));

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  const handleSwitchUser = (userId: string) => {
    const targetUser = staffUsers.find(u => u.id === userId);
    switchCurrentUser(userId);
    // If current activeTab is not allowed for the new user, switch to their default permitted tab
    if (targetUser && !isTabAllowedForUser(targetUser, activeTab)) {
      setActiveTab(getDefaultTabForUser(targetUser));
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <aside className="w-screen max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Top Header of Sidebar */}
          <div>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Pill className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Botica Nova Salud
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      v2.6
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Panel Lateral de Operaciones
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Cerrar panel lateral"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Staff Card */}
            <div className="p-4 mx-4 my-3 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-800/80 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs text-white ${
                    currentUser.role === 'regente'
                      ? 'bg-emerald-600'
                      : currentUser.role === 'admin'
                      ? 'bg-blue-600'
                      : currentUser.role === 'cajero'
                      ? 'bg-purple-600'
                      : 'bg-amber-600'
                  }`}>
                    {currentUser.avatarInitials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      {currentUser.roleTitle}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 capitalize shadow-2xs">
                  Turno {currentUser.activeShift}
                </span>
              </div>
            </div>

            {/* Navigation Options List - ONLY showing authorized modules */}
            <div className="px-3 py-2 space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Módulos de Gestión
              </div>

              {allowedItems.map(item => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {item.label}
                        </div>
                        <div className={`text-[10px] truncate ${
                          isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-2 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : item.badgeAlert
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions of Sidebar */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Cambio de Colaborador en Turno
            </div>

            {/* Quick Switch User */}
            <div className="space-y-1.5">
              <select
                value={currentUser.id}
                onChange={e => handleSwitchUser(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
              >
                {staffUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.roleTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs transition shadow-md shadow-rose-900/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
