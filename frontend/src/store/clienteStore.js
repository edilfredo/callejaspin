import { create } from 'zustand';
import api from '../services/api';

const useClienteStore = create((set) => ({
  cliente: JSON.parse(localStorage.getItem('cliente') || 'null'),
  token: localStorage.getItem('cliente_token') || null,

  login: async (email, password) => {
    const { data: res } = await api.post('/auth/cliente-login', { email, password });
    if (!res.ok) throw new Error(res.mensaje);
    const { token, cliente } = res.data;
    localStorage.setItem('cliente_token', token);
    localStorage.setItem('cliente', JSON.stringify(cliente));
    set({ cliente, token });
    return res;
  },

  setCliente: (cliente, token) => {
    localStorage.setItem('cliente_token', token);
    localStorage.setItem('cliente', JSON.stringify(cliente));
    set({ cliente, token });
  },

  logout: () => {
    localStorage.removeItem('cliente_token');
    localStorage.removeItem('cliente');
    set({ cliente: null, token: null });
  }
}));

export default useClienteStore;
