import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useClienteStore from '../store/clienteStore';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setCliente = useClienteStore((s) => s.setCliente);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: res } = await api.post('/auth/login-unificado', { email, password });
      if (!res.ok) throw new Error(res.mensaje);

      if (res.tipo === 'usuario') {
        const { token, usuario } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));
        useAuthStore.setState({ user: usuario, token });
        navigate('/');
      } else {
        const { token, cliente } = res.data;
        localStorage.setItem('cliente_token', token);
        localStorage.setItem('cliente', JSON.stringify(cliente));
        setCliente(cliente, token);
        navigate('/cliente/dashboard');
      }
    } catch (err) {
      toast.error(err?.response?.data?.mensaje || err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-1">CallejasPin</h1>
        <p className="text-slate-500 text-center mb-6">Sistema Comercial</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
