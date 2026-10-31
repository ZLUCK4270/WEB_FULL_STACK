import api from './api';

/**
 * Capa de servicios Nova Salud. Todas las peticiones van al backend Node.js + SQL Server.
 * Los errores se propagan; el componente llama a extractError() para mostrar el mensaje.
 */

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
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('nova_token');
      localStorage.removeItem('nova_user');
    }
    return { success: true };
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const salesApi = {
  createSale: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },
  listSales: async (params = {}) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },
  getSale: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },
  voidSale: async (id, motivo) => {
    const response = await api.post(`/sales/${id}/void`, { motivo });
    return response.data;
  }
};

export const inventoryApi = {
  listProducts: async (params = {}) => {
    const response = await api.get('/inventory/products', { params });
    return response.data;
  },
  createProduct: async (data) => {
    const response = await api.post('/inventory/products', data);
    return response.data;
  },
  updateProduct: async (id, data) => {
    const response = await api.put(`/inventory/products/${id}`, data);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await api.delete(`/inventory/products/${id}`);
    return response.data;
  },
  listBatches: async () => {
    const response = await api.get('/inventory/batches');
    return response.data;
  },
  createBatch: async (data) => {
    const response = await api.post('/inventory/batches', data);
    return response.data;
  },
  getProductStock: async (productId) => {
    const response = await api.get(`/inventory/products/${productId}/stock`);
    return response.data;
  },
  adjustStock: async (data) => {
    const response = await api.post('/inventory/adjust-stock', data);
    return response.data;
  },
  getKardex: async (productId) => {
    const response = await api.get('/inventory/kardex', { params: productId ? { productId } : {} });
    return response.data;
  },
  getSubstitutes: async (productId) => {
    const response = await api.get(`/inventory/products/${productId}/substitutes`);
    return response.data;
  }
};

export const catalogApi = {
  getCategories: async () => {
    const response = await api.get('/inventory/categories');
    return response.data;
  },
  getLaboratories: async () => {
    const response = await api.get('/inventory/laboratories');
    return response.data;
  },
  getSuppliers: async () => {
    const response = await api.get('/inventory/suppliers');
    return response.data;
  }
};

export const cashApi = {
  getCurrentShift: async () => {
    const response = await api.get('/cash/current');
    return response.data;
  },
  openShift: async (data) => {
    const response = await api.post('/cash/open', data);
    return response.data;
  },
  createMovement: async (data) => {
    const response = await api.post('/cash/movements', data);
    return response.data;
  },
  closeShift: async (data) => {
    const response = await api.post('/cash/close', data);
    return response.data;
  },
  getShiftHistory: async () => {
    const response = await api.get('/cash/history');
    return response.data;
  }
};

export const purchasesApi = {
  listPurchases: async () => {
    const response = await api.get('/purchases');
    return response.data;
  },
  getPurchase: async (id) => {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
  },
  createPurchase: async (data) => {
    const response = await api.post('/purchases', data);
    return response.data;
  },
  receivePurchase: async (id, receivedItems) => {
    const response = await api.post(`/purchases/${id}/receive`, { receivedItems });
    return response.data;
  },
  getReplenishmentSuggestions: async () => {
    const response = await api.get('/purchases/replenishment/suggestions');
    return response.data;
  },
  generatePurchaseOrders: async (supplierId, items) => {
    const response = await api.post('/purchases/replenishment/generate-orders', { supplierId, items });
    return response.data;
  }
};

export const auditApi = {
  listLogs: async (params = {}) => {
    const response = await api.get('/audit', { params });
    return response.data;
  }
};

export const alertsApi = {
  listAlerts: async (params = {}) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },
  countAlerts: async () => {
    const response = await api.get('/alerts/count');
    return response.data;
  },
  generateAlerts: async () => {
    const response = await api.post('/alerts/generate');
    return response.data;
  },
  resolveAlert: async (id) => {
    const response = await api.patch(`/alerts/${id}/resolve`);
    return response.data;
  }
};

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

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};

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
  catalog: catalogApi,
  cash: cashApi,
  purchases: purchasesApi,
  audit: auditApi,
  alerts: alertsApi,
  customers: customersApi,
  dashboard: dashboardApi,
  health: healthApi
};
