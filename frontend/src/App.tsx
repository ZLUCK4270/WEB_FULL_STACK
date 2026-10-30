import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n/I18nContext';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Header } from './components/Header';
import { SidebarDrawer } from './components/layout/SidebarDrawer';
import { MobileNavigationDock } from './components/layout/MobileNavigationDock';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { PointOfSaleView } from './components/pos/PointOfSaleView';
import { InventoryBatchesView } from './components/inventory/InventoryBatchesView';
import { ActiveAlertsView } from './components/alerts/ActiveAlertsView';
import { CustomersView } from './components/customers/CustomersView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';

type TabId = 'dashboard' | 'pos' | 'sales' | 'inventory' | 'alerts' | 'customers';

const TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Panel de control' },
  { id: 'pos', label: 'Punto de venta' },
  { id: 'sales', label: 'Historial de ventas' },
  { id: 'inventory', label: 'Inventario' },
  { id: 'alerts', label: 'Alertas' },
  { id: 'customers', label: 'Clientes' }
];

const tabsByRole: Record<string, TabId[]> = {
  admin: ['dashboard', 'pos', 'sales', 'inventory', 'alerts', 'customers'],
  vendedor: ['dashboard', 'pos', 'sales', 'customers', 'alerts'],
  almacen: ['dashboard', 'inventory', 'alerts']
};

function defaultTabFor(role: string | undefined): TabId {
  return (tabsByRole[role ?? 'vendedor'] ?? ['dashboard'])[0];
}

export const DashboardShell: React.FC = () => {
  const { user, isLoading, logout, pendingAlerts } = usePharmacy();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const allowedTabs = tabsByRole[user?.role ?? 'vendedor'] ?? ['dashboard'];

  useEffect(() => {
    if (user && !allowedTabs.includes(activeTab)) {
      setActiveTab(defaultTabFor(user.role));
    }
  }, [user, allowedTabs, activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Iniciando Botica Nova Salud...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const isAllowed = (tab: TabId) => allowedTabs.includes(tab);

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onLogout={logout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 transition-all">
        <div className="animate-in fade-in duration-200">
          {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === 'pos' && <PointOfSaleView />}
          {activeTab === 'sales' && <SalesHistoryView />}
          {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <InventoryBatchesView />
            </div>
          )}
          {activeTab === 'alerts' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <ActiveAlertsView />
            </div>
          )}
          {activeTab === 'customers' && <CustomersView />}
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-4 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800">Botica Nova Salud S.A.C.</span>
            <span className="text-slate-400">• Sistema de inventario, ventas y atención al cliente</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>{user.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">{user.role}</span>
          </div>
        </div>
      </footer>

      <MobileNavigationDock
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allowedTabs={allowedTabs}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        pendingAlerts={pendingAlerts}
      />

      <QuickSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveTab}
        allowedTabs={allowedTabs}
      />

      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allowedTabs={allowedTabs}
        user={user}
        onLogout={logout}
      />
    </div>
  );
};

type QuickSearchProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
  allowedTabs: TabId[];
};

const QuickSearch: React.FC<QuickSearchProps> = ({ isOpen, onClose, onNavigate, allowedTabs }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Buscar módulo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {TABS.filter((t) => allowedTabs.includes(t.id)).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onNavigate(t.id);
                onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left text-sm font-medium transition hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <span>{t.label}</span>
              <span className="text-[10px] text-slate-400">Módulo {t.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <PharmacyProvider>
        <DashboardShell />
      </PharmacyProvider>
    </LanguageProvider>
  );
}
