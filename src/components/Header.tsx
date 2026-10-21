import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useWebPush } from '../context/WebPushContext';
import { usePharmacy } from '../context/PharmacyContext';
import { isTabAllowedForUser } from '../types/pharmacy';
import {
  Pill,
  Menu,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Banknote,
  Truck,
  BellRing,
  Bell,
  Users,
  ShieldCheck,
  FileText,
  Globe,
  User,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Database,
  Activity,
  FileCode,
  Search,
  Sparkles,
  Command
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onOpenSidebar: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  onOpenSidebar,
  onOpenSearch
}) => {
  const { language, setLanguage, t, setIsProfileModalOpen } = useI18n();
  const { unreadCount, setIsDrawerOpen } = useWebPush();
  const { cashRegister, currentUser, alerts, logout, systemDate } = usePharmacy();

  const tabLabels: { [key: string]: { label: string; icon: any } } = {
    dashboard: { label: t('tab_dashboard'), icon: LayoutDashboard },
    pos: { label: t('tab_pos'), icon: ShoppingCart },
    inventory: { label: t('tab_inventory'), icon: Package },
    cash: { label: t('tab_cash'), icon: Banknote },
    purchases: { label: t('tab_purchases'), icon: Truck },
    alerts: { label: `${t('tab_alerts')} (${alerts.length})`, icon: BellRing },
    customers: { label: t('tab_customers'), icon: Users },
    staff: { label: t('tab_staff'), icon: ShieldCheck },
    reports: { label: t('tab_reports'), icon: FileText },
    backups: { label: '💾 Respaldos & BD', icon: Database },
    audit: { label: '📋 Log de Actividades', icon: Activity },
    sql: { label: '⚡ Scripts SQL & INSERT JOIN', icon: FileCode }
  };

  const currentTabInfo = tabLabels[activeTab] || tabLabels.dashboard;
  const CurrentIcon = currentTabInfo.icon;

  const toggleLanguage = () => {
    const nextLang = language === 'es' ? 'en' : 'es';
    setLanguage(nextLang);
  };

  // Determine warm, natural greeting based on local time
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? '¡Buenos días'
      : currentHour < 19
      ? '¡Buenas tardes'
      : '¡Buenas noches';

  const firstName = currentUser.name.split(' ')[0] || 'Colaborador';

  return (
    <header
      className={`border-b transition-colors sticky top-0 z-40 backdrop-blur-xl ${
        isDarkMode
          ? 'bg-slate-950/85 border-slate-800/80 text-white shadow-lg shadow-black/20'
          : 'bg-white/85 border-slate-200/80 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Left: Sidebar Toggle & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            {/* Sidebar Opener Button */}
            <button
              onClick={onOpenSidebar}
              className="p-2 sm:px-3 sm:py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition flex items-center gap-2 font-bold text-xs shadow-2xs group active:scale-95 cursor-pointer shrink-0"
              title="Abrir menú de módulos"
              aria-label="Abrir panel lateral de opciones"
            >
              <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline font-extrabold tracking-tight">
                {t('sidebar_menu')}
              </span>
            </button>

            {/* Brand Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <Pill className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent truncate">
                    Nova Salud
                  </span>
                  <span className="hidden xl:inline px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                    BPOF DIGEMID
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                  <CurrentIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {currentTabInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Quick Search Trigger (Friendly, Natural, Non-Robotic) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-2">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition flex items-center justify-between text-xs cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" />
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Buscar medicamento, módulo o acción...
                </span>
              </div>
              <kbd className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-400">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Right: Cash status, search icon on mobile, alerts, theme, profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Buscar en el sistema"
              aria-label="Abrir buscador"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Live Cash Register Pill */}
            {isTabAllowedForUser(currentUser, 'cash') ? (
              <button
                type="button"
                onClick={() => setActiveTab('cash')}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  cashRegister.isOpen
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-300/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-300/80 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
                }`}
                title="Ir al arqueo de caja"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    cashRegister.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span>Caja: S/ {cashRegister.currentCash.toFixed(2)}</span>
              </button>
            ) : null}

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs font-bold shadow-2xs cursor-pointer"
              title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              aria-label="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline font-mono">{language === 'es' ? 'ES' : 'EN'}</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Notificaciones push del sistema"
              aria-label="Abrir centro de notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Alternar tema visual"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Active User Avatar & Natural Greeting */}
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition text-xs cursor-pointer shadow-2xs"
              title="Ver perfil del colaborador"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs ${
                  currentUser.role === 'regente'
                    ? 'bg-emerald-600'
                    : currentUser.role === 'admin'
                    ? 'bg-blue-600'
                    : currentUser.role === 'cajero'
                    ? 'bg-purple-600'
                    : 'bg-amber-600'
                }`}
              >
                {currentUser.avatarInitials}
              </div>
              <div className="text-left hidden md:block">
                <div className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {greeting}, {firstName}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-none font-medium">
                  {currentUser.roleTitle}
                </div>
              </div>
            </button>

            {/* Direct Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Cerrar turno y salir del sistema"
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
