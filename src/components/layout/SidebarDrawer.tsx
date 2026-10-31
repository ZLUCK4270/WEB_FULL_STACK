import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  BellRing,
  Users,
  LogOut,
  PanelLeftClose,
  Banknote,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { TabId } from '../../App';
import { AuthUser } from '../../types/pharmacy';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingAlerts?: number;
  user: AuthUser;
  allowedTabs: string[];
  onLogout: () => void;
}

const NAV: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Panel de control', icon: LayoutDashboard },
  { id: 'pos', label: 'Punto de venta', icon: ShoppingCart },
  { id: 'sales', label: 'Historial de ventas', icon: History },
  { id: 'inventory', label: 'Inventario y lotes', icon: Package },
  { id: 'cash', label: 'Caja registradora', icon: Banknote },
  { id: 'purchases', label: 'Compras y reposición', icon: Truck },
  { id: 'alerts', label: 'Alertas de stock y FEFO', icon: BellRing },
  { id: 'customers', label: 'Clientes y pacientes', icon: Users },
  { id: 'audit', label: 'Auditoría y seguridad', icon: ShieldCheck },
];

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  pendingAlerts = 0,
  user,
  allowedTabs,
  onLogout,
}) => {
  const items = NAV.filter((i) => allowedTabs.includes(i.id));

  if (!isOpen) return null;

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 4)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

  return (
    <aside className="w-64 lg:w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between select-none transition-all duration-200">
      <div className="p-3.5">
        <div className="flex items-center justify-between px-2.5 py-2 mb-1">
          <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Módulos del Sistema
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Ocultar panel lateral"
            aria-label="Ocultar panel lateral"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between gap-2.5 transition text-left cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-600/20'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/15 text-white'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm truncate">{item.label}</span>
                </div>

                {item.id === 'alerts' && pendingAlerts > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-extrabold rounded-full shrink-0 ${
                      isSelected ? 'bg-white text-emerald-700' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {pendingAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white bg-emerald-600 shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              {user.name}
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              {user.roleTitle || user.role}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
};
