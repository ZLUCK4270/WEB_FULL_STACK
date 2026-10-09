import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useI18n } from '../../i18n/I18nContext';
import {
  HOURLY_SALES_DATA,
  DEMAND_FORECAST_DATA,
  CATEGORY_MARGIN_DATA
} from '../AnalyticsWidgetsView';
import {
  AreaChart, Area, ComposedChart, BarChart, Bar, Line, LineChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  Banknote,
  Package,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Sparkles,
  Users,
  ShieldCheck,
  ChevronRight,
  Plus,
  Send,
  Zap,
  Activity
} from 'lucide-react';
import { ResumenDelDia } from './ResumenDelDia';
import { SalesTrend7DaysChart } from './SalesTrend7DaysChart';
import { CustomPeriodComparisonSection } from './CustomPeriodComparisonSection';
import { calculate7DaysTrend } from '../../utils/salesAnalytics';
import { exportPharmacyExecutiveReportPDF } from '../../utils/pdfExport';
import { FileDown, Calendar, RotateCcw, ChevronRightCircle, PlusCircle, CheckCircle2 } from 'lucide-react';

interface BusinessExecutiveDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const BusinessExecutiveDashboard: React.FC<BusinessExecutiveDashboardProps> = ({
  onNavigate
}) => {
  const {
    sales,
    batches,
    products,
    cashRegister,
    alerts,
    currentUser,
    systemDate,
    advanceSystemDate,
    setSystemDate,
    addQuickSale,
    activityLogs
  } = usePharmacy();
  const { t } = useI18n();

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Selected time interval for widgets
  const [selectedProduct, setSelectedProduct] = useState<'amoxicilina' | 'paracetamol' | 'ibuprofeno'>('amoxicilina');

  // Trigger Full PDF Export
  const handleExportFullReportPDF = () => {
    try {
      setIsExportingPDF(true);

      const todaySalesList = sales.filter(s => {
        try {
          return s.date.startsWith(systemDate) || s.date.slice(0, 10) === systemDate;
        } catch {
          return false;
        }
      });

      const todayTotalSales = todaySalesList.reduce((sum, s) => sum + s.total, 0);
      const subtotalNeto = +(todayTotalSales / 1.18).toFixed(2);
      const totalIGV = +(todayTotalSales - subtotalNeto).toFixed(2);
      const avgTicket = todaySalesList.length > 0 ? +(todayTotalSales / todaySalesList.length).toFixed(2) : 0;

      const receiptBreakdown = {
        boletas: todaySalesList.filter(s => s.receiptType === 'boleta').length,
        facturas: todaySalesList.filter(s => s.receiptType === 'factura').length,
        tickets: todaySalesList.filter(s => s.receiptType === 'ticket').length
      };

      const paymentStats = {
        cash: todaySalesList.filter(s => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0),
        yape: todaySalesList.filter(s => s.paymentMethod === 'yape').reduce((sum, s) => sum + s.total, 0),
        card: todaySalesList.filter(s => s.paymentMethod === 'tarjeta').reduce((sum, s) => sum + s.total, 0)
      };

      const now = new Date();
      const expiring24hBatches = batches
        .filter(batch => {
          if (batch.status !== 'active' || batch.stock <= 0) return false;
          const expDate = new Date(
            batch.expirationDate.includes('T') ? batch.expirationDate : `${batch.expirationDate}T23:59:59`
          );
          const diffMs = expDate.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          return diffHours >= 0 && diffHours <= 24;
        })
        .map(batch => {
          const product = products.find(p => p.id === batch.productId);
          const expDate = new Date(
            batch.expirationDate.includes('T') ? batch.expirationDate : `${batch.expirationDate}T23:59:59`
          );
          const diffMs = expDate.getTime() - now.getTime();
          const hoursLeft = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
          return {
            batchCode: batch.batchCode,
            productName: product?.name,
            genericName: product?.genericName,
            stock: batch.stock,
            expirationDate: batch.expirationDate,
            hoursLeft
          };
        });

      const { sevenDaysData, stats } = calculate7DaysTrend(sales, systemDate, 2500);

      exportPharmacyExecutiveReportPDF({
        summary: {
          systemDate,
          totalSalesAmount: todayTotalSales,
          subtotalNeto,
          totalIGV,
          totalTransactions: todaySalesList.length,
          avgTicket,
          receiptBreakdown,
          paymentStats,
          expiring24hBatches
        },
        trend7Days: sevenDaysData,
        trendStats: stats,
        responsibleName: currentUser.name,
        responsibleRole: currentUser.roleTitle
      });

      setFeedbackMsg(`Informe Gerencial en PDF (${systemDate}) generado y descargado exitosamente.`);
      setTimeout(() => setFeedbackMsg(null), 4500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setFeedbackMsg('Ocurrió un error al generar el archivo PDF.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Quick sale test
  const handleQuickSaleClick = () => {
    const s = addQuickSale();
    setFeedbackMsg(`¡Nueva venta registrada por S/ ${s.total.toFixed(2)} (${s.receiptNumber})! Métricas y gráfico de 7 días actualizados.`);
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  // Advance day
  const handleAdvanceDayClick = () => {
    advanceSystemDate(1);
    setFeedbackMsg('Fecha de gestión avanzada al día siguiente (+1 día rotativo). La ventana de métricas y gráfico se actualizó.');
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  // Reset to today
  const handleResetToToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setSystemDate(todayStr);
    setFeedbackMsg(`Fecha de gestión restablecida a la fecha base actual (${todayStr}).`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Live KPI Calculations
  const totalSalesToday = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const totalTickets = sales.length;
  const avgTicket = totalTickets > 0 ? +(totalSalesToday / totalTickets).toFixed(2) : 0;

  // FEFO critical batches (< 30 days)
  const criticalBatchesCount = useMemo(() => {
    const today = new Date();
    return batches.filter(b => {
      if (b.status !== 'active') return false;
      const exp = new Date(b.expirationDate);
      const days = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 30 && days > 0;
    }).length;
  }, [batches]);

  // Low stock products count
  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      const validBatches = batches.filter(b => b.productId === p.id && b.status === 'active');
      const stock = validBatches.reduce((s, b) => s + b.stock, 0);
      return stock <= p.minStock;
    }).length;
  }, [products, batches]);

  // Dynamic burn-down dataset for FEFO widget
  const burnDownData = useMemo(() => {
    if (selectedProduct === 'amoxicilina') {
      return [
        { semana: 'Sem 1', stockLoteCritico: 80, demandaHistorica: 18, fefoProyectado: 75 },
        { semana: 'Sem 2', stockLoteCritico: 62, demandaHistorica: 22, fefoProyectado: 55 },
        { semana: 'Sem 3', stockLoteCritico: 40, demandaHistorica: 19, fefoProyectado: 38 },
        { semana: 'Sem 4 (Hoy)', stockLoteCritico: 24, demandaHistorica: 20, fefoProyectado: 22 },
        { semana: 'Sem 5 (+7d)', stockLoteCritico: null, demandaHistorica: 22, fefoProyectado: 6 },
        { semana: 'Sem 6 (Agotado)', stockLoteCritico: null, demandaHistorica: 21, fefoProyectado: 0 },
      ];
    } else if (selectedProduct === 'paracetamol') {
      return [
        { semana: 'Sem 1', stockLoteCritico: 180, demandaHistorica: 45, fefoProyectado: 175 },
        { semana: 'Sem 2', stockLoteCritico: 135, demandaHistorica: 50, fefoProyectado: 130 },
        { semana: 'Sem 3', stockLoteCritico: 90, demandaHistorica: 48, fefoProyectado: 88 },
        { semana: 'Sem 4 (Hoy)', stockLoteCritico: 85, demandaHistorica: 44, fefoProyectado: 45 },
        { semana: 'Sem 5 (+7d)', stockLoteCritico: null, demandaHistorica: 46, fefoProyectado: 8 },
        { semana: 'Sem 6 (Agotado)', stockLoteCritico: null, demandaHistorica: 42, fefoProyectado: 0 },
      ];
    } else {
      return [
        { semana: 'Sem 1', stockLoteCritico: 100, demandaHistorica: 25, fefoProyectado: 95 },
        { semana: 'Sem 2', stockLoteCritico: 75, demandaHistorica: 28, fefoProyectado: 70 },
        { semana: 'Sem 3', stockLoteCritico: 48, demandaHistorica: 26, fefoProyectado: 45 },
        { semana: 'Sem 4 (Hoy)', stockLoteCritico: 22, demandaHistorica: 24, fefoProyectado: 22 },
        { semana: 'Sem 5 (+7d)', stockLoteCritico: null, demandaHistorica: 25, fefoProyectado: 4 },
        { semana: 'Sem 6 (Agotado)', stockLoteCritico: null, demandaHistorica: 24, fefoProyectado: 0 },
      ];
    }
  }, [selectedProduct]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Operational greeting */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg shadow-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              Botica Nova Salud • Jesús María, Lima
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              En Vivo
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Panel de Operaciones & Control Farmacéutico
          </h1>
          <p className="text-xs text-emerald-100 max-w-2xl">
            Bienvenido, <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle}). El sistema se encuentra operando bajo despacho automático FEFO y facturación en tiempo real.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onNavigate('pos')}
            className="px-3.5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            + Nueva Venta POS
          </button>
          <button
            onClick={handleExportFullReportPDF}
            disabled={isExportingPDF}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-extrabold shadow-sm border border-white/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60"
            title="Exportar informe de gestión gerencial con gráfico y resumen a archivo PDF"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            {isExportingPDF ? 'Generando PDF...' : 'Exportar Informe PDF'}
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <Package className="w-4 h-4" />
            + Recibir Lote
          </button>
          <button
            onClick={() => onNavigate('cash')}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <Banknote className="w-4 h-4" />
            Arqueo Caja
          </button>
        </div>
      </div>

      {/* Barra de Gestión Rotativa de Fechas & Simulación Continua */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Fecha de Gestión Operativa (Rotativa):
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                {systemDate}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                • Los datos se actualizan consecutivamente según días posteriores
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Al registrar una nueva venta, se actualizan al instante las métricas del día y el gráfico de tendencia de los últimos 7 días.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleQuickSaleClick}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            title="Registrar una nueva venta para verificar que se actualizan las métricas rotativas"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            + Venta Rápida
          </button>

          <button
            onClick={handleAdvanceDayClick}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            title="Avanzar consecutivamente al siguiente día (ej: 08/10 -> 09/10 -> 10/10)"
          >
            <ChevronRightCircle className="w-3.5 h-3.5 text-indigo-600" />
            +1 Día Siguiente
          </button>

          <button
            onClick={handleResetToToday}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition active:scale-95"
            title="Restablecer a la fecha actual"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            Restablecer
          </button>

          <button
            onClick={handleExportFullReportPDF}
            disabled={isExportingPDF}
            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60"
            title="Descargar informe oficial de gestión gerencial a archivo PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-white" />
            {isExportingPDF ? 'Exportando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-900 dark:text-emerald-100 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {/* Componente Resumen del Día */}
      <ResumenDelDia onNavigate={onNavigate} />

      {/* Tendencia de Ventas de los Últimos 7 Días (Recharts) */}
      <SalesTrend7DaysChart onNavigate={onNavigate} />

      {/* Selector de Rangos de Fechas Personalizado & Comparación de Periodos */}
      <CustomPeriodComparisonSection onNavigate={onNavigate} />

      {/* Alert Notice Strip */}
      {alerts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Atención Farmacéutica:</strong> Existen <strong>{alerts.length} alertas operativas activas</strong> (vencimientos próximos y quiebres de inventario).
            </span>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition"
          >
            Revisar Centro de Alertas
          </button>
        </div>
      )}

      {/* Analytical Visualizations (Recharts Section) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Analítica Predictiva de Demanda & Curvas Horarias (Recharts)
          </h2>
          <span className="text-xs text-slate-500">
            Actualización continua con datos del POS
          </span>
        </div>

        {/* Grid: 2 Large Chart Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget 1: Curva de Ventas por Hora */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Curva de Ventas por Hora & Horas Pico
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    Pico: 19:00 hrs
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Flujo de ingresos en mostrador y detección de congestión de clientes.
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY_SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val: any) => [`S/ ${val}`, 'Ventas']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <ReferenceLine x="19:00" stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Pico Máx', fill: '#f43f5e', fontSize: 10 }} />
                  <Area type="monotone" dataKey="ventasSoles" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Máxima congestión detectada entre 18:00 y 20:30 hrs (86 clientes/hr).</span>
              <span className="font-bold text-emerald-600">Requiere 2 cajeros</span>
            </div>
          </div>

          {/* Widget 2: Proyección de Demanda a 14 Días */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Proyección de Demanda Basada en Historial
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                    Tendencia +24%
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Modelo predictivo con intervalo de confianza superior e inferior.
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={DEMAND_FORECAST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ventasReales" name="Venta Histórica" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="proyeccionMedia" name="Pronóstico Media" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="bandaSuperior" name="Banda Superior" stroke="#10b981" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="bandaInferior" name="Banda Inferior" stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Demanda proyectada a Día +14: 280 uds/día.</span>
              <span className="font-bold text-blue-600">Sugerencia: Orden día +5</span>
            </div>
          </div>
        </div>

        {/* Grid: 2 Medium Chart Cards (Margin & FEFO burn-down) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget 3: Margen por Categoría */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ventas vs. Margen Bruto por Categoría Farmacéutica
                </h3>
                <p className="text-xs text-slate-500">
                  Identificación de líneas más rentables (Analgésicos, Antibióticos, etc.).
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                Margen Global: 41.6%
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CATEGORY_MARGIN_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="categoria" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val: any) => [`S/ ${val}`, '']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ventas" name="Venta Bruta (S/)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="margenBruto" name="Margen Bruto (S/)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Widget 4: Tasa de Agotamiento de Lotes (FEFO Burn-down) */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tasa de Agotamiento de Lotes Críticos (FEFO Burn-down)
                </h3>
                <p className="text-xs text-slate-500">
                  Velocidad de despacho para evitar que medicamentos caduquen en estantería.
                </p>
              </div>

              {/* Product selector */}
              <div className="flex gap-1 text-[11px]">
                {(['amoxicilina', 'paracetamol', 'ibuprofeno'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedProduct(p)}
                    className={`px-2 py-1 rounded font-bold capitalize transition ${
                      selectedProduct === p
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burnDownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="stockLoteCritico" name="Stock Real Lote" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="fefoProyectado" name="Consumo FEFO Proyectado" stroke="#10b981" strokeDasharray="4 4" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales Live Stream */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Últimas Transacciones Registradas en Mostrador (Auditoría en Vivo)
            </h3>
          </div>
          <button
            onClick={() => onNavigate('pos')}
            className="text-xs text-emerald-600 font-bold hover:underline"
          >
            Ir a Punto de Venta →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Comprobante</th>
                <th className="py-2.5 px-4">Hora</th>
                <th className="py-2.5 px-4">Cliente</th>
                <th className="py-2.5 px-4">Método de Pago</th>
                <th className="py-2.5 px-4">Ítems & Lotes FEFO</th>
                <th className="py-2.5 px-4">Cajero</th>
                <th className="py-2.5 px-4 text-right">Total (S/)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.slice(0, 5).map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {s.receiptNumber}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono">
                    {new Date(s.date).toLocaleTimeString('es-PE')}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {s.customerName}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                    {s.items.map(i => `${i.productName} (${i.batchCode})`).join(', ')}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                    {s.cashierName}
                  </td>
                  <td className="py-2.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                    S/ {s.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-Time Activity Log & Audit Trail Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Trazabilidad del Sistema & Log de Acciones Críticas
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  En Vivo
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Auditoría en tiempo real de ventas, inventario, permisos RBAC y cierres de caja.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('audit')}
            className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Ver Log Completo ({activityLogs.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Most Recent Critical Activities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activityLogs.slice(0, 3).map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 hover:border-purple-200 transition"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  {act.action}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {act.timeFormatted}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {act.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <span>Por: <strong>{act.userName}</strong></span>
                <span className="uppercase px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 font-bold text-purple-600">
                  {act.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
