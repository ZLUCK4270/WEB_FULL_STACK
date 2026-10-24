import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  Zap,
  Info,
  CreditCard,
  QrCode,
  Banknote,
  Archive,
  Flame,
  PlusCircle,
  Eye,
  FileDown
} from 'lucide-react';
import { calculate7DaysTrend } from '../../utils/salesAnalytics';
import { exportPharmacyExecutiveReportPDF } from '../../utils/pdfExport';

interface ResumenDelDiaProps {
  onNavigate?: (tabId: string) => void;
}

export const ResumenDelDia: React.FC<ResumenDelDiaProps> = ({ onNavigate }) => {
  const {
    sales,
    batches,
    products,
    cashRegister,
    adjustBatchStock,
    receiveNewBatch,
    systemDate,
    addQuickSale,
    currentUser
  } = usePharmacy();
  const [showExpiringDetails, setShowExpiringDetails] = useState<boolean>(false);
  const [showPaymentBreakdown, setShowPaymentBreakdown] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // 1. Live Sales Calculations (Context data)
  const todaySales = useMemo(() => {
    const filtered = sales.filter(s => {
      try {
        const saleDateOnly = s.date.slice(0, 10);
        return saleDateOnly === systemDate || s.date.startsWith(systemDate);
      } catch {
        return false;
      }
    });
    if (filtered.length > 0) return filtered;
    // Fallback for initial load if mock sales ISO string is on UTC yesterday
    if (sales.length > 0 && systemDate === new Date().toISOString().split('T')[0]) {
      return sales;
    }
    return [];
  }, [sales, systemDate]);

  const totalSalesAmount = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + s.total, 0);
  }, [todaySales]);

  // Tax breakdown (Perú: IGV 18% included)
  const subtotalNeto = +(totalSalesAmount / 1.18).toFixed(2);
  const totalIGV = +(totalSalesAmount - subtotalNeto).toFixed(2);

  // Payment methods breakdown
  const paymentStats = useMemo(() => {
    const cash = todaySales.filter(s => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0);
    const yape = todaySales.filter(s => s.paymentMethod === 'yape').reduce((sum, s) => sum + s.total, 0);
    const card = todaySales.filter(s => s.paymentMethod === 'tarjeta').reduce((sum, s) => sum + s.total, 0);
    return { cash, yape, card };
  }, [todaySales]);

  // 2. Transaction Count Calculations (Context data)
  const totalTransactions = todaySales.length;
  const avgTicket = totalTransactions > 0 ? +(totalSalesAmount / totalTransactions).toFixed(2) : 0;

  const receiptBreakdown = useMemo(() => {
    const boletas = todaySales.filter(s => s.receiptType === 'boleta').length;
    const facturas = todaySales.filter(s => s.receiptType === 'factura').length;
    const tickets = todaySales.filter(s => s.receiptType === 'ticket').length;
    return { boletas, facturas, tickets };
  }, [todaySales]);

  // 3. Batches expiring in the next 24 hours (Context data)
  const expiring24hBatches = useMemo(() => {
    const now = new Date();
    return batches
      .filter(batch => {
        if (batch.status !== 'active' || batch.stock <= 0) return false;

        // Parse expiration date (YYYY-MM-DD or ISO)
        const expDate = new Date(
          batch.expirationDate.includes('T') ? batch.expirationDate : `${batch.expirationDate}T23:59:59`
        );
        const diffMs = expDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // Within the next 24 hours (>= 0 and <= 24 hours)
        return diffHours >= 0 && diffHours <= 24;
      })
      .map(batch => {
        const product = products.find(p => p.id === batch.productId);
        const expDate = new Date(
          batch.expirationDate.includes('T') ? batch.expirationDate : `${batch.expirationDate}T23:59:59`
        );
        const diffMs = expDate.getTime() - new Date().getTime();
        const hoursLeft = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
        return {
          ...batch,
          product,
          hoursLeft
        };
      });
  }, [batches, products]);

  // Total units at risk in next 24h
  const totalUnitsAtRisk24h = useMemo(() => {
    return expiring24hBatches.reduce((sum, b) => sum + b.stock, 0);
  }, [expiring24hBatches]);

  // Handle quarantine action for critical batch
  const handleQuarantine = (batchId: string, batchCode: string, productName?: string) => {
    adjustBatchStock(batchId, 0, 'Aislamiento urgente por caducidad en <24h', true);
    setActionFeedback(`Lote ${batchCode} (${productName || 'Medicamento'}) enviado a CUARENTENA.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Simulate or add a test 24h batch for demonstration
  const handleAddDemo24hBatch = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)] || products[0];
    const expDate = new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString().split('T')[0];
    const code = `LOT-${randomProduct.code}-${Math.floor(100 + Math.random() * 900)}-24H`;

    receiveNewBatch({
      productId: randomProduct.id,
      batchCode: code,
      expirationDate: expDate,
      stock: 12,
      unitCost: 1.5,
      supplierName: 'Distribuidora Farmacéutica Demo'
    });

    setActionFeedback(`Se añadió el lote ${code} con vencimiento en ~16 horas para simulación.`);
    setShowExpiringDetails(true);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Quick sale test trigger
  const handleQuickSale = () => {
    const sale = addQuickSale();
    setActionFeedback(`¡Venta registrada por S/ ${sale.total.toFixed(2)} (${sale.receiptNumber})! Métricas actualizadas.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Export PDF Handler
  const handleExportPDF = () => {
    try {
      const { sevenDaysData, stats } = calculate7DaysTrend(sales, systemDate, 2500);
      exportPharmacyExecutiveReportPDF({
        summary: {
          systemDate,
          totalSalesAmount,
          subtotalNeto,
          totalIGV,
          totalTransactions,
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
      setActionFeedback('Informe de Gestión en PDF descargado exitosamente.');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setActionFeedback('Error al generar el PDF de gestión.');
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  return (
    <section aria-label="Resumen del Día" className="space-y-4">
      {/* Component Header / Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Resumen del Día
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Fecha: {systemDate}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Métricas clave de facturación, volumen transaccional y control de vencimiento FEFO en 24 horas
            </p>
          </div>
        </div>

        {/* Action buttons: Quick Sale, Simulate 24h, Export PDF */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleQuickSale}
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 transition flex items-center gap-1 shadow-2xs active:scale-95"
            title="Registrar una nueva venta rápida para ver actualización rotativa inmediata"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            + Venta Rápida
          </button>

          <button
            onClick={handleAddDemo24hBatch}
            className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-800 transition flex items-center gap-1 shadow-2xs active:scale-95"
            title="Añadir lote de prueba con vencimiento menor a 24 horas"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            + Simular Lote &lt;24h
          </button>

          <button
            onClick={handleExportPDF}
            className="text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 active:scale-95"
            title="Exportar informe de gestión gerencial a archivo PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Action notification toast */}
      {actionFeedback && (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* The 3 Core Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ======================================================== */}
        {/* TARJETA 1: VENTAS TOTALES */}
        {/* ======================================================== */}
        <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-700 dark:text-emerald-400">
                Ventas Totales
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Total Sales Amount */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                S/ {totalSalesAmount.toFixed(2)}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Facturación del Turno Activo</span>
            </div>

            {/* Subtotal & IGV Details */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Base Imponible</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  S/ {subtotalNeto.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">IGV (18%)</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  S/ {totalIGV.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown Toggle */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setShowPaymentBreakdown(!showPaymentBreakdown)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
            >
              <span>Ver medios de pago ({todaySales.length})</span>
              {showPaymentBreakdown ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {showPaymentBreakdown && (
              <div className="mt-2.5 space-y-1.5 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Efectivo:
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    S/ {paymentStats.cash.toFixed(2)}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <QrCode className="w-3.5 h-3.5 text-purple-600" /> Yape / Plin:
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    S/ {paymentStats.yape.toFixed(2)}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Tarjeta:
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    S/ {paymentStats.card.toFixed(2)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TARJETA 2: CANTIDAD DE TRANSACCIONES */}
        {/* ======================================================== */}
        <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-blue-700 dark:text-blue-400">
                Cantidad de Transacciones
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            {/* Transaction Count */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {totalTransactions}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {totalTransactions === 1 ? 'operación' : 'operaciones'}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Ticket Promedio: <strong>S/ {avgTicket.toFixed(2)}</strong></span>
            </div>

            {/* Document Types Breakdown */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Boletas</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {receiptBreakdown.boletas}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Facturas</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {receiptBreakdown.facturas}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Tickets</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {receiptBreakdown.tickets}
                </span>
              </div>
            </div>
          </div>

          {/* Quick link to POS or Cash */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Gaveta: S/ {cashRegister.currentCash.toFixed(2)}</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('pos')}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
              >
                Ir a Caja POS <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TARJETA 3: PRODUCTOS PRÓXIMOS A VENCER (PRÓXIMAS 24 HORAS) */}
        {/* ======================================================== */}
        <div
          className={`relative rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between group overflow-hidden ${
            expiring24hBatches.length > 0
              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Subtle top accent bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              expiring24hBatches.length > 0
                ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                : 'bg-gradient-to-r from-emerald-400 to-teal-500'
            }`}
          />

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span
                className={`font-semibold uppercase tracking-wider text-[11px] ${
                  expiring24hBatches.length > 0
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Próximos a Vencer (24 Horas)
              </span>
              <div
                className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${
                  expiring24hBatches.length > 0
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {expiring24hBatches.length > 0 ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
            </div>

            {/* Expiring Count */}
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-black tracking-tight ${
                  expiring24hBatches.length > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {expiring24hBatches.length}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {expiring24hBatches.length === 1 ? 'producto en riesgo' : 'productos en riesgo'}
              </span>
            </div>

            {/* Status notice */}
            <div className="mt-1">
              {expiring24hBatches.length > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {totalUnitsAtRisk24h} unidades requieren acción FEFO inmediata
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Sin vencimientos en las próximas 24 horas</span>
                </div>
              )}
            </div>

            {/* Regulatory badge */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {expiring24hBatches.length > 0
                  ? 'Protocolo DIGEMID: Priorizar o aislar'
                  : 'Almacén conforme a BPOF'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  expiring24hBatches.length > 0
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                }`}
              >
                {expiring24hBatches.length > 0 ? 'Alerta Activa' : 'Protegido'}
              </span>
            </div>
          </div>

          {/* Toggle details list / view alerts */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            {expiring24hBatches.length > 0 ? (
              <button
                onClick={() => setShowExpiringDetails(!showExpiringDetails)}
                className="font-bold text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                {showExpiringDetails ? (
                  <>Ocultar detalle <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Ver productos ({expiring24hBatches.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>
            ) : (
              <span className="text-slate-400 text-[11px]">Próxima revisión: 24h</span>
            )}

            {onNavigate && (
              <button
                onClick={() => onNavigate('alerts')}
                className="text-slate-600 dark:text-slate-300 font-bold hover:text-rose-600 flex items-center gap-1"
              >
                Alertas FEFO <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded list of products expiring within 24 hours */}
      {showExpiringDetails && expiring24hBatches.length > 0 && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                Detalle de Lotes con Vencimiento en las Próximas 24 Horas
              </h3>
            </div>
            <span className="text-[11px] text-rose-700 dark:text-rose-300">
              Total: {totalUnitsAtRisk24h} unidades en riesgo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiring24hBatches.map(batch => (
              <div
                key={batch.id}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/80 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                      {batch.product?.name || 'Medicamento'}
                    </h4>
                    <span className="text-[11px] text-slate-500 block">
                      {batch.product?.genericName || batch.product?.category}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black text-[10px] shrink-0 border border-rose-200 dark:border-rose-800">
                    ~{batch.hoursLeft}h rest.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lote / Serie:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                      {batch.batchCode}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Stock en riesgo:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-bold">
                      {batch.stock} unidades
                    </strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 truncate">
                    Vence: {batch.expirationDate}
                  </span>
                  <button
                    onClick={() => handleQuarantine(batch.id, batch.batchCode, batch.product?.name)}
                    className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 transition active:scale-95 shadow-2xs"
                    title="Enviar a Cuarentena Sanitaria DIGEMID para evitar venta"
                  >
                    <Archive className="w-3 h-3" />
                    Aislar Lote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
