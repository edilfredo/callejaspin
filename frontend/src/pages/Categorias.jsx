import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'estado', label: 'Estado' },
];

export default function Categorias() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const res = await api.get('/categorias');
    setData(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ codigo: '', nombre: '', descripcion: '' });
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ codigo: row.codigo, nombre: row.nombre, descripcion: row.descripcion });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/categorias/${editing.id}`, form);
        toast.success('Categoría actualizada');
      } else {
        await api.post('/categorias', form);
        toast.success('Categoría creada');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Nueva categoría</button>
      </div>
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} />
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar categoría' : 'Nueva categoría'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">{editing ? 'Actualizar' : 'Crear'}</button>
        </form>
      </Modal>
    </div>
  );
}
