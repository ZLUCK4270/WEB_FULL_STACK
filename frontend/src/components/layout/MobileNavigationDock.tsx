import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  BellRing,
  Users,
  Menu,
  Search
} from 'lucide-react';

interface MobileNavigationDockProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  allowedTabs: string[];
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  pendingAlerts: number;
}

const DOCK: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'pos', label: 'Venta', icon: ShoppingCart },
  { id: 'sales', label: 'Historial', icon: History },
  { id: 'inventory', label: 'Lotes', icon: Package },
  { id: 'alerts', label: 'Alertas', icon: BellRing },
  { id: 'customers', label: 'Clientes', icon: Users }
];

export const MobileNavigationDock: React.FC<MobileNavigationDockProps> = ({
  activeTab,
  setActiveTab,
  allowedTabs,
  onOpenSidebar,
  onOpenSearch,
  pendingAlerts
}) => {
  const visible = DOCK.filter((i) => allowedTabs.includes(i.id));

  return (
    <nav aria-label="Navegación móvil rápida" className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-2xl">
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center p-2 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition active:scale-95 cursor-pointer min-w-[56px] min-h-[48px]"
          aria-label="Buscar módulo"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Buscar</span>
        </button>

        {visible.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasAlert = item.id === 'alerts' && pendingAlerts > 0;
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
              {isActive && <span className="absolute inset-x-2 inset-y-1 bg-emerald-500/10 rounded-xl -z-10" />}
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {hasAlert && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white">
                    {pendingAlerts}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenSidebar}
          className="relative flex flex-col items-center justify-center p-2 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition active:scale-95 cursor-pointer min-w-[56px] min-h-[48px]"
          aria-label="Ver todos los módulos"
        >
          <div className="relative">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold mt-0.5">Más</span>
        </button>
      </div>
    </nav>
  );
};
