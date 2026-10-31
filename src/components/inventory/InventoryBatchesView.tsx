import React, { useState, useMemo, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Package,
  Plus,
  AlertTriangle,
  Clock,
  Search,
  Edit2,
  Trash2,
  X,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  BookOpen,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import type { Product, KardexMovement } from '../../types/pharmacy';

export const InventoryBatchesView: React.FC = () => {
  const {
    products,
    productsLoading,
    batches,
    categories,
    laboratories,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    createBatch,
    getProductStock,
    kardex,
    kardexLoading,
    loadKardex,
    user
  } = usePharmacy();

  // Vista activa: Productos / Lotes / Kárdex
  const [activeTab, setActiveTab] = useState<'products' | 'batches' | 'kardex'>('products');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showLowStock, setShowLowStock] = useState<boolean>(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [stockBatches, setStockBatches] = useState<{ loteId: string; codigoLote: string; fechaVencimiento: string; stock: number; estado: string }[]>([]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<{ productId: string; loteId: string; stock: number } | null>(null);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<string>('');

  // Forms
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    generico: '',
    categoriaId: '',
    laboratorioId: '',
    concentracion: '',
    presentacion: '',
    precio: '',
    costo: '',
    stockMinimo: '10',
    requiereReceta: false,
    controlado: false
  });

  const [batchForm, setBatchForm] = useState({
    productId: '',
    codigoLote: '',
    fechaVencimiento: '',
    stockInicial: '50'
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE', quantity: '', reason: '' });
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'kardex') {
      loadKardex();
    }
  }, [activeTab, loadKardex]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return products.filter((p) => {
      const match =
        !term ||
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        (p.generico && p.generico.toLowerCase().includes(term)) ||
        (p.categoria && p.categoria.toLowerCase().includes(term)) ||
        (p.laboratorio && p.laboratorio.toLowerCase().includes(term));
      if (!match) return false;
      if (showLowStock && !p.lowStock) return false;
      return true;
    });
  }, [products, searchTerm, showLowStock]);

  const canWrite = user?.role === 'admin' || user?.role === 'almacen';

  const handleOpenCreateProduct = () => {
    setForm({
      codigo: '',
      nombre: '',
      generico: '',
      categoriaId: categories[0]?.id || '',
      laboratorioId: laboratories[0]?.id || '',
      concentracion: '',
      presentacion: 'Caja x 30 tabletas',
      precio: '',
      costo: '',
      stockMinimo: '10',
      requiereReceta: false,
      controlado: false
    });
    setFormError(null);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.codigo || !form.nombre || !form.categoriaId) {
      setFormError('Código de barras, nombre comercial y categoría son obligatorios.');
      return;
    }
    const precio = parseFloat(form.precio);
    const costo = parseFloat(form.costo) || 0;
    const stockMin = parseInt(form.stockMinimo, 10) || 0;
    if (!Number.isFinite(precio) || precio < 0) {
      setFormError('Precio de venta inválido.');
      return;
    }

    const result = await createProduct({
      codigo_barras: form.codigo.trim(),
      nombre: form.nombre.trim(),
      nombre_generico: form.generico.trim() || null,
      categoria_id: form.categoriaId,
      laboratorio_id: form.laboratorioId || null,
      concentracion: form.concentracion.trim() || null,
      presentacion: form.presentacion.trim() || null,
      precio_venta: precio,
      costo: costo,
      stock_minimo: stockMin,
      requiere_receta: form.requiereReceta,
      controlado: form.controlado
    });

    if (result.success) {
      setIsProductModalOpen(false);
      setFeedback('Producto registrado correctamente en el catálogo.');
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFormError(result.error || 'Error al guardar producto');
    }
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      generico: p.generico || '',
      categoriaId: p.categoriaId || categories[0]?.id || '',
      laboratorioId: p.laboratorioId || laboratories[0]?.id || '',
      concentracion: p.concentracion || '',
      presentacion: p.presentacion || '',
      precio: p.precio.toString(),
      costo: p.costo.toString(),
      stockMinimo: p.stockMinimo.toString(),
      requiereReceta: p.requiereReceta,
      controlado: p.controlado
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const precio = parseFloat(form.precio);
    const stockMin = parseInt(form.stockMinimo, 10) || 0;
    const result = await updateProduct(editingProduct.id, {
      nombre: form.nombre.trim() || editingProduct.nombre,
      nombre_generico: form.generico.trim() || null,
      categoria_id: form.categoriaId,
      laboratorio_id: form.laboratorioId || null,
      precio_venta: Number.isFinite(precio) && precio >= 0 ? precio : editingProduct.precio,
      stock_minimo: stockMin,
      requiere_receta: form.requiereReceta,
      controlado: form.controlado
    });
    if (result.success) {
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setFeedback('Producto actualizado exitosamente.');
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFormError(result.error || 'Error al actualizar producto');
    }
  };

  const handleDeleteProduct = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Desactivar producto "${nombre}"? Se conservará su historial en ventas y kárdex.`)) return;
    const result = await deleteProduct(id);
    if (result.success) {
      setFeedback('Producto desactivado.');
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback(result.error || 'Error al desactivar producto');
    }
  };

  const handleOpenCreateBatch = (productId?: string) => {
    setBatchForm({
      productId: productId || products[0]?.id || '',
      codigoLote: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaVencimiento: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().substring(0, 10),
      stockInicial: '50'
    });
    setIsBatchModalOpen(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.productId || !batchForm.codigoLote || !batchForm.fechaVencimiento) return;
    const stock = parseInt(batchForm.stockInicial, 10);
    if (!Number.isFinite(stock) || stock <= 0) {
      setFormError('El stock inicial debe ser mayor a 0');
      return;
    }
    const res = await createBatch({
      productId: batchForm.productId,
      codigoLote: batchForm.codigoLote.trim(),
      fechaVencimiento: batchForm.fechaVencimiento,
      stockInicial: stock
    });
    if (res.success) {
      setIsBatchModalOpen(false);
      setFeedback(`Lote ${batchForm.codigoLote} registrado con éxito.`);
      setTimeout(() => setFeedback(null), 3500);
      if (expandedProduct === batchForm.productId) {
        loadBatchDetail(batchForm.productId);
      }
    } else {
      setFormError(res.error || 'Error al registrar lote');
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
      setAdjustError('El motivo es obligatorio (trazabilidad y auditoría DIGEMID).');
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
      setFeedback(`Stock ajustado correctamente. Nuevo saldo en lote: ${result.stockNuevo}.`);
      setTimeout(() => setFeedback(null), 3500);
      if (expandedProduct === adjustTarget.productId) {
        loadBatchDetail(adjustTarget.productId);
      }
    } else {
      setAdjustError(result.error || 'Error al ajustar stock');
    }
  };

  const loadBatchDetail = async (productId: string) => {
    const data = await getProductStock(productId);
    setStockBatches(
      data.batches.map((b) => ({
        loteId: b.id,
        codigoLote: b.codigoLote,
        fechaVencimiento: b.fechaVencimiento,
        stock: b.stock,
        estado: b.estado
      }))
    );
    setExpandedProduct(productId);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Notificación */}
      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header y Navegación de Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Inventario, Lotes y Kárdex</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control de existencias bajo normativa FEFO, registro sanitario y trazabilidad de lotes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canWrite && (
            <>
              <button
                type="button"
                onClick={() => handleOpenCreateBatch()}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Ingresar Lote
              </button>
              <button
                type="button"
                onClick={handleOpenCreateProduct}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-navegación: Catálogo / Todos los Lotes / Kárdex */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Productos y Existencias ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'batches'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Lotes Vigentes ({batches.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('kardex')}
          className={`pb-2.5 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'kardex'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kárdex de Movimientos</span>
        </button>
      </div>

      {/* VISTA 1: PRODUCTOS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, código de barra, DCI genérico o laboratorio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                showLowStock
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Solo Stock Crítico
            </button>
          </div>

          {/* Tabla de Productos */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-8"></th>
                    <th className="py-3 px-4">Producto & DCI</th>
                    <th className="py-3 px-4">Categoría / Lab</th>
                    <th className="py-3 px-4 text-right">Precio Venta</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                    <th className="py-3 px-4 text-center">Mínimo</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {productsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                        Cargando inventario...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                        No se encontraron productos.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isExpanded = expandedProduct === p.id;
                      const isOut = p.stockTotal === 0;
                      const isLow = p.stockTotal <= p.stockMinimo;

                      return (
                        <React.Fragment key={p.id}>
                          <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedProduct(null);
                                  } else {
                                    loadBatchDetail(p.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{p.nombre}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                SKU: {p.codigo} {p.generico ? `• DCI: ${p.generico}` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-slate-700 dark:text-slate-300">{p.categoria || '—'}</div>
                              <div className="text-[10px] text-slate-400">{p.laboratorio || '—'}</div>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                              S/ {p.precio.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full font-black text-xs ${
                                  isOut
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {p.stockTotal} un.
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-slate-500">{p.stockMinimo} un.</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isOut
                                    ? 'bg-rose-100 text-rose-700'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {isOut ? 'AGOTADO' : isLow ? 'BAJO STOCK' : 'OK'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {canWrite && (
                                  <>
                                    <button
                                      onClick={() => handleOpenCreateBatch(p.id)}
                                      className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                                      title="Nuevo lote para este producto"
                                    >
                                      <Layers className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditProduct(p)}
                                      className="p-1 rounded text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Editar producto"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(p.id, p.nombre)}
                                      className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                                      title="Desactivar producto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Fila expandida: Lotes del Producto */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 dark:bg-slate-800/30">
                              <td colSpan={8} className="p-4 pl-12 border-y border-slate-200 dark:border-slate-800">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                      <Layers className="w-4 h-4 text-emerald-600" />
                                      Lotes Asignados (Orden FEFO de Vencimiento Próximo)
                                    </div>
                                    {canWrite && (
                                      <button
                                        onClick={() => handleOpenCreateBatch(p.id)}
                                        className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                      >
                                        <Plus className="w-3 h-3" /> Agregar nuevo lote
                                      </button>
                                    )}
                                  </div>

                                  {stockBatches.length === 0 ? (
                                    <div className="text-xs text-slate-400 italic py-2">
                                      Este producto no cuenta con lotes activos o registrados.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {stockBatches.map((b) => (
                                        <div
                                          key={b.loteId}
                                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between"
                                        >
                                          <div>
                                            <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                              {b.codigoLote}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                              Vence: <strong className="text-slate-700 dark:text-slate-300">{b.fechaVencimiento}</strong>
                                            </div>
                                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                              Stock: {b.stock} unidades
                                            </div>
                                          </div>

                                          {canWrite && (
                                            <button
                                              onClick={() => {
                                                setAdjustTarget({
                                                  productId: p.id,
                                                  loteId: b.loteId,
                                                  stock: b.stock
                                                });
                                                setAdjustForm({ type: 'ENTRADA', quantity: '', reason: '' });
                                                setIsAdjustModalOpen(true);
                                              }}
                                              className="px-2 py-1 text-[10px] font-bold rounded bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                            >
                                              Ajustar
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: LOTES VIGENTES */}
      {activeTab === 'batches' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código Lote</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Fecha Vencimiento</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">No hay lotes registrados</td>
                  </tr>
                ) : (
                  batches.map((b) => {
                    const prod = products.find((p) => p.id === b.productId);
                    const isVencido = new Date(b.fechaVencimiento).getTime() < Date.now();

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {b.codigoLote}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{prod?.nombre || b.productId}</div>
                          <div className="text-[10px] text-slate-400">{prod?.codigo}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className={isVencido ? 'text-rose-600 font-bold' : ''}>
                            {b.fechaVencimiento} {isVencido ? '(VENCIDO)' : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">{b.stock} un.</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.stock === 0
                                ? 'bg-slate-100 text-slate-600'
                                : isVencido
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {b.stock === 0 ? 'AGOTADO' : isVencido ? 'VENCIDO' : 'VIGENTE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canWrite && (
                            <button
                              onClick={() => {
                                setAdjustTarget({ productId: b.productId, loteId: b.id, stock: b.stock });
                                setAdjustForm({ type: 'ENTRADA', quantity: '', reason: '' });
                                setIsAdjustModalOpen(true);
                              }}
                              className="px-2 py-1 text-[10px] font-bold rounded bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            >
                              Ajustar Stock
                            </button>
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

      {/* VISTA 3: KÁRDEX DE MOVIMIENTOS */}
      {activeTab === 'kardex' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Libro de Movimientos de Almacén (Kárdex Físico)
            </h2>
            <button
              onClick={() => loadKardex()}
              className="text-xs text-emerald-600 hover:underline font-semibold"
            >
              Actualizar Kárdex
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4">Tipo Movimiento</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-center">Stock Ant.</th>
                  <th className="py-3 px-4 text-center">Stock Nvo.</th>
                  <th className="py-3 px-4">Motivo / Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {kardexLoading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">Cargando kárdex...</td>
                  </tr>
                ) : kardex.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">No hay movimientos registrados en el kárdex.</td>
                  </tr>
                ) : (
                  kardex.map((m) => {
                    const isIn = String(m.tipoMovimiento || '').includes('ENTRADA') || String(m.tipoMovimiento || '').includes('COMPRA') || String(m.tipoMovimiento || '').includes('ANULACION');
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(m.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                          {m.productoNombre}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px]">{m.codigoLote || '—'}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isIn
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {isIn ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {m.tipoMovimiento}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-black">
                          {isIn ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-500">{m.stockAnterior}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">{m.stockNuevo}</td>
                        <td className="py-2.5 px-4 text-[11px]">
                          <div>{m.motivo}</div>
                          <div className="text-[10px] text-slate-400">Por: {m.usuarioNombre}</div>
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

      {/* Modal: Crear Producto (Fix C9: dropdowns de categoría y laboratorio) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" /> Nuevo Producto Farmacéutico
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Código de barras / SKU:</label>
                  <input
                    type="text"
                    required
                    placeholder="775123400001"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nombre comercial:</label>
                  <input
                    type="text"
                    required
                    placeholder="Amoxicilina 500mg"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nombre genérico (DCI / Principio Activo):</label>
                <input
                  type="text"
                  placeholder="Amoxicilina Trihidrato"
                  value={form.generico}
                  onChange={(e) => setForm({ ...form, generico: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Categoría (Fisiológica):</label>
                  <select
                    value={form.categoriaId}
                    onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Laboratorio Fabricante:</label>
                  <select
                    value={form.laboratorioId}
                    onChange={(e) => setForm({ ...form, laboratorioId: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Sin laboratorio asignado</option>
                    {laboratories.map((l) => (
                      <option key={l.id} value={l.id}>{l.nombre} ({l.pais || 'Perú'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Precio venta (S/):</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Costo compra (S/):</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={form.costo}
                    onChange={(e) => setForm({ ...form, costo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Stock mínimo:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiereReceta}
                    onChange={(e) => setForm({ ...form, requiereReceta: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Requiere receta (Rx)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.controlado}
                    onChange={(e) => setForm({ ...form, controlado: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Medicamento Controlado</span>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Producto */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Editar {editingProduct.nombre}</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {formError && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}
            <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nombre comercial:</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Genérico (DCI):</label>
                <input
                  type="text"
                  value={form.generico}
                  onChange={(e) => setForm({ ...form, generico: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Precio venta (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Stock mínimo:</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ingresar Lote */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" /> Registrar Lote de Medicamento
              </h3>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Producto:</label>
                <select
                  value={batchForm.productId}
                  onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Código de Lote:</label>
                  <input
                    type="text"
                    required
                    value={batchForm.codigoLote}
                    onChange={(e) => setBatchForm({ ...batchForm, codigoLote: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Vencimiento:</label>
                  <input
                    type="date"
                    required
                    value={batchForm.fechaVencimiento}
                    onChange={(e) => setBatchForm({ ...batchForm, fechaVencimiento: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Stock Inicial (unidades):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={batchForm.stockInicial}
                  onChange={(e) => setBatchForm({ ...batchForm, stockInicial: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Ingresar Lote
                </button>
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
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Ajuste de Stock
              </h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
              <div>Lote: <strong className="font-mono">{adjustTarget.loteId || '—'}</strong></div>
              <div>Stock actual en lote: <strong>{adjustTarget.stock} unidades</strong></div>
            </div>
            {adjustError && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {adjustError}
              </div>
            )}
            <form onSubmit={handleAdjust} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tipo:</label>
                  <select
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as 'ENTRADA' | 'SALIDA' | 'AJUSTE' })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="ENTRADA">Entrada (Devolución/Hallazgo)</option>
                    <option value="SALIDA">Salida (Merma/Deterioro)</option>
                    <option value="AJUSTE">Ajuste Directo de Conteo</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Motivo (Trazabilidad DIGEMID):</label>
                <input
                  type="text"
                  placeholder="Ej. Rotura de ampolla en transporte, conteo físico..."
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Registrar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
