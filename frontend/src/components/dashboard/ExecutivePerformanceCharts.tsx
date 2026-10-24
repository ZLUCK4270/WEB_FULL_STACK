import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product, Batch, Sale } from '../../types/pharmacy';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Package,
  Calendar,
  DollarSign,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ChevronRightCircle,
  Filter,
  Flame,
  Zap,
  Percent,
  RefreshCw,
  ShoppingBag,
  Award
} from 'lucide-react';

export interface ExecutivePerformanceChartsProps {
  onNavigate?: (tabId: string) => void;
}

export interface ProductTurnoverMetric {
  productId: string;
  code: string;
  name: string;
  genericName: string;
  category: string;
  unitPrice: number;
  unitsSold: number;
  totalRevenue: number;
  orderCount: number;
  currentStock: number;
  estimatedCost: number;
  grossProfit: number;
  marginPercent: number;
  turnoverRatio: number;
  daysOfInventoryCover: number;
  abcClass: 'A' | 'B' | 'C';
  stockStatus: 'quiebre_inminente' | 'stock_optimo' | 'sobrestock';
}

export interface DailySalesMetric {
  dateStr: string;
  displayDay: string;
  fullDateStr: string;
  isToday: boolean;
  totalSales: number;
  ticketCount: number;
  avgTicket: number;
  totalUnits: number;
  targetGoal: number;
  compliancePercent: number;
  cashSales: number;
  yapeSales: number;
  cardSales: number;
}

const DAILY_TARGET_SALES = 2500;

export const ExecutivePerformanceCharts: React.FC<ExecutivePerformanceChartsProps> = ({
  onNavigate
}) => {
  const {
    sales,
    products,
    batches,
    systemDate,
    addQuickSale,
    advanceSystemDate
  } = usePharmacy();

  // Active Tab: 'ventas_diarias' | 'rotacion_productos'
  const [activeTab, setActiveTab] = useState<'ventas_diarias' | 'rotacion_productos'>('ventas_diarias');

  // Daily Sales Controls
  const [dailyRangeDays, setDailyRangeDays] = useState<7 | 14 | 30>(7);
  const [dailyViewType, setDailyViewType] = useState<'sales_vs_target' | 'payment_methods' | 'avg_ticket'>('sales_vs_target');

  // Product Turnover Controls
  const [turnoverMetric, setTurnoverMetric] = useState<'units' | 'revenue' | 'profit' | 'velocity'>('units');
  const [turnoverLimit, setTurnoverLimit] = useState<5 | 8 | 10 | 20>(8);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Interactive Toast
  const [actionToast, setActionToast] = useState<string | null>(null);

  // 1. Calculate Daily Sales Performance
  const dailySalesData: DailySalesMetric[] = useMemo(() => {
    const result: DailySalesMetric[] = [];
    const baseDate = new Date(systemDate.includes('T') ? systemDate : `${systemDate}T12:00:00`);

    const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = dailyRangeDays - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayName = dayNamesShort[d.getDay()];
      const displayDay = `${dayName} ${day}/${month}`;

      const daySales = sales.filter(s => {
        try {
          return s.date.startsWith(dateStr) || s.date.slice(0, 10) === dateStr;
        } catch {
          return false;
        }
      });

      const totalSales = +daySales.reduce((acc, s) => acc + s.total, 0).toFixed(2);
      const ticketCount = daySales.length;
      const avgTicket = ticketCount > 0 ? +(totalSales / ticketCount).toFixed(2) : 0;
      const totalUnits = daySales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);

      const cashSales = +daySales.filter(s => s.paymentMethod === 'efectivo').reduce((acc, s) => acc + s.total, 0).toFixed(2);
      const yapeSales = +daySales.filter(s => s.paymentMethod === 'yape').reduce((acc, s) => acc + s.total, 0).toFixed(2);
      const cardSales = +daySales.filter(s => s.paymentMethod === 'tarjeta').reduce((acc, s) => acc + s.total, 0).toFixed(2);

      const compliancePercent = +((totalSales / DAILY_TARGET_SALES) * 100).toFixed(1);

      result.push({
        dateStr,
        displayDay,
        fullDateStr: dateStr,
        isToday: dateStr === systemDate,
        totalSales,
        ticketCount,
        avgTicket,
        totalUnits,
        targetGoal: DAILY_TARGET_SALES,
        compliancePercent,
        cashSales,
        yapeSales,
        cardSales
      });
    }

    return result;
  }, [sales, systemDate, dailyRangeDays]);

  // Daily Summary Stats
  const dailySummaryStats = useMemo(() => {
    const totalSalesPeriod = dailySalesData.reduce((acc, d) => acc + d.totalSales, 0);
    const totalTicketsPeriod = dailySalesData.reduce((acc, d) => acc + d.ticketCount, 0);
    const avgDailySales = dailySalesData.length > 0 ? +(totalSalesPeriod / dailySalesData.length).toFixed(2) : 0;
    const avgCompliance = dailySalesData.length > 0 ? +((totalSalesPeriod / (DAILY_TARGET_SALES * dailySalesData.length)) * 100).toFixed(1) : 0;
    
    let peakDay = dailySalesData[0];
    dailySalesData.forEach(d => {
      if (d.totalSales > (peakDay?.totalSales || 0)) {
        peakDay = d;
      }
    });

    return {
      totalSalesPeriod,
      totalTicketsPeriod,
      avgDailySales,
      avgCompliance,
      peakDay
    };
  }, [dailySalesData]);

  // 2. Calculate Product Turnover & ABC Analysis
  const productTurnoverList: ProductTurnoverMetric[] = useMemo(() => {
    const productStatsMap = new Map<string, {
      unitsSold: number;
      totalRevenue: number;
      orderCount: number;
    }>();

    // Aggregate from real sales
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productStatsMap.get(item.productId) || {
          unitsSold: 0,
          totalRevenue: 0,
          orderCount: 0
        };

        existing.unitsSold += item.quantity || 1;
        existing.totalRevenue += item.subtotal || (item.quantity * item.unitPrice);
        existing.orderCount += 1;

        productStatsMap.set(item.productId, existing);
      });
    });

    // Map each catalog product
    const mapped: ProductTurnoverMetric[] = products.map(product => {
      const stats = productStatsMap.get(product.id) || {
        unitsSold: 0,
        totalRevenue: 0,
        orderCount: 0
      };

      // Current stock across active batches
      const productBatches = batches.filter(b => b.productId === product.id && b.status === 'active');
      const currentStock = productBatches.reduce((acc, b) => acc + b.stock, 0);
      
      // Estimated unit cost
      const avgUnitCost = productBatches.length > 0 
        ? productBatches.reduce((acc, b) => acc + b.unitCost, 0) / productBatches.length
        : product.unitPrice * 0.55;

      const estimatedCost = +(stats.unitsSold * avgUnitCost).toFixed(2);
      const grossProfit = +(stats.totalRevenue - estimatedCost).toFixed(2);
      const marginPercent = stats.totalRevenue > 0 ? +((grossProfit / stats.totalRevenue) * 100).toFixed(1) : 42.0;

      // Turnover ratio = units sold / current stock
      const turnoverRatio = +(stats.unitsSold / Math.max(1, currentStock)).toFixed(2);

      // Estimated run rate per day (assuming 30 days period)
      const dailyRunRate = Math.max(0.1, stats.unitsSold / 30);
      const daysOfInventoryCover = Math.round(currentStock / dailyRunRate);

      let stockStatus: ProductTurnoverMetric['stockStatus'] = 'stock_optimo';
      if (currentStock <= product.minStock || daysOfInventoryCover < 7) {
        stockStatus = 'quiebre_inminente';
      } else if (daysOfInventoryCover > 60) {
        stockStatus = 'sobrestock';
      }

      return {
        productId: product.id,
        code: product.code,
        name: product.name,
        genericName: product.genericName,
        category: product.category,
        unitPrice: product.unitPrice,
        unitsSold: stats.unitsSold,
        totalRevenue: +stats.totalRevenue.toFixed(2),
        orderCount: stats.orderCount,
        currentStock,
        estimatedCost,
        grossProfit,
        marginPercent,
        turnoverRatio,
        daysOfInventoryCover,
        abcClass: 'B', // Will be calculated after sorting
        stockStatus
      };
    });

    // Sort by units sold to calculate ABC Pareto distribution
    mapped.sort((a, b) => b.unitsSold - a.unitsSold);

    const totalAllUnits = mapped.reduce((acc, p) => acc + p.unitsSold, 0) || 1;
    let accumulated = 0;

    mapped.forEach(p => {
      accumulated += p.unitsSold;
      const share = (accumulated / totalAllUnits) * 100;
      if (share <= 75) {
        p.abcClass = 'A';
      } else if (share <= 92) {
        p.abcClass = 'B';
      } else {
        p.abcClass = 'C';
      }
    });

    return mapped;
  }, [sales, products, batches]);

  // Filtered & Sorted Turnover List for Chart
  const displayTurnoverList = useMemo(() => {
    let list = [...productTurnoverList];

    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter(p => p.category === selectedCategoryFilter);
    }

    if (turnoverMetric === 'units') {
      list.sort((a, b) => b.unitsSold - a.unitsSold);
    } else if (turnoverMetric === 'revenue') {
      list.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else if (turnoverMetric === 'profit') {
      list.sort((a, b) => b.grossProfit - a.grossProfit);
    } else if (turnoverMetric === 'velocity') {
      list.sort((a, b) => b.turnoverRatio - a.turnoverRatio);
    }

    return list.slice(0, turnoverLimit);
  }, [productTurnoverList, turnoverMetric, turnoverLimit, selectedCategoryFilter]);

  // Distinct Categories for Filter
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => cats.add(p.category));
    return Array.from(cats);
  }, [products]);

  // Top Product Star
  const topProductStar = productTurnoverList[0];

  // Quick Action Handlers
  const handleQuickSaleClick = () => {
    const newSale = addQuickSale();
    setActionToast(`¡Venta rápida ${newSale.receiptNumber} registrada por S/ ${newSale.total.toFixed(2)}! Gráficos de ventas y rotación recalculados.`);
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleAdvanceDayClick = () => {
    advanceSystemDate(1);
    setActionToast('Fecha de gestión avanzada al siguiente día rotativo (+1 día). Gráficos actualizados consecutivamente.');
    setTimeout(() => setActionToast(null), 4000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
      {/* Toast Feedback */}
      {actionToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <span className="text-[10px] text-emerald-600 uppercase font-mono">Reactivo En Vivo</span>
        </div>
      )}

      {/* Main Header & Subtabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              Rendimiento Comercial & Demanda
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Gráficos Recharts en Vivo
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-semibold">
              Gestión: <strong className="text-emerald-600">{systemDate}</strong>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-600 shrink-0" />
            Rendimiento de Ventas Diarias & Productos con Mayor Rotación
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualización analítica del flujo de ingresos diarios y clasificación de medicamentos según su velocidad de rotación (Análisis ABC).
          </p>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {/* Main Subtab Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setActiveTab('ventas_diarias')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'ventas_diarias'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ventas Diarias</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rotacion_productos')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'rotacion_productos'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Mayor Rotación (Top)</span>
            </button>
          </div>

          {/* Quick Real-Time Simulator Buttons */}
          <button
            type="button"
            onClick={handleQuickSaleClick}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Registrar una nueva venta consecutiva para ver la actualización de rotación"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Venta</span>
          </button>

          <button
            type="button"
            onClick={handleAdvanceDayClick}
            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Avanzar al siguiente día rotativo"
          >
            <ChevronRightCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>+1 Día</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: RENDIMIENTO DE VENTAS DIARIAS                           */}
      {/* ============================================================== */}
      {activeTab === 'ventas_diarias' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Bar for Daily Sales */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Days Window */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Ventana Diaria:
              </span>
              {[
                { days: 7, label: 'Últimos 7 Días' },
                { days: 14, label: 'Últimos 14 Días' },
                { days: 30, label: 'Mes (30 Días)' }
              ].map(item => (
                <button
                  key={item.days}
                  type="button"
                  onClick={() => setDailyRangeDays(item.days as 7 | 14 | 30)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    dailyRangeDays === item.days
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* View Mode Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Visualización:
              </span>
              {[
                { id: 'sales_vs_target', label: 'Ventas vs Meta' },
                { id: 'payment_methods', label: 'Medios de Pago' },
                { id: 'avg_ticket', label: 'Ticket Promedio' }
              ].map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setDailyViewType(mode.id as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    dailyViewType === mode.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Micro KPI Cards for Daily Performance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Facturación del Periodo ({dailyRangeDays}d)
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                S/ {dailySummaryStats.totalSalesPeriod.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{dailySummaryStats.totalTicketsPeriod} comprobantes</span>
                <span className="font-bold text-emerald-600">Total acumulado</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Venta Promedio por Día
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                S/ {dailySummaryStats.avgDailySales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Meta Diaria: S/ {DAILY_TARGET_SALES}</span>
                <span className={`font-bold ${dailySummaryStats.avgCompliance >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {dailySummaryStats.avgCompliance}% logro
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Día Pico de Facturación
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                S/ {(dailySummaryStats.peakDay?.totalSales || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Fecha: <strong>{dailySummaryStats.peakDay?.displayDay || 'N/A'}</strong></span>
                <span className="font-bold text-indigo-600">{dailySummaryStats.peakDay?.ticketCount || 0} tickets</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Mix de Pagos del Periodo
              </span>
              <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Efectivo:</span>
                  <span className="text-emerald-600 font-bold">
                    S/ {dailySalesData.reduce((acc, d) => acc + d.cashSales, 0).toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Digital (Yape/Tarjeta):</span>
                  <span className="text-indigo-600 font-bold">
                    S/ {dailySalesData.reduce((acc, d) => acc + d.yapeSales + d.cardSales, 0).toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                {(() => {
                  const total = dailySummaryStats.totalSalesPeriod || 1;
                  const cash = dailySalesData.reduce((acc, d) => acc + d.cashSales, 0);
                  const cashPct = Math.min(100, Math.round((cash / total) * 100));
                  return (
                    <>
                      <div className="bg-emerald-500 h-full" style={{ width: `${cashPct}%` }} title={`Efectivo: ${cashPct}%`} />
                      <div className="bg-indigo-500 h-full" style={{ width: `${100 - cashPct}%` }} title={`Digital: ${100 - cashPct}%`} />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Recharts Chart for Daily Sales */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Evolución Diaria de Ventas
                  {dailyViewType === 'sales_vs_target' && ' y Cumplimiento de Metas'}
                  {dailyViewType === 'payment_methods' && ' por Canal de Cobro'}
                  {dailyViewType === 'avg_ticket' && ' y Ticket Promedio'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Mostrando {dailyRangeDays} días consecutivos finalizando en la fecha de gestión ({systemDate})
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Ventas Diarias (S/)</span>
                {dailyViewType === 'sales_vs_target' && (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ml-2"></span>
                    <span>Meta Diaria S/ {DAILY_TARGET_SALES}</span>
                  </>
                )}
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {dailyViewType === 'sales_vs_target' ? (
                  <ComposedChart data={dailySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="displayDay" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `${val} t`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as DailySalesMetric;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[200px]">
                              <div className="font-bold border-b border-slate-800 pb-1 text-slate-300 flex items-center justify-between">
                                <span>{data.displayDay}</span>
                                {data.isToday && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-800 text-emerald-200 text-[10px]">
                                    Hoy en Curso
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between font-extrabold text-emerald-400">
                                <span>Venta Total:</span>
                                <span>S/ {data.totalSales.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Meta Diaria:</span>
                                <span>S/ {data.targetGoal.toFixed(2)} ({data.compliancePercent}%)</span>
                              </div>
                              <div className="flex items-center justify-between text-indigo-300">
                                <span>Tickets / Boletas:</span>
                                <span>{data.ticketCount}</span>
                              </div>
                              <div className="flex items-center justify-between text-amber-300">
                                <span>Ticket Promedio:</span>
                                <span>S/ {data.avgTicket.toFixed(2)}</span>
                              </div>
                              <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                                <div className="flex justify-between">
                                  <span>Efectivo: S/ {data.cashSales.toFixed(2)}</span>
                                  <span>Yape: S/ {data.yapeSales.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tarjeta: S/ {data.cardSales.toFixed(2)}</span>
                                  <span>Unidades: {data.totalUnits} uds</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine
                      yAxisId="left"
                      y={DAILY_TARGET_SALES}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      label={{ value: 'Meta S/ 2.5k', fill: '#f43f5e', fontSize: 10, position: 'right' }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="totalSales"
                      name="Facturación Real (S/)"
                      fill="url(#barSalesGrad)"
                      radius={[6, 6, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="ticketCount"
                      name="Cantidad de Tickets"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#6366f1' }}
                    />
                  </ComposedChart>
                ) : dailyViewType === 'payment_methods' ? (
                  <BarChart data={dailySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="displayDay" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `S/ ${val}`} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cashSales" name="Efectivo (S/)" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="yapeSales" name="Yape / Plin (S/)" fill="#8b5cf6" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="cardSales" name="Tarjeta (S/)" fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={dailySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="displayDay" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `S/ ${val}`} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="avgTicket"
                      name="Ticket Promedio Diario (S/)"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#ticketGrad)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PRODUCTOS CON MAYOR ROTACIÓN (ANALISIS ABC)              */}
      {/* ============================================================== */}
      {activeTab === 'rotacion_productos' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Bar for Product Turnover */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Metric Mode */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Ordenar Por:
              </span>
              {[
                { id: 'units', label: 'Unidades Vendidas' },
                { id: 'revenue', label: 'Ingresos Totales (S/)' },
                { id: 'profit', label: 'Margen Bruto (S/)' },
                { id: 'velocity', label: 'Velocidad de Rotación' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTurnoverMetric(item.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    turnoverMetric === item.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Limit and Category Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-bold">Mostrar:</span>
                {[5, 8, 10, 20].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTurnoverLimit(n as any)}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      turnoverLimit === n
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Top {n}
                  </button>
                ))}
              </div>

              {/* Category Dropdown Filter */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
                >
                  <option value="ALL">Todas las Categorías</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4 Micro KPI Cards for Turnover */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Medicamento Estrella #1
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-extrabold">
                  Clase A
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white truncate" title={topProductStar?.name}>
                {topProductStar?.name || 'N/A'}
              </div>
              <div className="text-xs text-amber-900 dark:text-amber-300 font-semibold flex items-center justify-between">
                <span>{topProductStar?.unitsSold || 0} unidades vendidas</span>
                <span className="font-bold">S/ {(topProductStar?.totalRevenue || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Unidades Dispensadas
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {productTurnoverList.reduce((acc, p) => acc + p.unitsSold, 0).toLocaleString()} uds
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>En {sales.length} transacciones</span>
                <span className="font-bold text-emerald-600">Alta Demanda</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Índice de Rotación Promedio
              </span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {productTurnoverList.length > 0 
                  ? (productTurnoverList.reduce((acc, p) => acc + p.turnoverRatio, 0) / productTurnoverList.length).toFixed(2)
                  : '0.00'}x
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Velocidad de despacho</span>
                <span className="font-bold text-indigo-600">Saludable</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Alerta de Abastecimiento Crítico
              </span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {productTurnoverList.filter(p => p.stockStatus === 'quiebre_inminente').length} productos
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Stock bajo &lt;7 días</span>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('purchases')}
                  className="font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Generar OC →
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Horizontal Bar Chart for Top Turnover Products */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Ranking de Productos con Mayor Rotación (Recharts)
                </h3>
                <p className="text-[11px] text-slate-400">
                  {turnoverMetric === 'units' && 'Ordenado por cantidad de unidades dispensadas al público'}
                  {turnoverMetric === 'revenue' && 'Ordenado por facturación bruta acumulada en Soles (S/)'}
                  {turnoverMetric === 'profit' && 'Ordenado por margen de utilidad bruta generada'}
                  {turnoverMetric === 'velocity' && 'Ordenado por velocidad relativa de rotación de inventario'}
                </p>
              </div>

              {/* ABC Legend Badges */}
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Clase A (Alta Rotación)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Clase B (Media)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Clase C (Baja)
                </span>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayTurnoverList}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => turnoverMetric === 'units' ? `${val} uds` : turnoverMetric === 'velocity' ? `${val}x` : `S/ ${val}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={150}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ProductTurnoverMetric;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[220px]">
                            <div className="font-bold border-b border-slate-800 pb-1 text-slate-200 flex items-center justify-between">
                              <span className="truncate pr-2">{data.name}</span>
                              <span className={`px-1.5 py-0.2 rounded font-extrabold text-[10px] ${
                                data.abcClass === 'A' ? 'bg-emerald-800 text-emerald-200' :
                                data.abcClass === 'B' ? 'bg-blue-800 text-blue-200' :
                                'bg-amber-800 text-amber-200'
                              }`}>
                                Clase {data.abcClass}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 italic">
                              {data.genericName} • {data.category}
                            </div>
                            <div className="flex items-center justify-between text-emerald-400 font-bold pt-1">
                              <span>Unidades Vendidas:</span>
                              <span>{data.unitsSold} uds</span>
                            </div>
                            <div className="flex items-center justify-between text-indigo-300 font-bold">
                              <span>Facturación Total:</span>
                              <span>S/ {data.totalRevenue.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-amber-300 font-semibold">
                              <span>Margen Bruto:</span>
                              <span>S/ {data.grossProfit.toFixed(2)} ({data.marginPercent}%)</span>
                            </div>
                            <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Stock en Almacén: <strong>{data.currentStock} uds</strong></span>
                              <span>Cobertura: <strong>{data.daysOfInventoryCover} días</strong></span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={turnoverMetric === 'units' ? 'unitsSold' : turnoverMetric === 'revenue' ? 'totalRevenue' : turnoverMetric === 'profit' ? 'grossProfit' : 'turnoverRatio'}
                    name={turnoverMetric === 'units' ? 'Unidades Vendidas' : turnoverMetric === 'revenue' ? 'Facturación (S/)' : turnoverMetric === 'profit' ? 'Margen (S/)' : 'Índice Rotación'}
                    radius={[0, 6, 6, 0]}
                  >
                    {displayTurnoverList.map((entry, index) => {
                      const color = entry.abcClass === 'A' ? '#10b981' : entry.abcClass === 'B' ? '#3b82f6' : '#f59e0b';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Granular Turnover Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Matriz de Control: Rotación, Cobertura y Demanda
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                {displayTurnoverList.length} medicamentos analizados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4"># Ranking</th>
                    <th className="py-2.5 px-4">Medicamento / DCI</th>
                    <th className="py-2.5 px-4">Categoría ABC</th>
                    <th className="py-2.5 px-4 text-right">Uds Vendidas</th>
                    <th className="py-2.5 px-4 text-right">Facturación S/</th>
                    <th className="py-2.5 px-4 text-right">Margen Bruto</th>
                    <th className="py-2.5 px-4 text-right">Stock Actual</th>
                    <th className="py-2.5 px-4 text-center">Cobertura</th>
                    <th className="py-2.5 px-4">Estatus Reposición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayTurnoverList.map((item, idx) => (
                    <tr key={item.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.genericName} • {item.code}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item.abcClass === 'A'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                            : item.abcClass === 'B'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                        }`}>
                          Clase {item.abcClass}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900 dark:text-white">
                        {item.unitsSold} uds
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        S/ {item.totalRevenue.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-300">
                        S/ {item.grossProfit.toFixed(2)} <span className="text-[10px] text-slate-400">({item.marginPercent}%)</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                        {item.currentStock} uds
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                          {item.daysOfInventoryCover} d
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {item.stockStatus === 'quiebre_inminente' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            Reordenar Urgente
                          </span>
                        ) : item.stockStatus === 'sobrestock' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                            Sobrestock (&gt;60d)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            Stock Equilibrado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
