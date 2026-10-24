import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Pill,
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  BellRing,
  Users,
  LogOut,
  X,
  ChevronRight
} from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  allowedTabs: string[];
  user: { name: string; role: string; roleTitle: string };
  onLogout: () => void;
}

const NAV: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Panel de control', icon: LayoutDashboard },
  { id: 'pos', label: 'Punto de venta', icon: ShoppingCart },
  { id: 'sales', label: 'Historial de ventas', icon: History },
  { id: 'inventory', label: 'Inventario y lotes', icon: Package },
  { id: 'alerts', label: 'Alertas de stock', icon: BellRing },
  { id: 'customers', label: 'Clientes', icon: Users }
];

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  allowedTabs,
  user,
  onLogout
}) => {
  const items = NAV.filter((i) => allowedTabs.includes(i.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <aside className="w-screen max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                    Botica Nova Salud
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Gestión de inventario y ventas</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" aria-label="Cerrar menú">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Módulos disponibles
            </div>
            <div className="px-1 py-1 space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition group-hover:scale-105">
                      {isSelected ? (
                        <Icon className="w-4 h-4 text-white" />
                      ) : (
                        <Icon className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                      )}
                    </div>
                    <span className="text-sm font-semibold truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white bg-emerald-600">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</div>
                <div className="text-[10px] text-emerald-600">{user.roleTitle}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
