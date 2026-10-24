import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Batch } from '../types/pharmacy';

export interface DayTrendItem {
  dateObj: Date;
  diaCorto: string;
  diaCompleto: string;
  ventas: number;
  tickets: number;
  avgTicket: number;
  metaDiaria: number;
  cumplimiento: number;
  promedioMovil?: number;
  esHoy?: boolean;
}

export interface DaySummaryData {
  systemDate: string;
  totalSalesAmount: number;
  subtotalNeto: number;
  totalIGV: number;
  totalTransactions: number;
  avgTicket: number;
  receiptBreakdown: {
    boletas: number;
    facturas: number;
    tickets: number;
  };
  paymentStats: {
    cash: number;
    yape: number;
    card: number;
  };
  expiring24hBatches: Array<{
    batchCode: string;
    productName?: string;
    genericName?: string;
    stock: number;
    expirationDate: string;
    hoursLeft: number;
  }>;
}

export interface PDFExportOptions {
  summary: DaySummaryData;
  trend7Days: DayTrendItem[];
  trendStats: {
    totalVentas7d: number;
    totalTickets7d: number;
    avgDiario: number;
    peakDay?: DayTrendItem;
    ticketPromedioGlobal: number;
    cumplimientoSemanal: number;
  };
  responsibleName: string;
  responsibleRole: string;
}

/**
 * Generates and downloads a high-fidelity management PDF report
 * containing both the Daily Summary and the 7-Day Sales Trend.
 */
export const exportPharmacyExecutiveReportPDF = (options: PDFExportOptions): void => {
  const { summary, trend7Days, trendStats, responsibleName, responsibleRole } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // --- 1. BRANDING HEADER BANNER ---
  // Primary emerald bar
  doc.setFillColor(6, 95, 70); // #065f46 Emerald 800
  doc.rect(margin, currentY, pageWidth - margin * 2, 22, 'F');

  // Accent stripe
  doc.setFillColor(16, 185, 129); // #10b981 Emerald 500
  doc.rect(margin, currentY + 21, pageWidth - margin * 2, 1.5, 'F');

  // White text in banner
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FARMACIA & BOTICA SAN LORENZO', margin + 6, currentY + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA INTEGRAL DE GESTIÓN FARMACÉUTICA • REGULACIÓN DIGEMID / SUNAT', margin + 6, currentY + 14);
  doc.text('RUC: 20608945123 • Sede Central Jesús María, Lima', margin + 6, currentY + 18.5);

  // Badge on the right
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME GERENCIAL', pageWidth - margin - 38, currentY + 8);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('REPORTE OFICIAL', pageWidth - margin - 38, currentY + 13);
  doc.text(`FOLIO: INF-${summary.systemDate.replace(/-/g, '')}`, pageWidth - margin - 38, currentY + 17.5);

  currentY += 28;

  // --- 2. DOCUMENT METADATA GRID ---
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 16, 2, 2, 'FD');

  const nowFormatted = new Date().toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // Slate 600

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Gestión Operativa:', margin + 4, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${summary.systemDate} (Rotativo Continuo)`, margin + 43, currentY + 6);

  // Column 2
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Responsable en Turno:', margin + 105, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${responsibleName} (${responsibleRole})`, margin + 137, currentY + 6);

  // Row 2
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Emisión del Documento:', margin + 4, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(nowFormatted, margin + 43, currentY + 12);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Estado de Métricas:', margin + 105, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text('100% Actualizado en Tiempo Real (FEFO)', margin + 137, currentY + 12);

  currentY += 21;

  // --- 3. SECTION 1: RESUMEN EJECUTIVO DEL DÍA ---
  doc.setFillColor(16, 185, 129); // Accent small bar
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. RESUMEN EJECUTIVO DEL DÍA (FACTURACIÓN & OPERACIONES)', margin + 6, currentY + 5);

  currentY += 9;

  // 4 KPI Cards for the day
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 17;

  const kpis = [
    {
      title: 'VENTAS TOTALES',
      value: `S/ ${summary.totalSalesAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Subt: S/ ${summary.subtotalNeto.toFixed(2)} | IGV: S/ ${summary.totalIGV.toFixed(2)}`,
      bg: [236, 253, 245], // emerald-50
      border: [167, 243, 208],
      text: [6, 95, 70]
    },
    {
      title: 'TRANSACCIONES',
      value: `${summary.totalTransactions} tickets`,
      subtitle: `${summary.receiptBreakdown.boletas} Bol. • ${summary.receiptBreakdown.facturas} Fact. • ${summary.receiptBreakdown.tickets} Tick.`,
      bg: [238, 242, 255], // indigo-50
      border: [199, 210, 254],
      text: [49, 46, 129]
    },
    {
      title: 'TICKET PROMEDIO',
      value: `S/ ${summary.avgTicket.toFixed(2)}`,
      subtitle: 'Promedio por comprobante',
      bg: [240, 253, 250], // teal-50
      border: [153, 246, 228],
      text: [19, 78, 74]
    },
    {
      title: 'VENCIMIENTO < 24H',
      value: `${summary.expiring24hBatches.length} lote(s)`,
      subtitle: summary.expiring24hBatches.length > 0 ? 'En alerta de cuarentena' : '0 lotes en riesgo',
      bg: summary.expiring24hBatches.length > 0 ? [254, 242, 242] : [240, 253, 244],
      border: summary.expiring24hBatches.length > 0 ? [254, 202, 202] : [187, 247, 208],
      text: summary.expiring24hBatches.length > 0 ? [153, 27, 27] : [22, 101, 52]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (cardWidth + 3);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.roundedRect(kpiX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
    doc.text(kpi.title, kpiX + 3, currentY + 4.5);

    doc.setFontSize(10.5);
    doc.text(kpi.value, kpiX + 3, currentY + 10.5);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.subtitle, kpiX + 3, currentY + 14.5);
  });

  currentY += cardHeight + 4;

  // Breakdown by payment methods table
  const totalPaymentSum = summary.paymentStats.cash + summary.paymentStats.yape + summary.paymentStats.card || 1;
  const cashPct = Math.round((summary.paymentStats.cash / totalPaymentSum) * 100);
  const yapePct = Math.round((summary.paymentStats.yape / totalPaymentSum) * 100);
  const cardPct = Math.round((summary.paymentStats.card / totalPaymentSum) * 100);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Medio de Pago', 'Facturación Diaria (S/)', '% Participación', 'Destino Financiero']],
    body: [
      ['Efectivo en Mostrador', `S/ ${summary.paymentStats.cash.toFixed(2)}`, `${cashPct}%`, 'Caja Física Principal'],
      ['Billetera Digital (Yape / Plin)', `S/ ${summary.paymentStats.yape.toFixed(2)}`, `${yapePct}%`, 'Cuenta BCP Digital Farmacia'],
      ['Tarjetas Débito / Crédito', `S/ ${summary.paymentStats.card.toFixed(2)}`, `${cardPct}%`, 'POS Izipay / Niubiz']
    ],
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 35, halign: 'center' },
      3: { halign: 'left' }
    }
  });

  // Update currentY after payment table
  currentY = (doc as any).lastAutoTable.finalY + 5;

  // If there are expiring batches in next 24h, render their table
  if (summary.expiring24hBatches.length > 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28); // Red 700
    doc.text('ALERTA SANITARIA: Lotes de Medicamentos Próximos a Vencer (< 24 Horas):', margin, currentY);
    currentY += 2;

    const expiringRows = summary.expiring24hBatches.map(b => [
      b.batchCode,
      b.productName || 'Medicamento',
      `${b.stock} unidades`,
      b.expirationDate,
      `~${b.hoursLeft} horas`,
      'CUARENTENA INMEDIATA'
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Código Lote', 'Producto / Medicamento', 'Stock en Riesgo', 'F. Caducidad', 'Tiempo Restante', 'Protocolo']],
      body: expiringRows,
      headStyles: {
        fillColor: [185, 28, 28],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59]
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // --- 4. SECTION 2: TENDENCIA DE VENTAS DE LOS ÚLTIMOS 7 DÍAS ---
  doc.setFillColor(79, 70, 229); // Indigo 600 accent bar
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. TENDENCIA DE VENTAS DE LOS ÚLTIMOS 7 DÍAS (VENTANA ROTATIVA)', margin + 6, currentY + 5);

  currentY += 9;

  // Table with the 7 consecutive days
  const tableRows = trend7Days.map(item => {
    return [
      item.diaCorto + (item.esHoy ? ' (ACTUAL)' : ''),
      item.diaCompleto,
      `S/ ${item.ventas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${item.tickets} bol.`,
      `S/ ${item.avgTicket.toFixed(2)}`,
      `S/ ${item.metaDiaria.toLocaleString('es-PE')}`,
      `${item.cumplimiento}%`,
      item.promedioMovil ? `S/ ${item.promedioMovil.toFixed(2)}` : '-'
    ];
  });

  // Append a summary row
  tableRows.push([
    'TOTAL SEMANAL',
    'Acumulado Últimos 7 Días Rotativos',
    `S/ ${trendStats.totalVentas7d.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `${trendStats.totalTickets7d} bol.`,
    `S/ ${trendStats.ticketPromedioGlobal.toFixed(2)}`,
    `S/ ${(2500 * 7).toLocaleString('es-PE')}`,
    `${trendStats.cumplimientoSemanal}%`,
    `Prom: S/ ${trendStats.avgDiario.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    head: [['Día / Código', 'Fecha Completa', 'Ventas (S/)', 'Comprobantes', 'Ticket Prom.', 'Meta (S/)', '% Cumpl.', 'Prom. Móvil']],
    body: tableRows,
    headStyles: {
      fillColor: [6, 95, 70], // Emerald 800
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 26 },
      1: { cellWidth: 42 },
      2: { halign: 'right', fontStyle: 'bold', textColor: [6, 95, 70] },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center', fontStyle: 'bold' },
      7: { halign: 'right' }
    },
    didParseCell: (data) => {
      // Highlight the last row (Summary row)
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Check if we need a new page for signatures
  if (currentY > pageHeight - 38) {
    doc.addPage();
    currentY = 20;
  }

  // --- 5. MANAGEMENT AUDIT SUMMARY & SIGNATURES ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('OBSERVACIONES DE GESTIÓN & AUDITORÍA ROTATIVA:', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `• Cumplimiento Global Semanal: ${trendStats.cumplimientoSemanal}%. Día con mayor facturación registrada: ${trendStats.peakDay?.diaCompleto || 'N/A'} (S/ ${trendStats.peakDay?.ventas.toFixed(2) || '0.00'}).`,
    margin + 4,
    currentY + 10
  );
  doc.text(
    '• Rotación de Stock e Inventario: Operación validada bajo norma técnica FEFO de DIGEMID con dispensación cronológica estricta.',
    margin + 4,
    currentY + 14
  );
  doc.text(
    '• Certificación de Datos: Toda venta ingresada en el sistema POS se consolida de forma rotativa consecutiva según la fecha de gestión.',
    margin + 4,
    currentY + 18
  );

  currentY += 30;

  // Signatures lines
  const sigWidth = 60;
  const sig1X = margin + 15;
  const sig2X = pageWidth - margin - sigWidth - 15;

  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.line(sig1X, currentY + 12, sig1X + sigWidth, currentY + 12);
  doc.line(sig2X, currentY + 12, sig2X + sigWidth, currentY + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${responsibleName}`, sig1X + sigWidth / 2, currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${responsibleRole} / Regente Farmacéutico`, sig1X + sigWidth / 2, currentY + 19.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SUPERVISIÓN DE AUDITORÍA Y CONTROL', sig2X + sigWidth / 2, currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Administración Central • Botica San Lorenzo', sig2X + sigWidth / 2, currentY + 19.5, { align: 'center' });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages} • Documento Electrónico Generado por Sistema San Lorenzo • DIGEMID Certificado`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Trigger download
  const cleanFileName = `Informe_Gestion_Farmacia_${summary.systemDate}_${Date.now()}.pdf`;
  doc.save(cleanFileName);
};

export interface PeriodComparisonPDFOptions {
  bounds: {
    currentStart: string;
    currentEnd: string;
    currentLabel: string;
    previousStart: string;
    previousEnd: string;
    previousLabel: string;
    dayCount: number;
    intervalType: string;
  };
  metrics: {
    current: {
      totalSales: number;
      transactionCount: number;
      averageTicket: number;
      grossProfit: number;
      averageMarginPercent: number;
      totalUnitsSold: number;
      cashTotal: number;
      yapeTotal: number;
      cardTotal: number;
    };
    previous: {
      totalSales: number;
      transactionCount: number;
      averageTicket: number;
      grossProfit: number;
      averageMarginPercent: number;
      totalUnitsSold: number;
    };
    deltas: {
      salesAmount: number;
      salesPercent: number;
      transactions: number;
      transactionsPercent: number;
      avgTicket: number;
      avgTicketPercent: number;
      grossProfit: number;
      grossProfitPercent: number;
    };
  };
  categories: Array<{
    category: string;
    currentAmount: number;
    previousAmount: number;
    deltaPercent: number;
    unitsSold: number;
  }>;
  joinedSamples?: Array<{
    saleDate: string;
    receiptNumber: string;
    productName: string;
    batchCode: string;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    subtotal: number;
    grossProfit: number;
    marginPercent: number;
  }>;
  responsibleName: string;
  responsibleRole: string;
  systemDate: string;
}

export const exportPeriodComparisonPDF = (options: PeriodComparisonPDFOptions): void => {
  const { bounds, metrics, categories, joinedSamples, responsibleName, responsibleRole, systemDate } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // Header Banner
  doc.setFillColor(6, 95, 70); // Emerald 800
  doc.rect(margin, currentY, pageWidth - margin * 2, 22, 'F');

  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(margin, currentY + 21, pageWidth - margin * 2, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BOTICA SAN LORENZO • INFORME COMPARATIVO DE VENTAS', margin + 6, currentY + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text(
    `Análisis de Rango: ${bounds.currentLabel} vs ${bounds.previousLabel} (${bounds.intervalType.toUpperCase()})`,
    margin + 6,
    currentY + 14
  );
  doc.text(`Fecha Base del Sistema: ${systemDate} | Emisión: ${new Date().toLocaleTimeString('es-PE')}`, margin + 6, currentY + 18.5);

  currentY += 28;

  // Executive Summary Subheader
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. RESUMEN EJECUTIVO Y VARIACIÓN COMPARATIVA', margin, currentY);

  currentY += 4;

  // Comparative Metrics AutoTable
  const currentSalesStr = `S/ ${metrics.current.totalSales.toFixed(2)}`;
  const previousSalesStr = `S/ ${metrics.previous.totalSales.toFixed(2)}`;
  const salesVarStr = `${metrics.deltas.salesPercent >= 0 ? '+' : ''}${metrics.deltas.salesPercent}% (S/ ${metrics.deltas.salesAmount >= 0 ? '+' : ''}${metrics.deltas.salesAmount.toFixed(2)})`;

  const currentTicketsStr = `${metrics.current.transactionCount} tickets`;
  const previousTicketsStr = `${metrics.previous.transactionCount} tickets`;
  const ticketsVarStr = `${metrics.deltas.transactionsPercent >= 0 ? '+' : ''}${metrics.deltas.transactionsPercent}% (${metrics.deltas.transactions >= 0 ? '+' : ''}${metrics.deltas.transactions})`;

  const currentAvgTicketStr = `S/ ${metrics.current.averageTicket.toFixed(2)}`;
  const previousAvgTicketStr = `S/ ${metrics.previous.averageTicket.toFixed(2)}`;
  const avgTicketVarStr = `${metrics.deltas.avgTicketPercent >= 0 ? '+' : ''}${metrics.deltas.avgTicketPercent}%`;

  const currentProfitStr = `S/ ${metrics.current.grossProfit.toFixed(2)} (${metrics.current.averageMarginPercent}%)`;
  const previousProfitStr = `S/ ${metrics.previous.grossProfit.toFixed(2)} (${metrics.previous.averageMarginPercent}%)`;
  const profitVarStr = `${metrics.deltas.grossProfitPercent >= 0 ? '+' : ''}${metrics.deltas.grossProfitPercent}%`;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Indicador Clave de Rendimiento', 'Periodo Actual', 'Periodo Previo Comparativo', 'Variación Neta / %']],
    body: [
      ['Ventas Brutas Totales', currentSalesStr, previousSalesStr, salesVarStr],
      ['Comprobantes / Tickets', currentTicketsStr, previousTicketsStr, ticketsVarStr],
      ['Ticket Promedio', currentAvgTicketStr, previousAvgTicketStr, avgTicketVarStr],
      ['Margen Bruto Comercial (Join)', currentProfitStr, previousProfitStr, profitVarStr],
      ['Unidades Totales Dispensadas', `${metrics.current.totalUnitsSold} uds`, `${metrics.previous.totalUnitsSold} uds`, `${metrics.current.totalUnitsSold - metrics.previous.totalUnitsSold >= 0 ? '+' : ''}${metrics.current.totalUnitsSold - metrics.previous.totalUnitsSold} uds`]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 2. Categories Breakdown
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. DESGLOSE POR LÍNEAS / FAMILIAS FARMACÉUTICAS', margin, currentY);

  currentY += 4;

  const catRows = categories.slice(0, 7).map(c => [
    c.category,
    `S/ ${c.currentAmount.toFixed(2)}`,
    `S/ ${c.previousAmount.toFixed(2)}`,
    `${c.deltaPercent >= 0 ? '+' : ''}${c.deltaPercent}%`,
    `${c.unitsSold} uds`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Familia Farmacéutica', 'Ventas Periodo Actual', 'Ventas Periodo Previo', 'Variación %', 'Unidades']],
    body: catRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 250] }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 3. Relational Join Sample
  if (joinedSamples && joinedSamples.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. MUESTRA DE REGISTROS INSERT JOIN (TRAZABILIDAD RELACIONAL)', margin, currentY);

    currentY += 4;

    const sampleRows = joinedSamples.slice(0, 5).map(s => [
      s.saleDate,
      s.receiptNumber,
      s.productName,
      s.batchCode,
      `${s.quantity}`,
      `S/ ${s.unitPrice.toFixed(2)}`,
      `S/ ${s.subtotal.toFixed(2)}`,
      `S/ ${s.grossProfit.toFixed(2)} (${s.marginPercent}%)`
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Fecha', 'Comprobante', 'Medicamento', 'Lote FEFO', 'Cant', 'P. Unit', 'Total', 'Margen']],
      body: sampleRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.8 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Legal & Technical Note
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, pageWidth - margin * 2, 16, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `• Informe de control gerencial generado con datos relacionales integrados (Ventas, Catálogo y Lotes FEFO).`,
    margin + 4,
    currentY + 5
  );
  doc.text(
    `• Responsable de Emisión: ${responsibleName} (${responsibleRole}) • Botica San Lorenzo S.A.C.`,
    margin + 4,
    currentY + 9.5
  );
  doc.text(
    `• Certificación de integridad de datos: Cálculo dinámico consecutivo para días posteriores.`,
    margin + 4,
    currentY + 13.5
  );

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages} • Reporte Comparativo de Periodos • Sistema San Lorenzo`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  doc.save(`Informe_Comparativo_Periodos_${bounds.intervalType}_${Date.now()}.pdf`);
};

export interface InventoryPDFExportOptions {
  products: Product[];
  batches: Batch[];
  systemDate: string;
  responsibleName?: string;
  responsibleRole?: string;
  filterLabel?: string;
}

export const exportInventoryPDF = (options: InventoryPDFExportOptions): void => {
  const {
    products,
    batches,
    systemDate,
    responsibleName = 'Dr. Carlos Mendoza Flores',
    responsibleRole = 'Regente Farmacéutico',
    filterLabel = 'Inventario General Completo'
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let currentY = 12;

  // Header Banner
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(margin, currentY, pageWidth - margin * 2, 22, 'F');

  doc.setFillColor(20, 184, 166); // Teal 500
  doc.rect(margin, currentY + 21, pageWidth - margin * 2, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BOTICA NOVA SALUD • REPORTE OFICIAL DE INVENTARIO Y LOTES FEFO', margin + 6, currentY + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(204, 251, 241);
  doc.text(
    `Filtro: ${filterLabel.toUpperCase()} | Fecha de Gestión: ${systemDate} | Emisión: ${new Date().toLocaleTimeString('es-PE')}`,
    margin + 6,
    currentY + 14
  );
  doc.text(
    `Control Técnico DIGEMID: Buenas Prácticas de Almacenamiento (BPA) y Dispensación FEFO`,
    margin + 6,
    currentY + 18.5
  );

  currentY += 27;

  // KPI Summary Bar
  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.id, p));

  const totalStockUnits = batches.reduce((acc, b) => acc + (b.status === 'active' ? b.stock : 0), 0);
  const totalCostValuation = batches.reduce((acc, b) => acc + (b.status === 'active' ? b.stock * b.unitCost : 0), 0);

  const calculateDays = (dateStr: string) => {
    const today = new Date(systemDate.includes('T') ? systemDate : `${systemDate}T00:00:00`);
    const exp = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T23:59:59`);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const criticalBatchesCount = batches.filter(b => {
    if (b.status !== 'active') return false;
    const days = calculateDays(b.expirationDate);
    return days <= 30 && days > 0;
  }).length;

  const quarantineBatchesCount = batches.filter(b => b.status === 'quarantine').length;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, pageWidth - margin * 2, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, currentY, pageWidth - margin * 2, 14, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  const colW = (pageWidth - margin * 2) / 5;
  doc.text(`SKUs Activos: ${products.length}`, margin + 4, currentY + 6);
  doc.text(`Lotes Totales: ${batches.length}`, margin + colW + 2, currentY + 6);
  doc.text(`Unidades: ${totalStockUnits.toLocaleString()} uds`, margin + colW * 2 + 2, currentY + 6);
  doc.text(`Valuación: S/ ${totalCostValuation.toFixed(2)}`, margin + colW * 3 + 2, currentY + 6);
  doc.text(`Lotes Críticos (<30d): ${criticalBatchesCount}`, margin + colW * 4 + 2, currentY + 6);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Cuarentena: ${quarantineBatchesCount} lotes`, margin + colW * 4 + 2, currentY + 10.5);

  currentY += 18;

  // Table of Batches
  const rows = batches.map((batch, idx) => {
    const product = productMap.get(batch.productId);
    const days = calculateDays(batch.expirationDate);
    let estado = 'Vigente';
    if (batch.status === 'quarantine') estado = 'Cuarentena';
    else if (batch.status === 'expired' || days <= 0) estado = 'Vencido';
    else if (days <= 30) estado = 'Crítico (<30d)';
    else if (days <= 90) estado = 'Próx. (<90d)';

    const totalVal = (batch.stock * batch.unitCost).toFixed(2);

    return [
      `${idx + 1}`,
      product?.code || 'N/A',
      product?.name || 'Producto',
      batch.batchCode,
      batch.supplierName.slice(0, 16),
      batch.expirationDate,
      `${days} d`,
      estado,
      `${batch.stock}`,
      `S/ ${batch.unitCost.toFixed(2)}`,
      `S/ ${totalVal}`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['N°', 'Código', 'Medicamento Comercial', 'Lote', 'Droguería', 'Caducidad', 'Días', 'Estado FEFO', 'Stock', 'Costo U.', 'Valor Total']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 1.6 },
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 250] },
    columnStyles: {
      0: { cellWidth: 7 },
      1: { cellWidth: 15 },
      2: { cellWidth: 38 },
      3: { cellWidth: 18 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { cellWidth: 12 },
      7: { cellWidth: 20 },
      8: { cellWidth: 12 },
      9: { cellWidth: 14 },
      10: { cellWidth: 16 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  let signY = finalY;
  if (signY > pageHeight - 35) {
    doc.addPage();
    signY = 20;
  }

  // Signature Block
  const sigWidth = 65;
  const sigX = pageWidth / 2 - sigWidth / 2;
  doc.setDrawColor(148, 163, 184);
  doc.line(sigX, signY + 12, sigX + sigWidth, signY + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${responsibleName}`, sigX + sigWidth / 2, signY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${responsibleRole} • CQFP Colegiado`, sigX + sigWidth / 2, signY + 19.5, { align: 'center' });

  // Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages} • Reporte de Inventario FEFO • Botica Nova Salud • DIGEMID Certificado`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const cleanDate = systemDate.replace(/[^0-9-]/g, '_');
  doc.save(`Reporte_Inventario_FEFO_${cleanDate}.pdf`);
};
