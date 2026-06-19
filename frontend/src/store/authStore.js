import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  login: async (email, password) => {
    const { data: res } = await api.post('/auth/login', { email, password });
    if (!res.ok) throw new Error(res.mensaje);
    const { token, usuario } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(usuario));
    set({ user: usuario, token });
    return res;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  isAuthenticated: () => !!localStorage.getItem('token')
}));

export default useAuthStore;
