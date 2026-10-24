import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  AreaChart, Area, ComposedChart, BarChart, Bar, Line, LineChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  TrendingUp, Clock, AlertTriangle, ShieldCheck, Zap, Calendar,
  DollarSign, Activity, BarChart3, Filter, CheckCircle2, ShoppingBag, ArrowUpRight
} from 'lucide-react';

// --- DATASETS SIMULADOS REALISTAS DE FARMACIA NOVA SALUD ---

// 1. Datos de Ventas por Hora (07:00 a 22:00)
export const HOURLY_SALES_DATA = [
  { hour: '07:00', ventasSoles: 180, tickets: 9, avgTicket: 20.0, rushHour: false },
  { hour: '08:00', ventasSoles: 360, tickets: 17, avgTicket: 21.2, rushHour: false },
  { hour: '09:00', ventasSoles: 640, tickets: 28, avgTicket: 22.8, rushHour: false },
  { hour: '10:00', ventasSoles: 920, tickets: 36, avgTicket: 25.5, rushHour: false },
  { hour: '11:00', ventasSoles: 1480, tickets: 55, avgTicket: 26.9, rushHour: true }, // Pico matutino
  { hour: '12:00', ventasSoles: 1890, tickets: 68, avgTicket: 27.8, rushHour: true }, // Pico almuerzo
  { hour: '13:00', ventasSoles: 1420, tickets: 51, avgTicket: 27.8, rushHour: true },
  { hour: '14:00', ventasSoles: 890, tickets: 35, avgTicket: 25.4, rushHour: false },
  { hour: '15:00', ventasSoles: 780, tickets: 31, avgTicket: 25.1, rushHour: false },
  { hour: '16:00', ventasSoles: 1120, tickets: 44, avgTicket: 25.4, rushHour: false },
  { hour: '17:00', ventasSoles: 1540, tickets: 59, avgTicket: 26.1, rushHour: true }, // Pico tarde
  { hour: '18:00', ventasSoles: 2150, tickets: 78, avgTicket: 27.5, rushHour: true }, // Pico principal salida de oficinas
  { hour: '19:00', ventasSoles: 2420, tickets: 86, avgTicket: 28.1, rushHour: true }, // Máximo diario
  { hour: '20:00', ventasSoles: 1780, tickets: 64, avgTicket: 27.8, rushHour: true },
  { hour: '21:00', ventasSoles: 940, tickets: 38, avgTicket: 24.7, rushHour: false },
  { hour: '22:00', ventasSoles: 410, tickets: 18, avgTicket: 22.7, rushHour: false },
];

// 2. Proyección de Demanda Basada en Historial (14 días históricos + 14 días proyectados)
export const DEMAND_FORECAST_DATA = [
  // Histórico reciente
  { day: 'Día -14', ventasReales: 145, proyeccionMedia: 140, bandaSuperior: 160, bandaInferior: 120 },
  { day: 'Día -12', ventasReales: 158, proyeccionMedia: 152, bandaSuperior: 175, bandaInferior: 130 },
  { day: 'Día -10', ventasReales: 162, proyeccionMedia: 160, bandaSuperior: 180, bandaInferior: 140 },
  { day: 'Día -8',  ventasReales: 180, proyeccionMedia: 175, bandaSuperior: 198, bandaInferior: 150 },
  { day: 'Día -6',  ventasReales: 172, proyeccionMedia: 170, bandaSuperior: 190, bandaInferior: 150 },
  { day: 'Día -4',  ventasReales: 195, proyeccionMedia: 188, bandaSuperior: 210, bandaInferior: 165 },
  { day: 'Día -2',  ventasReales: 210, proyeccionMedia: 205, bandaSuperior: 230, bandaInferior: 180 },
  { day: 'Hoy',     ventasReales: 225, proyeccionMedia: 220, bandaSuperior: 245, bandaInferior: 195 },
  // Proyección Modelo de Tendencia (ARIMA / Media Móvil Ponderada)
  { day: 'Día +2',  ventasReales: null, proyeccionMedia: 232, bandaSuperior: 260, bandaInferior: 204 },
  { day: 'Día +4',  ventasReales: null, proyeccionMedia: 240, bandaSuperior: 272, bandaInferior: 208 },
  { day: 'Día +6',  ventasReales: null, proyeccionMedia: 248, bandaSuperior: 285, bandaInferior: 212 },
  { day: 'Día +8',  ventasReales: null, proyeccionMedia: 255, bandaSuperior: 295, bandaInferior: 215 },
  { day: 'Día +10', ventasReales: null, proyeccionMedia: 263, bandaSuperior: 308, bandaInferior: 218 },
  { day: 'Día +12', ventasReales: null, proyeccionMedia: 270, bandaSuperior: 320, bandaInferior: 220 },
  { day: 'Día +14', ventasReales: null, proyeccionMedia: 280, bandaSuperior: 335, bandaInferior: 225 },
];

// 3. Distribución por Categorías Farmacéuticas y Margen
export const CATEGORY_MARGIN_DATA = [
  { categoria: 'Antibióticos', ventas: 4850, margenBruto: 1820, porcentajeMargen: 37.5, color: '#3b82f6' },
  { categoria: 'Analgésicos/Antigrip.', ventas: 6420, margenBruto: 2890, porcentajeMargen: 45.0, color: '#10b981' },
  { categoria: 'Cardio / Crónicos', ventas: 3950, margenBruto: 1240, porcentajeMargen: 31.4, color: '#f59e0b' },
  { categoria: 'Cuidado & Higiene', ventas: 2640, margenBruto: 1180, porcentajeMargen: 44.7, color: '#8b5cf6' },
  { categoria: 'Vitaminas/Suplementos', ventas: 3150, margenBruto: 1540, porcentajeMargen: 48.9, color: '#ec4899' },
];

// 4. Curva de Agotamiento de Lotes Críticos (FEFO Burn-down Rate)
export const FEFO_BURNDOWN_DATA = [
  { dia: 'Semana 1', loteAmox: 180, lotePara: 260, loteIbu: 140, stockSeguridad: 40 },
  { dia: 'Semana 2', loteAmox: 145, lotePara: 210, loteIbu: 110, stockSeguridad: 40 },
  { dia: 'Semana 3', loteAmox: 105, lotePara: 155, loteIbu: 78,  stockSeguridad: 40 },
  { dia: 'Semana 4', loteAmox: 68,  lotePara: 102, loteIbu: 48,  stockSeguridad: 40 },
  { dia: 'Semana 5', loteAmox: 28,  lotePara: 52,  loteIbu: 22,  stockSeguridad: 40 },
  { dia: 'Semana 6', loteAmox: 0,   lotePara: 12,  loteIbu: 0,   stockSeguridad: 40 }, // Agotamiento exitoso previo a vencimiento
];

export const AnalyticsWidgetsView: React.FC = () => {
  const { t, language } = useI18n();
  const [selectedProduct, setSelectedProduct] = useState<'amoxicilina' | 'paracetamol' | 'ibuprofeno'>('amoxicilina');
  const [activeMetric, setActiveMetric] = useState<'soles' | 'tickets'>('soles');

  const totalVentasDia = HOURLY_SALES_DATA.reduce((acc, h) => acc + h.ventasSoles, 0);
  const totalTicketsDia = HOURLY_SALES_DATA.reduce((acc, h) => acc + h.tickets, 0);
  const ticketPromedioGlobal = (totalVentasDia / totalTicketsDia).toFixed(2);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
              {t('analytics_badge')}
            </span>
            <span className="text-xs text-slate-500">{t('analytics_subtitle')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            {t('analytics_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('analytics_desc')}
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-3 py-1.5 text-right">
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">{t('sales_today')}</div>
            <div className="text-sm font-bold text-emerald-800 dark:text-emerald-200">S/ {totalVentasDia.toLocaleString()}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl px-3 py-1.5 text-right">
            <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium">{t('avg_ticket')}</div>
            <div className="text-sm font-bold text-indigo-800 dark:text-indigo-200">S/ {ticketPromedioGlobal}</div>
          </div>
        </div>
      </div>

      {/* GRID DE LOS 4 WIDGETS RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ============================================================== */}
        {/* WIDGET 1: TENDENCIA DE VENTAS POR HORA & HORAS PICO */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('w1_title')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('w1_subtitle')}
                  </p>
                </div>
              </div>

              {/* Selector de Métrica */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setActiveMetric('soles')}
                  className={`px-2 py-1 rounded transition ${activeMetric === 'soles' ? 'bg-white dark:bg-slate-900 font-bold text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                >
                  {t('metric_amount')}
                </button>
                <button
                  onClick={() => setActiveMetric('tickets')}
                  className={`px-2 py-1 rounded transition ${activeMetric === 'tickets' ? 'bg-white dark:bg-slate-900 font-bold text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                >
                  {t('metric_tickets')}
                </button>
              </div>
            </div>

            <div className="my-3 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {t('w1_peak_banner')}
              </span>
              <span className="text-[11px] bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-full font-bold">
                {t('w1_peak_badge')}
              </span>
            </div>

            {/* Recharts AreaChart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY_SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [activeMetric === 'soles' ? `S/ ${val}` : `${val} tickets`, activeMetric === 'soles' ? 'Venta Total' : 'Transacciones']}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <ReferenceLine x="19:00" stroke="#ef4444" strokeDasharray="3 3" label={{ value: t('w1_peak_marker'), fill: '#ef4444', fontSize: 10, position: 'top' }} />
                  {activeMetric === 'soles' ? (
                    <Area type="monotone" dataKey="ventasSoles" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" name="Venta (S/)" />
                  ) : (
                    <Area type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTickets)" name="N° Tickets" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>{t('source_audit')}</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{t('avg_speed')}</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* WIDGET 2: PROYECCIÓN DE DEMANDA BASADA EN HISTORIAL */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('w2_title')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('w2_subtitle')}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                {t('w2_trend_badge')}
              </span>
            </div>

            <div className="my-3 p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-900 dark:text-teal-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                {t('w2_forecast_banner')}
              </span>
              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                {t('w2_suggestion')}
              </span>
            </div>

            {/* Recharts ComposedChart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={DEMAND_FORECAST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <ReferenceLine x="Hoy" stroke="#6366f1" strokeDasharray="4 4" label={{ value: language === 'en' ? 'Today' : 'Hoy', fill: '#6366f1', fontSize: 11 }} />
                  {/* Ventas reales pasadas */}
                  <Bar dataKey="ventasReales" fill="#0d9488" radius={[4, 4, 0, 0]} name={t('w2_real_legend')} />
                  {/* Proyección futura */}
                  <Line type="monotone" dataKey="proyeccionMedia" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} name={t('w2_forecast_legend')} />
                  <Line type="monotone" dataKey="bandaSuperior" stroke="#93c5fd" strokeDasharray="3 3" dot={false} name={t('w2_upper_legend')} />
                  <Line type="monotone" dataKey="bandaInferior" stroke="#93c5fd" strokeDasharray="3 3" dot={false} name={t('w2_lower_legend')} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>{t('w2_model_info')}</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400">R² = 0.94</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* WIDGET 3: VENTAS Y MARGEN BRUTO POR CATEGORÍA FARMACÉUTICA */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('w3_title')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('w3_subtitle')}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-600">
                {t('w3_margin_badge')}
              </span>
            </div>

            <div className="my-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {t('w3_best_margin')}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                {t('w3_high_volume')}
              </span>
            </div>

            {/* Recharts Composed/Bar Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CATEGORY_MARGIN_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="categoria" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`S/ ${val.toLocaleString()}`, name]}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="ventas" fill="#94a3b8" radius={[4, 4, 0, 0]} name={t('w3_sales_legend')} />
                  <Bar dataKey="margenBruto" fill="#10b981" radius={[4, 4, 0, 0]} name={t('w3_margin_legend')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>{t('w3_calc_info')}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Decimal(10,2)</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* WIDGET 4: TASA DE AGOTAMIENTO DE LOTES CRÍTICOS (FEFO BURN-DOWN) */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('w4_title')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('w4_subtitle')}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {t('w4_zero_waste')}
              </span>
            </div>

            <div className="my-3 p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {t('w4_burn_banner')}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                {t('w4_success_badge')}
              </span>
            </div>

            {/* Recharts LineChart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={FEFO_BURNDOWN_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: t('w4_security_stock'), fill: '#ef4444', fontSize: 10, position: 'right' }} />
                  <Line type="monotone" dataKey="loteAmox" stroke="#f43f5e" strokeWidth={2.5} name="Lote AMX-2026 (Vence 30d)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="lotePara" stroke="#3b82f6" strokeWidth={2.5} name="Lote PAR-2026 (Vence 60d)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="loteIbu" stroke="#10b981" strokeWidth={2.5} name="Lote IBU-2026 (Vence 45d)" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>{t('w4_fefo_rule')}</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">{t('w4_loss_zero')}</span>
          </div>
        </div>

      </div>

      {/* Explicación Técnica y Valor Académico de los Widgets para el Jurado */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {t('justification_title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">{t('j1_title')}</strong>
            {t('j1_desc')}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">{t('j2_title')}</strong>
            {t('j2_desc')}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">{t('j3_title')}</strong>
            {t('j3_desc')}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">{t('j4_title')}</strong>
            {t('j4_desc')}
          </div>
        </div>
      </div>
    </div>
  );
};
