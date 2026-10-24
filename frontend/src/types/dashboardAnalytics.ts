import { Sale, Product, Batch, MedicineCategory, PaymentMethod, ReceiptType } from './pharmacy';

export type DateRangeInterval = 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'personalizado';

export interface DateRangeFilter {
  interval: DateRangeInterval;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  enableComparison: boolean;
  comparisonLabel?: string;
}

/**
 * Detailed relational record produced by an inner/left join between
 * Sales items, Product catalog, and active/historical Batches.
 */
export interface JoinedSaleDetailItem {
  saleId: string;
  receiptNumber: string;
  receiptType: ReceiptType;
  saleDate: string; // YYYY-MM-DD or ISO
  saleTime: string; // HH:mm:ss
  paymentMethod: PaymentMethod;
  cashierName: string;
  customerName: string;
  customerDoc: string;
  // Product Catalog joined fields
  productId: string;
  productName: string;
  genericName: string;
  category: MedicineCategory;
  laboratory: string;
  isControlled: boolean;
  // Batch & FEFO joined fields
  batchCode: string;
  expirationDate: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
}

export interface PeriodMetricsSummary {
  startDate: string;
  endDate: string;
  formattedRange: string;
  totalSales: number;
  transactionCount: number;
  averageTicket: number;
  totalUnitsSold: number;
  grossProfit: number;
  averageMarginPercent: number;
  cashTotal: number;
  yapeTotal: number;
  cardTotal: number;
}

export interface PeriodComparisonMetrics {
  current: PeriodMetricsSummary;
  previous: PeriodMetricsSummary;
  deltas: {
    salesAmount: number;
    salesPercent: number;
    transactions: number;
    transactionsPercent: number;
    avgTicket: number;
    avgTicketPercent: number;
    grossProfit: number;
    grossProfitPercent: number;
    unitsSold: number;
    unitsSoldPercent: number;
  };
}

export interface ComparisonChartPoint {
  index: number;
  bucketLabel: string;
  currentDateStr: string;
  currentSales: number;
  currentTickets: number;
  currentUnits: number;
  currentProfit: number;
  previousDateStr?: string;
  previousSales: number;
  previousTickets: number;
  previousUnits: number;
  previousProfit: number;
  varianceAmount: number;
  variancePercent: number;
}

export interface CategoryComparisonItem {
  category: MedicineCategory;
  currentAmount: number;
  previousAmount: number;
  currentUnits: number;
  previousUnits: number;
  deltaPercent: number;
}
