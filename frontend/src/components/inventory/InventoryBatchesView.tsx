import React, { useState, useMemo, useCallback } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Package,
  Plus,
  AlertTriangle,
  Clock,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';
import type { Product } from '../../types/pharmacy';

export const InventoryBatchesView: React.FC = () => {
  const {
    products,
    productsLoading,
    batches,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getProductStock,
    user
  } = usePharmacy();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showLowStock, setShowLowStock] = useState<boolean>(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [stockBatches, setStockBatches] = useState<{ loteId: string; codigoLote: string; fechaVencimiento: string; stock: number; estado: string }[]>([]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<{ productId: string; loteId: string; stock: number } | null>(null);

  // Forms
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    generico: '',
    categoria: '',
    laboratorio: '',
    precio: '',
    costo: '',
    stockMinimo: '0'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE', quantity: '', reason: '' });
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return products.filter((p) => {
      const match =
        !term ||
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        (p.generico && p.generico.toLowerCase().includes(term)) ||
        (p.categoria && p.categoria.toLowerCase().includes(term));
      if (!match) return false;
      if (showLowStock && !p.lowStock) return false;
      return true;
    });
  }, [products, searchTerm, showLowStock]);

  const canWrite = user?.role === 'admin' || user?.role === 'almacen';

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.codigo || !form.nombre || !form.categoria) {
      setFormError('Código, nombre y categoría son obligatorios.');
      return;
    }
    const precio = parseFloat(form.precio);
    const stockMin = parseInt(form.stockMinimo, 10) || 0;
    if (!Number.isFinite(precio) || precio < 0) {
      setFormError('Precio de venta inválido.');
      return;
    }
    const result = await createProduct({
      codigo_barras: form.codigo.trim(),
      nombre: form.nombre.trim(),
      nombre_generico: form.generico.trim() || null,
      categoria_id: form.categoria.trim(),
      laboratorio_id: form.laboratorio.trim() || null,
      precio_venta: precio,
      costo: parseFloat(form.costo) || 0,
      stock_minimo: stockMin
    });
    if (result.success) {
      setIsProductModalOpen(false);
      setForm({ codigo: '', nombre: '', generico: '', categoria: '', laboratorio: '', precio: '', costo: '', stockMinimo: '0' });
      setFeedback('Producto guardado correctamente.');
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFormError(result.error);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const precio = parseFloat(form.precio);
    const stockMin = parseInt(form.stockMinimo, 10) || 0;
    const result = await updateProduct(editingProduct.id, {
      nombre: form.nombre.trim() || editingProduct.nombre,
      nombre_generico: form.generico.trim() || null,
      precio_venta: Number.isFinite(precio) && precio >= 0 ? precio : editingProduct.precio,
      stock_minimo: stockMin
    });
    if (result.success) {
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setFeedback('Producto actualizado.');
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFormError(result.error);
    }
  };

  const handleDeleteProduct = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar (desactivar) "${nombre}"? Se conserva el historial de ventas y movimientos.`)) return;
    const result = await deleteProduct(id);
    if (result.success) {
      setFeedback('Producto desactivado.');
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFormError(result.error);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setAdjustError(null);
    const qty = parseInt(adjustForm.quantity, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      setAdjustError('La cantidad debe ser mayor a 0.');
      return;
    }
    if (!adjustForm.reason.trim()) {
      setAdjustError('El motivo es obligatorio (trazabilidad).');
      return;
    }
    const result = await adjustStock({
      productId: adjustTarget.productId,
      loteId: adjustTarget.loteId,
      type: adjustForm.type,
      quantity: qty,
      reason: adjustForm.reason.trim()
    });
    if (result.success) {
      setIsAdjustModalOpen(false);
      setFeedback(`Stock ajustado. Nuevo stock en lote: ${result.stockNuevo}.`);
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setAdjustError(result.error);
    }
  };

  const loadBatchDetail = async (productId: string) => {
    const data = await getProductStock(productId);
    setStockBatches(data.batches);
    setExpandedProduct(productId);
  };

  const stockBadge = (p: Product) => {
    if (p.stockTotal === 0) return { label: 'SIN STOCK', className: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' };
    if (p.lowStock) return { label: 'BAJO MÍNIMO', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
    return { label: 'OK', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };
  };

  const nearestBatch = (productId: string) => {
    const pb = batches.filter((b) => b.productId === productId && b.estado === 'VIGENTE' && b.stock > 0);
    if (pb.length === 0) return null;
    return pb.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" /> Inventario y Lotes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stock en tiempo real, stock mínimo configurable y trazabilidad por lote (FEFO).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              onClick={() => {
                setIsProductModalOpen(true);
                setFormError(null);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nuevo producto
            </button>
          )}
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${showLowStock ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {showLowStock ? 'Ver todos' : 'Solo bajo stock'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">Cerrar</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código, categoría…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500">
          {filteredProducts.length} de {products.length} productos
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-center">Mínimo</th>
              <th className="px-4 py-3 text-center">Vence más cercano</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {productsLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">Cargando inventario…</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">No hay productos que coincidan.</td></tr>
            ) : (
              filteredProducts.map((p) => {
                const badge = stockBadge(p);
                const nb = nearestBatch(p.id);
                const isExpanded = expandedProduct === p.id;
                return (
                  <>
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{p.codigo}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                      {p.nombre}
                      {p.generico && <br />}
                      <span className="text-[10px] text-slate-500 block mt-0.5">{p.generico || ''} {p.concentracion ? '• ' + p.concentracion : ''} {p.laboratorio ? '• ' + p.laboratorio : ''}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.categoria || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">S/ {p.precio.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
                        {badge.label}
                      </span>
                      <br />
                      <span className="text-[10px] text-slate-400">{p.stockTotal} uds.</span>
                    </td>
                    <td className="px-4 py-3 text-center">{p.stockMinimo} uds.</td>
                    <td className="px-4 py-3 text-center">
                      {nb ? (
                        <span className={`text-[10px] font-bold ${
                          nb.stock === 0
                            ? 'text-slate-400'
                            : new Date(nb.fechaVencimiento).getTime() <= Date.now() + 86400000 * 30
                              ? 'text-rose-600'
                              : 'text-amber-600'
                        }`}>
                          {nb.stock > 0 ? nb.fechaVencimiento : '—'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => loadBatchDetail(p.id)}
                          className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition p-1"
                          title={isExpanded ? 'Ocultar lotes' : 'Ver lotes'}
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                        {canWrite && (
                          <>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setForm({ ...p, precio: String(p.precio), stockMinimo: String(p.stockMinimo), codigo: p.codigo, nombre: p.nombre, generico: p.generico || '', categoria: p.categoria || '', laboratorio: p.laboratorio || '', costo: String(p.costo) });
                                setFormError(null);
                                setIsEditModalOpen(true);
                              }}
                              className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition p-1"
                              title="Editar producto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.nombre)}
                              className="text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition p-1"
                              title="Desactivar producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const nb2 = nearestBatch(p.id);
                                setAdjustTarget({ productId: p.id, loteId: nb2 ? nb2.id : '', stock: p.stockTotal });
                                setAdjustForm({ type: 'ENTRADA', quantity: '', reason: '' });
                                setAdjustError(null);
                                setIsAdjustModalOpen(true);
                              }}
                              className="text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition p-1"
                              title="Ajustar stock"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && stockBatches.length > 0 && (
                    <tr key={`${p.id}-batches`}>
                      <td colSpan={8} className="p-3 bg-slate-50/50 dark:bg-slate-950/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                            <Layers className="w-3 h-3" /> Lotes FEFO de {p.nombre}
                          </span>
                          <span className="text-[10px] text-slate-400">Ordenados por vencimiento más próximo</span>
                        </div>
                        <table className="w-full text-[10px]">
                          <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="px-4 py-2">Lote</th>
                              <th className="px-4 py-2 text-center">Vencimiento</th>
                              <th className="px-4 py-2 text-center">Stock</th>
                              <th className="px-4 py-2 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {stockBatches.map((b) => (
                              <tr key={b.loteId} className="hover:bg-white/50 dark:hover:bg-white/5/80">
                                <td className="px-4 py-2 font-mono">{b.codigoLote}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`font-bold ${new Date(b.fechaVencimiento).getTime() <= Date.now() ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {b.fechaVencimiento}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-center font-mono">{b.stock}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${b.estado === 'AGOTADO' ? 'bg-rose-100 text-rose-700' : b.estado === 'VENCIDO' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {b.estado}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                  </>
                )
              )}
          </tbody>
        </table>
      </div>

      {/* Modal: Nuevo producto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" /> Nuevo producto
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            {formError && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {formError}
              </div>
            )}
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Código de barras / SKU:</label>
                <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono" required />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nombre comercial:</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" required />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nombre genérico (DCI):</label>
                <input type="text" value={form.generico} onChange={(e) => setForm({ ...form, generico: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Categoría:</label>
                  <input type="text" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" required />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Laboratorio:</label>
                  <input type="text" value={form.laboratorio} onChange={(e) => setForm({ ...form, laboratorio: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Precio venta (S/):</label>
                  <input type="number" step="0.01" min="0" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" required />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Costo (S/):</label>
                  <input type="number" step="0.01" min="0" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Stock mínimo:</label>
                  <input type="number" min="0" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" required />
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Guardar producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar producto */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Editar {editingProduct.nombre}</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            {formError && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {formError}
              </div>
            )}
            <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nombre comercial:</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" required />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Genérico (DCI):</label>
                <input type="text" value={form.generico} onChange={(e) => setForm({ ...form, generico: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Precio venta (S/):</label>
                  <input type="number" step="0.01" min="0" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" required />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Stock mínimo:</label>
                  <input type="number" min="0" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" required />
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajuste de stock */}
      {isAdjustModalOpen && adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Ajuste de stock
              </h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
              <div>Producto: <strong className="font-mono">{adjustTarget.productId}</strong></div>
              <div>Lote: <strong className="font-mono">{adjustTarget.loteId || '—'}</strong></div>
              <div>Stock actual del producto: <strong>{adjustTarget.stock} uds.</strong></div>
            </div>
            {adjustError && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {adjustError}
              </div>
            )}
            <form onSubmit={handleAdjust} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tipo:</label>
                  <select value={adjustForm.type} onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <option value="ENTRADA">Entrada (compra/devolución)</option>
                    <option value="SALIDA">Salida (merma/baja)</option>
                    <option value="AJUSTE">Ajuste manual</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cantidad:</label>
                  <input type="number" min="1" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold" required />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Motivo (trazabilidad):</label>
                <input type="text" placeholder="Ej. Recepción drogería, rotura, vencimiento…" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" required />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold">Registrar ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
