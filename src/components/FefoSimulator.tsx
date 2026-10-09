import React, { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, PackageX, ShoppingCart, RefreshCw, Layers } from 'lucide-react';

interface BatchItem {
  id: string;
  code: string;
  expirationDate: string; // YYYY-MM-DD
  stock: number;
  initialStock: number;
  isExpired: boolean;
}

export const FefoSimulator: React.FC = () => {
  const initialBatches: BatchItem[] = [
    { id: 'b1', code: 'LOTE-2025-01', expirationDate: '2026-05-15', stock: 12, initialStock: 12, isExpired: true }, // Vencido (fecha anterior)
    { id: 'b2', code: 'LOTE-2026-11', expirationDate: '2026-11-20', stock: 15, initialStock: 15, isExpired: false }, // Próximo a vencer (1.5 meses)
    { id: 'b3', code: 'LOTE-2027-04', expirationDate: '2027-04-10', stock: 30, initialStock: 30, isExpired: false }, // Vence en 6 meses
    { id: 'b4', code: 'LOTE-2028-01', expirationDate: '2028-01-30', stock: 50, initialStock: 50, isExpired: false }, // Vence en 15 meses
  ];

  const [batches, setBatches] = useState<BatchItem[]>(initialBatches);
  const [quantityToSell, setQuantityToSell] = useState<number>(20);
  const [transactionLog, setTransactionLog] = useState<string[]>([]);
  const [lastDeductions, setLastDeductions] = useState<{ batchCode: string; qty: number }[]>([]);

  const handleReset = () => {
    setBatches(initialBatches);
    setTransactionLog([]);
    setLastDeductions([]);
  };

  const handleExecuteFefoSale = () => {
    let remaining = quantityToSell;
    const logs: string[] = [];
    const deductions: { batchCode: string; qty: number }[] = [];

    // Filter valid (non-expired) batches and sort by expiration date ASC
    const sortedValidBatches = [...batches]
      .filter(b => !b.isExpired)
      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

    const totalValidStock = sortedValidBatches.reduce((acc, b) => acc + b.stock, 0);

    if (quantityToSell > totalValidStock) {
      logs.push(`❌ ERROR ATÓMICO: Stock insuficiente. Solicitado: ${quantityToSell}, Disponible en lotes vigentes: ${totalValidStock}.`);
      logs.push(`⚠️ Nota: El LOTE-2025-01 tiene 12 unidades pero está VENCIDO; el motor FEFO se niega a despacharlo.`);
      setTransactionLog(logs);
      setLastDeductions([]);
      return;
    }

    logs.push(`▶ INICIO TRANSACCIÓN ATÓMICA FEFO (Solicitud: ${quantityToSell} unidades de "Amoxicilina 500mg"):`);

    const updatedBatches = batches.map(b => {
      if (b.isExpired) {
        return b; // Skip expired
      }

      // Check if this batch is processed
      if (remaining > 0 && b.stock > 0) {
        const toDeduct = Math.min(b.stock, remaining);
        remaining -= toDeduct;
        deductions.push({ batchCode: b.code, qty: toDeduct });
        logs.push(`  ✔ Despachando ${toDeduct} unidades del ${b.code} (Vence: ${b.expirationDate}, más próximo en la cola).`);
        return {
          ...b,
          stock: b.stock - toDeduct
        };
      }
      return b;
    });

    logs.push(`✅ COMMIT: Transacción exitosa. Venta registrada con id #TX-${Math.floor(1000 + Math.random() * 9000)}.`);
    setBatches(updatedBatches);
    setTransactionLog(logs);
    setLastDeductions(deductions);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-500" />
            Simulador en Vivo: Despacho FEFO (First Expired, First Out)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Demuestra cómo el algoritmo protege la salud pública eliminando medicamentos vencidos y consumiendo siempre el lote con fecha más cercana.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reiniciar Lotes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lotes disponibles (Col 7) */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              Lotes Registrados para "Amoxicilina 500mg Cápsulas"
            </h3>
            <span className="text-xs text-slate-500">Orden natural de gaveta</span>
          </div>

          <div className="space-y-3">
            {batches.map((batch) => {
              const deduction = lastDeductions.find(d => d.batchCode === batch.code);
              return (
                <div
                  key={batch.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                    batch.isExpired
                      ? 'border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20'
                      : batch.stock === 0
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-70'
                      : 'border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {batch.code}
                      </span>
                      {batch.isExpired ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold flex items-center gap-1">
                          <PackageX className="w-3 h-3" /> VENCIDO (BLOQUEADO)
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          VIGENTE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Fecha Vencimiento: <strong className="text-slate-700 dark:text-slate-300">{batch.expirationDate}</strong>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {batch.stock} <span className="text-xs font-normal text-slate-500">unid.</span>
                    </div>
                    {deduction && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        -{deduction.qty} despachadas
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones de Venta & Consola Transaccional (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-500" />
              Simular Venta en Mostrador POS
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">
                  Cantidad solicitada por cliente:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={quantityToSell}
                    onChange={(e) => setQuantityToSell(parseInt(e.target.value) || 1)}
                    className="w-full text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200"
                  />
                  <span className="text-slate-500 text-xs">unidades</span>
                </div>
              </div>

              <button
                onClick={handleExecuteFefoSale}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Ejecutar Transacción Atómica FEFO
              </button>
            </div>

            {/* Consola de logs de la transacción */}
            <div className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] space-y-1.5 max-h-52 overflow-y-auto border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 pb-1">
                PostgreSQL Transaction Console
              </div>
              {transactionLog.length === 0 ? (
                <div className="text-slate-500 italic py-2">
                  Presiona "Ejecutar Transacción" para ver el despacho cronológico por vencimiento en tiempo real...
                </div>
              ) : (
                transactionLog.map((log, i) => (
                  <div key={i} className="leading-snug">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
