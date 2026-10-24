import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Receipt,
  ArrowUpRight,
  Sparkles,
  Target,
  Activity,
  CheckCircle2,
  ChevronRight,
  ShoppingCart,
  FileDown,
  ChevronRightCircle,
  PlusCircle,
  Clock,
  Printer
} from 'lucide-react';
import { calculate7DaysTrend } from '../../utils/salesAnalytics';
import { exportPharmacyExecutiveReportPDF } from '../../utils/pdfExport';

interface SalesTrend7DaysChartProps {
  onNavigate?: (tabId: string) => void;
}

export const SalesTrend7DaysChart: React.FC<SalesTrend7DaysChartProps> = ({ onNavigate }) => {
  const {
    sales,
    systemDate,
    advanceSystemDate,
    addQuickSale,
    currentUser,
    batches,
    products
  } = usePharmacy();

  const [metricMode, setMetricMode] = useState<'sales_and_goal' | 'dual_axis' | 'sales_only'>('sales_and_goal');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Daily target in Soles for the pharmacy
  const DAILY_SALES_TARGET = 2500;

  // Calculate 7 days data dynamically based on sales and active systemDate
  const { sevenDaysData, stats } = useMemo(() => {
    return calculate7DaysTrend(sales, systemDate, DAILY_SALES_TARGET);
  }, [sales, systemDate, DAILY_SALES_TARGET]);

  // Handle Export to PDF
  const handleExportPDF = () => {
    try {
      setIsExporting(true);

      // Current day summary calculations
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

      // Expiring batches in next 24h
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

      setExportFeedback('Informe Gerencial en PDF exportado y descargado exitosamente.');
      setTimeout(() => setExportFeedback(null), 4500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setExportFeedback('Error al generar el archivo PDF.');
      setTimeout(() => setExportFeedback(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // Quick sale test trigger
  const handleQuickSaleTest = () => {
    const sale = addQuickSale();
    setExportFeedback(`¡Nueva venta registrada por S/ ${sale.total.toFixed(2)}! Las métricas y el gráfico se actualizaron automáticamente.`);
    setTimeout(() => setExportFeedback(null), 4500);
  };

  // Advance day test trigger
  const handleAdvanceDay = () => {
    advanceSystemDate(1);
    setExportFeedback('Fecha de gestión avanzada al siguiente día rotativo (+1 día). Ventana de 7 días recalculada.');
    setTimeout(() => setExportFeedback(null), 4500);
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header and Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tendencia de Ventas de los Últimos 7 Días
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En Vivo (Recharts)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              Gestión: <strong className="text-emerald-600 dark:text-emerald-400">{systemDate}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evolución diaria rotativa de facturación neta, ticket promedio y meta operativa de S/ {DAILY_SALES_TARGET.toLocaleString('es-PE')}.
          </p>
        </div>

        {/* Action Controls & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick interactive test buttons to demonstrate dynamic rotative updates */}
          <button
            onClick={handleQuickSaleTest}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="Registrar venta rápida para verificar actualización instantánea de métricas"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            + Registrar Venta
          </button>

          <button
            onClick={handleAdvanceDay}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="Avanzar la fecha de gestión al día siguiente (08/10 -> 09/10 -> 10/10...)"
          >
            <ChevronRightCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            +1 Día Rotativo
          </button>

          {/* Primary PDF Export Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60"
            title="Exportar informe de gestión gerencial con gráfico y resumen a archivo PDF"
          >
            <FileDown className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            {isExporting ? 'Generando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Notification Feedback Toast */}
      {exportFeedback && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-900 dark:text-emerald-100 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{exportFeedback}</span>
        </div>
      )}

      {/* View Mode Segmented Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setMetricMode('sales_and_goal')}
            className={`px-3 py-1.5 rounded-lg transition ${
              metricMode === 'sales_and_goal'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Venta + Meta & Tendencia
          </button>
          <button
            onClick={() => setMetricMode('dual_axis')}
            className={`px-3 py-1.5 rounded-lg transition ${
              metricMode === 'dual_axis'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ventas vs. Boletas
          </button>
          <button
            onClick={() => setMetricMode('sales_only')}
            className={`px-3 py-1.5 rounded-lg transition ${
              metricMode === 'sales_only'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Solo Facturación (S/)
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Ventana móvil de 7 días continuos finalizando en {systemDate}</span>
        </div>
      </div>

      {/* 4 Summary Micro-KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Total 7 Días Facturado
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              S/ {stats.totalVentas7d.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            +14.8% vs. semana ant.
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Promedio Diario
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
              S/ {stats.avgDiario.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {stats.cumplimientoSemanal}% de meta semanal
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Día Récord Semanal
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">
              {stats.peakDay ? stats.peakDay.diaCorto : 'Sáb'}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              (S/ {stats.peakDay?.ventas.toLocaleString('es-PE')})
            </span>
          </div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 block">
            Pico de afluencia
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Transacciones & Ticket
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.totalTickets7d}
            </span>
            <span className="text-xs text-slate-500 font-normal">boletas</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Ticket prom: S/ {stats.ticketPromedioGlobal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RECHARTS LINE CHART CONTAINER */}
      {/* ======================================================== */}
      <div className="w-full h-80 pt-2 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sevenDaysData}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
            <XAxis
              dataKey="diaCorto"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#059669"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              domain={[1500, (dataMax: number) => Math.max(3500, Math.ceil(dataMax * 1.15))]}
            />

            {metricMode === 'dual_axis' && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6366f1"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(val) => `${val} b.`}
                domain={[40, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-lg text-xs space-y-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        {d.diaCompleto}
                      </span>
                      {d.esHoy && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">
                          En Vivo
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                      <span>Venta Total:</span>
                      <span className="text-sm">S/ {d.ventas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Boletas Emitidas:</span>
                      <span className="font-semibold">{d.tickets} tickets</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Ticket Promedio:</span>
                      <span className="font-semibold">S/ {d.avgTicket.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Meta Operativa:</span>
                      <span>S/ {d.metaDiaria.toLocaleString('es-PE')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="font-semibold text-slate-500">Cumplimiento:</span>
                      <span className={`font-bold ${d.cumplimiento >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {d.cumplimiento}%
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
              formatter={(value) => {
                if (value === 'ventas') return 'Facturación Diaria (S/)';
                if (value === 'promedioMovil') return 'Media Móvil 3 Días';
                if (value === 'tickets') return 'Transacciones / Boletas';
                return value;
              }}
            />

            {/* Reference Line for Daily Target */}
            <ReferenceLine
              yAxisId="left"
              y={DAILY_SALES_TARGET}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Meta S/ ${DAILY_SALES_TARGET}`,
                position: 'top',
                fill: '#d97706',
                fontSize: 10,
                fontWeight: 'bold'
              }}
            />

            {/* Main Daily Sales Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="ventas"
              name="ventas"
              stroke="#059669"
              strokeWidth={3}
              dot={{ r: 4, stroke: '#059669', strokeWidth: 2, fill: '#ffffff' }}
              activeDot={{ r: 7, stroke: '#047857', strokeWidth: 3, fill: '#10b981' }}
            />

            {/* Moving Average Line in sales_and_goal mode */}
            {metricMode === 'sales_and_goal' && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="promedioMovil"
                name="promedioMovil"
                stroke="#0284c7"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}

            {/* Transactions count line in dual_axis mode */}
            {metricMode === 'dual_axis' && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tickets"
                name="tickets"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 3, stroke: '#6366f1', strokeWidth: 1.5, fill: '#ffffff' }}
                activeDot={{ r: 6, fill: '#818cf8' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Insights Footer & Fast Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Los datos se recalculan consecutivamente en cada venta y avanzan automáticamente según la fecha de gestión.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Descargar Informe PDF
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('pos')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 transition"
            >
              Ir a Registrar Venta POS <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
