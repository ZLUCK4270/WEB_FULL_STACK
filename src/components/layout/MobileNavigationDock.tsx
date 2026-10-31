import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Wallet,
  Truck,
  Bell,
  Users,
  ShieldCheck,
  Search,
  Menu,
} from 'lucide-react';
import { TabId } from '../../App';

interface MobileNavigationDockProps {
  activeTab: TabId;
  setActiveTab: (tab: string) => void;
  allowedTabs: TabId[];
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  pendingAlerts: number;
}

export const MobileNavigationDock: React.FC<MobileNavigationDockProps> = ({
  activeTab,
  setActiveTab,
  allowedTabs,
  onOpenSidebar,
  onOpenSearch,
  pendingAlerts,
}) => {
  const items: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'sales', label: 'Ventas', icon: Receipt },
    { id: 'inventory', label: 'Stock', icon: Package },
    { id: 'cash', label: 'Caja', icon: Wallet },
    { id: 'purchases', label: 'Compras', icon: Truck },
    { id: 'alerts', label: 'Alertas', icon: Bell, badge: pendingAlerts },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'audit', label: 'Auditoría', icon: ShieldCheck },
  ];

  const visibleItems = items.filter((item) => allowedTabs.includes(item.id));

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around overflow-x-auto">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all min-w-[52px] ${
              isActive
                ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="truncate max-w-[60px]">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute top-0.5 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 min-w-[48px]"
      >
        <Search className="w-4 h-4 mb-0.5" />
        <span>Buscar</span>
      </button>
      <button
        onClick={onOpenSidebar}
        className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 min-w-[48px]"
      >
        <Menu className="w-4 h-4 mb-0.5" />
        <span>Menú</span>
      </button>
    </nav>
  );
};
