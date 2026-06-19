import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const columns = [
  { key: 'fecha', label: 'Fecha', render: (r) => new Date(r.fecha).toLocaleDateString() },
  { key: 'tipo_venta', label: 'Tipo' },
  { key: 'total', label: 'Total', render: (r) => `$${Number(r.total).toFixed(2)}` },
  { key: 'estado', label: 'Estado' },
  {
    key: 'cliente', label: 'Cliente',
    render: (r) => r.clientes ? `${r.clientes.nombres} ${r.clientes.apellidos || ''}`.trim() : '-'
  },
];

export default function Ventas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    cliente_id: '', tipo_venta: 'CONTADO',
    detalles: [{ producto_id: '', cantidad: 1, precio: '' }]
  });

  const load = async () => {
    const res = await api.get('/ventas');
    setData(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = async () => {
    const [cliRes, prodRes] = await Promise.all([api.get('/clientes'), api.get('/productos?estado=true')]);
    setClientes(cliRes.data.data || []);
    setProductos(prodRes.data.data || []);
    setForm({ cliente_id: '', tipo_venta: 'CONTADO', detalles: [{ producto_id: '', cantidad: 1, precio: '' }] });
    setModal(true);
  };

  const addDetalle = () => {
    setForm({ ...form, detalles: [...form.detalles, { producto_id: '', cantidad: 1, precio: '' }] });
  };

  const removeDetalle = (i) => {
    const d = form.detalles.filter((_, idx) => idx !== i);
    setForm({ ...form, detalles: d });
  };

  const updateDetalle = (i, field, value) => {
    const d = [...form.detalles];
    d[i][field] = value;
    if (field === 'producto_id') {
      const prod = productos.find((p) => p.id === value);
      if (prod) d[i].precio = prod.precio_venta;
    }
    setForm({ ...form, detalles: d });
  };

  const total = form.detalles.reduce((s, d) => s + (Number(d.precio) || 0) * (d.cantidad || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ventas', {
        cliente_id: form.cliente_id || null,
        tipo_venta: form.tipo_venta,
        detalles: form.detalles.map((d) => ({
          producto_id: d.producto_id, cantidad: d.cantidad, precio: d.precio
        }))
      });
      toast.success('Venta creada');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || err.message || 'Error al crear venta');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nueva venta
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva venta">
        <form onSubmit={handleSubmit} className="space-y-3">
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
            <option value="">Sin cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} - {c.cedula}</option>)}
          </select>

          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.tipo_venta} onChange={(e) => setForm({ ...form, tipo_venta: e.target.value })}>
            <option value="CONTADO">CONTADO</option>
            <option value="CREDITO">CRÉDITO</option>
            <option value="SEPARE">SEPARE</option>
          </select>

          <div className="space-y-2">
            {form.detalles.map((d, i) => (
              <div key={i} className="flex gap-2 items-end">
                <select className="flex-1 border rounded-lg px-2 py-2 text-sm" value={d.producto_id} onChange={(e) => updateDetalle(i, 'producto_id', e.target.value)} required>
                  <option value="">Producto</option>
                  {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
                </select>
                <input className="w-16 border rounded-lg px-2 py-2 text-sm" type="number" min="1" placeholder="Cant" value={d.cantidad} onChange={(e) => updateDetalle(i, 'cantidad', parseInt(e.target.value) || 1)} required />
                <input className="w-24 border rounded-lg px-2 py-2 text-sm" type="number" step="0.01" placeholder="Precio" value={d.precio} onChange={(e) => updateDetalle(i, 'precio', e.target.value)} required />
                {form.detalles.length > 1 && (
                  <button type="button" onClick={() => removeDetalle(i)} className="text-red-500 text-sm px-1">X</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addDetalle} className="text-blue-600 text-sm hover:underline">+ Agregar producto</button>
          </div>

          <div className="text-right font-bold">Total: ${total.toFixed(2)}</div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Crear venta</button>
        </form>
      </Modal>
    </div>
  );
}
