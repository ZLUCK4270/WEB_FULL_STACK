import React, { useState, useEffect } from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { LanguageProvider } from './i18n/I18nContext';
import { Header } from './components/Header';
import { SidebarDrawer } from './components/layout/SidebarDrawer';
import { DashboardView } from './components/dashboard/DashboardView';
import { PointOfSaleView } from './components/pos/PointOfSaleView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { InventoryBatchesView } from './components/inventory/InventoryBatchesView';
import { CashRegisterView } from './components/cash/CashRegisterView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { ActiveAlertsView } from './components/alerts/ActiveAlertsView';
import { CustomersView } from './components/customers/CustomersView';
import { AuditView } from './components/audit/AuditView';
import { LoginView } from './components/auth/LoginView';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useMotion } from './hooks/useMotion';

export type TabId =
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'inventory'
  | 'cash'
  | 'purchases'
  | 'alerts'
  | 'customers'
  | 'audit';

const ROLE_PERMISSIONS: Record<string, TabId[]> = {
  admin: ['dashboard', 'pos', 'sales', 'inventory', 'cash', 'purchases', 'alerts', 'customers', 'audit'],
  vendedor: ['pos', 'sales', 'cash', 'customers'],
  cajero: ['pos', 'sales', 'cash', 'customers'],
  almacen: ['dashboard', 'inventory', 'purchases', 'alerts'],
  almacenero: ['dashboard', 'inventory', 'purchases', 'alerts'],
};

const MainLayout: React.FC = () => {
  const { user, logout, alerts } = usePharmacy();
  const [activeTab, setActiveTab] = useState<TabId>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('nova_theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('nova_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('nova_theme', 'light');
    }
  }, [darkMode]);

  const allowedTabs: TabId[] = user ? (ROLE_PERMISSIONS[user.role] || ['pos']) : [];
  const defaultTabForRole: TabId = user?.role === 'almacen' ? 'inventory' : 'pos';
  const currentTab: TabId = allowedTabs.includes(activeTab) ? activeTab : defaultTabForRole;

  if (!user) {
    return <LoginView />;
  }

  const pendingAlerts = alerts.filter(a => String(a.estado).toUpperCase() === 'PENDIENTE').length;
  const hasPermission = allowedTabs.includes(currentTab);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as TabId);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <Header
        activeTab={currentTab}
        setActiveTab={setActiveTab}
        allowedTabs={allowedTabs}
        pendingAlerts={pendingAlerts}
        user={user}
        onLogout={logout}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
      />

      {/* Contenedor principal en fila: el panel lateral empuja el contenido sin superponerse */}
      <div className="flex-1 flex min-h-0">
        <SidebarDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={currentTab}
          setActiveTab={handleNavigate}
          pendingAlerts={pendingAlerts}
          user={user}
          allowedTabs={allowedTabs}
          onLogout={logout}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {!hasPermission ? (
              <div className="max-w-md mx-auto mt-16 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Acceso Restringido</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                  Tu perfil actual (<span className="font-bold uppercase text-slate-800 dark:text-slate-100">{user.roleTitle || user.role}</span>) no cuenta con permisos para acceder a este módulo.
                </p>
                <button
                  onClick={() => setActiveTab(defaultTabForRole)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al módulo principal
                </button>
              </div>
            ) : (
              <div key={currentTab} className="m-view">
                {currentTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
                {currentTab === 'pos' && <PointOfSaleView />}
                {currentTab === 'sales' && <SalesHistoryView />}
                {currentTab === 'inventory' && <InventoryBatchesView />}
                {currentTab === 'cash' && <CashRegisterView />}
                {currentTab === 'purchases' && <PurchasesView />}
                {currentTab === 'alerts' && <ActiveAlertsView onNavigate={handleNavigate} />}
                {currentTab === 'customers' && <CustomersView />}
                {currentTab === 'audit' && <AuditView />}
              </div>
            )}
          </main>

          <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-auto hidden md:block transition-colors">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 dark:text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Botica Nova Salud • Sistema Integral ERP Farmacéutico</span>
              </div>
              <div>
                Rol activo: <strong className="uppercase text-slate-800 dark:text-slate-200">{user.roleTitle || user.role}</strong> • Cumplimiento BPA / DIGEMID / FEFO
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export function App() {
  useMotion();

  return (
    <LanguageProvider>
      <PharmacyProvider>
        <MainLayout />
      </PharmacyProvider>
    </LanguageProvider>
  );
}

export default App;
