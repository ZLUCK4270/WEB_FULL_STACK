import React from 'react';
import {
  Pill,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Bell,
  LogOut,
  Users,
  Wallet,
  Truck,
  ShieldCheck,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { TabId } from '../App';
import { AuthUser } from '../types/pharmacy';

interface HeaderProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  allowedTabs: TabId[];
  pendingAlerts: number;
  user: AuthUser;
  onLogout: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  allowedTabs,
  pendingAlerts,
  user,
  onLogout,
  isSidebarOpen,
  onToggleSidebar,
  darkMode,
  onToggleDarkMode,
}) => {
  const tabMeta: Record<TabId, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    dashboard: { label: 'Panel de control', icon: LayoutDashboard },
    pos: { label: 'Punto de venta', icon: ShoppingCart },
    sales: { label: 'Historial de ventas', icon: Receipt },
    inventory: { label: 'Inventario y lotes', icon: Package },
    cash: { label: 'Caja registradora', icon: Wallet },
    purchases: { label: 'Compras y reposición', icon: Truck },
    alerts: { label: 'Alertas de stock y FEFO', icon: Bell },
    customers: { label: 'Clientes y pacientes', icon: Users },
    audit: { label: 'Auditoría y seguridad', icon: ShieldCheck },
  };

  const current = tabMeta[activeTab] || tabMeta.pos;
  const CurrentIcon = current.icon;

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 4)
    .map(part => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Single Button to Toggle Lateral Panel + Brand + Current Module Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onToggleSidebar}
              className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold tracking-wide transition-all cursor-pointer ${
                isSidebarOpen
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs shadow-emerald-600/20'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
              }`}
              aria-label={isSidebarOpen ? 'Ocultar panel lateral de módulos' : 'Mostrar panel lateral de módulos'}
              title={isSidebarOpen ? 'Ocultar panel lateral de módulos' : 'Mostrar panel lateral de módulos'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 shrink-0" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 shrink-0" />
              )}
              <span>Módulos</span>
              {pendingAlerts > 0 && !isSidebarOpen && (
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-600 text-white leading-none">
                  {pendingAlerts}
                </span>
              )}
            </button>

            <div
              onClick={() => setActiveTab(allowedTabs.includes('dashboard') ? 'dashboard' : 'pos')}
              className="flex items-center gap-2.5 select-none cursor-pointer group"
            >
              <div className="bg-emerald-600 p-2 rounded-xl shadow-xs shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
                <Pill className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white block">
                  Nova Salud
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CurrentIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{current.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Theme Toggle + User Profile + Logout */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              title={darkMode ? 'Cambiar a Modo Claro Clínico' : 'Cambiar a Modo Oscuro'}
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline">Modo Oscuro</span>
                </>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                {initials}
              </div>
              <div className="text-xs leading-tight">
                <div className="font-bold text-slate-900 dark:text-white">
                  {user.name}
                </div>
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {user.roleTitle || user.role}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xl:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
