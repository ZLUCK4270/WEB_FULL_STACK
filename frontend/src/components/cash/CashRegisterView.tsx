import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { CashMovement } from '../../types/pharmacy';
import {
  Banknote,
  Plus,
  Minus,
  Calculator,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Clock,
  User,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  DollarSign,
  X
} from 'lucide-react';

export const CashRegisterView: React.FC = () => {
  const {
    cashRegister,
    currentUser,
    openCashRegister,
    closeCashRegister,
    addCashMovement
  } = usePharmacy();

  // Modals
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [closedSummary, setClosedSummary] = useState<{ difference: number } | null>(null);

  // New Movement Form
  const [movementForm, setMovementForm] = useState<{
    type: 'ingreso' | 'egreso';
    concept: string;
    amount: number;
    category: CashMovement['category'];
    voucher: string;
  }>({
    type: 'egreso',
    concept: 'Pago de rollos térmicos y papel para ticketera POS',
    amount: 15.00,
    category: 'gasto_operativo',
    voucher: 'B001-992'
  });

  // Cash Denomination Calculator
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    100: 1,
    50: 2,
    20: 3,
    10: 2,
    5: 1,
    2: 1,
    1: 1,
    0.5: 0
  });

  // Calculate counted physical cash
  const countedPhysicalTotal = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + parseFloat(denom) * count,
    0
  );

  const expectedCash = cashRegister.currentCash;
  const cashDifference = +(countedPhysicalTotal - expectedCash).toFixed(2);

  const [formError, setFormError] = useState<string | null>(null);

  // Submit Movement
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (movementForm.amount <= 0 || !movementForm.concept.trim()) {
      setFormError('Por favor ingrese un monto mayor a 0 y especifique el concepto del movimiento.');
      return;
    }

    addCashMovement(
      movementForm.type,
      movementForm.concept.trim(),
      Number(movementForm.amount),
      movementForm.category,
      movementForm.voucher
    );

    setFormError(null);
    setIsMovementModalOpen(false);
    setMovementForm({
      type: 'egreso',
      concept: '',
      amount: 10,
      category: 'gasto_operativo',
      voucher: ''
    });
  };

  // Submit Shift Close
  const handleConfirmCloseShift = () => {
    const res = closeCashRegister(countedPhysicalTotal);
    setClosedSummary(res);
    setIsReconciliationModalOpen(false);
  };

  // Reopen shift
  const handleReopenShift = () => {
    openCashRegister(250.00, 'tarde');
    setClosedSummary(null);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Control de Caja Chica & Arqueo de Turno
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                cashRegister.isOpen
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
              }`}>
                {cashRegister.isOpen ? '🟢 Turno Activo' : '🔴 Caja Cerrada'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Responsable: <strong className="text-slate-700 dark:text-slate-300">{cashRegister.cashierName}</strong> • Turno: {cashRegister.shift.toUpperCase()} • Apertura: {new Date(cashRegister.openedAt).toLocaleTimeString('es-PE')}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          {cashRegister.isOpen ? (
            <>
              <button
                onClick={() => setIsMovementModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                Registrar Movimiento
              </button>

              <button
                onClick={() => setIsReconciliationModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
              >
                <Calculator className="w-4 h-4" />
                Arqueo & Cierre de Turno
              </button>
            </>
          ) : (
            <button
              onClick={handleReopenShift}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Unlock className="w-4 h-4" />
              Abrir Nuevo Turno (S/ 250.00)
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Efectivo Físico Esperado */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Efectivo en Gaveta</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            S/ {cashRegister.currentCash.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">
            Fondo (S/ {cashRegister.initialFund.toFixed(2)}) + Ventas Ef. - Egresos
          </p>
        </div>

        {/* Card 2: Ventas en Efectivo */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ventas Efectivo</span>
            <DollarSign className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            S/ {cashRegister.totalSalesCash.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">
            Cobrado en mostrador en moneda física
          </p>
        </div>

        {/* Card 3: Ventas Digitales (Yape + Tarjetas) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Yape / Plin & Tarjetas</span>
            <Receipt className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            S/ {(cashRegister.totalSalesYape + cashRegister.totalSalesCard).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">
            Yape: S/ {cashRegister.totalSalesYape.toFixed(2)} • Tarjeta: S/ {cashRegister.totalSalesCard.toFixed(2)}
          </p>
        </div>

        {/* Card 4: Egresos y Gastos Menores */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Egresos Caja Chica</span>
            <Minus className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            S/ {cashRegister.totalOutflow.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">
            Suministros y gastos operativos de turno
          </p>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Movimientos Registrados en el Turno Actual
          </h3>
          <span className="text-xs text-slate-500">
            {cashRegister.movements.length} transacciones registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Hora</th>
                <th className="py-2.5 px-4">Tipo</th>
                <th className="py-2.5 px-4">Concepto / Justificación</th>
                <th className="py-2.5 px-4">Categoría</th>
                <th className="py-2.5 px-4">Comprobante</th>
                <th className="py-2.5 px-4">Responsable</th>
                <th className="py-2.5 px-4 text-right">Monto (S/)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cashRegister.movements.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {new Date(m.timestamp).toLocaleTimeString('es-PE')}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.type === 'ingreso'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {m.type === 'ingreso' ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> Ingreso
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3" /> Egreso
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {m.concept}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 capitalize">
                    {m.category.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {m.voucherNumber || '—'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                    {m.responsibleName}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-bold ${
                    m.type === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {m.type === 'ingreso' ? '+' : '-'} S/ {m.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Registrar Movimiento */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-500" />
                Registrar Movimiento de Caja Chica
              </h3>
              <button
                onClick={() => {
                  setIsMovementModalOpen(false);
                  setFormError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMovement} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: 'egreso' })}
                  className={`p-2.5 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition ${
                    movementForm.type === 'egreso'
                      ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" /> Egreso (Salida)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: 'ingreso' })}
                  className={`p-2.5 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition ${
                    movementForm.type === 'ingreso'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Ingreso (Entrada)
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Monto en Soles (S/):
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0.50"
                  value={movementForm.amount}
                  onChange={e => setMovementForm({ ...movementForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-black text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Concepto / Detalle:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago de taxi para envío de medicinas urgente"
                  value={movementForm.concept}
                  onChange={e => setMovementForm({ ...movementForm, concept: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoría:
                  </label>
                  <select
                    value={movementForm.category}
                    onChange={e => setMovementForm({ ...movementForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="gasto_operativo">Gasto Operativo</option>
                    <option value="pago_proveedor">Pago Proveedor Menor</option>
                    <option value="retiro">Retiro Parcial</option>
                    <option value="fondo_inicial">Ajuste de Fondo</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    N° Comprobante / Recibo:
                  </label>
                  <input
                    type="text"
                    placeholder="B001-442"
                    value={movementForm.voucher}
                    onChange={e => setMovementForm({ ...movementForm, voucher: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Arqueo de Caja & Cierre de Turno */}
      {isReconciliationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                Arqueo Físico de Caja & Cuadre de Turno
              </h3>
              <button
                onClick={() => setIsReconciliationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingrese el conteo de billetes y monedas que se encuentran físicamente en la gaveta.
            </p>

            {/* Denomination inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[100, 50, 20, 10, 5, 2, 1, 0.5].map(val => (
                <div
                  key={val}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    S/ {val >= 1 ? val : '0.50'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[10px]">cant:</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[val] || 0}
                      onChange={e =>
                        setDenominations({
                          ...denominations,
                          [val]: parseInt(e.target.value) || 0
                        })
                      }
                      className="w-14 p-1 text-center font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Reconciliation Comparison Card */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Efectivo Esperado por Sistema:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  S/ {expectedCash.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Conteo Físico Real:</span>
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  S/ {countedPhysicalTotal.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-300">Diferencia de Cuadre:</span>
                <span className={`font-black px-2 py-0.5 rounded ${
                  cashDifference === 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : cashDifference > 0
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {cashDifference === 0
                    ? 'CUADRE EXACTO (S/ 0.00)'
                    : cashDifference > 0
                    ? `SOBRANTE (+S/ ${cashDifference.toFixed(2)})`
                    : `FALTANTE (-S/ ${Math.abs(cashDifference).toFixed(2)})`}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsReconciliationModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                Confirmar Cierre de Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Closed Banner */}
      {closedSummary && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Turno cerrado exitosamente. Comprobante Z de caja emitido. Diferencia: S/ {closedSummary.difference.toFixed(2)}.</span>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir Reporte Z
          </button>
        </div>
      )}
    </div>
  );
};
