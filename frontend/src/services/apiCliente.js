import axios from 'axios';

const apiCliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

apiCliente.interceptors.request.use((config) => {
  const token = localStorage.getItem('cliente_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiCliente.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cliente_token');
      localStorage.removeItem('cliente');
      window.location.href = '/cliente/login';
    }
    return Promise.reject(err);
  }
);

export default apiCliente;
