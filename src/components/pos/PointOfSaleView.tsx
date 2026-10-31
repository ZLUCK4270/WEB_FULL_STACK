import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  FileText,
  UserPlus,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { Product, PaymentMethod, ReceiptType } from '../../types/pharmacy';

export const PointOfSaleView: React.FC = () => {
  const {
    products,
    productsLoading,
    customers,
    user,
    createSale,
    loadProducts,
    currentShift,
    createCustomer,
    getSubstitutes
  } = usePharmacy();

  // Búsqueda y foco
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Cliente (Fix C8: estado React para persistencia)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDoc, setCustomerDoc] = useState<string>('00000000');
  const [customerName, setCustomerName] = useState<string>('Público General');
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState<boolean>(false);
  const [newCustDocType, setNewCustDocType] = useState<string>('DNI');
  const [newCustDocNumber, setNewCustDocNumber] = useState<string>('');
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  // Checkout y pagos
  const [receiptType, setReceiptType] = useState<ReceiptType>('boleta');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal de sustitutos
  const [substituteModalProduct, setSubstituteModalProduct] = useState<Product | null>(null);
  const [substitutesList, setSubstitutesList] = useState<Product[]>([]);
  const [loadingSubstitutes, setLoadingSubstitutes] = useState<boolean>(false);

  // Atajos de teclado (F2 para buscar, F4 para cobrar, Escape para cerrar modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && !isCheckoutOpen) {
          handleOpenCheckout();
        }
      } else if (e.key === 'Escape') {
        if (isCheckoutOpen) setIsCheckoutOpen(false);
        if (isQuickCustomerOpen) setIsQuickCustomerOpen(false);
        if (substituteModalProduct) setSubstituteModalProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isCheckoutOpen, isQuickCustomerOpen, substituteModalProduct]);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        (p.generico && p.generico.toLowerCase().includes(term)) ||
        (p.laboratorio && p.laboratorio.toLowerCase().includes(term)) ||
        (p.categoria && p.categoria.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  // Totales
  const cartItemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.product.precio * i.quantity, 0),
    [cart]
  );
  const cartSubtotal = +(cartTotal / 1.18).toFixed(2);
  const cartIgv = +(cartTotal - cartSubtotal).toFixed(2);

  // Chequeo de recetas
  const cartRequiresPrescription = useMemo(
    () => cart.some((i) => i.product.requiereReceta || i.product.controlado),
    [cart]
  );

  const getAvailableStock = useCallback((productId: string) => {
    const p = products.find((x) => x.id === productId);
    return p ? p.stockTotal : 0;
  }, [products]);

  const addToCart = useCallback(
    (product: Product) => {
      setErrorMessage(null);
      const available = getAvailableStock(product.id);
      if (available <= 0) {
        setErrorMessage(`No hay stock disponible para "${product.nombre}". Revise sustitutos genéricos.`);
        return;
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          if (existing.quantity >= available) {
            setErrorMessage(`Stock máximo alcanzado (${available} unidades) para "${product.nombre}".`);
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
    if (!id || doc === '00000000') {
      setCustomerName('Público General');
      setSelectedCustomerId(null);
    } else {
      const found = customers.find((c) => c.id === id || c.numeroDocumento === doc);
      setCustomerName(found ? found.nombreCompleto : `Cliente (${doc})`);
      setSelectedCustomerId(id);
    }
  };

  const handleCreateQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustDocNumber || !newCustName) return;
    const res = await createCustomer({
      tipoDocumento: newCustDocType,
      numeroDocumento: newCustDocNumber.trim(),
      nombreCompleto: newCustName.trim(),
      telefono: newCustPhone.trim()
    });
    if (res.success && res.customerId) {
      setSelectedCustomerId(res.customerId);
      setCustomerDoc(newCustDocNumber.trim());
      setCustomerName(newCustName.trim());
      setIsQuickCustomerOpen(false);
      setNewCustDocNumber('');
      setNewCustName('');
      setNewCustPhone('');
      setSuccessMessage(`Cliente ${newCustName} registrado y asociado a la venta.`);
    } else {
      setErrorMessage(res.error || 'Error al registrar cliente');
    }
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setAmountPaid(cartTotal);
    setErrorMessage(null);
    setIsCheckoutOpen(true);
  };

  const handleReceiptTypeChange = (type: ReceiptType) => {
    setReceiptType(type);
    setErrorMessage(null);
    if (type === 'factura') {
      // Si ya hay un cliente con RUC seleccionado (11 dígitos), mantenerlo; de lo contrario, limpiar para pedir RUC
      const currentClean = customerDoc.replace(/\D/g, '');
      if (currentClean.length !== 11) {
        const existingRucCustomer = customers.find(
          (c) => c.tipoDocumento === 'RUC' || c.numeroDocumento.trim().length === 11
        );
        if (existingRucCustomer) {
          setSelectedCustomerId(existingRucCustomer.id);
          setCustomerDoc(existingRucCustomer.numeroDocumento);
          setCustomerName(existingRucCustomer.nombreCompleto);
        } else {
          setSelectedCustomerId(null);
          setCustomerDoc('');
          setCustomerName('');
        }
      }
    } else if (type === 'boleta') {
      // Si veníamos de un RUC de 11 dígitos o vacío, volver a Público General (00000000) o DNI
      if (!customerDoc || customerDoc.replace(/\D/g, '').length === 11) {
        setSelectedCustomerId(null);
        setCustomerDoc('00000000');
        setCustomerName('Público General');
      }
    } else {
      // Ticket simplificado
      setSelectedCustomerId(null);
      setCustomerDoc('00000000');
      setCustomerName('Público General');
    }
  };

  const handleCheckoutDocChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, receiptType === 'factura' ? 11 : 8);
    setCustomerDoc(digits);
    const matched = customers.find((c) => c.numeroDocumento === digits);
    if (matched) {
      setSelectedCustomerId(matched.id);
      setCustomerName(matched.nombreCompleto);
    } else {
      setSelectedCustomerId(null);
      if (digits === '00000000' || digits === '') {
        setCustomerName(receiptType === 'factura' ? '' : 'Público General');
      } else if (customerName === 'Público General') {
        setCustomerName('');
      }
    }
  };

  const handleFillRandomDni = () => {
    const randomDni = String(Math.floor(10000000 + Math.random() * 80000000));
    setSelectedCustomerId(null);
    setCustomerDoc(randomDni);
    setCustomerName(`Cliente Eventual (DNI ${randomDni})`);
  };

  const handleOpenSubstitutes = async (product: Product) => {
    setSubstituteModalProduct(product);
    setLoadingSubstitutes(true);
    try {
      const subs = await getSubstitutes(product.id);
      setSubstitutesList(subs);
    } catch {
      setSubstitutesList([]);
    } finally {
      setLoadingSubstitutes(false);
    }
  };

  const handleConfirmSale = async () => {
    setErrorMessage(null);

    const cleanDoc = customerDoc.replace(/\D/g, '');
    let finalCustomerId = selectedCustomerId;
    let finalDoc = cleanDoc || '00000000';
    let finalName = customerName.trim() || 'Público General';

    // Validación según tipo de comprobante
    if (receiptType === 'factura') {
      if (cleanDoc.length !== 11) {
        setErrorMessage('Para emitir FACTURA es obligatorio ingresar un número de RUC válido de 11 dígitos.');
        return;
      }
      if (!finalName || finalName === 'Público General') {
        finalName = `Empresa RUC ${cleanDoc}`;
      }
    } else if (receiptType === 'boleta') {
      if (cleanDoc && cleanDoc !== '00000000' && cleanDoc.length !== 8) {
        setErrorMessage('Para BOLETA el DNI debe tener 8 dígitos, o elija "Sin DNI / Público General".');
        return;
      }
      if (!cleanDoc || cleanDoc === '00000000') {
        finalDoc = '00000000';
        finalName = finalName && finalName !== 'Público General' ? finalName : 'Público General';
      } else if (!finalName || finalName === 'Público General') {
        finalName = `Cliente DNI ${cleanDoc}`;
      }
    }

    setSubmitting(true);
    try {
      // Si el cliente ingresó un DNI o RUC específico que aún no existe en el padrón, lo registramos o asociamos automáticamente
      if (finalDoc !== '00000000' && !finalCustomerId) {
        const existing = customers.find((c) => c.numeroDocumento === finalDoc);
        if (existing) {
          finalCustomerId = existing.id;
          finalName = existing.nombreCompleto;
        } else {
          const created = await createCustomer({
            tipoDocumento: receiptType === 'factura' ? 'RUC' : 'DNI',
            numeroDocumento: finalDoc,
            nombreCompleto: finalName,
            telefono: ''
          });
          if (created.success && created.customerId) {
            finalCustomerId = created.customerId;
          }
        }
      }

      const result = await createSale({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod,
        amountPaid: paymentMethod === 'efectivo' ? amountPaid : cartTotal,
        customerId: finalCustomerId || undefined,
        receiptType
      });
      if (result.success && result.sale) {
        setSuccessMessage(`Venta ${result.sale.codigoVenta} (${receiptType.toUpperCase()}) registrada correctamente con FEFO.`);
        setCompletedSale({
          ...result.sale,
          receiptType,
          cliente: finalName,
          clienteDoc: finalDoc,
          amountPaid: paymentMethod === 'efectivo' ? amountPaid : cartTotal
        });
        setIsCheckoutOpen(false);
        setCart([]);
        setAmountPaid(0);
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Aviso de Caja Registradora */}
      {!currentShift && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Caja Cerrada:</strong> No hay un turno de caja abierto para registrar arqueo de efectivo. Puede continuar, pero se recomienda abrir turno en el módulo de Caja.</span>
          </div>
        </div>
      )}

      {/* Barra superior de POS: Cajero, Cliente y Atajos */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Punto de Venta</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Atajos: [F2] Buscar • [F4] Cobrar • [ESC] Cancelar
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cajero: <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.name}</span> ({user?.role}) •{' '}
              {cartItemCount > 0 ? `${cartItemCount} ítem(s) en orden` : 'Orden vacía'}
            </p>
          </div>
        </div>

        {/* Selector de Cliente con botón de registro rápido */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={selectedCustomerId || '00000000'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '00000000') {
                  handleSelectCustomer('00000000');
                } else {
                  const cust = customers.find((c) => c.id === val);
                  if (cust) {
                    handleSelectCustomer(cust.numeroDocumento, cust.id);
                  }
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            >
              <option value="00000000">Público General (Sin DNI/RUC)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombreCompleto} ({c.tipoDocumento}: {c.numeroDocumento})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsQuickCustomerOpen(true)}
            title="Nuevo cliente rápido"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0 || submitting}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-98'
            }`}
          >
            <Banknote className="w-4 h-4" />
            Cobrar S/ {cartTotal.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Alertas y Notificaciones */}
      {errorMessage && (
        <div className="m-pop p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="m-pop p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cuerpo Principal: Buscador y Catálogo (Izquierda) + Carrito (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Catálogo de Medicamentos */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 dark:text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por nombre, código de barra, principio activo o laboratorio... [F2]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {productsLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="h-4 w-24 m-skeleton" />
                    <div className="h-5 w-3/4 m-skeleton" />
                    <div className="h-3 w-1/2 m-skeleton" />
                    <div className="pt-3 flex justify-between items-center">
                      <div className="h-6 w-16 m-skeleton" />
                      <div className="h-7 w-24 m-skeleton" />
                    </div>
                  </div>
                ))}
                <span className="sr-only">Cargando inventario de medicamentos...</span>
              </>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-600 dark:text-slate-300 text-sm font-medium">
                No se encontraron productos con "{searchTerm}".
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock = product.stockTotal <= product.stockMinimo;
                const outOfStock = product.stockTotal === 0;

                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between bg-white dark:bg-slate-900 shadow-xs ${
                      outOfStock
                        ? 'opacity-75 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
                        : 'hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {product.codigo}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {product.requiereReceta && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                              Rx Receta
                            </span>
                          )}
                          {product.controlado && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                              Controlado
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              outOfStock
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                                : isLowStock
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                            }`}
                          >
                            {outOfStock ? 'Agotado' : `${product.stockTotal} disp.`}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {product.nombre}
                      </h3>
                      {product.generico && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1 leading-snug">
                          DCI: {product.generico} {product.concentracion ? `• ${product.concentracion}` : ''}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                        {product.laboratorio ? `${product.laboratorio} • ` : ''}{product.presentacion || 'Unidad'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">Precio Venta</span>
                        <div className="text-base font-black text-slate-900 dark:text-white whitespace-nowrap">
                          S/ {product.precio.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenSubstitutes(product)}
                          title="Ver alternativas y sustitutos genéricos"
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                        >
                          Sustitutos
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={outOfStock}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                            outOfStock
                              ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Carrito de Compra (Derecha) */}
        <div className="lg:col-span-4 flex flex-col lg:sticky lg:top-32">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Orden de Venta</span>
                  {cart.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {cartItemCount}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Cliente: <strong className="text-slate-700 dark:text-slate-300">{customerName}</strong>
                </p>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar
                </button>
              )}
            </div>

            {/* Aviso de Medicamentos con Receta en Carrito */}
            {cartRequiresPrescription && (
              <div className="mx-4 mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-[11px] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>La orden contiene medicamentos bajo receta médica obligatoria. Verificar receta física antes de cobrar.</span>
              </div>
            )}

            {/* Lista de Ítems */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[calc(100vh-420px)]">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                  <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs font-semibold">El carrito está vacío</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Seleccione medicamentos del catálogo o presione [F2] para buscar por nombre o código de barra.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemSubtotal = item.product.precio * item.quantity;
                  return (
                    <div
                      key={item.product.id}
                      className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.product.nombre}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          S/ {item.product.precio.toFixed(2)} c/u
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right w-16">
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          S/ {itemSubtotal.toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] text-rose-500 hover:text-rose-700 transition"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Totales y Botón Cobrar */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Op. Gravada (Subtotal):</span>
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
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs ${
                  cart.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-98'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>{submitting ? 'Procesando venta...' : `Cobrar S/ ${cartTotal.toFixed(2)} [F4]`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Registro Rápido de Cliente */}
      {isQuickCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                Registrar Cliente Rápido
              </h3>
              <button onClick={() => setIsQuickCustomerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickCustomer} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tipo Doc.</label>
                  <select
                    value={newCustDocType}
                    onChange={(e) => setNewCustDocType(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Número Documento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 45678912"
                    value={newCustDocNumber}
                    onChange={(e) => setNewCustDocNumber(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nombre Completo o Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Elena Pérez"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Teléfono (opcional)</label>
                <input
                  type="tel"
                  placeholder="Ej. 987654321"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCustomerOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Sustitutos Genéricos */}
      {substituteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sustitutos y Alternativas Bioequivalentes
                </h3>
                <p className="text-xs text-slate-500">
                  Para: <strong className="text-slate-800 dark:text-slate-200">{substituteModalProduct.nombre}</strong> (DCI: {substituteModalProduct.generico || 'N/A'})
                </p>
              </div>
              <button onClick={() => setSubstituteModalProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {loadingSubstitutes ? (
                <div className="py-8 text-center text-xs text-slate-400">Buscando sustitutos por principio activo...</div>
              ) : substitutesList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No se encontraron otros productos con el mismo principio activo registrado.
                </div>
              ) : (
                substitutesList.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{sub.nombre}</div>
                      <div className="text-[11px] text-slate-500">
                        {sub.laboratorio} • Stock: <span className="font-bold text-emerald-600">{sub.stockTotal}</span> uds.
                      </div>
                      <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                        S/ {sub.precio.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addToCart(sub);
                        setSubstituteModalProduct(null);
                      }}
                      disabled={sub.stockTotal === 0}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300"
                    >
                      Seleccionar
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setSubstituteModalProduct(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checkout / Cobro */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                Confirmar Cobro • Nova Salud
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Tipo de Comprobante */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tipo de Comprobante:</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'boleta', label: 'Boleta (DNI)' },
                  { id: 'factura', label: 'Factura (RUC)' },
                  { id: 'ticket', label: 'Ticket Simple' }
                ] as { id: ReceiptType; label: string }[]).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleReceiptTypeChange(item.id)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase transition cursor-pointer ${
                      receiptType === item.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Datos de DNI (Boleta) o RUC (Factura) */}
            {receiptType === 'boleta' && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Datos del Cliente (Boleta - DNI)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(null);
                        setCustomerDoc('00000000');
                        setCustomerName('Público General');
                      }}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      Sin DNI (Público General)
                    </button>
                    <button
                      type="button"
                      onClick={handleFillRandomDni}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 cursor-pointer"
                    >
                      DNI Cualquiera (8 dígitos)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-5">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      N° de DNI (8 dígitos o 00000000)
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="Ej. 45892134 o 00000000"
                      value={customerDoc}
                      onChange={(e) => handleCheckoutDocChange(e.target.value)}
                      className="w-full mt-1 p-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-7">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Nombre del Cliente (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Público General o Nombre"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full mt-1 p-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Si el cliente no desea brindar su DNI, puede dejar <strong>00000000 (Público General)</strong> o pulsar <strong>"DNI Cualquiera"</strong>.
                </p>
              </div>
            )}

            {receiptType === 'factura' && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Datos Fiscales Obligatorios (Factura - RUC 11 dígitos)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {customers
                      .filter((c) => c.tipoDocumento === 'RUC' || c.numeroDocumento.trim().length === 11)
                      .slice(0, 1)
                      .map((rucCust) => (
                        <button
                          key={rucCust.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(rucCust.id);
                            setCustomerDoc(rucCust.numeroDocumento);
                            setCustomerName(rucCust.nombreCompleto);
                            setErrorMessage(null);
                          }}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 cursor-pointer"
                        >
                          Usar {rucCust.numeroDocumento}
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(null);
                        setCustomerDoc('20512345678');
                        setCustomerName('Corporación Médica del Perú S.A.C.');
                        setErrorMessage(null);
                      }}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-200 cursor-pointer"
                    >
                      RUC Rápido (11 dígitos)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      Número de RUC (11 dígitos) *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="Ej. 20601425369"
                      value={customerDoc}
                      onChange={(e) => handleCheckoutDocChange(e.target.value)}
                      className="w-full mt-1 p-2 text-xs font-mono font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-7">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      Razón Social / Empresa *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Policlínico San Gabriel S.A.C."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full mt-1 p-2 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90">
                  La emisión de Factura Electrónica requiere un número de RUC válido de 11 dígitos (iniciado en 10 o 20).
                </p>
              </div>
            )}

            {/* Monto Total */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monto Total a Cobrar
              </span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                S/ {cartTotal.toFixed(2)}
              </div>
            </div>

            {/* Método de Pago */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Método de Pago:</label>
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
                  <Banknote className="w-5 h-5 text-emerald-600" />
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

            {/* Efectivo: Recibido y Vuelto */}
            {paymentMethod === 'efectivo' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Monto Recibido (S/):
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 p-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Vuelto al Cliente:
                    </label>
                    <div className="mt-1 p-2 text-sm font-black rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      S/ {Math.max(0, amountPaid - cartTotal).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Botones de Denominación Rápida */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Rápido:</span>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(cartTotal)}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Exacto
                  </button>
                  {[10, 20, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountPaid(val)}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      S/ {val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSale}
                disabled={submitting || (paymentMethod === 'efectivo' && amountPaid < cartTotal)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Procesando Venta...' : 'Completar Venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ticket de Venta Completada (Fix C7: Safe access y renderizado impecable) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 font-mono text-xs space-y-4">
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <div className="font-bold text-sm tracking-wider uppercase">Botica Nova Salud S.A.C.</div>
              <div className="text-[10px] text-slate-600">RUC: 20601234567 • San Isidro, Lima</div>
              <div className="pt-1.5 font-bold text-xs uppercase text-emerald-700">
                {completedSale.receiptType ? `${completedSale.receiptType.toUpperCase()} ELECTRÓNICA` : 'COMPROBANTE ELECTRÓNICO'}
              </div>
              <div className="font-bold text-xs text-slate-800">
                {completedSale.codigoVenta || completedSale.saleCode || 'NV-000000'}
              </div>
            </div>

            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div>Fecha: {new Date(completedSale.fecha || Date.now()).toLocaleString('es-PE')}</div>
              <div>Cajero: {completedSale.cajero || user?.name}</div>
              <div>
                {completedSale.receiptType === 'factura' ? 'Razón Social: ' : 'Cliente: '}
                {completedSale.cliente || customerName}
              </div>
              <div>
                {completedSale.receiptType === 'factura' ? 'RUC: ' : 'DNI: '}
                {completedSale.clienteDoc || customerDoc || '00000000'}
              </div>
              <div>Pago: {String(completedSale.metodoPago || 'efectivo').toUpperCase()}</div>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3 max-h-48 overflow-y-auto">
              <div className="font-bold grid grid-cols-12 text-[10px]">
                <span className="col-span-6">Descripción</span>
                <span className="col-span-2 text-center">Cant.</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              {(completedSale.items || []).map((it: any, idx: number) => (
                <div key={idx} className="space-y-0.5 text-[10px]">
                  <div className="grid grid-cols-12 font-medium">
                    <span className="col-span-6 line-clamp-1">{it.productName || it.producto}</span>
                    <span className="col-span-2 text-center">{it.quantity || it.cantidad}</span>
                    <span className="col-span-4 text-right">S/ {(it.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {it.batches && it.batches.length > 0 && (
                    <div className="text-[9px] text-slate-500 italic pl-1">
                      Lote FEFO: {it.batches.map((b: any) => b.codigoLote || b.codigo_lote).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[11px]">
              <div>Op. Gravada: S/ {(completedSale.subtotal || 0).toFixed(2)}</div>
              <div>IGV (18%): S/ {(completedSale.igv || 0).toFixed(2)}</div>
              <div className="font-bold text-sm text-slate-900 pt-1">
                TOTAL: S/ {(completedSale.total || 0).toFixed(2)}
              </div>
              {completedSale.metodoPago === 'efectivo' && completedSale.amountPaid !== undefined && (
                <>
                  <div className="text-[10px] text-slate-600">Recibido: S/ {Number(completedSale.amountPaid).toFixed(2)}</div>
                  <div className="text-[10px] text-slate-600 font-bold">
                    Vuelto: S/ {Math.max(0, Number(completedSale.amountPaid) - Number(completedSale.total || 0)).toFixed(2)}
                  </div>
                </>
              )}
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-500 border-t border-dashed border-slate-300 space-y-0.5">
              <div>¡Gracias por su compra en Botica Nova Salud!</div>
              <div className="text-[9px]">Representación impresa de comprobante electrónico</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
