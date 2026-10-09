import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useI18n } from '../../i18n/I18nContext';
import { Product, ReceiptType, PaymentMethod, Sale } from '../../types/pharmacy';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  CreditCard,
  Banknote,
  Receipt,
  User,
  Printer,
  Sparkles,
  ShieldAlert,
  Clock,
  Pill,
  X
} from 'lucide-react';

export const PointOfSaleView: React.FC = () => {
  const {
    products,
    customers,
    currentUser,
    cashRegister,
    getProductTotalStock,
    getProductFefoEarliestBatch,
    getDaysUntilExpiration,
    executeFefoSale
  } = usePharmacy();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Customer State
  const [customerDoc, setCustomerDoc] = useState('00000000');
  const [customerName, setCustomerName] = useState('Público General');

  // Checkout State
  const [receiptType, setReceiptType] = useState<ReceiptType>('boleta');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.laboratory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Cart operations
  const addToCart = (product: Product) => {
    const available = getProductTotalStock(product.id);
    if (available <= 0) {
      setErrorMessage(`No hay stock vigente para "${product.name}".`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= available) {
          setErrorMessage(`Stock máximo alcanzado (${available} unidades) para "${product.name}".`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setErrorMessage(null);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const available = getProductTotalStock(productId);
            const newQty = item.quantity + delta;
            if (newQty > available) {
              setErrorMessage(`Stock máximo disponible: ${available}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[];
    });
    setErrorMessage(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setErrorMessage(null);
  };

  // Cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartSubtotal = +(cartTotal / 1.18).toFixed(2);
  const cartIgv = +(cartTotal - cartSubtotal).toFixed(2);

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setAmountPaid(cartTotal);
    setIsCheckoutModalOpen(true);
  };

  // Submit Sale
  const handleConfirmSale = () => {
    setErrorMessage(null);
    const result = executeFefoSale({
      cartItems: cart,
      receiptType,
      customerName,
      customerDoc,
      paymentMethod,
      amountPaid: paymentMethod === 'efectivo' ? amountPaid : cartTotal
    });

    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      setIsCheckoutModalOpen(false);
      setCart([]);
    } else {
      setErrorMessage(result.error || 'Error al procesar la venta.');
    }
  };

  // Quick Customer Selection
  const handleSelectCustomer = (doc: string) => {
    const cust = customers.find(c => c.docNumber === doc);
    if (cust) {
      setCustomerDoc(cust.docNumber);
      setCustomerName(cust.fullName);
    } else {
      setCustomerDoc('00000000');
      setCustomerName('Público General');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Cashier Alert */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Punto de Venta & Despacho FEFO
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                FEFO Activo
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cajero: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.name}</span> • Caja #{cashRegister.id} ({cashRegister.shift.toUpperCase()}) • {cashRegister.isOpen ? '🟢 Turno Abierto' : '🔴 Caja Cerrada'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSelectCustomer('00000000')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              customerDoc === '00000000'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            Público General
          </button>
          <select
            value={customerDoc}
            onChange={e => handleSelectCustomer(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="00000000">Público General (00000000)</option>
            {customers.map(c => (
              <option key={c.id} value={c.docNumber}>
                {c.fullName} ({c.docNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Products (Left) & Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Search & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search bar & Category filter */}
          <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por medicamento, principio activo (DCI), laboratorio..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition font-medium ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map(product => {
              const totalStock = getProductTotalStock(product.id);
              const earliestBatch = getProductFefoEarliestBatch(product.id);
              const daysLeft = earliestBatch ? getDaysUntilExpiration(earliestBatch.expirationDate) : 0;
              const isLowStock = totalStock <= product.minStock;
              const isUrgentExpiration = daysLeft <= 30 && daysLeft > 0;

              return (
                <div
                  key={product.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between bg-white dark:bg-slate-900 ${
                    totalStock === 0
                      ? 'opacity-60 border-slate-200 dark:border-slate-800'
                      : 'hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-md border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {product.code} • {product.laboratory}
                      </span>
                      {product.isControlled && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          <ShieldAlert className="w-3 h-3" /> Rx Controlada
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-1 mb-2">
                      {product.genericName} ({product.concentration})
                    </p>

                    {/* FEFO Queue Badge */}
                    {earliestBatch ? (
                      <div className={`p-2 rounded-lg text-[11px] mb-3 flex items-center justify-between ${
                        isUrgentExpiration
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Lote FEFO: <strong>{earliestBatch.batchCode}</strong></span>
                        </div>
                        <span className="font-semibold">{daysLeft}d restantes</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg text-[11px] mb-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200">
                        Sin lotes vigentes disponibles
                      </div>
                    )}
                  </div>

                  {/* Price & Add to Cart button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white">
                        S/ {product.unitPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Stock: <span className={isLowStock ? 'text-amber-600 font-bold' : 'font-medium'}>{totalStock} uds</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={totalStock === 0}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                        totalStock === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Carrito de Venta
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                  {cart.reduce((s, i) => s + i.quantity, 0)} ítems
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

            {/* Customer info bar */}
            <div className="py-2.5 px-3 my-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Cliente: <strong className="text-slate-900 dark:text-white">{customerName}</strong> ({customerDoc})</span>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1 my-2">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <Pill className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-sm font-medium">El carrito está vacío</p>
                  <p className="text-xs">Seleccione medicamentos del catálogo para iniciar la venta.</p>
                </div>
              ) : (
                cart.map(item => {
                  const earliestBatch = getProductFefoEarliestBatch(item.product.id);
                  const itemSubtotal = item.product.unitPrice * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.product.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            S/ {item.product.unitPrice.toFixed(2)} c/u
                          </div>
                        </div>

                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          S/ {itemSubtotal.toFixed(2)}
                        </div>
                      </div>

                      {/* FEFO Batch dispatch info */}
                      {earliestBatch && (
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded flex items-center justify-between">
                          <span>FEFO: Lote {earliestBatch.batchCode}</span>
                          <span>Vence: {earliestBatch.expirationDate}</span>
                        </div>
                      )}

                      {/* Controls */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100"
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

            {/* Receipt Type Toggle */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-400">Comprobante:</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  {(['boleta', 'factura', 'ticket'] as ReceiptType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setReceiptType(type)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition ${
                        receiptType === type
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal Base (sin IGV):</span>
                  <span>S/ {cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGV (18% SUNAT):</span>
                  <span>S/ {cartIgv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    S/ {cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleOpenCheckout}
                disabled={cart.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${
                  cart.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-500/20'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Cobrar S/ {cartTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Checkout / Payment */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                Confirmar Cobro • {receiptType.toUpperCase()}
              </h3>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total display */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monto Total a Cobrar
              </span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                S/ {cartTotal.toFixed(2)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Seleccione Método de Pago:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'efectivo'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs">Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('yape')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'yape'
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-purple-600" />
                  <span className="text-xs">Yape / Plin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'tarjeta'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Tarjeta POS</span>
                </button>
              </div>
            </div>

            {/* Cash Detail (Amount Paid & Change) */}
            {paymentMethod === 'efectivo' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Billetes Rápidos:
                  </span>
                  <div className="flex gap-1">
                    {[cartTotal, 10, 20, 50, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmountPaid(val)}
                        className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      >
                        S/ {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Monto Recibido (S/):
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      value={amountPaid}
                      onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 p-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Vuelto a Entregar:
                    </label>
                    <div className="mt-1 p-2 text-sm font-black rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      S/ {Math.max(0, amountPaid - cartTotal).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'yape' && (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center space-y-2">
                <div className="w-20 h-20 mx-auto bg-white p-2 rounded-lg shadow-xs flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-purple-700" />
                </div>
                <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  Escanear QR de Botica Nova Salud (987 654 321)
                </div>
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  Verificar el abono en el celular de caja antes de confirmar.
                </p>
              </div>
            )}

            {/* Confirm button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSale}
                disabled={paymentMethod === 'efectivo' && amountPaid < cartTotal}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Completar Venta FEFO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Completed Sale / Thermal Ticket Receipt Preview */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 font-mono text-xs space-y-4">
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <div className="font-bold text-sm tracking-wider uppercase">
                BOTICA NOVA SALUD S.A.C.
              </div>
              <div className="text-[10px] text-slate-600">RUC: 20601234567</div>
              <div className="text-[10px] text-slate-600">Av. Brasil 1420 - Jesús María, Lima</div>
              <div className="text-[10px] text-slate-600">Tel: (01) 424-9000</div>
              <div className="pt-2 font-bold text-xs uppercase text-emerald-700">
                {completedSale.receiptType.toUpperCase()} ELECTRÓNICA
              </div>
              <div className="font-bold text-xs">{completedSale.receiptNumber}</div>
            </div>

            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div>Fecha: {new Date(completedSale.date).toLocaleString('es-PE')}</div>
              <div>Cajero: {completedSale.cashierName}</div>
              <div>Cliente: {completedSale.customerName}</div>
              <div>Doc: {completedSale.customerDoc}</div>
              <div>Pago: {completedSale.paymentMethod.toUpperCase()}</div>
            </div>

            {/* Items list with FEFO batches */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              <div className="font-bold grid grid-cols-12 text-[10px]">
                <span className="col-span-6">DESCRIPCIÓN</span>
                <span className="col-span-2 text-center">CANT</span>
                <span className="col-span-4 text-right">TOTAL</span>
              </div>
              {completedSale.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5 text-[10px]">
                  <div className="grid grid-cols-12 font-medium">
                    <span className="col-span-6">{it.productName}</span>
                    <span className="col-span-2 text-center">{it.quantity}</span>
                    <span className="col-span-4 text-right">S/ {it.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 italic pl-1">
                    Lote: {it.batchCode} (Vence: {it.expirationDate})
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-right text-[11px]">
              <div>Op. Gravada: S/ {completedSale.subtotal.toFixed(2)}</div>
              <div>IGV (18%): S/ {completedSale.igv.toFixed(2)}</div>
              <div className="font-bold text-sm text-slate-900 pt-1">
                TOTAL: S/ {completedSale.total.toFixed(2)}
              </div>
              {completedSale.paymentMethod === 'efectivo' && (
                <>
                  <div className="text-[10px] text-slate-600">
                    Importe Recibido: S/ {completedSale.amountPaid.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    Vuelto: S/ {completedSale.change.toFixed(2)}
                  </div>
                </>
              )}
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-500 border-t border-dashed border-slate-300 space-y-1">
              <div>¡Gracias por su compra en Botica Nova Salud!</div>
              <div className="text-[9px]">Representación impresa de comprobante electrónico</div>
              <div>Autorizado por SUNAT mediante RS 192-2020</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
