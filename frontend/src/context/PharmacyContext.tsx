import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  Product,
  Batch,
  Sale,
  CartItem,
  CashRegister,
  CashMovement,
  Supplier,
  PurchaseOrder,
  Customer,
  StaffUser,
  SystemAlert,
  ReceiptType,
  PaymentMethod,
  BackupScheduleConfig,
  BackupRecord,
  BackupScope,
  ActivityLogEntry,
  ActivityActionCategory,
  ActivitySeverity
} from '../types/pharmacy';
import {
  authApi,
  salesApi,
  inventoryApi,
  cashApi,
  alertsApi,
  auditApi,
  healthApi
} from '../services/pharmacyApi';

// --- INITIAL SEED DATA (fallback si el backend no está disponible) ---
const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    username: 'cmendoza',
    password: 'regente2026',
    name: 'Dr. Carlos Mendoza Flores',
    role: 'regente',
    roleTitle: 'Administrador Propietario',
    dni: '10203040',
    email: 'admin@novasalud.pe',
    colegiatura: 'CQFP N° 18492',
    activeShift: 'mañana',
    avatarInitials: 'CM',
    allowedTabs: [
      'dashboard', 'pos', 'inventory', 'cash', 'purchases', 'alerts',
      'customers', 'staff', 'reports', 'backups', 'audit'
    ],
    permissions: {
      canSell: true, canReceiveBatches: true, canAdjustStock: true,
      canOpenCloseCash: true, canViewFinancials: true, canManageStaff: true,
      canSignDigemidReports: true
    }
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    username: 'amorales',
    password: 'caja2026',
    name: 'Juan Manuel Pérez García',
    role: 'cajero',
    roleTitle: 'Cajero / Atención Mostrador',
    dni: '71829304',
    email: 'cajero@novasalud.pe',
    activeShift: 'mañana',
    avatarInitials: 'JM',
    allowedTabs: ['pos', 'cash', 'customers', 'alerts'],
    permissions: {
      canSell: true, canReceiveBatches: false, canAdjustStock: false,
      canOpenCloseCash: true, canViewFinancials: false, canManageStaff: false,
      canSignDigemidReports: false
    }
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    username: 'ltorres',
    password: 'almacen2026',
    name: 'Luis Torres Valdivia',
    role: 'almacen',
    roleTitle: 'Almacén y Logística',
    dni: '76543210',
    email: 'almacen@novasalud.pe',
    activeShift: 'mañana',
    avatarInitials: 'LT',
    allowedTabs: ['inventory', 'purchases', 'alerts'],
    permissions: {
      canSell: false, canReceiveBatches: true, canAdjustStock: true,
      canOpenCloseCash: false, canViewFinancials: false, canManageStaff: false,
      canSignDigemidReports: false
    }
  }
];

interface PharmacyContextType {
  products: Product[];
  batches: Batch[];
  sales: Sale[];
  cashRegister: CashRegister;
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  customers: Customer[];
  staffUsers: StaffUser[];
  currentUser: StaffUser | null;
  alerts: SystemAlert[];

  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;

  login: (dni: string, password: string) => Promise<{ success: boolean; error?: string; user?: StaffUser }>;
  logout: () => void;
  switchCurrentUser: (userId: string) => void;

  getValidBatchesForProduct: (productId: string) => Batch[];
  getProductTotalStock: (productId: string) => number;

  executeFefoSale: (params: {
    cartItems: { product: Product; quantity: number }[];
    receiptType: ReceiptType;
    customerName: string;
    customerDoc: string;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
  }) => Promise<{ success: boolean; sale?: Sale; error?: string }>;

  openCashRegister: (initialFund: number, shift: 'mañana' | 'tarde' | 'noche') => Promise<void>;
  closeCashRegister: (countedCash: number) => Promise<{ difference: number; summary: CashRegister }>;

  listSales: () => Promise<void>;
  listProducts: () => Promise<void>;
  listBatches: () => Promise<void>;
  listAlerts: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister>({
    id: '', isOpen: false, openedAt: '', cashierName: '', shift: 'mañana',
    initialFund: 0, currentCash: 0, totalSalesCash: 0, totalSalesYape: 0,
    totalSalesCard: 0, totalInflow: 0, totalOutflow: 0, movements: []
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(INITIAL_STAFF);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [initChecked, setInitChecked] = useState<boolean>(false);

  // --- AUTENTICACIÓN ---
  const login = useCallback(async (dni: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(dni, password);
      if (response.success && response.user && response.token) {
        const found = staffUsers.find(u => u.dni === dni || u.id === response.user.id);
        setCurrentUser(found || {
          id: response.user.id,
          username: '',
          name: response.user.name,
          role: 'cajero',
          roleTitle: response.user.roleTitle,
          dni,
          email: '',
          allowedTabs: ['pos', 'cash', 'customers', 'alerts'],
          permissions: {
            canSell: true, canReceiveBatches: false, canAdjustStock: false,
            canOpenCloseCash: true, canViewFinancials: false, canManageStaff: false,
            canSignDigemidReports: false
          }
        });
        setIsLoggedIn(true);
        return { success: true, user: found || null };
      }
      return { success: false, error: response.error || 'Credenciales inválidas' };
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      return { success: false, error: err.message || 'Error al iniciar sesión' };
    } finally {
      setIsLoading(false);
    }
  }, [staffUsers]);

  const logout = useCallback(() => {
    authApi.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setProducts([]);
    setBatches([]);
    setSales([]);
    setAlerts([]);
  }, []);

  const switchCurrentUser = useCallback((userId: string) => {
    const found = staffUsers.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  }, [staffUsers]);

  // --- CARGA DE DATOS DESDE API (SOLO si hay usuario autenticado) ---
  const listProducts = useCallback(async () => {
    try {
      const response = await inventoryApi.listProducts();
      setProducts(response.products || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const listBatches = useCallback(async () => {
    try {
      const response = await inventoryApi.listBatches();
      setBatches(response.batches || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const listSales = useCallback(async () => {
    try {
      const response = await salesApi.listSales();
      setSales(response.sales || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const listAlerts = useCallback(async () => {
    try {
      const response = await alertsApi.listAlerts();
      setAlerts(response.alerts || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([listProducts(), listBatches(), listSales(), listAlerts()]);
  }, [listProducts, listBatches, listSales, listAlerts]);

  // --- INICIALIZACIÓN: Verificar token existente, luego cargar datos una sola vez ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('nova_token');
        if (token) {
          // Intentar restaurar sesión desde el backend
          try {
            const response = await authApi.me();
            if (response.user) {
              const found = staffUsers.find(u => u.id === response.user.id || u.dni === response.user.dni);
              if (found) {
                setCurrentUser(found);
                setIsLoggedIn(true);
              }
            }
          } catch (err) {
            // Token inválido, limpiar
            localStorage.removeItem('nova_token');
            localStorage.removeItem('nova_user');
            setIsLoggedIn(false);
          }
        }
      } finally {
        setInitChecked(true);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (initChecked && isLoggedIn && !hasLoaded) {
      setHasLoaded(true);
      refreshData().finally(() => {
        // No cambiar isLoading aquí para no causar re-render innecesario
      });
    }
  }, [initChecked, isLoggedIn, hasLoaded, refreshData]);

  // --- HELPERS FEFO ---
  const getValidBatchesForProduct = useCallback((productId: string): Batch[] => {
    return batches
      .filter(b => b.productId === productId && b.status === 'active' && b.stock > 0)
      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
  }, [batches]);

  const getProductTotalStock = useCallback((productId: string): number => {
    return getValidBatchesForProduct(productId).reduce((sum, b) => sum + b.stock, 0);
  }, [getValidBatchesForProduct]);

  // --- VENTA FEFO ---
  const executeFefoSale = useCallback(async (params: {
    cartItems: { product: Product; quantity: number }[];
    receiptType: ReceiptType;
    customerName: string;
    customerDoc: string;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
  }) => {
    try {
      const { cartItems, receiptType, customerName, customerDoc, paymentMethod, amountPaid, notes } = params;

      const response = await salesApi.createSale({
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        paymentMethod,
        amountPaid,
        customerDoc,
        receiptType
      });

      if (response.success && response.sale) {
        await refreshData();
        return { success: true, sale: response.sale };
      }
      return { success: false, error: response.error || 'Error al procesar la venta' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al procesar la venta' };
    }
  }, [salesApi, refreshData]);

  // --- CAJA ---
  const openCashRegister = useCallback(async (initialFund: number, shift: 'mañana' | 'tarde' | 'noche') => {
    try {
      const response = await cashApi.openCashRegister(initialFund, shift);
      if (response.success && response.cashRegister) {
        setCashRegister(response.cashRegister);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [cashApi]);

  const closeCashRegister = useCallback(async (countedCash: number) => {
    try {
      const response = await cashApi.closeCashRegister(countedCash);
      return { difference: 0, summary: cashRegister };
    } catch (err: any) {
      setError(err.message);
      return { difference: 0, summary: cashRegister };
    }
  }, [cashApi, cashRegister]);

  const contextValue: PharmacyContextType = useMemo(() => ({
    products,
    batches,
    sales,
    cashRegister,
    suppliers,
    purchaseOrders,
    customers,
    staffUsers,
    currentUser,
    alerts,
    isLoggedIn,
    isLoading,
    error,
    login,
    logout,
    switchCurrentUser,
    getValidBatchesForProduct,
    getProductTotalStock,
    executeFefoSale,
    openCashRegister,
    closeCashRegister,
    listSales,
    listProducts,
    listBatches,
    listAlerts,
    refreshData
  }), [
    products, batches, sales, cashRegister, suppliers, purchaseOrders,
    customers, staffUsers, currentUser, alerts,
    isLoggedIn, isLoading, error,
    login, logout, switchCurrentUser,
    getValidBatchesForProduct, getProductTotalStock,
    executeFefoSale, openCashRegister, closeCashRegister,
    listSales, listProducts, listBatches, listAlerts, refreshData
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
