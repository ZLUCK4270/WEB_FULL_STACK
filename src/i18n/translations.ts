export type Language = 'es' | 'en';

export const TRANSLATIONS = {
  es: {
    app_title: 'Botica Nova Salud',
    app_subtitle: 'Sistema de Gestión Farmacéutica Centralizado • Operaciones en Tiempo Real',
    business_badge: 'Operación Comercial Activa',
    theme_light: '☀️ Claro',
    theme_dark: '🌙 Oscuro',
    tab_dashboard: 'Panel de Control',
    tab_pos: 'Punto de Venta (POS)',
    tab_inventory: 'Inventario & FEFO',
    tab_cash: 'Caja Registradora',
    tab_purchases: 'Compras & Reposición',
    tab_alerts: 'Centro de Alertas',
    tab_customers: 'Clientes',
    tab_audit: 'Auditoría & Seguridad',
    logout: 'Cerrar Sesión',
    login_title: 'Inicio de Sesión',
    login_btn: 'Ingresar al Sistema'
  },
  en: {
    app_title: 'Nova Salud Pharmacy',
    app_subtitle: 'Centralized Pharmacy Management System • Real-Time Operations',
    business_badge: 'Active Commercial Operation',
    theme_light: '☀️ Light',
    theme_dark: '🌙 Dark',
    tab_dashboard: 'Dashboard',
    tab_pos: 'Point of Sale (POS)',
    tab_inventory: 'Inventory & FEFO',
    tab_cash: 'Cash Register',
    tab_purchases: 'Purchases & Replenishment',
    tab_alerts: 'Alerts Center',
    tab_customers: 'Customers',
    tab_audit: 'Audit & Security',
    logout: 'Sign Out',
    login_title: 'Sign In',
    login_btn: 'Sign In'
  }
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.es;

