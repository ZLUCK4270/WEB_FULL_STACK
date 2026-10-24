import React, { useState, useEffect } from 'react';
import { LanguageProvider, useI18n } from './i18n/I18nContext';
import { WebPushProvider } from './context/WebPushContext';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { isTabAllowedForUser, getDefaultTabForUser } from './types/pharmacy';
import { Header } from './components/Header';
import { SidebarDrawer } from './components/layout/SidebarDrawer';
import { MobileNavigationDock } from './components/layout/MobileNavigationDock';
import { QuickCommandPalette } from './components/common/QuickCommandPalette';
import { LoginView } from './components/auth/LoginView';
import { AccessDeniedView } from './components/common/AccessDeniedView';
import { UserProfileModal } from './components/UserProfileModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { PushToastBanner } from './components/PushToastBanner';

// Operational Business Suite Components
import { WelcomePortalView } from './components/dashboard/WelcomePortalView';
import { PointOfSaleView } from './components/pos/PointOfSaleView';
import { InventoryBatchesView } from './components/inventory/InventoryBatchesView';
import { CashRegisterView } from './components/cash/CashRegisterView';
import { PurchasesSuppliersView } from './components/purchases/PurchasesSuppliersView';
import { ActiveAlertsView } from './components/alerts/ActiveAlertsView';
import { CustomersView } from './components/customers/CustomersView';
import { StaffRolesView } from './components/staff/StaffRolesView';
import { DigemidReportsView } from './components/reports/DigemidReportsView';

import { Pill, CheckCircle2, ShieldCheck, HeartPulse } from 'lucide-react';

function DashboardMain() {
  const { isLoggedIn, currentUser } = usePharmacy();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const { t } = useI18n();

  // Global Keyboard shortcut: Ctrl+K or Cmd+K to open search palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col justify-between selection:bg-emerald-500 selection:text-white ${
        isDarkMode
          ? 'dark bg-slate-950 text-slate-100'
          : 'bg-slate-50/80 text-slate-900'
      }`}
    >
      <div className="flex-1 flex flex-col">
        {/* Responsive, Dynamic Glass Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* Main Workspace Container (With bottom safe padding for mobile dock) */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 lg:pb-12 transition-all">
          {/* RBAC Route Guard */}
          {!isCurrentTabAllowed ? (
            <AccessDeniedView
              attemptedTab={activeTab}
              onNavigate={setActiveTab}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
          ) : (
            <div className="animate-in fade-in duration-200">
              {activeTab === 'dashboard' && (
                <WelcomePortalView onNavigate={setActiveTab} />
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
              {activeTab === 'sql' && <StaffRolesView initialSubTab="sql" />}
            </div>
          )}
        </main>
      </div>

      {/* Operational Humanized Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-5 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                Botica Nova Salud S.A.C.
              </span>
              <span className="mx-2 text-slate-400">•</span>
              <span>{t('footer_system_live')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Colaborador activo:</span>
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                {currentUser.name}
              </strong>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[10px]">
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

      {/* Mobile Bottom Navigation Dock (Native-feeling mobile app experience) */}
      <MobileNavigationDock
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Quick Search & Command Palette Modal (Ctrl + K) */}
      <QuickCommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveTab}
      />

      {/* Lateral Menu Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Global Overlays & Modals */}
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
