import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'marca', label: 'Marca' },
  { key: 'precio_venta', label: 'Precio Venta', render: (r) => `$${Number(r.precio_venta).toFixed(2)}` },
  { key: 'stock', label: 'Stock' },
  { key: 'estado', label: 'Estado', render: (r) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {r.estado}
    </span>
  )},
];

export default function Productos() {
  const [data, setData] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', categoria_id: '', marca: '', precio_compra: '', precio_venta: '', stock_minimo: 0 });
  const [editing, setEditing] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  const load = async () => {
    const params = {};
    if (categoriaFiltro) params.categoria_id = categoriaFiltro;
    const [prodRes, catRes] = await Promise.all([api.get('/productos', { params }), api.get('/categorias')]);
    setData(prodRes.data.data || []);
    setCategorias(catRes.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [categoriaFiltro]);

  const openCreate = () => {
    setEditing(null);
    setForm({ codigo: '', nombre: '', descripcion: '', categoria_id: '', marca: '', precio_compra: '', precio_venta: '', stock_minimo: 0 });
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ codigo: row.codigo, nombre: row.nombre, descripcion: row.descripcion, categoria_id: row.categoria_id || '', marca: row.marca || '', precio_compra: row.precio_compra, precio_venta: row.precio_venta, stock_minimo: row.stock_minimo });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/productos/${editing.id}`, form);
        toast.success('Producto actualizado');
      } else {
        await api.post('/productos', form);
        toast.success('Producto creado');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error');
    }
  };

  const toggleStatus = async (row) => {
    const nuevoEstado = row.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await api.put(`/productos/${row.id}`, { estado: nuevoEstado });
      toast.success(`Producto ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Nuevo producto</button>
      </div>
      <div className="mb-4">
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onToggleStatus={toggleStatus} />
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
            <option value="">Sin categoría</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Precio compra" type="number" step="0.01" value={form.precio_compra} onChange={(e) => setForm({ ...form, precio_compra: e.target.value })} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Precio venta" type="number" step="0.01" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} required />
          </div>
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Stock mínimo" type="number" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">{editing ? 'Actualizar' : 'Crear'}</button>
        </form>
      </Modal>
    </div>
  );
}
