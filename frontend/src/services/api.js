import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de solicitud: agregar token JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nova_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta: NO redirigir automáticamente en 401
// El contexto de autenticación maneja el error 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es error 401, solo lanzar el error para que el contexto lo maneje
    // No hacer window.location.href aquí para evitar bucles infinitos
    return Promise.reject(error);
  }
);

export default api;
