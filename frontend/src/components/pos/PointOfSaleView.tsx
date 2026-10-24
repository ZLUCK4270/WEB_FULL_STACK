import React, { useState, useMemo, useCallback } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  QrCode,
  CreditCard,
  Banknote,
  Receipt,
  User,
  Printer,
  Sparkles,
  X,
  Clock
} from 'lucide-react';
import type { Product, PaymentMethod, ReceiptType } from '../../types/pharmacy';

export const PointOfSaleView: React.FC = () => {
  const {
    products,
    productsLoading,
    customers,
    user,
    createSale,
    getProductStock,
    loadProducts
  } = usePharmacy();

  // Estado de búsqueda y carrito
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Cliente opcional
  const [customerDoc, setCustomerDoc] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Público General');
  let selectedCustomerId: string | undefined;

  // Checkout
  const [receiptType, setReceiptType] = useState<ReceiptType>('boleta');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Productos filtrados (búsqueda rápida por nombre, código o genérico)
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        (p.generico && p.generico.toLowerCase().includes(term)) ||
        (p.laboratorio && p.laboratorio.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  // Totales del carrito
  const cartItemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.product.precio * i.quantity, 0),
    [cart]
  );
  const cartSubtotal = +(cartTotal / 1.18).toFixed(2);
  const cartIgv = +(cartTotal - cartSubtotal).toFixed(2);

  const getAvailableStock = useCallback((productId: string) => {
    const p = products.find((x) => x.id === productId);
    return p ? p.stockTotal : 0;
  }, [products]);

  const addToCart = useCallback(
    (product: Product) => {
      setErrorMessage(null);
      const available = getAvailableStock(product.id);
      if (available <= 0) {
        setErrorMessage(`No hay stock disponible para "${product.nombre}".`);
        return;
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          if (existing.quantity >= available) {
            setErrorMessage(`Stock máximo alcanzado (${available} uds.) para "${product.nombre}".`);
            return prev;
          }
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
    },
    [getAvailableStock]
  );

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      setCart((prev) =>
        prev
          .map((i) => {
            if (i.product.id !== productId) return i;
            const available = getAvailableStock(productId);
            const newQty = i.quantity + delta;
            if (newQty > available) {
              setErrorMessage(`Stock máximo disponible: ${available}`);
              return i;
            }
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          })
          .filter(Boolean) as { product: Product; quantity: number }[]
      );
      setErrorMessage(null);
    },
    [getAvailableStock]
  );

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    setErrorMessage(null);
  };

  const clearCart = () => {
    setCart([]);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSelectCustomer = (doc: string, id?: string) => {
    setCustomerDoc(doc);
    setCustomerName(id ? `Cliente (${doc})` : 'Público General');
    selectedCustomerId = id;
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setAmountPaid(cartTotal);
    setIsCheckoutOpen(true);
  };

  const handleConfirmSale = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const result = await createSale({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod,
        amountPaid: paymentMethod === 'efectivo' ? amountPaid : cartTotal,
        customerId: selectedCustomerId,
        receiptType
      });
      if (result.success && result.sale) {
        setSuccessMessage(`Venta ${result.sale.codigoVenta} registrada. Stock descontado.`);
        setCompletedSale(result.sale);
        setIsCheckoutOpen(false);
        setCart([]);
        setAmountPaid(0);
        // Forzar recarga de productos para reflejar stock al instante
        await loadProducts();
      } else {
        setErrorMessage(result.error || 'Error al procesar la venta.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la venta.');
    } finally {
      setSubmitting(false);
    }
  };

  const printTicket = () => {
    if (!completedSale) return;
    const printWindow = window.open('', '', 'width=600,height=800');
    if (!printWindow) return;
    const itemsHtml = completedSale.items
      .map(
        (it: any) =>
          `<tr><td style="padding:4px;border-bottom:1px solid #ccc">${it.productName}</td>` +
          `<td style="padding:4px;border-bottom:1px solid #ccc;text-align:center">${it.quantity}</td>` +
          `<td style="padding:4px;border-bottom:1px solid #ccc;text-align:right">S/ ${it.subtotal.toFixed(2)}</td></tr>`
      )
      .join('');
    printWindow.document.write(`
      <html><head><title>Ticket ${completedSale.codigoVenta}</title>
      <style>body{font-family:system-ui,sans-serif;font-size:13px;padding:20px} h2{margin:0;text-transform:uppercase;letter-spacing:1px}
      .meta{font-size:11px;color:#666;margin:4px 0} table{width:100%;border-collapse:collapse;margin:12px 0}
      .total{font-weight:bold;font-size:16px;margin-top:16px;padding-top:12px;border-top:2px solid #000;text-align:right}
      .foot{margin-top:24px;font-size:10px;color:#666;text-align:center}</style></head>
      <body>
      <h2>Botica Nova Salud S.A.C.</h2>
      <div class="meta">RUC: 20601234567 • ${completedSale.codigoVenta}</div>
      <div class="meta">Fecha: ${new Date(completedSale.fecha).toLocaleString('es-PE')} • Cajero: ${completedSale.cajero}</div>
      <div class="meta">Cliente: ${completedSale.cliente || 'Público General'} (${completedSale.clienteDoc || '-'})</div>
      <table>
        <thead><tr><th style="text-align:left">Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="total">Subtotal: S/ ${completedSale.subtotal.toFixed(2)}<br/>
      IGV (18%): S/ ${completedSale.igv.toFixed(2)}<br/>
      TOTAL: S/ ${completedSale.total.toFixed(2)}</div>
      <div class="foot">Gracias por su compra en Botica Nova Salud.</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Barra superior: cajero + cliente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Punto de Venta</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cajero: <span className="font-semibold">{user?.name}</span> ({user?.role}) •{' '}
              {cartItemCount > 0 ? `${cartItemCount} ítem(es) en carrito` : 'Carrito vacío'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={customerDoc || '00000000'}
              onChange={(e) => {
                const doc = e.target.value;
                const cust = customers.find((c) => c.numeroDocumento === doc);
                if (cust) {
                  handleSelectCustomer(cust.numeroDocumento, cust.id);
                } else {
                  setCustomerDoc('00000000');
                  setCustomerName('Público General');
                  selectedCustomerId = undefined;
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="00000000">Público General (cliente sin documento)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.numeroDocumento}>
                  {c.nombreCompleto} ({c.numeroDocumento})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0 || submitting}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${cart.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-500/20'}`}
          >
            <Banknote className="w-4 h-4" />
            Cobrar S/ {cartTotal.toFixed(2)}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cuerpo: catálogo izquierda + carrito derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Izquierda: catálogo */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar medicamento por nombre, código o principio activo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {productsLoading ? (
              <div className="col-span-2 py-8 text-center text-slate-400 text-xs">Cargando catálogo…</div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                No se encontraron productos.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock = product.stockTotal <= product.stockMinimo;
                const outOfStock = product.stockTotal === 0;
                return (
                  <div
                    key={product.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between bg-white dark:bg-slate-900 ${
                      outOfStock
                        ? 'opacity-60 border-slate-200 dark:border-slate-800'
                        : 'hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-md border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {product.codigo}
                        </span>
                        {product.controlado && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            Controlado
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {product.nombre}
                      </h3>
                      {product.generico && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-1 mb-2">
                          {product.generico}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                          S/ {product.precio.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Stock: <span className={isLowStock ? 'text-amber-600 font-bold' : 'font-medium'}>{product.stockTotal} uds</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={outOfStock || submitting}
                      className={`mt-3 w-full py-2 rounded-lg text-xs font-bold transition shadow-xs ${
                        outOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Derecha: carrito */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Carrito de Venta</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                  {cartItemCount} ítems
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar
                </button>
              )}
            </div>

            <div className="py-2.5 px-3 my-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Cliente: <strong className="text-slate-900 dark:text-white">{customerName}</strong>{' '}
                  ({customerDoc || '00000000'})
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1 my-2">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-sm font-medium">El carrito está vacío</p>
                  <p className="text-xs">Busque medicamentos arriba y agréguelos al carrito.</p>
                </div>
              ) : (
                cart.map((item) => {
                  const available = getAvailableStock(item.product.id);
                  const itemSubtotal = item.product.precio * item.quantity;
                  const atLimit = item.quantity >= available;
                  return (
                    <div key={item.product.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.product.nombre}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            S/ {item.product.precio.toFixed(2)} c/u
                          </div>
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          S/ {itemSubtotal.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Stock disponible: {available} uds.
                        {atLimit ? ' • Límite alcanzado' : ''}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            disabled={submitting}
                            className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            disabled={submitting || atLimit}
                            className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-500 transition"
                          title="Eliminar ítem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-400">Comprobante:</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  {(['boleta', 'factura', 'ticket'] as ReceiptType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setReceiptType(type)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition ${receiptType === type ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal base:</span>
                  <span>S/ {cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGV (18%):</span>
                  <span>S/ {cartIgv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">S/ {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleOpenCheckout}
                disabled={cart.length === 0 || submitting}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${cart.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-500/20'}`}
              >
                <span>{submitting ? 'Procesando…' : 'Cobrar'}</span>
              </button>
            </div>
          </div>

          {/* Barra flotante móvil */}
          {cart.length > 0 && (
            <div className="lg:hidden fixed bottom-24 left-3 right-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
              <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{cartItemCount} ítem(es) en carrito</div>
                    <div className="text-[11px] text-emerald-400 font-extrabold">Total: S/ {cartTotal.toFixed(2)}</div>
                  </div>
                </div>
                <button
                  onClick={handleOpenCheckout}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <span>Cobrar</span>
                  <Banknote className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de pago */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                Confirmar Cobro • {receiptType.toUpperCase()}
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monto total a cobrar
              </span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                S/ {cartTotal.toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Método de pago:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${paymentMethod === 'efectivo' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs">Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('yape')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${paymentMethod === 'yape' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  <QrCode className="w-5 h-5 text-purple-600" />
                  <span className="text-xs">Yape / Plin</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${paymentMethod === 'tarjeta' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Tarjeta POS</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'efectivo' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Monto recibido (S/):</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Vuelto:</span>
                    <div className="mt-1 p-2 text-sm font-black rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      S/ {Math.max(0, amountPaid - cartTotal).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">
                  Botones rápidos:{' '}
                  {[cartTotal, 10, 20, 50, 100]
                    .map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmountPaid(v)}
                        className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      >
                        S/ {v}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSale}
                disabled={
                  submitting ||
                  (paymentMethod === 'efectivo' && amountPaid < cartTotal)
                }
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Procesando venta…' : 'Completar venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket de venta completada */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 font-mono text-xs space-y-4">
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <div className="font-bold text-sm tracking-wider uppercase">Botica Nova Salud S.A.C.</div>
              <div className="text-[10px] text-slate-600">RUC: 20601234567</div>
              <div className="pt-2 font-bold text-xs uppercase text-emerald-700">{completedSale.receiptType?.toUpperCase() || 'BOLETA'} Electrónica</div>
              <div className="font-bold text-xs">{completedSale.codigoVenta}</div>
            </div>

            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div>Fecha: {new Date(completedSale.fecha).toLocaleString('es-PE')}</div>
              <div>Cajero: {completedSale.cajero}</div>
              <div>Cliente: {completedSale.cliente || 'Público General'}</div>
              <div>Doc: {completedSale.clienteDoc || '-'}</div>
              <div>Pago: {completedSale.metodoPago.toUpperCase()}</div>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              <div className="font-bold grid grid-cols-12 text-[10px]">
                <span className="col-span-6">Descripción</span>
                <span className="col-span-2 text-center">Cant.</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              {completedSale.items.map((it: any, idx: number) => (
                <div key={idx} className="space-y-0.5 text-[10px]">
                  <div className="grid grid-cols-12 font-medium">
                    <span className="col-span-6 line-clamp-1">{it.productName}</span>
                    <span className="col-span-2 text-center">{it.quantity}</span>
                    <span className="col-span-4 text-right">S/ {it.subtotal.toFixed(2)}</span>
                  </div>
                  {it.batches?.length && (
                    <div className="text-[9px] text-slate-500 italic pl-1">
                      Lote: {it.batches.map((b: any) => b.codigoLote).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[11px]">
              <div>Op. Gravada: S/ {completedSale.subtotal.toFixed(2)}</div>
              <div>IGV (18%): S/ {completedSale.igv.toFixed(2)}</div>
              <div className="font-bold text-sm text-slate-900 pt-1">TOTAL: S/ {completedSale.total.toFixed(2)}</div>
              {completedSale.metodoPago === 'efectivo' && completedSale.amountPaid !== undefined && (
                <>
                  <div className="text-[10px] text-slate-600">Recibido: S/ {completedSale.amountPaid.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-600">Vuelto: S/ {Math.max(0, completedSale.amountPaid - completedSale.total).toFixed(2)}</div>
                </>
              )}
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-500 border-t border-dashed border-slate-300 space-y-1">
              <div>¡Gracias por su compra en Botica Nova Salud!</div>
              <div className="text-[9px]">Comprobante de venta electrónica</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cerrar
              </button>
              <button onClick={printTicket} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
