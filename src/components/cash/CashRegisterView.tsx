import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Banknote,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Unlock,
  Plus,
  RefreshCw
} from 'lucide-react';
import type { CashShift } from '../../types/pharmacy';

export const CashRegisterView: React.FC = () => {
  const {
    currentShift,
    shiftLoading,
    loadCurrentShift,
    openCashRegister,
    createCashMovement,
    closeCashRegister,
    shiftHistory,
    loadShiftHistory,
    user
  } = usePharmacy();

  // Modales
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // Formularios
  const [montoInicial, setMontoInicial] = useState('100.00');
  const [notasApertura, setNotasApertura] = useState('');

  const [movTipo, setMovTipo] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [movMonto, setMovMonto] = useState('');
  const [movMotivo, setMovMotivo] = useState('');

  const [montoContado, setMontoContado] = useState('');
  const [notasCierre, setNotasCierre] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCurrentShift();
    loadShiftHistory();
  }, [loadCurrentShift, loadShiftHistory]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const monto = parseFloat(montoInicial);
    if (!Number.isFinite(monto) || monto < 0) {
      setErrorMsg('Monto inicial de fondo de caja inválido');
      return;
    }
    setIsSubmitting(true);
    const res = await openCashRegister(monto, notasApertura);
    setIsSubmitting(false);
    if (res.success) {
      setIsOpenShiftModalOpen(false);
      setFeedback('Turno de caja abierto correctamente con S/ ' + monto.toFixed(2));
      loadShiftHistory();
    } else {
      setErrorMsg(res.error || 'Error al abrir caja');
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const monto = parseFloat(movMonto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorMsg('Monto del movimiento debe ser mayor a 0');
      return;
    }
    if (!movMotivo.trim()) {
      setErrorMsg('El motivo del movimiento es obligatorio');
      return;
    }
    setIsSubmitting(true);
    const res = await createCashMovement(movTipo, monto, movMotivo.trim());
    setIsSubmitting(false);
    if (res.success) {
      setIsMovementModalOpen(false);
      setMovMonto('');
      setMovMotivo('');
      setFeedback(`Movimiento de ${movTipo} por S/ ${monto.toFixed(2)} registrado.`);
    } else {
      setErrorMsg(res.error || 'Error al registrar movimiento');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const contado = parseFloat(montoContado);
    if (!Number.isFinite(contado) || contado < 0) {
      setErrorMsg('Debe ingresar el monto real en efectivo contado en la gaveta');
      return;
    }
    setIsSubmitting(true);
    const res = await closeCashRegister(contado, notasCierre);
    setIsSubmitting(false);
    if (res.success) {
      setIsCloseModalOpen(false);
      setMontoContado('');
      setNotasCierre('');
      const diff = res.summary?.diferencia || 0;
      setFeedback(`Turno cerrado con éxito. Diferencia de arqueo: S/ ${diff.toFixed(2)} (${diff >= 0 ? 'Conforme' : 'Faltante'}).`);
      loadShiftHistory();
    } else {
      setErrorMsg(res.error || 'Error al cerrar caja');
    }
  };

  return (
    <div className="space-y-5">
      {/* Mensajes */}
      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold">×</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 font-bold">×</button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Control de Caja Registradora y Arqueo</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apertura de turno, movimientos de efectivo extraordinarios y conciliación de gaveta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentShift ? (
            <>
              <button
                onClick={() => {
                  setMovTipo('INGRESO');
                  setMovMonto('');
                  setMovMotivo('');
                  setIsMovementModalOpen(true);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                Registrar Movimiento
              </button>
              <button
                onClick={() => {
                  setMontoContado(currentShift.efectivoEsperado.toFixed(2));
                  setNotasCierre('');
                  setIsCloseModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                Cerrar Caja / Arqueo
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMontoInicial('100.00');
                setNotasApertura('');
                setIsOpenShiftModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Unlock className="w-3.5 h-3.5" />
              Abrir Turno de Caja
            </button>
          )}
        </div>
      </div>

      {/* Tarjeta de Turno Actual */}
      {currentShift ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Turno de Caja Activo • {currentShift.cajeroNombre || user?.name}
              </h2>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Abierto desde: {new Date(currentShift.fechaApertura).toLocaleString('es-PE')}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Fondo Inicial
              </span>
              <div className="text-lg font-black text-slate-800 dark:text-slate-200">
                S/ {currentShift.fondoInicial.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                Ventas Efectivo
              </span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                + S/ {currentShift.totalVentasEfectivo.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">
                Ingresos Extra
              </span>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                + S/ {currentShift.totalIngresosExtra.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-1">
                Egresos / Gastos
              </span>
              <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                - S/ {currentShift.totalEgresosExtra.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Efectivo Total Esperado en Gaveta:
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Fondo inicial + Ventas efectivo + Ingresos extras - Egresos
              </p>
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              S/ {currentShift.efectivoEsperado.toFixed(2)}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3">
          <Lock className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            La caja registradora se encuentra actualmente cerrada
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Abra un nuevo turno para asignar el fondo inicial en soles e iniciar la conciliación de cobros en efectivo.
          </p>
          <button
            onClick={() => {
              setMontoInicial('100.00');
              setNotasApertura('');
              setIsOpenShiftModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            Abrir Turno de Caja Ahora
          </button>
        </div>
      )}

      {/* Historial de Turnos y Arqueos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            Historial de Arqueos y Turnos de Caja
          </h3>
          <button
            onClick={() => loadShiftHistory()}
            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Apertura</th>
                <th className="py-3 px-4">Cierre</th>
                <th className="py-3 px-4">Cajero</th>
                <th className="py-3 px-4 text-right">Fondo Ini.</th>
                <th className="py-3 px-4 text-right">Vtas. Efectivo</th>
                <th className="py-3 px-4 text-right">Esperado</th>
                <th className="py-3 px-4 text-right">Contado</th>
                <th className="py-3 px-4 text-right">Diferencia</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {shiftHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se registran turnos de caja previos.
                  </td>
                </tr>
              ) : (
                shiftHistory.map((s) => {
                  const diff = s.diferencia !== null && s.diferencia !== undefined ? s.diferencia : null;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {new Date(s.fechaApertura).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {s.fechaCierre ? new Date(s.fechaCierre).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '— (Activo)'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {s.cajeroNombre || 'Cajero'}
                      </td>
                      <td className="py-3 px-4 text-right">S/ {s.fondoInicial.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">S/ {s.totalVentasEfectivo.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold">S/ {s.efectivoEsperado.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {s.efectivoContado !== null && s.efectivoContado !== undefined ? `S/ ${s.efectivoContado.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {diff !== null ? (
                          <span className={diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {diff >= 0 ? `+S/ ${diff.toFixed(2)}` : `-S/ ${Math.abs(diff).toFixed(2)}`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.estado === 'ABIERTO'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {s.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Apertura de Caja */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-500" />
              Apertura de Turno de Caja
            </h3>
            <form onSubmit={handleOpenShift} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Monto de Fondo Inicial en Soles (S/):
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  className="w-full p-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Observaciones / Notas (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Billetes y monedas para cambio matutino"
                  value={notasApertura}
                  onChange={(e) => setNotasApertura(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {isSubmitting ? 'Abriendo...' : 'Confirmar Apertura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Movimiento Extraordinario (Ingreso/Egreso) */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Movimiento de Caja Extraordinario
            </h3>
            <form onSubmit={handleCreateMovement} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tipo de Movimiento:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovTipo('INGRESO')}
                    className={`py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      movTipo === 'INGRESO'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" /> Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovTipo('EGRESO')}
                    className={`py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      movTipo === 'EGRESO'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-600" /> Egreso
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Monto en Soles (S/):
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0.10"
                  required
                  placeholder="50.00"
                  value={movMonto}
                  onChange={(e) => setMovMonto(e.target.value)}
                  className="w-full p-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Motivo o Justificación:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pago de suministros de limpieza, reposición de cambio"
                  value={movMotivo}
                  onChange={(e) => setMovMotivo(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {isSubmitting ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cierre de Turno y Arqueo */}
      {isCloseModalOpen && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-500" />
              Arqueo y Cierre de Turno de Caja
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Efectivo Sistema Esperado:</span>
                <span className="font-bold text-slate-900 dark:text-white">S/ {currentShift.efectivoEsperado.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Efectivo Real Contado en Gaveta (S/):
                </label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  required
                  value={montoContado}
                  onChange={(e) => setMontoContado(e.target.value)}
                  className="w-full p-2.5 text-base font-black rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {montoContado && (
                <div className="p-2.5 rounded-lg border text-xs font-bold flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
                  <span>Diferencia estimada:</span>
                  <span
                    className={
                      parseFloat(montoContado) - currentShift.efectivoEsperado >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }
                  >
                    S/ {(parseFloat(montoContado) - currentShift.efectivoEsperado).toFixed(2)}{' '}
                    {parseFloat(montoContado) - currentShift.efectivoEsperado >= 0 ? '(Conforme/Sobrante)' : '(Faltante)'}
                  </span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas de Cierre:
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles del cuadre de caja o justificación si existió diferencia"
                  value={notasCierre}
                  onChange={(e) => setNotasCierre(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  {isSubmitting ? 'Cerrando...' : 'Confirmar Cierre de Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
