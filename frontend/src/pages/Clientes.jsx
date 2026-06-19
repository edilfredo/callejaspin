import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const columns = [
  { key: 'cedula', label: 'Cédula' },
  { key: 'nombres', label: 'Nombres' },
  { key: 'apellidos', label: 'Apellidos' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Email' },
  { key: 'estado', label: 'Estado', render: (r) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {r.estado || 'ACTIVO'}
    </span>
  )},
];

export default function Clientes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ cedula: '', nombres: '', apellidos: '', telefono: '', direccion: '', email: '', password: '' });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (estadoFilter) params.estado = estadoFilter;
    const res = await api.get('/clientes', { params });
    setData(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, estadoFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ cedula: '', nombres: '', apellidos: '', telefono: '', direccion: '', email: '', password: '' });
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ cedula: row.cedula, nombres: row.nombres, apellidos: row.apellidos, telefono: row.telefono, direccion: row.direccion, email: row.email, password: '' });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/clientes/${editing.id}`, form);
        toast.success('Cliente actualizado');
      } else {
        await api.post('/clientes', form);
        toast.success('Cliente creado');
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
      await api.put(`/clientes/${row.id}`, { estado: nuevoEstado });
      toast.success(`Cliente ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Nuevo cliente</button>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar por cédula, nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm flex-1"
        />
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onToggleStatus={toggleStatus} />
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Cédula" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombres" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={editing ? 'Dejar vacío para no cambiar' : 'Contraseña'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">{editing ? 'Actualizar' : 'Crear'}</button>
        </form>
      </Modal>
    </div>
  );
}
