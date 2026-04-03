import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => api.post('/auth/google-login', credentials),
  devLogin: (payload) => api.post('/auth/dev-login', payload),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout')
};

export const bookingService = {
  createClassroomBooking: (data) => api.post('/bookings/classroom', data),
  getUserBookings: () => api.get('/bookings'),
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
  placeFoodOrder: (data) => api.post('/bookings/food', data),
  bookCab: (data) => api.post('/bookings/cab', data)
};

export const classroomService = {
  getAll: () => api.get('/classrooms'),
  create: (data) => api.post('/classrooms', data),
  update: (id, data) => api.put(`/classrooms/${id}`, data)
};

export const menuService = {
  getByVendor: (vendor, date) => api.get('/menus', { params: { vendor, date } }),
  addItems: (data) => api.post('/menus', data),
  updateItems: (data) => api.put('/menus', data)
};

export const cabService = {
  getAvailable: () => api.get('/cabs'),
  getMyStats: () => api.get('/cabs/operator/my-stats'),
  create: (data) => api.post('/cabs', data),
  updateStatus: (id, data) => api.put(`/cabs/${id}`, data)
};

export const adminService = {
  getPendingBookings: () => api.get('/admin/bookings/pending'),
  approveBooking: (id) => api.post(`/admin/bookings/${id}/approve`),
  rejectBooking: (id) => api.post(`/admin/bookings/${id}/reject`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  getVendorOrders: () => api.get('/admin/vendor/orders'),
  generateReports: (params) => api.get('/admin/reports', { params }),
  getClassrooms: () => api.get('/admin/classrooms'),
  getCabs: () => api.get('/admin/cabs'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  mapVendorRestaurant: (id, restaurantName) => api.put(`/admin/users/${id}/vendor-mapping`, { restaurantName }),
  mapCabOperator: (id, cabId) => api.put(`/admin/users/${id}/cab-mapping`, { cabId })
};

export const notificationService = {
  getMine: (limit = 20) => api.get('/notifications', { params: { limit } }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
};

export default api;