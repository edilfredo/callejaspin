import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Package } from 'lucide-react';

const columns = [
  { key: 'fecha_limite', label: 'Vence', render: (r) => r.fecha_limite ? new Date(r.fecha_limite).toLocaleDateString() : '-' },
  { key: 'monto_total', label: 'Total', render: (r) => `$${Number(r.monto_total).toFixed(2)}` },
  { key: 'saldo', label: 'Saldo', render: (r) => `$${Number(r.saldo).toFixed(2)}` },
  { key: 'estado', label: 'Estado' },
  {
    key: 'cliente', label: 'Cliente',
    render: (r) => r.clientes ? `${r.clientes.nombres} ${r.clientes.apellidos || ''}`.trim() : '-'
  },
];

export default function PlanSepare() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abonoModal, setAbonoModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [monto, setMonto] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/plan-separe');
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAbono = (row) => {
    setSelected(row);
    setMonto('');
    setAbonoModal(true);
  };

  const handleAbono = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/plan-separe/${selected.id}/abonos`, { valor: parseFloat(monto) });
      toast.success('Abono registrado');
      setAbonoModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Plan Separe</h1>
      </div>
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={data} loading={loading} onEdit={openAbono} />
      </div>

      <Modal open={abonoModal} onClose={() => setAbonoModal(false)} title="Registrar abono">
        <form onSubmit={handleAbono} className="space-y-3">
          {selected && (
            <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
              <p className="text-slate-500">Total: <strong>${Number(selected.monto_total).toFixed(2)}</strong></p>
              <p className="text-slate-500">Saldo: <strong>${Number(selected.saldo).toFixed(2)}</strong></p>
              {(selected.detalle_separe || selected.productos)?.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Package size={12} /> Productos</p>
                  {(selected.detalle_separe || selected.productos).map((d, i) => (
                    <p key={i} className="text-xs text-slate-600">{d.productos?.nombre || 'Producto'} x{d.cantidad}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Monto del abono" type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Registrar abono</button>
        </form>
      </Modal>
    </div>
  );
}
