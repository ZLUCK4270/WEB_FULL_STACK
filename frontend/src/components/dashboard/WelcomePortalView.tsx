import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useI18n } from '../../i18n/I18nContext';
import { isTabAllowedForUser } from '../../types/pharmacy';
import {
  ShoppingCart,
  Package,
  Banknote,
  Truck,
  BellRing,
  Users,
  ShieldCheck,
  FileText,
  Database,
  Activity,
  FileCode,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  BarChart3,
  ChevronDown,
  Layers
} from 'lucide-react';
import { ExecutivePerformanceCharts } from './ExecutivePerformanceCharts';
import { SalesTrend7DaysChart } from './SalesTrend7DaysChart';

interface WelcomePortalViewProps {
  onNavigate: (tabId: string) => void;
}

export const WelcomePortalView: React.FC<WelcomePortalViewProps> = ({ onNavigate }) => {
  const {
    currentUser,
    sales,
    batches,
    products,
    cashRegister,
    alerts,
    systemDate
  } = usePharmacy();
  const { t } = useI18n();

  const [showAdvancedCharts, setShowAdvancedCharts] = useState<boolean>(false);

  // Time-of-day greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? '¡Buenos días'
      : currentHour < 19
      ? '¡Buenas tardes'
      : '¡Buenas noches';

  // Basic Metrics of the Day
  const todaySales = sales.filter(s => {
    try {
      return s.date.startsWith(systemDate) || s.date.slice(0, 10) === systemDate;
    } catch {
      return false;
    }
  });

  const totalVendidoHoy = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalBoletas = todaySales.length;
  const activeBatchesCount = batches.filter(b => b.status === 'active' && b.stock > 0).length;

  // Catalog of interactive module cards
  const allModules = [
    {
      id: 'pos',
      title: 'Punto de Venta (POS)',
      description: 'Atención rápida en mostrador, emisión de boletas/facturas y salida FEFO.',
      icon: ShoppingCart,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Operación Principal'
    },
    {
      id: 'inventory',
      title: 'Inventario & Lotes FEFO',
      description: 'Control de existencias físicas, semáforo de vencimientos y recepción.',
      icon: Package,
      color: 'from-blue-500 to-indigo-600',
      badge: `${activeBatchesCount} lotes vigentes`
    },
    {
      id: 'cash',
      title: 'Caja Chica & Arqueo',
      description: 'Control de ingresos/egresos, fondo de apertura y cuadre de turno.',
      icon: Banknote,
      color: 'from-amber-500 to-orange-600',
      badge: cashRegister.isOpen ? 'Turno Abierto' : 'Cerrada'
    },
    {
      id: 'customers',
      title: 'Pacientes & Clientes',
      description: 'Fichas con DNI/RUC, historial de recetas y alergias declaradas.',
      icon: Users,
      color: 'from-violet-500 to-purple-600',
      badge: 'Atención Farmacéutica'
    },
    {
      id: 'alerts',
      title: 'Centro de Alertas',
      description: 'Notificaciones preventivas de lotes por vencer y reposición de stock.',
      icon: BellRing,
      color: 'from-rose-500 to-red-600',
      badge: `${alerts.length} activas`,
      badgeAlert: alerts.length > 0
    },
    {
      id: 'purchases',
      title: 'Compras & Proveedores',
      description: 'Órdenes de compra a droguerías, cotizaciones y abastecimiento.',
      icon: Truck,
      color: 'from-sky-500 to-cyan-600'
    },
    {
      id: 'staff',
      title: 'Personal & Roles RBAC',
      description: 'Matriz de permisos por cargo, altas de colaboradores y claves.',
      icon: ShieldCheck,
      color: 'from-indigo-600 to-purple-700'
    },
    {
      id: 'reports',
      title: 'Reportes Oficiales DIGEMID',
      description: 'Balances de psicotrópicos, control sanitario y libros de ocurrencias.',
      icon: FileText,
      color: 'from-teal-600 to-emerald-700'
    },
    {
      id: 'backups',
      title: 'Respaldos & Seguridad',
      description: 'Copias de seguridad del sistema, hash de integridad y restauración.',
      icon: Database,
      color: 'from-slate-700 to-slate-900'
    },
    {
      id: 'sql',
      title: 'Scripts SQL & INSERT',
      description: 'Sentencias relacionales DDL/DML, inserciones estructuradas y JOINs.',
      icon: FileCode,
      color: 'from-cyan-600 to-blue-700'
    }
  ];

  // Filter modules to only those permitted for this user's role
  const userAllowedModules = allModules.filter(m => isTabAllowedForUser(currentUser, m.id));

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. BANNER DE BIENVENIDA HUMANO Y CÁLIDO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Portal de Inicio • Botica Nova Salud</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {greeting}, {currentUser.name}!
            </h1>

            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Tu estación de trabajo está activa con el rol de{' '}
              <strong className="text-white font-bold">{currentUser.roleTitle}</strong>.
              Accede a tus módulos autorizados desde los accesos rápidos o revisa el estado del día.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-emerald-200">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 backdrop-blur-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                Turno {currentUser.activeShift.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 backdrop-blur-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                Fecha: {systemDate}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 font-semibold border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Conforme DIGEMID
              </span>
            </div>
          </div>

          {/* Quick Primary Action */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
            {isTabAllowedForUser(currentUser, 'pos') && (
              <button
                type="button"
                onClick={() => onNavigate('pos')}
                className="px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-emerald-50 font-bold text-xs sm:text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Ir a Punto de Venta</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            {isTabAllowedForUser(currentUser, 'cash') && (
              <button
                type="button"
                onClick={() => onNavigate('cash')}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
              >
                <Banknote className="w-4 h-4 text-emerald-300" />
                <span>Ver Saldo de Caja</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. PEQUEÑO APARTADO 1: RESUMEN BÁSICO DEL DÍA (4 TARJETAS CONCISAS) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Resumen del Día (Snapshot Operativo)</span>
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Cifras actualizadas al instante
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Ventas Hoy */}
          <div
            onClick={() => onNavigate('pos')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ventas de Hoy
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              S/ {totalVendidoHoy.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>{totalBoletas} comprobantes emitidos</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
            </div>
          </div>

          {/* Card 2: Saldo en Caja */}
          <div
            onClick={() => onNavigate('cash')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-500/50 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Saldo en Caja
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              S/ {cashRegister.currentCash.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className={cashRegister.isOpen ? 'text-emerald-600 font-bold' : 'text-rose-500'}>
                {cashRegister.isOpen ? '🟢 Turno Abierto' : '🔴 Caja Cerrada'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
            </div>
          </div>

          {/* Card 3: Medicamentos & Lotes */}
          <div
            onClick={() => onNavigate('inventory')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-500/50 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Lotes Vigentes
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {activeBatchesCount} lotes
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>{products.length} medicamentos activos</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
            </div>
          </div>

          {/* Card 4: Alertas Activas */}
          <div
            onClick={() => onNavigate('alerts')}
            className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition cursor-pointer group ${
              alerts.length > 0
                ? 'border-rose-200 dark:border-rose-900/60 hover:border-rose-500'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Alertas Activas
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                alerts.length > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}>
                <BellRing className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-lg sm:text-2xl font-black ${
              alerts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {alerts.length} avisos
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>{alerts.length > 0 ? 'Requieren atención' : 'Stock en orden'}</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. PEQUEÑO APARTADO 2: MÓDULOS DE TRABAJO (LANZADORES DIRECTOS POR ROL) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Tus Módulos de Trabajo Autorizados</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Habilitados para tu perfil de <strong>{currentUser.roleTitle}</strong>
            </p>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">
            {userAllowedModules.length} módulos disponibles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {userAllowedModules.map(mod => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigate(mod.id)}
                className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${mod.color} text-white flex items-center justify-center shadow-md shadow-emerald-950/10 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {mod.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          mod.badgeAlert
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {mod.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {mod.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Ingresar al módulo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PEQUEÑO APARTADO 3: AVISOS IMPORTANTES Y ESTADO OPERATIVO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aviso de Alertas / Pendientes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-500" />
              <span>Avisos Pendientes de Turno</span>
            </h3>
            {alerts.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('alerts')}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Ver todos ({alerts.length}) →
              </button>
            )}
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.slice(0, 2).map(alert => (
                <div
                  key={alert.id}
                  onClick={() => onNavigate('alerts')}
                  className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 cursor-pointer hover:bg-amber-100/70 transition"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold line-clamp-1">{alert.title}</p>
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-400">
                      {alert.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No hay alertas críticas pendientes. Todos los lotes operan con normalidad.</span>
            </div>
          )}
        </div>

        {/* Cumplimiento Normativo & Seguridad */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Control Sanitario & DIGEMID</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
              Directiva N° 038
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span>Farmacéutico Regente:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                Dr. Carlos Mendoza Flores (CQFP 18492)
              </strong>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span>Algoritmo de Despacho:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                FEFO Activo (First Expired, First Out)
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN COLAPSABLE: GRÁFICOS Y ANALÍTICA AVANZADA (OPCIONAL) */}
      {isTabAllowedForUser(currentUser, 'dashboard') && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvancedCharts(prev => !prev)}
            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 transition flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>
                {showAdvancedCharts
                  ? 'Ocultar Gráficos de Rendimiento Ejecutivo'
                  : '¿Deseas consultar los Gráficos de Rendimiento y Rotación? (Opcional)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <span>{showAdvancedCharts ? 'Cerrar' : 'Desplegar gráficos'}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showAdvancedCharts ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {showAdvancedCharts && (
            <div className="mt-4 space-y-6 animate-in slide-in-from-top-3 duration-200">
              <ExecutivePerformanceCharts onNavigate={onNavigate} />
              <SalesTrend7DaysChart onNavigate={onNavigate} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
