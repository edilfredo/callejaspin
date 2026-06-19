import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useClienteStore from '../store/clienteStore';
import api from '../services/apiCliente';
import Modal from '../components/Modal';
import { CreditCard, HandCoins, ArrowLeftRight, LogOut, Upload, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const METODOS_PAGO = ['NEQUI', 'BANCOLOMBIA', 'DAVIPLATA', 'TRANSFERENCIA', 'OTRO'];

export default function ClienteDashboard() {
  const cliente = useClienteStore((s) => s.cliente);
  const token = useClienteStore((s) => s.token);
  const logout = useClienteStore((s) => s.logout);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [pagosHistorial, setPagosHistorial] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [selectedCredito, setSelectedCredito] = useState(null);
  const [payForm, setPayForm] = useState({ metodo_pago: 'NEQUI', monto: '', comprobante: null, observacion: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filtroCredito, setFiltroCredito] = useState('');
  const [filtroSepare, setFiltroSepare] = useState('');

  useEffect(() => {
    if (!token || !cliente) { navigate('/cliente/login'); return; }
    api.get(`/clientes/${cliente.id}/mis-datos`)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, cliente]);

  const loadPagos = async () => {
    try {
      const res = await api.get('/clientes/pagos');
      setPagosHistorial(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token && cliente) loadPagos();
  }, [token, cliente]);

  const handleLogout = () => {
    logout();
    navigate('/cliente/login');
  };

  const openPayModal = (credito) => {
    setSelectedCredito(credito);
    setPayForm({ metodo_pago: 'NEQUI', monto: '', comprobante: null, observacion: '' });
    setPayModal(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payForm.monto || parseFloat(payForm.monto) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('credito_id', selectedCredito.id);
      formData.append('monto', payForm.monto);
      formData.append('metodo_pago', payForm.metodo_pago);
      formData.append('observacion', payForm.observacion);
      if (payForm.comprobante) {
        formData.append('comprobante', payForm.comprobante);
      }

      await api.post('/clientes/pagos', formData);
      toast.success('Solicitud de pago enviada. Pendiente de aprobación.');
      setPayModal(false);
      loadPagos();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || err.message || 'Error al solicitar pago');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    );
  }

  const creditosFiltrados = (data?.creditos || []).filter((c) => !filtroCredito || c.estado === filtroCredito);
  const planesFiltrados = (data?.planes_separe || []).filter((p) => !filtroSepare || p.estado === filtroSepare);
  const totalCredito = creditosFiltrados.reduce((s, c) => s + Number(c.saldo || c.saldo_pendiente || 0), 0);
  const totalPlan = planesFiltrados.reduce((s, p) => s + Number(p.saldo || p.saldo_pendiente || 0), 0);
  const totalAbonado = (data?.abonos || []).reduce((s, a) => s + Number(a.valor || 0), 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">CallejasPin</h1>
          <p className="text-sm text-slate-500">Bienvenido, {cliente?.nombres} {cliente?.apellidos}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-red-600 text-sm">
          <LogOut size={18} /> Salir
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-lg"><CreditCard className="text-teal-600" size={24} /></div>
            <div><p className="text-sm text-slate-500">Saldo créditos</p><p className="text-xl font-bold">${totalCredito.toFixed(2)}</p></div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg"><HandCoins className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-slate-500">Saldo Plan Separe</p><p className="text-xl font-bold">${totalPlan.toFixed(2)}</p></div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg"><ArrowLeftRight className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-slate-500">Total abonado</p><p className="text-xl font-bold">${totalAbonado.toFixed(2)}</p></div>
          </div>
        </div>

        {data?.creditos?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Mis Créditos</h2>
              <select
                value={filtroCredito}
                onChange={(e) => setFiltroCredito(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-xs"
              >
                <option value="">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="PAGADO">Pagados</option>
                <option value="VENCIDO">Vencidos</option>
              </select>
            </div>
            {creditosFiltrados.length === 0 ? (
              <p className="text-sm text-slate-400">No hay créditos con ese estado.</p>
            ) : (
            <div className="space-y-3">
              {creditosFiltrados.map((c) => (
                <div key={c.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      (c.estado === 'PAGADO') ? 'bg-green-100 text-green-700' :
                      (c.estado === 'VENCIDO') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{c.estado}</span>
                    <span className="text-sm text-slate-500">Total: ${Number(c.monto_total).toFixed(2)}</span>
                  </div>
                  <p className="text-sm">
                    Saldo: <strong>${Number(c.saldo || c.saldo_pendiente).toFixed(2)}</strong>
                  </p>
                  {(c.productos || []).length > 0 && (
                    <div className="mt-2 border-t pt-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">Productos:</p>
                      {c.productos.map((d, i) => (
                        <p key={i} className="text-xs text-slate-600">{d.productos?.nombre || 'Producto'} x{d.cantidad} - ${Number(d.subtotal || d.precio * d.cantidad).toFixed(2)}</p>
                      ))}
                    </div>
                  )}
                  {c.estado !== 'PAGADO' && (
                    <button
                      onClick={() => openPayModal(c)}
                      className="mt-2 bg-teal-600 text-white px-3 py-1 rounded text-xs hover:bg-teal-700"
                    >
                      Pagar
                    </button>
                  )}
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {data?.planes_separe?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Mis Planes Separe</h2>
              <select
                value={filtroSepare}
                onChange={(e) => setFiltroSepare(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-xs"
              >
                <option value="">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="COMPLETADO">Completados</option>
                <option value="VENCIDO">Vencidos</option>
              </select>
            </div>
            {planesFiltrados.length === 0 ? (
              <p className="text-sm text-slate-400">No hay planes separe con ese estado.</p>
            ) : (
            <div className="space-y-3">
              {planesFiltrados.map((p) => (
                <div key={p.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      (p.estado === 'COMPLETADO') ? 'bg-green-100 text-green-700' :
                      (p.estado === 'VENCIDO') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{p.estado}</span>
                    <span className="text-sm text-slate-500">Límite: {p.fecha_limite ? new Date(p.fecha_limite).toLocaleDateString() : '-'}</span>
                  </div>
                  <p className="text-sm">Total: ${Number(p.total || p.monto_total).toFixed(2)} | Saldo: <strong>${Number(p.saldo || p.saldo_pendiente).toFixed(2)}</strong></p>
                  {(p.detalle_separe || p.productos)?.length > 0 && (
                    <div className="mt-2 border-t pt-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">Productos:</p>
                      {(p.detalle_separe || p.productos).map((d) => (
                        <p key={d.id} className="text-xs text-slate-600">{d.productos?.nombre || d.nombre || 'Producto'} x{d.cantidad} - ${Number(d.valor || d.precio).toFixed(2)}</p>
                      ))}
                    </div>
                  )}
                  {(p.abonos || []).length > 0 && (
                    <div className="mt-2 border-t pt-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">Abonos realizados:</p>
                      {(p.abonos || []).map((a) => (
                        <p key={a.id} className="text-xs text-slate-600">${Number(a.valor).toFixed(2)} - {new Date(a.fecha).toLocaleDateString()} {a.observacion ? `(${a.observacion})` : ''}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {data?.abonos?.length > 0 && !showHistorial && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Historial de Abonos</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-left">Valor</th>
                    <th className="px-4 py-2 text-left">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.abonos.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">{new Date(a.fecha).toLocaleDateString()}</td>
                      <td className="px-4 py-2 font-medium">${Number(a.valor).toFixed(2)}</td>
                      <td className="px-4 py-2 text-slate-500">{a.observacion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {pagosHistorial.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Mis Solicitudes de Pago</h2>
              <button
                onClick={() => setShowHistorial(!showHistorial)}
                className="text-teal-600 text-sm hover:underline"
              >
                {showHistorial ? 'Ocultar' : 'Ver historial'}
              </button>
            </div>
            {showHistorial && (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Método</th>
                      <th className="px-4 py-2 text-left">Monto</th>
                      <th className="px-4 py-2 text-left">Estado</th>
                      <th className="px-4 py-2 text-left">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagosHistorial.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2">{new Date(p.fecha).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{p.metodo_pago}</td>
                        <td className="px-4 py-2 font-medium">${Number(p.valor).toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            p.estado === 'APROBADO' ? 'bg-green-100 text-green-700' :
                            p.estado === 'RECHAZADO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{p.estado}</span>
                        </td>
                        <td className="px-4 py-2">
                          {p.comprobante ? (
                            <a href={p.comprobante} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-xs flex items-center gap-1">
                              <Upload size={12} /> Ver
                            </a>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {!data?.creditos?.length && !data?.planes_separe?.length && !data?.abonos?.length && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">No tienes créditos, planes separe ni abonos registrados.</p>
          </div>
        )}
      </main>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Pagar crédito">
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg text-sm">
            <p className="text-slate-500">
              Saldo del crédito: <strong>${Number(selectedCredito?.saldo || selectedCredito?.saldo_pendiente || 0).toFixed(2)}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto a pagar</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              type="number"
              step="0.01"
              min="0.01"
              max={selectedCredito?.saldo || selectedCredito?.saldo_pendiente || 0}
              placeholder="Ingrese el monto"
              value={payForm.monto}
              onChange={(e) => setPayForm({ ...payForm, monto: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Método de pago</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={payForm.metodo_pago}
              onChange={(e) => setPayForm({ ...payForm, metodo_pago: e.target.value })}
              required
            >
              {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">Si el pago es en efectivo, debe realizarlo directamente en el negocio.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comprobante de pago</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
              onChange={(e) => setPayForm({ ...payForm, comprobante: e.target.files[0] })}
            />
            <p className="text-xs text-slate-400 mt-1">Sube una foto o captura de la transferencia (jpg, png, pdf)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observación (opcional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Referencia de la transferencia, etc."
              value={payForm.observacion}
              onChange={(e) => setPayForm({ ...payForm, observacion: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
          >
            {submitting ? 'Enviando...' : 'Solicitar pago'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
