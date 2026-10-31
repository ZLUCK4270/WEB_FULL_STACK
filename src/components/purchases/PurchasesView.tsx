import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Truck,
  Plus,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Building2,
  Calendar,
  X,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';
import type { PurchaseOrder, ReplenishmentSuggestion } from '../../types/pharmacy';

export const PurchasesView: React.FC = () => {
  const {
    purchases,
    purchasesLoading,
    loadPurchases,
    createPurchase,
    receivePurchase,
    replenishmentSuggestions,
    loadReplenishmentSuggestions,
    generatePurchaseOrders,
    products,
    suppliers,
    user
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'orders' | 'replenishment'>('orders');

  // Modales
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [receiveModalPurchase, setReceiveModalPurchase] = useState<PurchaseOrder | null>(null);

  // Formulario de Nueva Orden
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([]);
  const [orderNotes, setOrderNotes] = useState('');

  // Formulario de Recepción de Lotes
  const [receptionInputs, setReceptionInputs] = useState<Record<string, { batchCode: string; expiryDate: string }>>({});

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPurchases();
    loadReplenishmentSuggestions();
  }, [loadPurchases, loadReplenishmentSuggestions]);

  const handleOpenNewOrder = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setOrderItems([
      { productId: products[0]?.id || '', quantity: 20, unitCost: products[0]?.costo || 5 }
    ]);
    setOrderNotes('');
    setIsNewOrderModalOpen(true);
  };

  const handleAddItemRow = () => {
    setOrderItems((prev) => [
      ...prev,
      { productId: products[0]?.id || '', quantity: 10, unitCost: 5 }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || orderItems.length === 0) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    const res = await createPurchase({
      supplierId: selectedSupplierId,
      items: orderItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitCost: i.unitCost
      })),
      notes: orderNotes
    });
    setIsSubmitting(false);
    if (res.success) {
      setIsNewOrderModalOpen(false);
      setFeedback('Orden de compra registrada exitosamente.');
    } else {
      setErrorMsg(res.error || 'Error al crear orden de compra');
    }
  };

  const handleOpenReceive = (purchase: PurchaseOrder) => {
    setReceiveModalPurchase(purchase);
    const initialInputs: Record<string, { batchCode: string; expiryDate: string }> = {};
    const defaultExpiry = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().substring(0, 10);
    // Asignar códigos de lote predeterminados
    (purchase.items || []).forEach((item, idx) => {
      initialInputs[item.productoId] = {
        batchCode: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: defaultExpiry
      };
    });
    setReceptionInputs(initialInputs);
  };

  const handleConfirmReceive = async () => {
    if (!receiveModalPurchase) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    const receivedItems = Object.entries(receptionInputs).map(([prodId, details]) => ({
      productId: prodId,
      batchCode: details.batchCode,
      expiryDate: details.expiryDate
    }));

    const res = await receivePurchase(receiveModalPurchase.id, receivedItems);
    setIsSubmitting(false);
    if (res.success) {
      setReceiveModalPurchase(null);
      setFeedback(`Orden ${receiveModalPurchase.codigoCompra} recibida. Stock ingresado al inventario con lotes registrados.`);
    } else {
      setErrorMsg(res.error || 'Error al recepcionar orden');
    }
  };

  const handleGenerateOrdersFromSuggestions = async (supplierId: string, items: any[]) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    const res = await generatePurchaseOrders(supplierId, items);
    setIsSubmitting(false);
    if (res.success) {
      setFeedback('Orden de compra generada automáticamente según stock mínimo/máximo.');
      setActiveTab('orders');
    } else {
      setErrorMsg(res.error || 'Error al generar orden');
    }
  };

  const orderTotal = orderItems.reduce((acc, it) => acc + (it.quantity * it.unitCost), 0);

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Compras, Proveedores y Reposición</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Órdenes de compra a droguerías, recepción de lotes y sugerencias automatizadas de abastecimiento.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewOrder}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden de Compra
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Órdenes de Compra ({purchases.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('replenishment')}
          className={`pb-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'replenishment'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Sugerencias de Reposición ({replenishmentSuggestions.length})</span>
        </button>
      </div>

      {/* Pestaña: Órdenes de Compra */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {purchasesLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">Cargando órdenes de compra...</td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">No hay órdenes de compra registradas.</td>
                  </tr>
                ) : (
                  purchases.map((p) => {
                    const isReceived = p.estado === 'RECIBIDA';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {p.codigoCompra}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(p.fechaCreacion).toLocaleDateString('es-PE')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{p.proveedorNombre}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {p.compradorNombre || 'Administrador'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                          S/ {p.montoTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isReceived
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {p.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!isReceived && (
                            <button
                              onClick={() => handleOpenReceive(p)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 mx-auto transition"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Recepcionar
                            </button>
                          )}
                          {isReceived && (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ingresada
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pestaña: Sugerencias de Reposición */}
      {activeTab === 'replenishment' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Sugerencias Automatizadas de Reposición de Stock
              </h2>
              <p className="text-xs text-slate-500">
                Calculadas en base a punto de reorden y stock máximo para evitar quiebres de inventario.
              </p>
            </div>
            <button
              onClick={() => loadReplenishmentSuggestions()}
              className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Recalcular
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-center">Mínimo</th>
                  <th className="py-3 px-4 text-center">Máximo</th>
                  <th className="py-3 px-4 text-center">Sugerido Comprar</th>
                  <th className="py-3 px-4">Proveedor Sugerido</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {replenishmentSuggestions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      El inventario se encuentra en niveles óptimos. No hay sugerencias de reposición pendientes.
                    </td>
                  </tr>
                ) : (
                  replenishmentSuggestions.map((sug) => (
                    <tr key={sug.productoId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{sug.nombre}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{sug.codigoBarras}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{sug.categoria}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">{sug.stockActual} un.</td>
                      <td className="py-3 px-4 text-center text-slate-500">{sug.stockMinimo} un.</td>
                      <td className="py-3 px-4 text-center text-slate-500">{sug.stockMaximo} un.</td>
                      <td className="py-3 px-4 text-center font-black text-emerald-600 text-sm">
                        +{sug.cantidadSugerida} un.
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {sug.proveedorNombre || 'Droguería Médica'}
                        </div>
                        {sug.proveedorRuc && (
                          <div className="text-[10px] text-slate-400">RUC: {sug.proveedorRuc}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            handleGenerateOrdersFromSuggestions(sug.proveedorId || suppliers[0]?.id, [
                              { productId: sug.productoId, quantity: sug.cantidadSugerida, unitCost: 5 }
                            ])
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 mx-auto transition"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Generar OC
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nueva Orden de Compra */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-500" />
                Nueva Orden de Compra a Proveedor
              </h3>
              <button onClick={() => setIsNewOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Droguería / Proveedor:</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.razonSocial} (RUC: {s.ruc})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Ítems a Solicitar:</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-emerald-600 hover:underline font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Agregar ítem
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const pId = e.target.value;
                            const p = products.find((x) => x.id === pId);
                            setOrderItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, productId: pId, unitCost: p?.costo || 5 } : it))
                            );
                          }}
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          placeholder="Cant."
                          value={item.quantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value, 10) || 1;
                            setOrderItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, quantity: q } : it))
                            );
                          }}
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.10"
                          min="0.1"
                          placeholder="Costo"
                          value={item.unitCost}
                          onChange={(e) => {
                            const c = parseFloat(e.target.value) || 0;
                            setOrderItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, unitCost: c } : it))
                            );
                          }}
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Notas / Instrucciones:</label>
                <input
                  type="text"
                  placeholder="Ej. Entrega urgente en turno matutino"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex justify-between font-bold text-xs text-emerald-800 dark:text-emerald-300">
                <span>Total Estimado de la Orden:</span>
                <span>S/ {orderTotal.toFixed(2)}</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || orderItems.length === 0}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {isSubmitting ? 'Registrando...' : 'Emitir Orden de Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Recepción de Lotes de Compra */}
      {receiveModalPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-500" />
                Recepcionar Mercadería • {receiveModalPurchase.codigoCompra}
              </h3>
              <button onClick={() => setReceiveModalPurchase(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <p>Ingrese los números de lote y fechas de vencimiento de los productos físicos recibidos para ingresarlos inmediatamente al Kárdex y la matriz FEFO.</p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {Object.keys(receptionInputs).map((prodId) => {
                const prod = products.find((p) => p.id === prodId);
                const currentInput = receptionInputs[prodId];
                return (
                  <div key={prodId} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {prod?.nombre || prodId}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Código de Lote Impreso:</label>
                        <input
                          type="text"
                          required
                          value={currentInput?.batchCode || ''}
                          onChange={(e) =>
                            setReceptionInputs({
                              ...receptionInputs,
                              [prodId]: { ...currentInput, batchCode: e.target.value }
                            })
                          }
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Fecha de Vencimiento:</label>
                        <input
                          type="date"
                          required
                          value={currentInput?.expiryDate || ''}
                          onChange={(e) =>
                            setReceptionInputs({
                              ...receptionInputs,
                              [prodId]: { ...currentInput, expiryDate: e.target.value }
                            })
                          }
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setReceiveModalPurchase(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReceive}
                disabled={isSubmitting}
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar Ingreso a Almacén'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
