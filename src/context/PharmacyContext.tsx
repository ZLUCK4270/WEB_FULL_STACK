import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode
} from 'react';
import {
  AuthUser,
  UserRole,
  Product,
  Batch,
  Sale,
  Customer,
  SystemAlert,
  DashboardStats,
  ReceiptType,
  PaymentMethod,
  Category,
  Laboratory,
  Supplier,
  CashShift,
  CashMovement,
  PurchaseOrder,
  KardexMovement,
  ReplenishmentSuggestion,
  AuditLog
} from '../types/pharmacy';
import {
  authApi,
  salesApi,
  inventoryApi,
  catalogApi,
  cashApi,
  purchasesApi,
  auditApi,
  alertsApi,
  customersApi,
  dashboardApi,
  healthApi
} from '../services/pharmacyApi';
import { extractError, setUnauthorizedHandler } from '../services/api';

interface PharmacyContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiError: string | null;
  apiOk: boolean | null;

  login: (dni: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => void;

  products: Product[];
  productsLoading: boolean;
  loadProducts: (q?: string, lowStockOnly?: boolean) => Promise<void>;
  createProduct: (data: any) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (id: string, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  adjustStock: (data: {
    productId: string; loteId: string; type: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    quantity: number; reason: string;
  }) => Promise<{ success: boolean; error?: string; stockNuevo?: number }>;
  getProductStock: (productId: string) => Promise<{ totalStock: number; batches: Batch[] }>;

  batches: Batch[];
  loadBatches: () => Promise<void>;
  createBatch: (data: { productId: string; codigoLote: string; fechaVencimiento: string; stockInicial: number }) => Promise<{ success: boolean; error?: string }>;

  kardex: KardexMovement[];
  kardexLoading: boolean;
  loadKardex: (productId?: string) => Promise<void>;
  getSubstitutes: (productId: string) => Promise<Product[]>;

  categories: Category[];
  laboratories: Laboratory[];
  suppliers: Supplier[];
  loadCatalog: () => Promise<void>;

  sales: Sale[];
  salesLoading: boolean;
  loadSales: (params?: any) => Promise<any>;
  createSale: (params: {
    items: { productId: string; quantity: number }[];
    paymentMethod: PaymentMethod;
    amountPaid?: number;
    customerId?: string;
    receiptType: ReceiptType;
  }) => Promise<{ success: boolean; sale?: Sale; error?: string }>;
  getSale: (id: string) => Promise<Sale | null>;
  voidSale: (id: string, motivo: string) => Promise<{ success: boolean; error?: string }>;

  customers: Customer[];
  loadCustomers: () => Promise<void>;
  createCustomer: (data: any) => Promise<{ success: boolean; error?: string; customerId?: string }>;

  currentShift: CashShift | null;
  shiftLoading: boolean;
  loadCurrentShift: () => Promise<void>;
  openCashRegister: (montoInicial: number, notas?: string) => Promise<{ success: boolean; error?: string; shift?: CashShift }>;
  createCashMovement: (tipo: 'INGRESO' | 'EGRESO', monto: number, motivo: string) => Promise<{ success: boolean; error?: string }>;
  closeCashRegister: (montoRealEfectivo: number, notasCierre?: string) => Promise<{ success: boolean; error?: string; summary?: any }>;
  shiftHistory: CashShift[];
  loadShiftHistory: () => Promise<void>;

  purchases: PurchaseOrder[];
  purchasesLoading: boolean;
  loadPurchases: () => Promise<void>;
  createPurchase: (data: any) => Promise<{ success: boolean; error?: string; purchaseId?: string }>;
  receivePurchase: (id: string, receivedItems?: any[]) => Promise<{ success: boolean; error?: string }>;
  replenishmentSuggestions: ReplenishmentSuggestion[];
  loadReplenishmentSuggestions: () => Promise<void>;
  generatePurchaseOrders: (supplierId: string, items: any[]) => Promise<{ success: boolean; error?: string; purchaseId?: string }>;

  auditLogs: AuditLog[];
  auditLoading: boolean;
  loadAuditLogs: (params?: any) => Promise<void>;

  alerts: SystemAlert[];
  pendingAlerts: number;
  loadAlerts: () => Promise<void>;
  generateAlerts: () => Promise<{ success: boolean; error?: string; pendingCount?: number }>;
  resolveAlert: (id: string) => Promise<{ success: boolean; error?: string }>;

  stats: DashboardStats | null;
  loadStats: () => Promise<void>;

  refreshAll: () => Promise<void>;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  // Recursos de Inventario & Ventas
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState<number>(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Catálogos
  const [categories, setCategories] = useState<Category[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Kárdex
  const [kardex, setKardex] = useState<KardexMovement[]>([]);
  const [kardexLoading, setKardexLoading] = useState<boolean>(false);

  // Caja Registradora
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [shiftLoading, setShiftLoading] = useState<boolean>(false);
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>([]);

  // Compras & Reposición
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState<boolean>(false);
  const [replenishmentSuggestions, setReplenishmentSuggestions] = useState<ReplenishmentSuggestion[]>([]);

  // Auditoría
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  const mapRole = (role: string): UserRole => {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return 'admin';
    if (r.includes('almac')) return 'almacen';
    return 'vendedor';
  };

  // -------- Auth --------
  const login = useCallback(async (dni: string, password: string) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await authApi.login(dni, password);
      if (response.success && response.user && response.token) {
        const u: AuthUser = {
          id: response.user.id,
          dni: response.user.dni,
          name: `${response.user.nombre} ${response.user.apellido}`.trim(),
          role: mapRole(response.user.rol),
          roleTitle: response.user.rol || 'Vendedor',
          isRootAdmin: response.user.is_root_admin || response.user.rol?.toLowerCase() === 'admin',
          mustChangePassword: !!response.user.must_change_password
        };
        setUser(u);
        return { success: true, user: u };
      }
      return { success: false, error: response.error || 'Credenciales inválidas' };
    } catch (err: any) {
      const msg = extractError(err, 'No fue posible conectar con el servidor.');
      setApiError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    setUser(null);
    setProducts([]);
    setBatches([]);
    setSales([]);
    setCustomers([]);
    setAlerts([]);
    setStats(null);
    setCurrentShift(null);
    setPurchases([]);
    setKardex([]);
    setAuditLogs([]);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  // Chequeo de sesión al montar
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const health = await healthApi.check().catch(() => null);
        setApiOk(health?.status === 'ok');

        const savedUserStr = localStorage.getItem('nova_user');
        const token = localStorage.getItem('nova_token');

        if (token && savedUserStr) {
          try {
            const meRes = await authApi.me();
            if (meRes.user) {
              const u: AuthUser = {
                id: meRes.user.id,
                dni: meRes.user.dni,
                name: `${meRes.user.nombre} ${meRes.user.apellido}`.trim(),
                role: mapRole(meRes.user.rol),
                roleTitle: meRes.user.rol,
                isRootAdmin: meRes.user.is_root_admin || meRes.user.rol?.toLowerCase() === 'admin',
                mustChangePassword: !!meRes.user.must_change_password
              };
              setUser(u);
            } else {
              logout();
            }
          } catch {
            logout();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, [logout]);

  // -------- Catalog --------
  const loadCatalog = useCallback(async () => {
    try {
      const [catsRes, labsRes, supsRes] = await Promise.all([
        catalogApi.getCategories().catch(() => ({ categories: [] })),
        catalogApi.getLaboratories().catch(() => ({ laboratories: [] })),
        catalogApi.getSuppliers().catch(() => ({ suppliers: [] }))
      ]);
      setCategories(catsRes.categories || []);
      setLaboratories(labsRes.laboratories || []);
      setSuppliers(supsRes.suppliers || []);
    } catch (err: any) {
      console.warn('Error loading catalog:', err);
    }
  }, []);

  // -------- Products --------
  const loadProducts = useCallback(async (q?: string, lowStockOnly?: boolean) => {
    setProductsLoading(true);
    try {
      const response = await inventoryApi.listProducts({
        q: q || undefined,
        lowStockOnly: lowStockOnly ? 'true' : undefined
      });
      const mapped: Product[] = (response.products || []).map((p: any) => ({
        id: p.id,
        codigo: p.codigo_barras || '',
        nombre: p.nombre,
        generico: p.nombre_generico,
        categoria: p.categoria,
        categoriaId: p.categoria_id,
        concentracion: p.concentracion,
        presentacion: p.presentacion,
        laboratorio: p.laboratorio,
        laboratorioId: p.laboratorio_id,
        precio: parseFloat(p.precio_venta) || 0,
        costo: parseFloat(p.precio_costo) || 0,
        stockMinimo: parseInt(p.stock_minimo, 10) || 0,
        stockTotal: parseInt(p.stock_total, 10) || 0,
        stockVigente: parseInt(p.stock_vigente, 10) || 0,
        lowStock: !!p.bajo_stock,
        requiereReceta: Boolean(p.requiere_receta),
        controlado: Boolean(p.controlado),
        estaActivo: Boolean(p.esta_activo),
        fechaActualizacion: p.fecha_actualizacion
      }));
      setProducts(mapped);
    } catch (err: any) {
      setApiError(extractError(err, 'Error al cargar productos'));
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (data: any) => {
    try {
      await inventoryApi.createProduct(data);
      await loadProducts();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al crear producto') };
    }
  }, [loadProducts]);

  const updateProduct = useCallback(async (id: string, data: any) => {
    try {
      await inventoryApi.updateProduct(id, data);
      await loadProducts();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al actualizar producto') };
    }
  }, [loadProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await inventoryApi.deleteProduct(id);
      await loadProducts();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al eliminar producto') };
    }
  }, [loadProducts]);

  const adjustStock = useCallback(async (data: {
    productId: string; loteId: string; type: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    quantity: number; reason: string;
  }) => {
    try {
      const response = await inventoryApi.adjustStock(data);
      await Promise.all([loadProducts(), loadBatches()]);
      return { success: true, stockNuevo: response.stockNuevo };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al ajustar stock') };
    }
  }, [loadProducts]);

  const getProductStock = useCallback(async (productId: string) => {
    try {
      const response = await inventoryApi.getProductStock(productId);
      return {
        totalStock: response.totalStock || 0,
        batches: (response.batches || []).map((b: any) => ({
          id: b.id,
          productId: b.producto_id,
          codigoLote: b.codigo_lote,
          fechaVencimiento: b.fecha_vencimiento,
          stock: b.stock_actual,
          estado: b.estado
        }))
      };
    } catch {
      return { totalStock: 0, batches: [] };
    }
  }, []);

  // -------- Batches --------
  const loadBatches = useCallback(async () => {
    try {
      const response = await inventoryApi.listBatches();
      const mapped: Batch[] = (response.batches || []).map((b: any) => ({
        id: b.id,
        productId: b.producto_id,
        codigoLote: b.codigo_lote,
        fechaVencimiento: b.fecha_vencimiento ? b.fecha_vencimiento.substring(0, 10) : '',
        stock: parseInt(b.stock_actual, 10) || 0,
        estado: b.estado
      }));
      setBatches(mapped);
    } catch (err: any) {
      setApiError(extractError(err, 'Error al cargar lotes'));
    }
  }, []);

  const createBatch = useCallback(async (data: { productId: string; codigoLote: string; fechaVencimiento: string; stockInicial: number }) => {
    try {
      await inventoryApi.createBatch(data);
      await Promise.all([loadBatches(), loadProducts()]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al registrar lote') };
    }
  }, [loadBatches, loadProducts]);

  // -------- Kárdex & Substitutes --------
  const loadKardex = useCallback(async (productId?: string) => {
    setKardexLoading(true);
    try {
      const response = await inventoryApi.getKardex(productId);
      setKardex((response.movements || []).map((m: any) => ({
        id: m.id,
        productoId: m.producto_id,
        productoNombre: m.producto_nombre,
        codigoBarras: m.codigo_barras,
        loteId: m.lote_id,
        codigoLote: m.codigo_lote,
        tipoMovimiento: m.tipo_movimiento,
        cantidad: m.cantidad,
        stockAnterior: m.stock_anterior,
        stockNuevo: m.stock_nuevo,
        motivo: m.motivo,
        usuarioNombre: m.usuario_nombre,
        fecha: m.fecha_creacion,
        referenciaId: m.referencia_id
      })));
    } catch (err: any) {
      console.warn('Error loading kardex:', err);
    } finally {
      setKardexLoading(false);
    }
  }, []);

  const getSubstitutes = useCallback(async (productId: string): Promise<Product[]> => {
    try {
      const response = await inventoryApi.getSubstitutes(productId);
      return (response.substitutes || []).map((p: any) => ({
        id: p.id,
        codigo: p.codigo_barras || '',
        nombre: p.nombre,
        generico: p.nombre_generico,
        categoria: p.categoria,
        concentracion: p.concentracion,
        presentacion: p.presentacion,
        laboratorio: p.laboratorio,
        precio: parseFloat(p.precio_venta) || 0,
        costo: parseFloat(p.precio_costo) || 0,
        stockMinimo: parseInt(p.stock_minimo, 10) || 0,
        stockTotal: parseInt(p.stock_total, 10) || 0,
        stockVigente: parseInt(p.stock_vigente, 10) || 0,
        lowStock: !!p.bajo_stock,
        requiereReceta: Boolean(p.requiere_receta),
        controlado: Boolean(p.controlado),
        estaActivo: Boolean(p.esta_activo)
      }));
    } catch {
      return [];
    }
  }, []);

  // -------- Dashboard Stats --------
  const loadStats = useCallback(async () => {
    try {
      const response = await dashboardApi.getStats();
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (err: any) {
      console.warn('Error loading stats:', err);
    }
  }, []);

  // -------- Alerts --------
  const loadAlerts = useCallback(async () => {
    try {
      const [alertsRes, countRes] = await Promise.all([
        alertsApi.listAlerts({ estado: 'PENDIENTE' }),
        alertsApi.countAlerts()
      ]);
      const mapped: SystemAlert[] = (alertsRes.alerts || []).map((a: any) => ({
        id: a.id,
        tipo: a.tipo_alerta,
        estado: a.estado,
        mensaje: a.mensaje,
        productoId: a.producto_id,
        producto: a.producto_nombre,
        codigoBarras: a.codigo_barras,
        loteId: a.lote_id,
        codigoLote: a.codigo_lote,
        fechaVencimiento: a.fecha_vencimiento,
        fechaCreacion: a.fecha_creacion,
        resueltoPor: a.resuelto_por_nombre
      }));
      setAlerts(mapped);
      setPendingAlerts(countRes.pendingAlerts || mapped.length);
    } catch (err: any) {
      setApiError(extractError(err, 'Error al cargar alertas'));
    }
  }, []);

  // -------- Sales --------
  const loadSales = useCallback(async (params: any = {}) => {
    setSalesLoading(true);
    try {
      const response = await salesApi.listSales(params);
      const mapped: Sale[] = (response.sales || []).map((s: any) => mapSale(s));
      setSales(mapped);
      return mapped;
    } catch (err: any) {
      setApiError(extractError(err, 'Error al cargar historial de ventas'));
      return [];
    } finally {
      setSalesLoading(false);
    }
  }, []);

  const createSale = useCallback(async (params: {
    items: { productId: string; quantity: number }[];
    paymentMethod: PaymentMethod;
    amountPaid?: number;
    customerId?: string;
    receiptType: ReceiptType;
  }) => {
    try {
      const response = await salesApi.createSale({
        items: params.items,
        paymentMethod: params.paymentMethod,
        amountPaid: params.amountPaid,
        customerId: params.customerId,
        receiptType: params.receiptType
      });

      if (response.sale) {
        await Promise.all([
          loadProducts(),
          loadBatches(),
          loadSales(),
          loadAlerts(),
          loadStats()
        ]);
        return {
          success: true,
          sale: {
            id: response.sale.id || response.saleId,
            codigoVenta: response.sale.codigoVenta || response.sale.codigo_venta || response.saleCode,
            fecha: response.sale.fecha || response.sale.fecha_creacion || new Date().toISOString(),
            cliente: response.sale.cliente,
            clienteDoc: response.sale.clienteDoc,
            cajero: response.sale.cajero,
            cajeroId: response.sale.cajeroId,
            metodoPago: response.sale.metodoPago || params.paymentMethod,
            subtotal: response.sale.subtotal || 0,
            igv: response.sale.igv || 0,
            total: response.sale.total || response.totalAmount || 0,
            estado: 'COMPLETADA' as const,
            items: response.sale.items || []
          }
        };
      }
      return { success: false, error: response.error || 'Error al procesar la venta' };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al registrar venta') };
    }
  }, [loadProducts, loadBatches, loadSales, loadAlerts, loadStats]);

  const voidSale = useCallback(async (id: string, motivo: string) => {
    try {
      await salesApi.voidSale(id, motivo);
      await Promise.all([
        loadSales(),
        loadProducts(),
        loadBatches(),
        loadAlerts(),
        loadStats()
      ]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al anular venta') };
    }
  }, [loadSales, loadProducts, loadBatches, loadAlerts, loadStats]);

  const getSale = useCallback(async (id: string): Promise<Sale | null> => {
    try {
      const response = await salesApi.getSale(id);
      if (response.sale) {
        return mapSale(response.sale);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const mapSale = (s: any): Sale => ({
    id: s.id,
    codigoVenta: s.codigo_venta || s.codigoVenta,
    fecha: s.fecha_creacion || s.fecha,
    cliente: s.cliente || null,
    clienteDoc: s.cliente_doc || s.clienteDoc || null,
    clienteId: s.cliente_id || s.clienteId || undefined,
    cajero: s.cajero,
    cajeroId: s.cajero_id || s.cajeroId,
    metodoPago: s.metodo_pago || s.metodoPago,
    subtotal: parseFloat(s.subtotal) || 0,
    igv: parseFloat(s.igv !== undefined ? s.igv : s.monto_igv) || 0,
    total: parseFloat(s.total !== undefined ? s.total : s.monto_total) || 0,
    estado: (s.estado === 'ANULADA' ? 'ANULADA' : 'COMPLETADA') as 'COMPLETADA' | 'ANULADA',
    motivoAnulacion: s.motivo_anulacion,
    fechaAnulacion: s.fecha_anulacion,
    anuladoPor: s.anulado_por,
    items: (s.items || []).map((it: any) => ({
      id: it.id,
      productId: it.productId || it.producto_id,
      productName: it.productName || it.producto,
      codigo: it.codigo || it.codigo_barras,
      unitPrice: parseFloat(it.unitPrice || it.precio_unitario) || 0,
      quantity: parseInt(it.quantity || it.cantidad, 10) || 0,
      subtotal: parseFloat(it.subtotal) || 0,
      batches: (it.batches || []).map((b: any) => ({
        loteId: b.lote_id,
        codigoLote: b.codigoLote || b.codigo_lote,
        fechaVencimiento: b.fechaVencimiento || b.fecha_vencimiento,
        cantidad: parseInt(b.cantidad, 10) || 0
      }))
    }))
  });

  // -------- Customers --------
  const loadCustomers = useCallback(async () => {
    try {
      const response = await customersApi.listCustomers();
      setCustomers((response.customers || []).map((c: any) => ({
        id: c.id,
        tipoDocumento: c.tipo_documento,
        numeroDocumento: c.numero_documento,
        nombreCompleto: c.nombre_completo,
        telefono: c.telefono,
        correo: c.correo,
        direccion: c.direccion
      })));
    } catch (err: any) {
      setApiError(extractError(err, 'Error al cargar clientes'));
    }
  }, []);

  const createCustomer = useCallback(async (data: any) => {
    try {
      const response = await customersApi.createCustomer({
        docType: data.tipoDocumento || 'DNI',
        docNumber: data.numeroDocumento,
        fullName: data.nombreCompleto,
        phone: data.telefono,
        email: data.correo,
        address: data.direccion
      });
      await loadCustomers();
      return { success: true, customerId: response.customerId };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al crear cliente') };
    }
  }, [loadCustomers]);

  // -------- Cash Register --------
  const loadCurrentShift = useCallback(async () => {
    setShiftLoading(true);
    try {
      const response = await cashApi.getCurrentShift();
      if (response.shift) {
        setCurrentShift({
          id: response.shift.id,
          cajeroId: response.shift.cajero_id,
          cajeroNombre: response.shift.cajero_nombre,
          fechaApertura: response.shift.fecha_apertura,
          fechaCierre: response.shift.fecha_cierre,
          fondoInicial: parseFloat(response.shift.monto_apertura) || 0,
          efectivoEsperado: parseFloat(response.shift.monto_cierre_esperado || response.shift.monto_apertura) || 0,
          efectivoContado: response.shift.monto_cierre_real ? parseFloat(response.shift.monto_cierre_real) : null,
          diferencia: response.shift.diferencia ? parseFloat(response.shift.diferencia) : null,
          totalVentasEfectivo: parseFloat(response.shift.total_ventas_efectivo) || 0,
          totalIngresosExtra: parseFloat(response.shift.total_ingresos_extra) || 0,
          totalEgresosExtra: parseFloat(response.shift.total_egresos_extra) || 0,
          estado: response.shift.estado,
          observaciones: response.shift.observaciones
        });
      } else {
        setCurrentShift(null);
      }
    } catch {
      setCurrentShift(null);
    } finally {
      setShiftLoading(false);
    }
  }, []);

  const openCashRegister = useCallback(async (montoInicial: number, notas?: string) => {
    try {
      const response = await cashApi.openShift({ montoInicial, notas });
      await loadCurrentShift();
      return { success: true, shift: response.shift };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al abrir caja') };
    }
  }, [loadCurrentShift]);

  const createCashMovement = useCallback(async (tipo: 'INGRESO' | 'EGRESO', monto: number, motivo: string) => {
    try {
      await cashApi.createMovement({ tipo, monto, motivo });
      await loadCurrentShift();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al registrar movimiento') };
    }
  }, [loadCurrentShift]);

  const closeCashRegister = useCallback(async (montoRealEfectivo: number, notasCierre?: string) => {
    try {
      const response = await cashApi.closeShift({ montoRealEfectivo, notasCierre });
      await loadCurrentShift();
      return { success: true, summary: response.summary };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al cerrar caja') };
    }
  }, [loadCurrentShift]);

  const loadShiftHistory = useCallback(async () => {
    try {
      const response = await cashApi.getShiftHistory();
      setShiftHistory((response.shifts || []).map((s: any) => ({
        id: s.id,
        cajeroId: s.cajero_id,
        cajeroNombre: s.cajero_nombre,
        fechaApertura: s.fecha_apertura,
        fechaCierre: s.fecha_cierre,
        fondoInicial: parseFloat(s.monto_apertura) || 0,
        efectivoEsperado: parseFloat(s.monto_cierre_esperado) || 0,
        efectivoContado: s.monto_cierre_real ? parseFloat(s.monto_cierre_real) : null,
        diferencia: s.diferencia !== undefined ? parseFloat(s.diferencia) : null,
        totalVentasEfectivo: parseFloat(s.total_ventas_efectivo) || 0,
        totalIngresosExtra: parseFloat(s.total_ingresos_extra) || 0,
        totalEgresosExtra: parseFloat(s.total_egresos_extra) || 0,
        estado: s.estado,
        observaciones: s.observaciones
      })));
    } catch (err: any) {
      console.warn('Error loading shift history:', err);
    }
  }, []);

  // -------- Purchases & Replenishment --------
  const loadPurchases = useCallback(async () => {
    setPurchasesLoading(true);
    try {
      const response = await purchasesApi.listPurchases();
      setPurchases((response.purchases || []).map((p: any) => ({
        id: p.id,
        codigoCompra: p.codigo_compra,
        proveedorId: p.proveedor_id,
        proveedorNombre: p.proveedor || 'Proveedor General',
        compradorNombre: p.comprador,
        montoTotal: parseFloat(p.monto_total) || 0,
        numeroFactura: p.numero_factura,
        fechaFactura: p.fecha_factura,
        fechaCreacion: p.fecha_creacion,
        estado: p.estado,
        items: []
      })));
    } catch (err: any) {
      console.warn('Error loading purchases:', err);
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  const createPurchase = useCallback(async (data: any) => {
    try {
      const response = await purchasesApi.createPurchase(data);
      await loadPurchases();
      return { success: true, purchaseId: response.purchaseId };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al crear orden de compra') };
    }
  }, [loadPurchases]);

  const receivePurchase = useCallback(async (id: string, receivedItems?: any[]) => {
    try {
      await purchasesApi.receivePurchase(id, receivedItems);
      await Promise.all([
        loadPurchases(),
        loadProducts(),
        loadBatches(),
        loadAlerts(),
        loadStats()
      ]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al recepcionar compra') };
    }
  }, [loadPurchases, loadProducts, loadBatches, loadAlerts, loadStats]);

  const loadReplenishmentSuggestions = useCallback(async () => {
    try {
      const response = await purchasesApi.getReplenishmentSuggestions();
      setReplenishmentSuggestions((response.suggestions || []).map((s: any) => ({
        productoId: s.producto_id,
        nombre: s.nombre,
        codigoBarras: s.codigo_barras,
        categoria: s.categoria,
        stockActual: s.stock_actual,
        stockMinimo: s.stock_minimo,
        stockMaximo: s.stock_maximo,
        cantidadSugerida: s.cantidad_sugerida,
        proveedorId: s.proveedor_id,
        proveedorNombre: s.proveedor_nombre,
        proveedorRuc: s.proveedor_ruc
      })));
    } catch (err: any) {
      console.warn('Error loading replenishment suggestions:', err);
    }
  }, []);

  const generatePurchaseOrders = useCallback(async (supplierId: string, items: any[]) => {
    try {
      const response = await purchasesApi.generatePurchaseOrders(supplierId, items);
      await Promise.all([loadPurchases(), loadReplenishmentSuggestions()]);
      return { success: true, purchaseId: response.purchaseId };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al generar orden de compra') };
    }
  }, [loadPurchases, loadReplenishmentSuggestions]);

  // -------- Audit --------
  const loadAuditLogs = useCallback(async (params: any = {}) => {
    setAuditLoading(true);
    try {
      const response = await auditApi.listLogs(params);
      setAuditLogs((response.logs || []).map((l: any) => ({
        id: l.id,
        usuario: l.usuario || 'Sistema',
        accion: l.accion,
        modulo: l.modulo,
        tablaAfectada: l.tabla_afectada,
        registroId: l.registro_id,
        datosNuevos: l.datos_nuevos,
        fecha: l.fecha_creacion
      })));
    } catch (err: any) {
      console.warn('Error loading audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // -------- Alerts Actions --------
  const generateAlerts = useCallback(async () => {
    try {
      const response = await alertsApi.generateAlerts();
      await loadAlerts();
      return { success: true, pendingCount: response.pendingCount };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al generar alertas') };
    }
  }, [loadAlerts]);

  const resolveAlert = useCallback(async (id: string) => {
    try {
      await alertsApi.resolveAlert(id);
      await loadAlerts();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al resolver alerta') };
    }
  }, [loadAlerts]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadCatalog(),
      loadProducts(),
      loadBatches(),
      loadSales(),
      loadCustomers(),
      loadAlerts(),
      loadStats(),
      loadCurrentShift(),
      loadPurchases()
    ]);
  }, [loadCatalog, loadProducts, loadBatches, loadSales, loadCustomers, loadAlerts, loadStats, loadCurrentShift, loadPurchases]);

  useEffect(() => {
    if (user) {
      refreshAll();
      const timer = setInterval(() => {
        loadAlerts().catch(() => {});
        loadStats().catch(() => {});
      }, 120000);
      return () => clearInterval(timer);
    }
  }, [user, refreshAll, loadAlerts, loadStats]);

  const isAuthenticated = !!user;

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    apiError,
    apiOk,
    login,
    logout,
    products,
    productsLoading,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getProductStock,
    batches,
    loadBatches,
    createBatch,
    kardex,
    kardexLoading,
    loadKardex,
    getSubstitutes,
    categories,
    laboratories,
    suppliers,
    loadCatalog,
    sales,
    salesLoading,
    loadSales,
    createSale,
    getSale,
    voidSale,
    customers,
    loadCustomers,
    createCustomer,
    currentShift,
    shiftLoading,
    loadCurrentShift,
    openCashRegister,
    createCashMovement,
    closeCashRegister,
    shiftHistory,
    loadShiftHistory,
    purchases,
    purchasesLoading,
    loadPurchases,
    createPurchase,
    receivePurchase,
    replenishmentSuggestions,
    loadReplenishmentSuggestions,
    generatePurchaseOrders,
    auditLogs,
    auditLoading,
    loadAuditLogs,
    alerts,
    pendingAlerts,
    loadAlerts,
    generateAlerts,
    resolveAlert,
    stats,
    loadStats,
    refreshAll
  }), [
    user, isLoading, apiError, apiOk,
    login, logout,
    products, productsLoading, loadProducts, createProduct, updateProduct, deleteProduct, adjustStock, getProductStock,
    batches, loadBatches, createBatch,
    kardex, kardexLoading, loadKardex, getSubstitutes,
    categories, laboratories, suppliers, loadCatalog,
    sales, salesLoading, loadSales, createSale, getSale, voidSale,
    customers, loadCustomers, createCustomer,
    currentShift, shiftLoading, loadCurrentShift, openCashRegister, createCashMovement, closeCashRegister, shiftHistory, loadShiftHistory,
    purchases, purchasesLoading, loadPurchases, createPurchase, receivePurchase, replenishmentSuggestions, loadReplenishmentSuggestions, generatePurchaseOrders,
    auditLogs, auditLoading, loadAuditLogs,
    alerts, pendingAlerts, loadAlerts, generateAlerts, resolveAlert,
    stats, loadStats, refreshAll
  ]);

  return (
    <PharmacyContext.Provider value={contextValue}>
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy debe usarse dentro de PharmacyProvider');
  }
  return context;
};
