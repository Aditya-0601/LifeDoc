import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// Documents API
export const documentsAPI = {
  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (category?: string) =>
    api.get('/documents', { params: { category } }),
  getOne: (id: number) => api.get(`/documents/${id}`),
  delete: (id: number) => api.delete(`/documents/${id}`),
};

// Deadlines API
export const deadlinesAPI = {
  create: (data: any) => api.post('/deadlines', data),
  getAll: (upcoming?: boolean, category?: string) =>
    api.get('/deadlines', { params: { upcoming, category } }),
  getOne: (id: number) => api.get(`/deadlines/${id}`),
  update: (id: number, data: any) => api.put(`/deadlines/${id}`, data),
  delete: (id: number) => api.delete(`/deadlines/${id}`),
};

// Family API
export const familyAPI = {
  createAccess: (family_member_email: string, family_member_name: string) =>
    api.post('/family/access', { family_member_email, family_member_name }),
  getAllAccess: () => api.get('/family/access'),
  updateAccess: (id: number, is_active: boolean) =>
    api.put(`/family/access/${id}`, { is_active }),
  deleteAccess: (id: number) => api.delete(`/family/access/${id}`),
  emergencyAccess: (access_code: string) =>
    api.get(`/family/emergency/${access_code}`),
};
