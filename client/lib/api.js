import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Operations API
export const operationsAPI = {
  getOrders: (params) => api.get('/operations/orders', { params }),
  getOrder: (id) => api.get(`/operations/orders/${id}`),
  createOrder: (data) => api.post('/operations/orders', data),
  updateOrder: (id, data) => api.put(`/operations/orders/${id}`, data),
  getCustomers: (params) => api.get('/operations/customers', { params }),
  getCustomer: (id) => api.get(`/operations/customers/${id}`),
  updateCustomer: (id, data) => api.put(`/operations/customers/${id}`, data),
  getOrderStats: () => api.get('/operations/orders/stats'),
};

// Marketing API
export const marketingAPI = {
  getCampaigns: (params) => api.get('/marketing/campaigns', { params }),
  getCampaign: (id) => api.get(`/marketing/campaigns/${id}`),
  createCampaign: (data) => api.post('/marketing/campaigns', data),
  updateCampaign: (id, data) => api.put(`/marketing/campaigns/${id}`, data),
  getPromotions: (params) => api.get('/marketing/promotions', { params }),
  getPromotion: (id) => api.get(`/marketing/promotions/${id}`),
  createPromotion: (data) => api.post('/marketing/promotions', data),
  updatePromotion: (id, data) => api.put(`/marketing/promotions/${id}`, data),
};

// Inventory API
export const inventoryAPI = {
  getProducts: (params) => api.get('/inventory/products', { params }),
  getProduct: (id) => api.get(`/inventory/products/${id}`),
  createProduct: (data) => api.post('/inventory/products', data),
  updateProduct: (id, data) => api.put(`/inventory/products/${id}`, data),
  getStockMovements: (params) => api.get('/inventory/stock-movements', { params }),
  createStockMovement: (data) => api.post('/inventory/stock-movements', data),
  getProductStats: () => api.get('/inventory/products/stats'),
};

// Logistics API
export const logisticsAPI = {
  getShipments: (params) => api.get('/logistics/shipments', { params }),
  getShipment: (id) => api.get(`/logistics/shipments/${id}`),
  createShipment: (data) => api.post('/logistics/shipments', data),
  updateShipment: (id, data) => api.put(`/logistics/shipments/${id}`, data),
  getWarehouses: () => api.get('/logistics/warehouses'),
  getWarehouse: (id) => api.get(`/logistics/warehouses/${id}`),
  createWarehouse: (data) => api.post('/logistics/warehouses', data),
  updateWarehouse: (id, data) => api.put(`/logistics/warehouses/${id}`, data),
  getShipmentStats: () => api.get('/logistics/shipments/stats'),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getRevenueTrends: (params) => api.get('/analytics/revenue-trends', { params }),
  getTopProducts: (params) => api.get('/analytics/top-products', { params }),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// User Preferences API
export const userPreferencesAPI = {
  getPreferences: (userId) => api.get(`/user-preferences/${userId}`),
  updatePreferences: (userId, data) => api.put(`/user-preferences/${userId}`, data),
};

// User Activity API
export const userActivityAPI = {
  getActivity: (userId, params) => api.get(`/user-activity/${userId}`, { params }),
  logActivity: (userId, data) => api.post(`/user-activity/${userId}`, data),
  getActivityStats: (userId, params) => api.get(`/user-activity/${userId}/stats`, { params }),
};

export default api;

