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
  CartItem,
  Customer,
  SystemAlert,
  DashboardStats,
  ReceiptType,
  PaymentMethod
} from '../types/pharmacy';
import {
  authApi,
  salesApi,
  inventoryApi,
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
  apiOk: boolean;

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

  sales: Sale[];
  salesLoading: boolean;
  loadSales: (params?: any) => Promise<void>;
  createSale: (params: {
    items: { productId: string; quantity: number }[];
    paymentMethod: PaymentMethod;
    amountPaid?: number;
    customerId?: string;
    receiptType: ReceiptType;
  }) => Promise<{ success: boolean; sale?: Sale; error?: string }>;
  getSale: (id: string) => Promise<Sale | null>;

  customers: Customer[];
  loadCustomers: () => Promise<void>;
  createCustomer: (data: any) => Promise<{ success: boolean; error?: string }>;

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

  // Recursos
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState<number>(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);

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
          name: response.user.name,
          role: mapRole(response.user.role),
          roleTitle: response.user.roleTitle,
          isRootAdmin: response.user.isRootAdmin,
          mustChangePassword: response.user.mustChangePassword
        };
        setUser(u);
        setIsLoading(false);
        return { success: true, user: u };
      }
      return { success: false, error: response.error || 'Credenciales inválidas' };
    } catch (err: any) {
      const msg = extractError(err, 'Error al iniciar sesión');
      setApiError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setProducts([]);
    setBatches([]);
    setSales([]);
    setCustomers([]);
    setAlerts([]);
    setPendingAlerts(0);
    setStats(null);
    setIsLoading(false);
  }, []);

  // Restaurar sesión al montar si hay token y verificar salud del backend
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });

    healthApi.check()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));

    const restoreSession = async () => {
      try {
        const token = localStorage.getItem('nova_token');
        if (!token) {
          setIsLoading(false);
          return;
        }
        const response = await authApi.me();
        if (response.user) {
          setUser({
            id: response.user.id,
            dni: response.user.dni,
            name: response.user.name,
            role: mapRole(response.user.role),
            roleTitle: response.user.roleTitle,
            isRootAdmin: response.user.isRootAdmin,
            mustChangePassword: response.user.mustChangePassword
          });
        }
      } catch {
        localStorage.removeItem('nova_token');
        localStorage.removeItem('nova_user');
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // -------- Products --------
  const loadProducts = useCallback(async (q?: string, lowStockOnly = false) => {
    setProductsLoading(true);
    try {
      const response = await inventoryApi.listProducts({ q, solo_bajo_stock: lowStockOnly ? '1' : undefined });
      const data = (response.products || []).map((p: any) => ({
        id: p.id,
        codigo: p.codigo_barras,
        nombre: p.nombre,
        generico: p.nombre_generico,
        categoria: p.categoria,
        concentracion: p.concentracion,
        presentacion: p.presentacion,
        laboratorio: p.laboratorio,
        precio: parseFloat(p.precio_venta) || 0,
        costo: parseFloat(p.costo) || 0,
        stockMinimo: parseInt(p.stock_minimo, 10) || 0,
        stockTotal: parseInt(p.total_stock, 10) || 0,
        stockVigente: parseInt(p.total_stock, 10) || 0,
        lowStock: p.low_stock,
        requiereReceta: p.requiere_receta === 1,
        controlado: p.es_controlado === 1,
        estaActivo: p.esta_activo === 1,
        fechaActualizacion: p.fecha_actualizacion
      }));
      setProducts(data);
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
      await loadProducts();
      await loadAlerts();
      return { success: true, stockNuevo: response.stockNuevo };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al ajustar stock') };
    }
  }, [loadProducts, loadAlerts]);

  const getProductStock = useCallback(async (productId: string) => {
    const response = await inventoryApi.getProductStock(productId);
    return {
      totalStock: response.totalStock,
      batches: (response.batches || []).map((b: any) => ({
        id: b.id,
        productId: b.producto_id,
        codigoLote: b.codigo_lote,
        fechaVencimiento: b.fecha_vencimiento,
        stock: parseInt(b.stock_actual, 10) || 0,
        estado: b.estado
      }))
    };
  }, []);

  // -------- Batches --------
  const loadBatches = useCallback(async () => {
    try {
      const response = await inventoryApi.listBatches();
      setBatches((response.batches || []).map((b: any) => ({
        id: b.id,
        productId: b.producto_id,
        codigoLote: b.codigo_lote,
        fechaVencimiento: b.fecha_vencimiento,
        stock: parseInt(b.stock_actual, 10) || 0,
        estado: b.estado
      })));
    } catch (err: any) {
      setApiError(extractError(err, 'Error al cargar lotes'));
    }
  }, []);

  // -------- Sales --------
  const loadSales = useCallback(async (params?: any) => {
    setSalesLoading(true);
    try {
      const response = await salesApi.listSales(params);
      const data = (response.sales || []).map((s: any) => ({
        id: s.id,
        codigoVenta: s.codigo_venta,
        fecha: s.fecha_creacion,
        cliente: s.cliente || null,
        clienteDoc: s.cliente_doc || null,
        cajero: s.cajero,
        cajeroId: s.cajero_id || user?.id,
        metodoPago: s.metodo_pago,
        subtotal: parseFloat(s.subtotal) || 0,
        igv: parseFloat(s.monto_igv) || 0,
        total: parseFloat(s.monto_total) || 0,
        items: []
      }));
      setSales(data);
      return { page: response.page, limit: response.limit, total: response.total };
    } catch (err: any) {
      setApiError(extractError(err, 'Error al cargar ventas'));
      return { page: 1, limit: 50, total: 0 };
    } finally {
      setSalesLoading(false);
    }
  }, [user]);

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
        customerId: params.customerId || null,
        receiptType: params.receiptType
      });
      if (response.success && response.sale) {
        await loadSales();
        await loadProducts();
        await loadAlerts();
        await loadStats();
        return { success: true, sale: mapSale(response.sale) };
      }
      return { success: false, error: response.error || 'Error al procesar la venta' };
    } catch (err: any) {
      return { success: false, error: extractError(err, 'Error al procesar la venta') };
    }
  }, [loadSales, loadProducts, loadAlerts, loadStats]);

  const getSale = useCallback(async (id: string): Promise<Sale | null> => {
    try {
      const response = await salesApi.getSale(id);
      return mapSale(response.sale);
    } catch {
      return null;
    }
  }, []);

  const mapSale = (s: any): Sale => ({
    id: s.id,
    codigoVenta: s.codigo_venta,
    fecha: s.fecha_creacion,
    cliente: s.cliente || null,
    clienteDoc: s.cliente_doc || null,
    clienteId: s.cliente_id || undefined,
    cajero: s.cajero,
    cajeroId: s.cajero_id,
    metodoPago: s.metodo_pago,
    subtotal: parseFloat(s.subtotal) || 0,
    igv: parseFloat(s.igv !== undefined ? s.igv : s.monto_igv) || 0,
    total: parseFloat(s.total !== undefined ? s.total : s.monto_total) || 0,
    items: (s.items || []).map((it: any) => ({
      id: it.id,
      productId: it.productId || it.producto_id,
      productName: it.productName || it.producto,
      codigo: it.codigo || it.codigo_barras,
      unitPrice: parseFloat(it.unitPrice) || 0,
      quantity: parseInt(it.quantity, 10) || 0,
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

  // -------- Alerts --------
  const loadAlerts = useCallback(async () => {
    try {
      const response = await alertsApi.listAlerts();
      setAlerts((response.alerts || []).map((a: any) => ({
        id: a.id,
        tipo: a.tipo_alerta,
        estado: a.estado,
        mensaje: a.mensaje,
        productoId: a.producto_id,
        producto: a.producto,
        codigoBarras: a.codigo_barras,
        loteId: a.lote_id,
        codigoLote: a.codigo_lote,
        fechaVencimiento: a.fecha_vencimiento,
        fechaCreacion: a.fecha_creacion,
        resueltoPor: a.resuelto_por
      })));
      const count = await alertsApi.countAlerts();
      setPendingAlerts(count.pendingCount);
    } catch (err: any) {
      setApiError(extractError(err, 'Error al cargar alertas'));
    }
  }, []);

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

  // -------- Dashboard stats --------
  const loadStats = useCallback(async () => {
    try {
      const response = await dashboardApi.getStats();
      setStats(response);
    } catch (err: any) {
      setApiError(extractError(err, 'Error al cargar el panel de control'));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadProducts(),
      loadBatches(),
      loadSales(),
      loadCustomers(),
      loadAlerts(),
      loadStats()
    ]);
  }, [loadProducts, loadBatches, loadSales, loadCustomers, loadAlerts, loadStats]);

  // Carga inicial de datos tras autenticación
  useEffect(() => {
    if (user) {
      refreshAll();
      // Re-verificar alertas periódicamente (cada 2 min) mientras se usa el sistema
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
    sales,
    salesLoading,
    loadSales,
    createSale,
    getSale,
    customers,
    loadCustomers,
    createCustomer,
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
    batches, loadBatches,
    sales, salesLoading, loadSales, createSale, getSale,
    customers, loadCustomers, createCustomer,
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
