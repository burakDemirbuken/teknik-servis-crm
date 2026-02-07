import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
};

// Customers
export const customerAPI = {
  getAll: () => api.get('/customers'),
  create: (data: { name: string; surname: string; phone: string; address?: string }) =>
    api.post('/customers', data),
  update: (id: number, data: Partial<{ name: string; surname: string; phone: string; address: string }>) =>
    api.put(`/customers/${id}`, data),
};

// Tickets
export const ticketAPI = {
  getAll: () => api.get('/tickets'),
  create: (data: any) => api.post('/tickets', data),
  update: (id: number, data: { issue_description?: string | null; total_price?: number | null; ticketStatus?: string }) =>
    api.patch(`/tickets/${id}`, data),
  close: (id: number, data: { total_price: number }) =>
    api.put(`/tickets/${id}/close`, data),
  reopen: (id: number) => api.put(`/tickets/${id}/reopen`),
  cancel: (id: number) => api.put(`/tickets/${id}/cancel`),
  delete: (id: number) => api.delete(`/tickets/${id}`),
  addProduct: (ticketId: number, data: { productTypeId: number; shelfId: number; model: string; brand: string; price?: number | null; description?: string | null }) =>
    api.post(`/tickets/${ticketId}/products`, data),
};

// Products
export const productAPI = {
  getAll: () => api.get('/products'),
  update: (id: number, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Settings
export const settingsAPI = {
  getProductTypes: () => api.get('/settings/product-types'),
  createProductType: (data: { type: string }) =>
    api.post('/settings/product-types', data),
  updateProductType: (id: number, data: { type: string }) =>
    api.put(`/settings/product-types/${id}`, data),
  deleteProductType: (id: number) => api.delete(`/settings/product-types/${id}`),
  getShelves: () => api.get('/settings/shelves'),
  createShelf: (data: { zone: string; row: number }) =>
    api.post('/settings/shelves', data),
  updateShelf: (id: number, data: { zone: string; row: number }) =>
    api.put(`/settings/shelves/${id}`, data),
  deleteShelf: (id: number) => api.delete(`/settings/shelves/${id}`),
  getShelfInventory: () => api.get('/settings/shelves/inventory'),
};

// Reports
export const reportAPI = {
  getSummary: (params: string) => api.get(`/reports/summary?${params}`),
  getDailyTrend: (params: string) => api.get(`/reports/daily-trend?${params}`),
  getTopCustomers: (params: string) => api.get(`/reports/top-customers?${params}`),
  getProductTypeStats: (params: string) => api.get(`/reports/product-types?${params}`),
  getMonthlyComparison: () => api.get('/reports/monthly'),
};

// WhatsApp
export const whatsappAPI = {
  getStatus: () => api.get('/whatsapp/status'),
  connect: () => api.post('/whatsapp/connect'),
  disconnect: () => api.post('/whatsapp/disconnect'),
  sendMessage: (data: { to: string; message: string }) =>
    api.post('/whatsapp/send', data),
};

export default api;
