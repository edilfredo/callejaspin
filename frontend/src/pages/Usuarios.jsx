import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const columns = [
  { key: 'nombres', label: 'Nombres' },
  { key: 'apellidos', label: 'Apellidos' },
  { key: 'email', label: 'Email' },
  { key: 'rol', label: 'Rol' },
  {
    key: 'estado', label: 'Estado',
    render: (row) => {
      const activo = row.estado === true || row.estado === 'ACTIVO';
      return (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {activo ? 'ACTIVO' : 'INACTIVO'}
        </span>
      );
    }
  },
];

export default function Usuarios() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombres: '', apellidos: '', email: '', password: '', rol: 'VENDEDOR' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const res = await api.get('/usuarios');
    setData(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombres: '', apellidos: '', email: '', password: '', rol: 'VENDEDOR' });
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ nombres: row.nombres, apellidos: row.apellidos, email: row.email, password: '', rol: row.rol });
    setModal(true);
  };

  const toggleStatus = async (row) => {
    const nuevoEstado = !(row.estado === true || row.estado === 'ACTIVO');
    try {
      await api.put(`/usuarios/${row.id}`, { estado: nuevoEstado });
      toast.success(nuevoEstado ? 'Usuario activado' : 'Usuario desactivado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error');
    }
  };

  const eliminar = async (row) => {
    if (!window.confirm(`¿Eliminar al usuario ${row.nombres} ${row.apellidos}?`)) return;
    try {
      await api.delete(`/usuarios/${row.id}`);
      toast.success('Usuario eliminado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/usuarios/${editing.id}`, payload);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/usuarios', form);
        toast.success('Usuario creado');
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
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onToggleStatus={toggleStatus} onDelete={eliminar} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombres" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={editing ? 'Dejar vacío para no cambiar' : 'Contraseña'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
            <option value="ADMIN">ADMIN</option>
            <option value="VENDEDOR">VENDEDOR</option>
            <option value="CAJERO">CAJERO</option>
            <option value="BODEGA">BODEGA</option>
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">
            {editing ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
