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
  Activity
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  onOpenSidebar
}) => {
  const { language, setLanguage, t, setIsProfileModalOpen } = useI18n();
  const { unreadCount, setIsDrawerOpen } = useWebPush();
  const { cashRegister, currentUser, alerts, logout } = usePharmacy();

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
    audit: { label: '📋 Log de Actividades', icon: Activity }
  };

  const currentTabInfo = tabLabels[activeTab] || tabLabels.dashboard;
  const CurrentIcon = currentTabInfo.icon;

  const toggleLanguage = () => {
    const nextLang = language === 'es' ? 'en' : 'es';
    setLanguage(nextLang);
  };

  return (
    <header className={`border-b transition-colors sticky top-0 z-40 backdrop-blur-md ${
      isDarkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Menu Toggle Icon & Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* The Prominent Sidebar Toggle Button requested by user */}
            <button
              onClick={onOpenSidebar}
              className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition flex items-center gap-2 font-bold text-xs shadow-2xs group active:scale-95"
              title="Abrir panel lateral de opciones y módulos"
              aria-label="Abrir panel lateral de opciones"
            >
              <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-extrabold tracking-wide">
                {t('sidebar_menu')}
              </span>
            </button>

            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
                    {t('app_title')}
                  </span>
                  <span className="hidden lg:inline px-2 py-0.2 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {t('business_badge')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <CurrentIcon className="w-3.5 h-3.5 text-emerald-600" />
                    {currentTabInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Cash status, language, notifications, user & logout */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Cash Register or Warehouse Status */}
            {isTabAllowedForUser(currentUser, 'cash') ? (
              <button
                onClick={() => setActiveTab('cash')}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                  cashRegister.isOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
                }`}
                title="Ir a control de caja"
              >
                <span className={`h-2 w-2 rounded-full ${cashRegister.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="font-semibold">
                  Caja: S/ {cashRegister.currentCash.toFixed(2)}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('inventory')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold cursor-pointer"
                title="Módulo de almacén activo"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Almacén & FEFO</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition text-xs font-bold shadow-2xs"
              title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              aria-label="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}</span>
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title={language === 'en' ? 'Web Push Notifications' : 'Notificaciones Push Web'}
              aria-label="Abrir centro de notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Active Staff User Profile */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs"
              title="Ver Perfil y Preferencias de Usuario"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.avatarInitials}
              </div>
              <div className="text-left hidden lg:block">
                <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1]}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  {currentUser.roleTitle}
                </div>
              </div>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Alternar tema visual"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Logout Button (Direct in Header) */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition shadow-2xs"
              title="Cerrar sesión de colaborador para permitir el ingreso de otro usuario"
              aria-label="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
