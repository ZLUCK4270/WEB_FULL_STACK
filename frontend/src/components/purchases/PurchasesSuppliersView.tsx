import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Supplier, PurchaseOrder } from '../../types/pharmacy';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Truck,
  ArrowRight,
  PackageCheck,
  FileSpreadsheet,
  X,
  Sparkles,
  User
} from 'lucide-react';

export const PurchasesSuppliersView: React.FC = () => {
  const {
    suppliers,
    products,
    purchaseOrders,
    getProductTotalStock,
    createPurchaseOrder,
    receivePurchaseOrder
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers' | 'replenish'>('replenish');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // New Order Form
  const [newOrderForm, setNewOrderForm] = useState({
    supplierId: suppliers[0]?.id || '',
    productId: products[0]?.id || '',
    quantity: 100,
    unitCost: 0.50,
    notes: 'Reposición programada de stock'
  });

  // Calculate products that are in low stock or out of stock (Smart Auto-Replenish)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const stock = getProductTotalStock(p.id);
      return stock <= p.minStock;
    });
  }, [products, getProductTotalStock]);

  // Handle Quick Auto-Replenish Order
  const handleQuickReplenish = (productId: string, suggestedQty: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // Pick first supplier or matching
    const sup = suppliers[0];

    createPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.name,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          quantity: suggestedQty,
          unitCost: +(prod.unitPrice * 0.55).toFixed(2),
          subtotal: +(suggestedQty * prod.unitPrice * 0.55).toFixed(2)
        }
      ],
      total: +(suggestedQty * prod.unitPrice * 0.55).toFixed(2),
      notes: `Reabastecimiento automático preventivo de ${prod.name}`
    });

    setActiveTab('orders');
  };

  // Submit Manual PO
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === newOrderForm.supplierId) || suppliers[0];
    const prod = products.find(p => p.id === newOrderForm.productId) || products[0];

    const subtotal = +(newOrderForm.quantity * newOrderForm.unitCost).toFixed(2);

    createPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.name,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          quantity: Number(newOrderForm.quantity),
          unitCost: Number(newOrderForm.unitCost),
          subtotal
        }
      ],
      total: subtotal,
      notes: newOrderForm.notes
    });

    setIsNewOrderModalOpen(false);
    setActiveTab('orders');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Compras, Droguerías & Reabastecimiento
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold border border-blue-300">
                Logística Farmacéutica
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestión de distribuidoras mayoristas, órdenes de compra y recepción automática de lotes al almacén.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          + Nueva Orden de Compra
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('replenish')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition ${
            activeTab === 'replenish'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Asistente de Reposición ({lowStockProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Órdenes de Compra ({purchaseOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition ${
            activeTab === 'suppliers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Directorio Droguerías ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: SMART REPLENISHMENT ASSISTANT */}
      {activeTab === 'replenish' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Detección Inteligente de Medicamentos en Quiebre o Umbral Mínimo
              </span>
              <p className="text-amber-700 dark:text-amber-300">
                Los siguientes medicamentos han cruzado el stock mínimo de seguridad definido para Nova Salud. Se calcula automáticamente la cantidad económica de pedido para reabastecimiento.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowStockProducts.map(p => {
              const currentStock = getProductTotalStock(p.id);
              const deficit = Math.max(0, p.minStock - currentStock);
              const suggestedOrder = deficit + 50;
              const estimatedCost = +(suggestedOrder * p.unitPrice * 0.55).toFixed(2);

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {p.code} • {p.laboratory}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 italic">
                        {p.genericName} ({p.concentration})
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Bajo Stock
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Stock Actual</span>
                      <span className="font-extrabold text-rose-600">{currentStock} uds</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Mínimo Req.</span>
                      <span className="font-semibold">{p.minStock} uds</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Sugerido</span>
                      <span className="font-extrabold text-blue-600">+{suggestedOrder} uds</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Costo Estimado</span>
                      <span className="font-bold text-slate-900 dark:text-white">S/ {estimatedCost.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => handleQuickReplenish(p.id, suggestedOrder)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-2xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Emitir Orden de Compra
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS LIST */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Historial de Órdenes de Compra Emitidas
            </h3>
            <span className="text-xs text-slate-500">
              Al marcar como "Recibido", los lotes se cargan automáticamente al inventario.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">N° Orden</th>
                  <th className="py-2.5 px-4">Fecha Emisión</th>
                  <th className="py-2.5 px-4">Droguería Proveedora</th>
                  <th className="py-2.5 px-4">Medicamentos & Cantidad</th>
                  <th className="py-2.5 px-4">Total (S/)</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchaseOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{order.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {order.supplierName}
                    </td>
                    <td className="py-3 px-4">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="text-slate-600 dark:text-slate-400">
                          {it.productName}: <strong className="text-slate-900 dark:text-white">{it.quantity} uds</strong> (S/ {it.unitCost.toFixed(2)} c/u)
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      S/ {order.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'recibido'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : order.status === 'pendiente'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {order.status === 'recibido' ? '✔ Recibido en Almacén' : '⏳ Pendiente de Entrega'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {order.status === 'pendiente' ? (
                        <button
                          onClick={() => receivePurchaseOrder(order.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-2xs text-[11px] ml-auto transition active:scale-95"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          Recibir en Almacén
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Lotes cargados el {order.receivedAt}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map(sup => (
            <div
              key={sup.id}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {sup.name}
                  </h4>
                  <div className="text-xs text-slate-500 font-mono">
                    RUC: {sup.ruc}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {sup.paymentTerms}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contacto: <strong className="text-slate-800 dark:text-slate-200">{sup.contactPerson}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Teléfono: {sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Correo: {sup.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dirección: {sup.address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Nueva Orden de Compra */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Emitir Orden de Compra (OC)
              </h3>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Droguería Proveedora:
                </label>
                <select
                  value={newOrderForm.supplierId}
                  onChange={e => setNewOrderForm({ ...newOrderForm, supplierId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Medicamento a Solicitar:
                </label>
                <select
                  value={newOrderForm.productId}
                  onChange={e => setNewOrderForm({ ...newOrderForm, productId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.genericName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Cantidad a Comprar:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newOrderForm.quantity}
                    onChange={e => setNewOrderForm({ ...newOrderForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Costo Unitario Pactado (S/):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newOrderForm.unitCost}
                    onChange={e => setNewOrderForm({ ...newOrderForm, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas / Condiciones de Entrega:
                </label>
                <input
                  type="text"
                  value={newOrderForm.notes}
                  onChange={e => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Emitir Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
