import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movLoading, setMovLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ producto_id: '', tipo_movimiento: 'ENTRADA', cantidad: 1, costo: '', observacion: '' });
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');

  const loadProductos = async () => {
    const res = await api.get('/productos');
    setProductos(res.data.data || []);
  };

  const loadMovimientos = async () => {
    setMovLoading(true);
    const params = {};
    if (filtroTipo) params.tipo_movimiento = filtroTipo;
    if (filtroProducto) params.producto_id = filtroProducto;
    const res = await api.get('/inventario', { params });
    setMovimientos(res.data.data || []);
    setMovLoading(false);
    setLoading(false);
  };

  useEffect(() => { Promise.all([loadProductos(), loadMovimientos()]); }, []);

  useEffect(() => { loadMovimientos(); }, [filtroTipo, filtroProducto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventario/movimientos', form);
      toast.success('Movimiento registrado');
      setModal(false);
      setForm({ producto_id: '', tipo_movimiento: 'ENTRADA', cantidad: 1, costo: '', observacion: '' });
      loadProductos();
      loadMovimientos();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error');
    }
  };

  const getStockClass = (producto) => {
    if (producto.stock <= 0) return 'text-red-600 font-bold';
    if (producto.stock <= (producto.stock_minimo || 5)) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nuevo movimiento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-3 border-b bg-slate-50">
              <h2 className="font-semibold text-sm">Productos</h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {productos.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-sm ${filtroProducto === p.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setFiltroProducto(filtroProducto === p.id ? '' : p.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.codigo}</p>
                    </div>
                    <div className="text-right ml-2">
                      <span className={`font-semibold ${getStockClass(p)}`}>{p.stock}</span>
                      {p.stock <= (p.stock_minimo || 5) && (
                        <span className="block text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded mt-0.5">Bajo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-sm">
                {filtroProducto
                  ? `Movimientos - ${productos.find((p) => p.id === filtroProducto)?.nombre || ''}`
                  : 'Todos los movimientos'}
              </h2>
              <div className="flex gap-2">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="">Todos</option>
                  <option value="ENTRADA">ENTRADA</option>
                  <option value="SALIDA">SALIDA</option>
                  <option value="AJUSTE">AJUSTE</option>
                </select>
              </div>
            </div>
            {movLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : movimientos.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-sm">No hay movimientos</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Fecha</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Producto</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Tipo</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600">Cantidad</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600">Costo</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {movimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-500">{new Date(m.fecha || m.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-2 font-medium">{m.productos?.nombre || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            m.tipo_movimiento === 'ENTRADA' ? 'bg-green-100 text-green-700' :
                            m.tipo_movimiento === 'SALIDA' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{m.tipo_movimiento}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{m.cantidad}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{m.costo ? `$${Number(m.costo).toFixed(2)}` : '-'}</td>
                        <td className="px-3 py-2 text-slate-500 max-w-[200px] truncate">{m.observacion || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo movimiento">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Producto</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.producto_id} onChange={(e) => {
              const p = productos.find((x) => x.id === e.target.value);
              setForm({ ...form, producto_id: e.target.value, costo: p ? p.precio_compra : '' });
            }} required>
              <option value="">Seleccionar producto</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de movimiento</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.tipo_movimiento} onChange={(e) => setForm({ ...form, tipo_movimiento: e.target.value })}>
              <option value="ENTRADA">ENTRADA — aumenta stock</option>
              <option value="SALIDA">SALIDA — reduce stock</option>
              <option value="AJUSTE">AJUSTE — setea cantidad exacta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Cantidad" type="number" min="1" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: parseInt(e.target.value) || 0 })} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Costo unitario (opcional)</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Costo" type="number" step="0.01" min="0" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Observación</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Observación" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Registrar movimiento</button>
        </form>
      </Modal>
    </div>
  );
}
