import api from './api';

/**
 * Servicio de API para Nova Salud - Backend Node.js + Express + SQL Server
 * Reemplaza la lógica en memoria de PharmacyContext con llamadas REST reales.
 */

// ==================== AUTENTICACIÓN ====================

export const authApi = {
  login: async (dni, password) => {
    const response = await api.post('/auth/login', { dni, password });
    if (response.data.token) {
      localStorage.setItem('nova_token', response.data.token);
      localStorage.setItem('nova_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: async () => {
    localStorage.removeItem('nova_token');
    localStorage.removeItem('nova_user');
    await api.post('/auth/logout');
    return { success: true };
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// ==================== VENTAS (POS) ====================

export const salesApi = {
  createSale: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },
  listSales: async () => {
    const response = await api.get('/sales');
    return response.data;
  }
};

// ==================== INVENTARIO ====================

export const inventoryApi = {
  listProducts: async () => {
    const response = await api.get('/inventory/products');
    return response.data;
  },
  listBatches: async () => {
    const response = await api.get('/inventory/batches');
    return response.data;
  },
  getProductStock: async (productId) => {
    const response = await api.get(`/inventory/products/${productId}/stock`);
    return response.data;
  }
};

// ==================== CAJA ====================

export const cashApi = {
  openCashRegister: async (initialFund, shift) => {
    const response = await api.post('/cash/open', { initialFund, shift });
    return response.data;
  },
  closeCashRegister: async (countedCash) => {
    const response = await api.post('/cash/close', { countedCash });
    return response.data;
  }
};

// ==================== ALERTAS ====================

export const alertsApi = {
  listAlerts: async () => {
    const response = await api.get('/alerts');
    return response.data;
  }
};

// ==================== AUDITORÍA ====================

export const auditApi = {
  listAuditLogs: async () => {
    const response = await api.get('/audit');
    return response.data;
  }
};

// ==================== COMPRAS ====================

export const purchasesApi = {
  listPurchases: async () => {
    const response = await api.get('/purchases');
    return response.data;
  },
  createPurchase: async (purchaseData) => {
    const response = await api.post('/purchases', purchaseData);
    return response.data;
  },
  receivePurchase: async (purchaseId) => {
    const response = await api.post(`/purchases/${purchaseId}/receive`);
    return response.data;
  }
};

// ==================== CLIENTES ====================

export const customersApi = {
  listCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  },
  getCustomer: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  }
};

// ==================== RESPALDOS ====================

export const backupApi = {
  listBackups: async () => {
    const response = await api.get('/backups');
    return response.data;
  },
  createBackup: async (backupData) => {
    const response = await api.post('/backups', backupData);
    return response.data;
  },
  restoreBackup: async (payloadJson) => {
    const response = await api.post('/backups/restore', { payloadJson });
    return response.data;
  }
};

// ==================== SALUD DEL SERVIDOR ====================

export const healthApi = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default {
  auth: authApi,
  sales: salesApi,
  inventory: inventoryApi,
  cash: cashApi,
  alerts: alertsApi,
  audit: auditApi,
  purchases: purchasesApi,
  customers: customersApi,
  backup: backupApi,
  health: healthApi
};
