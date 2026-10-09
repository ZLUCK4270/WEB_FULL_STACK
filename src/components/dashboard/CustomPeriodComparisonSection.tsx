import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  DateRangeInterval,
  JoinedSaleDetailItem
} from '../../types/dashboardAnalytics';
import {
  performSalesRelationalJoin,
  computeDateRangeBounds,
  computePeriodComparison,
  generateComparisonChartData,
  computeCategoryBreakdownComparison
} from '../../utils/periodComparisonAnalytics';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Receipt,
  ShoppingCart,
  DollarSign,
  Package,
  Layers,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Filter,
  PlusCircle,
  Database,
  Sparkles,
  ChevronRight,
  BarChart3,
  Percent,
  SlidersHorizontal,
  Table,
  FileDown
} from 'lucide-react';
import { exportPeriodComparisonPDF } from '../../utils/pdfExport';

interface CustomPeriodComparisonSectionProps {
  onNavigate?: (tabId: string) => void;
}

export const CustomPeriodComparisonSection: React.FC<CustomPeriodComparisonSectionProps> = ({
  onNavigate
}) => {
  const { sales, products, batches, systemDate, addQuickSale, currentUser } = usePharmacy();

  // Selected Interval and Range
  const [selectedInterval, setSelectedInterval] = useState<DateRangeInterval>('semanal');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const parts = systemDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() - 14);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [customEndDate, setCustomEndDate] = useState<string>(systemDate);
  const [enableComparison, setEnableComparison] = useState<boolean>(true);
  const [chartMetric, setChartMetric] = useState<'sales' | 'tickets' | 'units' | 'profit'>('sales');
  const [showJoinedTable, setShowJoinedTable] = useState<boolean>(false);
  const [quickInsertToast, setQuickInsertToast] = useState<string | null>(null);

  // 1. Relational join across sales items, products catalog, and batches
  const joinedSalesData: JoinedSaleDetailItem[] = useMemo(() => {
    return performSalesRelationalJoin(sales, products, batches);
  }, [sales, products, batches]);

  // 2. Compute date bounds for current and previous comparative period
  const bounds = useMemo(() => {
    return computeDateRangeBounds(
      selectedInterval,
      systemDate,
      selectedInterval === 'personalizado' ? customStartDate : undefined,
      selectedInterval === 'personalizado' ? customEndDate : undefined
    );
  }, [selectedInterval, systemDate, customStartDate, customEndDate]);

  // 3. Compute KPI metrics and comparative deltas
  const comparisonMetrics = useMemo(() => {
    return computePeriodComparison(joinedSalesData, sales, bounds);
  }, [joinedSalesData, sales, bounds]);

  // 4. Generate Recharts points for dual-period overlay
  const chartData = useMemo(() => {
    return generateComparisonChartData(selectedInterval, joinedSalesData, sales, bounds);
  }, [selectedInterval, joinedSalesData, sales, bounds]);

  // 5. Category breakdown comparison
  const categoryComparison = useMemo(() => {
    return computeCategoryBreakdownComparison(joinedSalesData, bounds);
  }, [joinedSalesData, bounds]);

  // Trigger quick consecutive sale insertion to test real-time update
  const handleQuickConsecutiveInsert = () => {
    const newSale = addQuickSale();
    setQuickInsertToast(`Venta consecutiva ${newSale.receiptNumber} registrada por S/ ${newSale.total.toFixed(2)}. Relaciones unidas al instante.`);
    setTimeout(() => setQuickInsertToast(null), 4000);
  };

  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  const handleExportComparisonPDF = () => {
    try {
      setIsExportingPDF(true);
      exportPeriodComparisonPDF({
        bounds: {
          currentStart: bounds.currentStart,
          currentEnd: bounds.currentEnd,
          currentLabel: bounds.currentLabel,
          previousStart: bounds.previousStart,
          previousEnd: bounds.previousEnd,
          previousLabel: bounds.previousLabel,
          dayCount: bounds.dayCount,
          intervalType: selectedInterval
        },
        metrics: comparisonMetrics,
        categories: categoryComparison.map(c => ({
          category: c.category,
          currentAmount: c.currentAmount,
          previousAmount: c.previousAmount,
          deltaPercent: c.deltaPercent,
          unitsSold: c.currentUnits
        })),
        joinedSamples: joinedSalesData.slice(0, 10).map(s => ({
          saleDate: s.saleDate,
          receiptNumber: s.receiptNumber,
          productName: s.productName,
          batchCode: s.batchCode,
          quantity: s.quantity,
          unitCost: s.unitCost,
          unitPrice: s.unitPrice,
          subtotal: s.subtotal,
          grossProfit: s.grossProfit,
          marginPercent: s.marginPercent
        })),
        responsibleName: currentUser?.name || 'Dr. Carlos Mendoza',
        responsibleRole: currentUser?.roleTitle || 'Regente Farmacéutico',
        systemDate
      });
      setQuickInsertToast(`Reporte comparativo en PDF (${selectedInterval.toUpperCase()}) generado y descargado con éxito.`);
      setTimeout(() => setQuickInsertToast(null), 4500);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setQuickInsertToast('Error al generar el informe comparativo en PDF.');
      setTimeout(() => setQuickInsertToast(null), 4000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const { current, previous, deltas } = comparisonMetrics;

  const renderDeltaBadge = (amount: number, percent: number, isCurrency: boolean = false) => {
    const isPositive = percent >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const colorClass = isPositive
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';

    return (
      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span>{isPositive ? '+' : ''}{percent}%</span>
        <span className="text-[10px] opacity-75 ml-1">
          ({isPositive ? '+' : ''}{isCurrency ? `S/ ${amount.toFixed(2)}` : amount})
        </span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
      {/* Toast Feedback for Live Insert */}
      {quickInsertToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{quickInsertToast}</span>
          </div>
          <span className="text-[10px] text-emerald-600">Actualización reactiva</span>
        </div>
      )}

      {/* Header Bar with Date Range Selector & Interval Pills */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Intervalos & Comparativa Temporal
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Datos Relacionales en Vivo
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-600 shrink-0" />
            Análisis de Ventas por Rangos & Comparación de Periodos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare el rendimiento comercial actual contra periodos anteriores inmediatos con desglose de margen bruto y tickets.
          </p>
        </div>

        {/* Action button to insert quick consecutive sale */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          <button
            type="button"
            onClick={handleQuickConsecutiveInsert}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Registrar una nueva venta consecutiva para verificar el recálculo dinámico"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Venta Consecutiva</span>
          </button>

          <button
            type="button"
            onClick={handleExportComparisonPDF}
            disabled={isExportingPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            title="Descargar informe comparativo de este rango a archivo PDF oficial"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExportingPDF ? 'Generando...' : 'Descargar PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowJoinedTable(!showJoinedTable)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs border transition flex items-center gap-1.5 cursor-pointer ${
              showJoinedTable
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title="Inspeccionar datos unidos mediante join relacional"
          >
            <Table className="w-4 h-4" />
            <span>{showJoinedTable ? 'Ocultar Relaciones' : 'Ver Join Relacional'}</span>
          </button>
        </div>
      </div>

      {/* Interval Selector & Custom Date Inputs Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Interval Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Intervalo:
          </span>
          {[
            { id: 'diario', label: 'Diario (Hoy)' },
            { id: 'semanal', label: 'Semanal (7 Días)' },
            { id: 'mensual', label: 'Mensual (30 Días)' },
            { id: 'trimestral', label: 'Trimestral (90 Días)' },
            { id: 'personalizado', label: 'Personalizado' }
          ].map((item) => {
            const isSelected = selectedInterval === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedInterval(item.id as DateRangeInterval)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Pickers (Shown if Personalizado, or as Range Preview) */}
        <div className="flex flex-wrap items-center gap-3">
          {selectedInterval === 'personalizado' ? (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[11px] font-bold">Desde:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[11px] font-bold">Hasta:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Periodo Actual: <strong className="text-emerald-700 dark:text-emerald-400">{bounds.currentStart} al {bounds.currentEnd}</strong> ({bounds.dayCount} {bounds.dayCount === 1 ? 'día' : 'días'})
              </span>
            </div>
          )}

          {/* Comparison Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs select-none">
            <input
              type="checkbox"
              checked={enableComparison}
              onChange={(e) => setEnableComparison(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
              Comparar con Periodo Previo
            </span>
          </label>
        </div>
      </div>

      {/* Comparison Reference Banner */}
      {enableComparison && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Comparación Activa:</strong> Evaluando <strong className="underline">{bounds.currentLabel}</strong> contra el periodo inmediatamente previo <strong className="underline">{bounds.previousLabel}</strong>.
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-300 font-bold shrink-0">
            Misma duración: {bounds.dayCount} {bounds.dayCount === 1 ? 'día' : 'días'} equivalentes
          </span>
        </div>
      )}

      {/* KPI Comparison Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ventas Totales */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Ventas Totales
            </span>
            {enableComparison && renderDeltaBadge(deltas.salesAmount, deltas.salesPercent, true)}
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              S/ {current.totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {enableComparison && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Periodo Previo:</span>
                <strong className="font-semibold text-slate-700 dark:text-slate-300">
                  S/ {previous.totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Efectivo: S/ {current.cashTotal.toFixed(0)}</span>
            <span>Digital: S/ {(current.yapeTotal + current.cardTotal).toFixed(0)}</span>
          </div>
        </div>

        {/* Card 2: Transacciones / Tickets */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Receipt className="w-4 h-4 text-cyan-600" />
              Comprobantes Emitidos
            </span>
            {enableComparison && renderDeltaBadge(deltas.transactions, deltas.transactionsPercent, false)}
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {current.transactionCount} tickets
            </div>
            {enableComparison && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Periodo Previo:</span>
                <strong className="font-semibold text-slate-700 dark:text-slate-300">
                  {previous.transactionCount} tickets
                </strong>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Volumen diario prom.:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {(current.transactionCount / bounds.dayCount).toFixed(1)} / día
            </span>
          </div>
        </div>

        {/* Card 3: Ticket Promedio */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <ShoppingCart className="w-4 h-4 text-purple-600" />
              Ticket Promedio
            </span>
            {enableComparison && renderDeltaBadge(deltas.avgTicket, deltas.avgTicketPercent, true)}
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              S/ {current.averageTicket.toFixed(2)}
            </div>
            {enableComparison && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Periodo Previo:</span>
                <strong className="font-semibold text-slate-700 dark:text-slate-300">
                  S/ {previous.averageTicket.toFixed(2)}
                </strong>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Unidades por ticket:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {(current.totalUnitsSold / Math.max(1, current.transactionCount)).toFixed(1)} uds
            </span>
          </div>
        </div>

        {/* Card 4: Margen Bruto Comercial (Join Relacional) */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Percent className="w-4 h-4 text-amber-600" />
              Margen Comercial Bruto
            </span>
            {enableComparison && renderDeltaBadge(deltas.grossProfit, deltas.grossProfitPercent, true)}
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
              <span>S/ {current.grossProfit.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              <span className="text-xs font-extrabold text-amber-600">({current.averageMarginPercent}%)</span>
            </div>
            {enableComparison && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Periodo Previo:</span>
                <strong className="font-semibold text-slate-700 dark:text-slate-300">
                  S/ {previous.grossProfit.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({previous.averageMarginPercent}%)
                </strong>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Unidades vendidas:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {current.totalUnitsSold.toLocaleString()} uds
            </span>
          </div>
        </div>
      </div>

      {/* Dual Period Recharts Comparison Trend */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tendencia Superpuesta: Periodo Actual vs Periodo Anterior
              </h3>
              <p className="text-[11px] text-slate-400">
                Línea sólida: Periodo Actual | Línea discontinua índigo: Periodo Anterior inmediato
              </p>
            </div>
          </div>

          {/* Metric Selector for Chart */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setChartMetric('sales')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                chartMetric === 'sales'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Ventas (S/)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('tickets')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                chartMetric === 'tickets'
                  ? 'bg-cyan-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Tickets
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('profit')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                chartMetric === 'profit'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Margen (S/)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('units')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                chartMetric === 'units'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Unidades
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="currentAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="bucketLabel" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => chartMetric === 'tickets' || chartMetric === 'units' ? `${val}` : `S/ ${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as typeof chartData[0];
                    const isCurrency = chartMetric === 'sales' || chartMetric === 'profit';
                    const cVal = chartMetric === 'sales' ? data.currentSales : chartMetric === 'tickets' ? data.currentTickets : chartMetric === 'profit' ? data.currentProfit : data.currentUnits;
                    const pVal = chartMetric === 'sales' ? data.previousSales : chartMetric === 'tickets' ? data.previousTickets : chartMetric === 'profit' ? data.previousProfit : data.previousUnits;
                    const diff = cVal - pVal;
                    const pct = pVal > 0 ? ((diff / pVal) * 100).toFixed(1) : '0.0';

                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[200px]">
                        <div className="font-bold border-b border-slate-800 pb-1 text-slate-300">
                          {label} ({data.currentDateStr})
                        </div>
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>Periodo Actual:</span>
                          <span>{isCurrency ? `S/ ${cVal.toFixed(2)}` : `${cVal} uds`}</span>
                        </div>
                        {enableComparison && (
                          <>
                            <div className="flex items-center justify-between text-indigo-300 font-bold">
                              <span>Periodo Anterior:</span>
                              <span>{isCurrency ? `S/ ${pVal.toFixed(2)}` : `${pVal} uds`}</span>
                            </div>
                            <div className={`flex items-center justify-between pt-1 border-t border-slate-800 font-extrabold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              <span>Variación:</span>
                              <span>{diff >= 0 ? '+' : ''}{pct}% ({isCurrency ? `S/ ${diff.toFixed(2)}` : diff})</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />

              {/* Area for current period */}
              <Area
                type="monotone"
                dataKey={chartMetric === 'sales' ? 'currentSales' : chartMetric === 'tickets' ? 'currentTickets' : chartMetric === 'profit' ? 'currentProfit' : 'currentUnits'}
                name="Periodo Actual"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#currentAreaGradient)"
                activeDot={{ r: 6 }}
              />

              {/* Comparative line for previous period */}
              {enableComparison && (
                <Line
                  type="monotone"
                  dataKey={chartMetric === 'sales' ? 'previousSales' : chartMetric === 'tickets' ? 'previousTickets' : chartMetric === 'profit' ? 'previousProfit' : 'previousUnits'}
                  name="Periodo Anterior (Comparativo)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#6366f1' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Performance Comparison Breakdown */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Desglose Comparativo por Familias Farmacéuticas
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Periodo Actual vs Previo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryComparison.slice(0, 6).map((cat) => (
            <div
              key={cat.category}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2" title={cat.category}>
                  {cat.category}
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                  cat.deltaPercent >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {cat.deltaPercent >= 0 ? '+' : ''}{cat.deltaPercent}%
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  S/ {cat.currentAmount.toFixed(0)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Previo: S/ {cat.previousAmount.toFixed(0)}
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (cat.currentAmount / (bounds.dayCount * 2500)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Relational Join Inspector Table (Visible when toggled) */}
      {showJoinedTable && (
        <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Auditoría de Inserción Consecutiva mediante Join Relacional
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">
              Ventas ⨝ Catálogo Productos ⨝ Lotes FEFO ({joinedSalesData.length} registros unidos)
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-[11px] font-mono text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="py-2 px-3">Fecha/Hora</th>
                  <th className="py-2 px-3">Comprobante</th>
                  <th className="py-2 px-3">Medicamento</th>
                  <th className="py-2 px-3">Lote FEFO</th>
                  <th className="py-2 px-3">Cant</th>
                  <th className="py-2 px-3">Costo U.</th>
                  <th className="py-2 px-3">Precio U.</th>
                  <th className="py-2 px-3">Subtotal</th>
                  <th className="py-2 px-3 text-right">Margen Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {joinedSalesData.slice(0, 10).map((row, idx) => (
                  <tr key={`${row.saleId}-${idx}`} className="hover:bg-slate-900/60">
                    <td className="py-2 px-3 text-slate-400">{row.saleDate} {row.saleTime}</td>
                    <td className="py-2 px-3 font-bold text-white">{row.receiptNumber}</td>
                    <td className="py-2 px-3 text-emerald-300">{row.productName}</td>
                    <td className="py-2 px-3 text-cyan-300">{row.batchCode}</td>
                    <td className="py-2 px-3">{row.quantity}</td>
                    <td className="py-2 px-3">S/ {row.unitCost.toFixed(2)}</td>
                    <td className="py-2 px-3">S/ {row.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 text-white font-bold">S/ {row.subtotal.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                      S/ {row.grossProfit.toFixed(2)} ({row.marginPercent}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
