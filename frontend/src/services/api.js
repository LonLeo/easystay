import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('easystay_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('easystay_token');
      localStorage.removeItem('easystay_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const changePassword = (data) => api.put('/auth/password', data);

// Properties
export const getProperties = (params) => api.get('/properties', { params });
export const getProperty = (id) => api.get(`/properties/${id}`);
export const createProperty = (data) => api.post('/properties', data);
export const updateProperty = (id, data) => api.put(`/properties/${id}`, data);
export const deleteProperty = (id) => api.delete(`/properties/${id}`);
export const getManagedProperty = (id) => api.get(`/properties/my/${id}`);
export const getReadinessHistory = () => api.get('/readiness/history');
export const getMyProperties = () => api.get('/properties/my');

// Favourites
export const getFavourites = () => api.get('/favourites');
export const addFavourite = (propertyId) => api.post('/favourites', { propertyId });
export const removeFavourite = (propertyId) => api.delete(`/favourites/${propertyId}`);

// Enquiries
export const createEnquiry = (data) => api.post('/enquiries', data);
export const getMyEnquiries = () => api.get('/enquiries/my');
export const getReceivedEnquiries = () => api.get('/enquiries/received');
export const updateEnquiryStatus = (id, status) => api.put(`/enquiries/${id}/status`, { status });
export const replyToEnquiry = (id, replyMessage) => api.put(`/enquiries/${id}/reply`, { replyMessage });

// Readiness
export const runReadinessCheck = (data) => api.post('/readiness/check', data);

// Admin
export const getAdminStats = () => api.get('/admin/stats');
export const getPendingProperties = () => api.get('/admin/properties/pending');
export const reviewProperty = (id, status) => api.put(`/admin/properties/${id}/review`, { status });
export const getAllUsers = () => api.get('/admin/users');
export const toggleUserStatus = (id) => api.put(`/admin/users/${id}/toggle`);