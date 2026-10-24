import React from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Menu, LayoutDashboard, ShoppingCart, History, Package, BellRing, Users, LogOut, Pill } from 'lucide-react';

const tabInfo: Record<string, { label: string; icon: React.ElementType }> = {
  dashboard: { label: 'Panel de control', icon: LayoutDashboard },
  pos: { label: 'Punto de venta', icon: ShoppingCart },
  sales: { label: 'Historial de ventas', icon: History },
  inventory: { label: 'Inventario', icon: Package },
  alerts: { label: 'Alertas', icon: BellRing },
  customers: { label: 'Clientes', icon: Users }
};

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { name: string; role: string; roleTitle: string };
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenSidebar,
  onOpenSearch,
  onLogout
}) => {
  const current = tabInfo[activeTab] ?? tabInfo.dashboard;
  const CurrentIcon = current.icon;

  return (
    <header className="border-b sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-slate-200/90 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenSidebar}
              className="p-2 sm:px-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-2 font-bold text-xs cursor-pointer"
              title="Abrir menú de módulos"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:inline">Módulos</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0">
                <Pill className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 truncate">
                    Nova Salud
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                  <CurrentIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{current.label}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenSearch}
              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
              title="Buscar módulo (Ctrl+K)"
              aria-label="Buscar módulo"
            >
              Buscar módulo
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer transition"
              title="Perfil del colaborador"
            >
              <div className="w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-bold text-white bg-emerald-600 shadow-xs">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-slate-800 leading-tight">{user.name}</div>
                <div className="text-[10px] text-emerald-600 font-medium">{user.roleTitle}</div>
              </div>
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
