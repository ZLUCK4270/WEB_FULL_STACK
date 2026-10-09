import React, { useState, useEffect } from 'react';
import { LanguageProvider, useI18n } from './i18n/I18nContext';
import { WebPushProvider } from './context/WebPushContext';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { isTabAllowedForUser, getDefaultTabForUser } from './types/pharmacy';
import { Header } from './components/Header';
import { SidebarDrawer } from './components/layout/SidebarDrawer';
import { LoginView } from './components/auth/LoginView';
import { AccessDeniedView } from './components/common/AccessDeniedView';
import { UserProfileModal } from './components/UserProfileModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { PushToastBanner } from './components/PushToastBanner';

// Operational Business Suite Components
import { BusinessExecutiveDashboard } from './components/dashboard/BusinessExecutiveDashboard';
import { PointOfSaleView } from './components/pos/PointOfSaleView';
import { InventoryBatchesView } from './components/inventory/InventoryBatchesView';
import { CashRegisterView } from './components/cash/CashRegisterView';
import { PurchasesSuppliersView } from './components/purchases/PurchasesSuppliersView';
import { ActiveAlertsView } from './components/alerts/ActiveAlertsView';
import { CustomersView } from './components/customers/CustomersView';
import { StaffRolesView } from './components/staff/StaffRolesView';
import { DigemidReportsView } from './components/reports/DigemidReportsView';

import { Pill, CheckCircle2, ShieldAlert, Menu, Lock } from 'lucide-react';

function DashboardMain() {
  const { isLoggedIn, currentUser } = usePharmacy();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const { t } = useI18n();

  // Synchronize active tab whenever currentUser changes to avoid leaving user on a forbidden module
  useEffect(() => {
    if (currentUser && !isTabAllowedForUser(currentUser, activeTab)) {
      setActiveTab(getDefaultTabForUser(currentUser));
    }
  }, [currentUser]);

  // If user is logged out, show the full-screen authentication & login screen
  if (!isLoggedIn) {
    return <LoginView />;
  }

  // Check if current tab is permitted for current role
  const isCurrentTabAllowed = isTabAllowedForUser(currentUser, activeTab);

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col justify-between ${
      isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div>
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        {/* Floating Quick Action Button to open the Lateral Sidebar */}
        <div className="fixed bottom-6 right-6 z-30 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-950/40 border border-emerald-400/40 active:scale-95 transition"
            aria-label="Abrir panel lateral de opciones"
          >
            <Menu className="w-5 h-5" />
            <span>Módulos ({currentUser.allowedTabs.length})</span>
          </button>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* RBAC Route Guard: If role cannot access this module, display AccessDeniedView */}
          {!isCurrentTabAllowed ? (
            <AccessDeniedView
              attemptedTab={activeTab}
              onNavigate={setActiveTab}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <BusinessExecutiveDashboard onNavigate={setActiveTab} />
              )}
              {activeTab === 'pos' && <PointOfSaleView />}
              {activeTab === 'inventory' && <InventoryBatchesView />}
              {activeTab === 'cash' && <CashRegisterView />}
              {activeTab === 'purchases' && <PurchasesSuppliersView />}
              {activeTab === 'alerts' && <ActiveAlertsView />}
              {activeTab === 'customers' && <CustomersView />}
              {activeTab === 'staff' && <StaffRolesView initialSubTab="staff" />}
              {activeTab === 'reports' && <DigemidReportsView />}
              {activeTab === 'backups' && <StaffRolesView initialSubTab="backups" />}
              {activeTab === 'audit' && <StaffRolesView initialSubTab="audit" />}
            </>
          )}
        </main>
      </div>

      {/* Operational Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center">
              <Pill className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Botica Nova Salud S.A.C.</span>
              <span className="mx-2">•</span>
              <span>{t('footer_system_live')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Colaborador activo:</span>
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{currentUser.name}</strong>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[10px]">
                {currentUser.roleTitle}
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('footer_digemid_compliant')}
            </span>
          </div>
        </div>
      </footer>

      {/* Expandable Sidebar Drawer (Opened by the menu icon button) */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Global Overlays & Drawers */}
      <UserProfileModal />
      <NotificationsDrawer />
      <PushToastBanner />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <WebPushProvider>
        <PharmacyProvider>
          <DashboardMain />
        </PharmacyProvider>
      </WebPushProvider>
    </LanguageProvider>
  );
}
