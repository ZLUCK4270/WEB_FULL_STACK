import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { isTabAllowedForUser } from '../../types/pharmacy';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Banknote,
  BellRing,
  Menu,
  ShieldCheck,
  Search
} from 'lucide-react';

interface MobileNavigationDockProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}

export const MobileNavigationDock: React.FC<MobileNavigationDockProps> = ({
  activeTab,
  setActiveTab,
  onOpenSidebar,
  onOpenSearch
}) => {
  const { currentUser, alerts, cashRegister } = usePharmacy();

  // Primary mobile actions that matter most in day-to-day work
  const dockItems = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: LayoutDashboard,
      requiresTab: 'dashboard'
    },
    {
      id: 'pos',
      label: 'Venta',
      icon: ShoppingCart,
      requiresTab: 'pos'
    },
    {
      id: 'inventory',
      label: 'Lotes',
      icon: Package,
      requiresTab: 'inventory'
    },
    {
      id: 'cash',
      label: 'Caja',
      icon: Banknote,
      requiresTab: 'cash',
      badge: cashRegister.isOpen ? 'S/' : null
    }
  ];

  // Filter items allowed for this user
  const visibleItems = dockItems.filter(item =>
    isTabAllowedForUser(currentUser, item.requiresTab)
  );

  return (
    <nav
      aria-label="Navegación móvil rápida"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-all"
    >
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        {/* Quick Search on mobile */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center p-2 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition active:scale-95 cursor-pointer min-w-[56px] min-h-[48px]"
          aria-label="Buscar medicamento o módulo"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Buscar</span>
        </button>

        {/* Primary Allowed Tabs */}
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer min-w-[56px] min-h-[48px] ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              {/* Active pill background aura */}
              {isActive && (
                <span className="absolute inset-x-2 inset-y-1 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-xl -z-10" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-emerald-600 text-white text-[8px] font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* Menu Drawer Opener ("Más") */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="relative flex flex-col items-center justify-center p-2 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition active:scale-95 cursor-pointer min-w-[56px] min-h-[48px]"
          aria-label="Ver todos los módulos y opciones"
        >
          <div className="relative">
            <Menu className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white">
                {alerts.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold mt-0.5">Módulos</span>
        </button>
      </div>
    </nav>
  );
};
