import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  Calendar,
  DollarSign,
  AlertOctagon,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { exportInventoryToExcel } from '../../utils/excelExport';
import { exportInventoryPDF } from '../../utils/pdfExport';

export const DigemidReportsView: React.FC = () => {
  const { sales, batches, products, currentUser, systemDate, logActivity } = usePharmacy();
  const [activeReport, setActiveReport] = useState<'digemid_controlled' | 'sales_summary' | 'waste_losses'>('digemid_controlled');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Controlled medicines sales and batches
  const controlledProduct = products.find(p => p.isControlled);
  const controlledBatches = batches.filter(b => b.productId === controlledProduct?.id);

  // Total sales stats
  const totalSalesAmount = sales.reduce((sum, s) => sum + s.total, 0);
  const totalIgvAmount = sales.reduce((sum, s) => sum + s.igv, 0);
  const boletasCount = sales.filter(s => s.receiptType === 'boleta').length;
  const facturasCount = sales.filter(s => s.receiptType === 'factura').length;
  const ticketsCount = sales.filter(s => s.receiptType === 'ticket').length;

  // Expired / Quarantine batches
  const expiredBatches = batches.filter(b => b.status === 'expired' || b.status === 'quarantine');

  const handleExportExcelInventory = () => {
    try {
      exportInventoryToExcel({
        products,
        batches,
        systemDate,
        responsibleName: currentUser.name,
        responsibleRole: currentUser.roleTitle
      });

      logActivity({
        category: 'INVENTARIO',
        action: 'Exportación Excel (.xlsx)',
        description: `Exportación de reporte de inventario oficial a Excel (.xlsx) generada desde módulo de fiscalización por ${currentUser.name}.`,
        severity: 'info'
      });

      setFeedbackToast('Reporte de inventario en Excel (.xlsx) generado y descargado exitosamente.');
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (e) {
      console.error(e);
      setFeedbackToast('Error al exportar inventario a Excel.');
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  const handleExportPdfInventory = () => {
    try {
      exportInventoryPDF({
        products,
        batches,
        systemDate,
        responsibleName: currentUser.name,
        responsibleRole: currentUser.roleTitle,
        filterLabel: 'Reporte Regulatorio DIGEMID'
      });

      logActivity({
        category: 'INVENTARIO',
        action: 'Exportación PDF',
        description: `Exportación de reporte de inventario a PDF oficial generada desde módulo regulatorio por ${currentUser.name}.`,
        severity: 'info'
      });

      setFeedbackToast('Reporte de inventario en PDF generado exitosamente.');
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (e) {
      console.error(e);
      setFeedbackToast('Error al exportar inventario a PDF.');
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  const handleExportCsv = () => {
    handleExportExcelInventory();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Reportes Regulatorios DIGEMID & SUNAT
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-semibold border border-teal-300">
                Fiscalización Oficial
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Libros oficiales foliados, balance tributario de ventas e informe de bajas de lotes farmacéuticos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcelInventory}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
            title="Exportar inventario completo de lotes a archivo Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Inventario Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdfInventory}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition cursor-pointer"
            title="Exportar reporte de inventario en PDF oficial"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Inventario PDF</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Folio</span>
          </button>
        </div>
      </div>

      {feedbackToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-900 dark:text-emerald-100 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedbackToast}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-xs text-emerald-700 font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveReport('digemid_controlled')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            activeReport === 'digemid_controlled'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          1. Libro de Control de Psicotrópicos (Lista IV)
        </button>

        <button
          onClick={() => setActiveReport('sales_summary')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            activeReport === 'sales_summary'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          2. Resumen de Ventas & Facturación SUNAT
        </button>

        <button
          onClick={() => setActiveReport('waste_losses')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            activeReport === 'waste_losses'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          3. Acta de Mermas & Bajas por Caducidad
        </button>
      </div>

      {/* REPORT 1: DIGEMID CONTROLLED SUBSTANCES */}
      {activeReport === 'digemid_controlled' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Libro Oficial de Registro de Sustancias Psicotrópicas — DIGEMID
              </h3>
              <p className="text-xs text-slate-500">
                Sustancia activa: Clonazepam 2mg • Folio N° 048-2026 • Farmacéutico Regente: Dr. Carlos Mendoza Flores (CQFP 18492)
              </p>
            </div>
            <div className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-3 py-1 rounded-lg border border-emerald-300">
              Regente Responsable Habilitado
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">N° Receta Retenida</th>
                  <th className="py-2.5 px-3">Médico Prescriptor</th>
                  <th className="py-2.5 px-3">Paciente / DNI</th>
                  <th className="py-2.5 px-3">Lote Dispensado</th>
                  <th className="py-2.5 px-3 text-center">Entrada</th>
                  <th className="py-2.5 px-3 text-center">Salida</th>
                  <th className="py-2.5 px-3 text-center">Saldo Actual</th>
                  <th className="py-2.5 px-3 text-right">Firma Farmacéutico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-3">01/10/2026</td>
                  <td className="py-2.5 px-3 text-slate-500">Saldo Inicial</td>
                  <td className="py-2.5 px-3">—</td>
                  <td className="py-2.5 px-3">—</td>
                  <td className="py-2.5 px-3">LOT-CLO-2027-12</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600">+30</td>
                  <td className="py-2.5 px-3 text-center">0</td>
                  <td className="py-2.5 px-3 text-center font-bold">30</td>
                  <td className="py-2.5 px-3 text-right text-slate-500 font-sans">Dr. Carlos M.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">04/10/2026</td>
                  <td className="py-2.5 px-3 font-bold text-purple-600">RX-2026-9912</td>
                  <td className="py-2.5 px-3 font-sans">Dr. Alberto Vinatea (CMP 48192)</td>
                  <td className="py-2.5 px-3 font-sans">Rosa María Vega (DNI 08291472)</td>
                  <td className="py-2.5 px-3">LOT-CLO-2027-12</td>
                  <td className="py-2.5 px-3 text-center">0</td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-600">-2</td>
                  <td className="py-2.5 px-3 text-center font-bold">28</td>
                  <td className="py-2.5 px-3 text-right text-slate-500 font-sans">Dr. Carlos M.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span>Nota DIGEMID: Las recetas retenidas se archivan físicamente en el casillero de controlados por un periodo mínimo de 2 años conforme al D.S. 023-2001-SA.</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Saldo Vigente: 28 comprimidos</span>
          </div>
        </div>
      )}

      {/* REPORT 2: SALES & SUNAT SUMMARY */}
      {activeReport === 'sales_summary' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Resumen de Ventas & Facturación Electrónica SUNAT
            </h3>
            <p className="text-xs text-slate-500">
              Consolidado de operaciones gravadas con IGV (18%) para la declaración mensual PDT 621.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-xs text-slate-500">Total Facturado</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                S/ {totalSalesAmount.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500">Ventas netas acumuladas</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-xs text-slate-500">IGV Crédito Fiscal (18%)</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                S/ {totalIgvAmount.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500">Tributo devengado SUNAT</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-xs text-slate-500">Comprobantes Emitidos</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {sales.length}
              </div>
              <p className="text-[11px] text-slate-500">
                {boletasCount} Boletas • {facturasCount} Facturas • {ticketsCount} Tickets
              </p>
            </div>
          </div>

          {/* Detailed Sales Log */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Comprobante</th>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Cliente / DNI</th>
                  <th className="py-2.5 px-3">Método</th>
                  <th className="py-2.5 px-3">Subtotal Base</th>
                  <th className="py-2.5 px-3">IGV (18%)</th>
                  <th className="py-2.5 px-3 text-right">Total (S/)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {s.receiptNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(s.date).toLocaleString('es-PE')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {s.customerName} ({s.customerDoc})
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold">
                      {s.paymentMethod}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      S/ {s.subtotal.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      S/ {s.igv.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      S/ {s.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: LOSSES & EXPIRED MEDICINES */}
      {activeReport === 'waste_losses' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Acta de Medicamentos Vencidos & En Cuarentena
            </h3>
            <p className="text-xs text-slate-500">
              Registro para devolución por canje a droguerías o disposición final conforme a la Directiva Sanitaria de Residuos Sólidos Farmacéuticos.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Código Lote</th>
                  <th className="py-2.5 px-3">Medicamento</th>
                  <th className="py-2.5 px-3">Fecha Caducidad</th>
                  <th className="py-2.5 px-3">Cantidad</th>
                  <th className="py-2.5 px-3">Costo Pérdida</th>
                  <th className="py-2.5 px-3">Motivo / Estado</th>
                  <th className="py-2.5 px-3">Droguería Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expiredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-400">
                      No hay lotes vencidos ni en cuarentena en este momento.
                    </td>
                  </tr>
                ) : (
                  expiredBatches.map(b => {
                    const prod = products.find(p => p.id === b.productId);
                    const costLoss = b.stock * b.unitCost;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                          {b.batchCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {prod?.name || 'Medicamento'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{b.expirationDate}</td>
                        <td className="py-2.5 px-3 font-bold">{b.stock} unidades</td>
                        <td className="py-2.5 px-3 text-rose-600 font-bold">
                          S/ {costLoss.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {b.quarantineReason || 'Fecha de caducidad superada'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{b.supplierName}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
