import React, { useState } from 'react';
import {
  Pill,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Users,
  BellRing,
  BarChart3,
  ShieldCheck,
  Search,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  User,
  Key,
  Copy,
  Check,
  FileCode2,
  Sparkles,
  Command
} from 'lucide-react';

type SimulatedRole = 'admin' | 'supervisor' | 'cajero' | 'almacenero';

export const Phase6FrontendView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shell_preview' | 'code_viewer'>('shell_preview');
  const [selectedRole, setSelectedRole] = useState<SimulatedRole>('admin');
  const [activeSection, setActiveSection] = useState<string>('pos');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Role permissions map for the dynamic sidebar
  const rolePermissions: Record<SimulatedRole, { name: string; title: string; allowedModules: string[] }> = {
    admin: {
      name: 'Carlos Mendoza (Propietario)',
      title: 'Administrador General',
      allowedModules: ['dashboard', 'pos', 'inventario', 'compras', 'clientes', 'alertas', 'reportes', 'usuarios', 'auditoria']
    },
    supervisor: {
      name: 'Dra. Elena Ramos',
      title: 'Supervisora de Botica',
      allowedModules: ['dashboard', 'pos', 'inventario', 'compras', 'clientes', 'alertas', 'reportes']
    },
    cajero: {
      name: 'Juan Pérez García',
      title: 'Cajero / Atención Mostrador',
      allowedModules: ['dashboard', 'pos', 'clientes']
    },
    almacenero: {
      name: 'Roberto Dávila',
      title: 'Almacén & Logística',
      allowedModules: ['dashboard', 'inventario', 'compras', 'alertas']
    }
  };

  const navMenuItems = [
    { id: 'dashboard', label: 'Dashboard Resumen', icon: LayoutDashboard, badge: null },
    { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingCart, badge: '< 3 clics' },
    { id: 'inventario', label: 'Inventario & Lotes FEFO', icon: Boxes, badge: 'FEFO' },
    { id: 'clientes', label: 'Atención al Cliente', icon: Users, badge: null },
    { id: 'compras', label: 'Compras & Droguerías', icon: Truck, badge: null },
    { id: 'alertas', label: 'Centro de Alertas', icon: BellRing, badge: '4' },
    { id: 'reportes', label: 'Reportes & Curva ABC', icon: BarChart3, badge: null },
    { id: 'usuarios', label: 'Usuarios & Matriz RBAC', icon: ShieldCheck, badge: 'Admin' },
  ];

  const currentRoleConfig = rolePermissions[selectedRole];

  const handleCopyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(key);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const codeSnippets = {
    middleware: `// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que no exigen sesión activa
const PUBLIC_ROUTES = ['/login', '/recuperar-clave'];

// Mapa de módulos requeridos por ruta para el control RBAC
const ROUTE_MODULE_MAP: Record<string, string> = {
  '/dashboard/pos': 'pos_sales',
  '/dashboard/inventario': 'inventory_batches',
  '/dashboard/compras': 'purchases_suppliers',
  '/dashboard/clientes': 'customers_loyalty',
  '/dashboard/alertas': 'alerts_replenishment',
  '/dashboard/reportes': 'reports_bi',
  '/dashboard/usuarios': 'auth_rbac',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Extraer JWT emitido por Supabase Auth almacenado en cookie httpOnly
  const token = request.cookies.get('sb-access-token')?.value;

  // Redirigir al login si no hay token
  if (!token) {
    if (!PUBLIC_ROUTES.includes(pathname) && !pathname.startsWith('/_next')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Si ya tiene sesión activa y accede a /login, enviar directo al POS o dashboard
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard/pos', request.url));
  }

  // 2. Control de Rutas Protegidas por Matriz RBAC
  for (const [routePrefix, requiredModule] of Object.entries(ROUTE_MODULE_MAP)) {
    if (pathname.startsWith(routePrefix)) {
      // Extrae claims o consulta cookie segura de permisos
      const permissionsCookie = request.cookies.get('user_perms')?.value;
      if (permissionsCookie) {
        try {
          const perms = JSON.parse(permissionsCookie);
          // Si no tiene permiso de lectura en el módulo, redireccionar a pantalla de acceso denegado
          if (!perms.isRootAdmin && !perms[requiredModule]?.canView) {
            return NextResponse.redirect(new URL('/dashboard/acceso-denegado', request.url));
          }
        } catch {
          // Cookie malformada
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};`,

    layout: `// apps/web/app/(dashboard)/layout.tsx
import React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* 1. Barra Lateral Dinámica según Permisos */}
      <Sidebar />

      {/* 2. Área Principal de Contenido */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Barra Superior con Notificaciones y Buscador */}
        <Header />

        {/* Contenido Dinámico con Scroll Interno */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}`,

    sidebar: `// apps/web/components/dashboard/sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Pill,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  Truck,
  BellRing,
  BarChart3,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

const MENU_ITEMS = [
  { href: '/dashboard', label: 'Resumen General', icon: LayoutDashboard, moduleId: 'dashboard' },
  { href: '/dashboard/pos', label: 'Punto de Venta (POS)', icon: ShoppingCart, moduleId: 'pos_sales' },
  { href: '/dashboard/inventario', label: 'Inventario & FEFO', icon: Boxes, moduleId: 'inventory_batches' },
  { href: '/dashboard/clientes', label: 'Clientes & Recetas', icon: Users, moduleId: 'customers_loyalty' },
  { href: '/dashboard/compras', label: 'Compras & Droguerías', icon: Truck, moduleId: 'purchases_suppliers' },
  { href: '/dashboard/alertas', label: 'Alertas & Reposición', icon: BellRing, moduleId: 'alerts_replenishment' },
  { href: '/dashboard/reportes', label: 'Reportes & Curva ABC', icon: BarChart3, moduleId: 'reports_bi' },
  { href: '/dashboard/usuarios', label: 'Usuarios & Permisos', icon: ShieldCheck, moduleId: 'auth_rbac' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, isRootAdmin, userProfile, logout } = usePermissions();

  // Filtra los menús en caliente: solo muestra opciones autorizadas
  const visibleItems = MENU_ITEMS.filter((item) => {
    if (isRootAdmin || item.moduleId === 'dashboard') return true;
    return hasPermission(item.moduleId, 'view');
  });

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      {/* Logotipo de Botica Nova Salud */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
          <Pill className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
            Nova Salud
          </span>
          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
            Gestión Botica
          </span>
        </div>
      </div>

      {/* Navegación Filtrada por Matriz RBAC */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={\`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors \${
                isActive
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }\`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Perfil del Empleado y Botón Salir */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {userProfile?.fullName || 'Empleado'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {userProfile?.roleTitle || 'Cajero'}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}`,

    header: `// apps/web/components/dashboard/header.tsx
'use client';

import React, { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Bell, Search, Command, Sun, Moon, AlertTriangle } from 'lucide-react';

export function Header() {
  const { alertsCount, unreadAlerts } = usePermissions();
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Buscador Global (Atajo Ctrl+K) */}
      <div className="flex items-center gap-2 w-full max-w-md">
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 hover:border-slate-300 transition">
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            Buscar medicamento por nombre, DCI o código de barra...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-white dark:bg-slate-900 border text-slate-500">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Acciones de Cabecera: Alertas & Perfil */}
      <div className="flex items-center gap-3">
        {/* Campana con WebSocket Realtime Counter */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Bell className="h-4 w-4" />
            {alertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {alertsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}`
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
              Fase 6: Frontend Next.js 15 PWA
            </span>
            <span className="text-xs text-slate-500">Layout con Menú Dinámico según Matriz RBAC</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Layout del Dashboard, Sidebar Dinámico & Rutas Protegidas por Middleware
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Estructura responsive protegida en tres capas: Sidebar adaptativo, Header con WebSockets en tiempo real y Middleware perimetral.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('shell_preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'shell_preview'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Simulador de Layout en Vivo
          </button>
          <button
            onClick={() => setActiveTab('code_viewer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'code_viewer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Código Fuente (Next.js & Middleware)
          </button>
        </div>
      </div>

      {/* SUBTAB 1: SIMULADOR DE LAYOUT EN VIVO */}
      {activeTab === 'shell_preview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Role selector bar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Simular Sesión de Empleado (Observa cómo el Sidebar se adapta automáticamente):
              </span>
              <p className="text-[11px] text-slate-500">
                La barra lateral filtra y oculta los módulos a los que el empleado no tiene permiso de lectura.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['admin', 'supervisor', 'cajero', 'almacenero'] as SimulatedRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    selectedRole === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r === 'admin' ? '👑 Admin (Total)' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Mock Dashboard Shell */}
          <div className="border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row min-h-[580px]">
            {/* Sidebar */}
            <aside className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
              {/* Brand */}
              <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                      Nova Salud
                    </span>
                    <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                      Dashboard POS
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Nav Items */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
                  Módulos Habilitados
                </div>
                {navMenuItems.map((item) => {
                  const isAllowed = currentRoleConfig.allowedModules.includes(item.id);
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  if (!isAllowed) {
                    return null; // Oculto por Matriz RBAC
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* User badge */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {currentRoleConfig.name.charAt(0)}
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {currentRoleConfig.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {currentRoleConfig.title}
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
                {/* Search */}
                <div className="w-full max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar medicamento, DCI o código EAN..."
                      className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <kbd className="absolute right-2.5 top-2 hidden sm:inline-block text-[9px] font-mono text-slate-400 bg-white dark:bg-slate-900 border px-1 rounded">
                      ⌘K
                    </kbd>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
                    >
                      <BellRing className="h-4 w-4" />
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                        4
                      </span>
                    </button>

                    {/* Popover */}
                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-2 z-50 text-xs animate-fadeIn">
                        <div className="flex items-center justify-between font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span>Notificaciones Realtime</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">WebSockets Activo</span>
                        </div>
                        <div className="space-y-1.5 max-h-52 overflow-y-auto">
                          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 text-[11px]">
                            <strong>CRÍTICO:</strong> Lote LOT-2025-09B vencido. Bloqueado en POS.
                          </div>
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px]">
                            <strong>URGENTE:</strong> Amoxicilina vence en 28 días.
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                            <strong>QUIEBRE:</strong> Paracetamol 500mg con stock en cero.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">
                    {currentRoleConfig.title}
                  </div>
                </div>
              </header>

              {/* Main Content Render */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Módulo Activo:</span>
                    <span className="text-indigo-600 font-mono capitalize">{activeSection}</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Renderizado condicional con Next.js 15 App Router
                  </span>
                </div>

                {activeSection === 'pos' && (
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-emerald-500" />
                        Terminal de Punto de Venta (POS) - Flujo en Menos de 3 Clics
                      </h4>
                      <span className="text-xs text-emerald-600 font-mono font-bold">Atajos: F2 Busca | F4 Cliente | F9 Cobrar</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Búsqueda predictiva con escaneo de código de barras, selección atómica de lotes según vencimiento (FEFO) y emisión de ticket en menos de 45 segundos.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                        <span className="text-slate-500 block">1. Escaneo de Producto</span>
                        <strong className="text-slate-800 dark:text-white">Búsqueda reactiva &lt;50ms</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                        <span className="text-slate-500 block">2. Asignación Lote FEFO</span>
                        <strong className="text-emerald-600">Automático (0 clics)</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                        <span className="text-slate-500 block">3. Confirmar & Cobro</span>
                        <strong className="text-indigo-600">Transacción ACID</strong>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'inventario' && (
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-blue-500" />
                      Inventario Farmacéutico & Trazabilidad por Lote
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Catálogo con principios activos (DCI), registro sanitario DIGEMID y gavetas ordenadas por fecha de caducidad.
                    </p>
                  </div>
                )}

                {activeSection === 'usuarios' && (
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      Gestión de Usuarios & Matriz RBAC Granular
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Configuración Módulo × Acción (Ver, Crear, Editar, Eliminar) con propagación en caliente vía WebSockets sin desconexión del usuario.
                    </p>
                  </div>
                )}

                {activeSection !== 'pos' && activeSection !== 'inventario' && activeSection !== 'usuarios' && (
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                      Módulo de {activeSection}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Vista activa protegida por el Middleware de Next.js y el guard de permisos en backend.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CÓDIGO FUENTE FRONTEND */}
      {activeTab === 'code_viewer' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(codeSnippets).map(([key, code]) => (
              <div
                key={key}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {key === 'middleware'
                      ? 'apps/web/middleware.ts'
                      : key === 'layout'
                      ? 'apps/web/app/(dashboard)/layout.tsx'
                      : key === 'sidebar'
                      ? 'apps/web/components/dashboard/sidebar.tsx'
                      : 'apps/web/components/dashboard/header.tsx'}
                  </span>
                  <button
                    onClick={() => handleCopyCode(key, code)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    {copiedFile === key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedFile === key ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
                <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[360px] leading-relaxed border border-slate-800">
                  <pre>{code}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
