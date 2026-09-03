import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Upload, DollarSign, Search } from 'lucide-react';

const columns = [
  { key: 'fecha', label: 'Fecha', render: (r) => new Date(r.fecha).toLocaleDateString() },
  { key: 'tipo_pago', label: 'Tipo' },
  { key: 'valor', label: 'Monto', render: (r) => `$${Number(r.valor).toFixed(2)}` },
  { key: 'metodo_pago', label: 'Método' },
  {
    key: 'estado', label: 'Estado',
    render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
        r.estado === 'APROBADO' ? 'bg-green-100 text-green-700' :
        r.estado === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
        'bg-yellow-100 text-yellow-700'
      }`}>{r.estado}</span>
    )
  },
  {
    key: 'cliente', label: 'Cliente',
    render: (r) => r.clientes ? `${r.clientes.nombres} ${r.clientes.apellidos || ''}`.trim() : '-'
  },
];

export default function Pagos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('todos');
  const [pendientes, setPendientes] = useState([]);
  const [loadingPendientes, setLoadingPendientes] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [imagenModal, setImagenModal] = useState(null);

  const [clientes, setClientes] = useState([]);
  const [creditMap, setCreditMap] = useState({});
  const [efectivoForm, setEfectivoForm] = useState({ cliente_id: '', credito_id: '', monto: '', observacion: '' });
  const [submittingEfectivo, setSubmittingEfectivo] = useState(false);

  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');

  const load = async (params = {}) => {
    const res = await api.get('/pagos', { params });
    setData(res.data.data || []);
    setLoading(false);
  };

  const aplicarFiltros = () => {
    setLoading(true);
    const params = {};
    if (filtroMetodo) params.metodo_pago = filtroMetodo;
    if (filtroDesde) params.desde = new Date(filtroDesde).toISOString();
    if (filtroHasta) params.hasta = new Date(new Date(filtroHasta).setHours(23, 59, 59)).toISOString();
    if (filtroCliente) params.cliente = filtroCliente;
    load(params);
  };

  const limpiarFiltros = () => {
    setFiltroMetodo('');
    setFiltroDesde('');
    setFiltroHasta('');
    setFiltroCliente('');
    setLoading(true);
    load();
  };

  const loadPendientes = async () => {
    setLoadingPendientes(true);
    try {
      const res = await api.get('/pagos/pendientes');
      setPendientes(res.data.data || []);
    } catch (err) {
      toast.error('Error al cargar pendientes');
    } finally {
      setLoadingPendientes(false);
    }
  };

  const loadClientes = async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data.data || []);
    } catch (err) {
      toast.error('Error al cargar clientes');
    }
  };

  useEffect(() => {
    load();
    loadPendientes();
    loadClientes();
  }, []);

  const loadCreditos = async (clienteId) => {
    if (!clienteId) { setCreditMap({}); return; }
    try {
      const res = await api.get(`/clientes/${clienteId}/creditos`);
      const creditos = res.data.data || [];
      const map = {};
      for (const c of creditos) {
        if (c.estado !== 'PAGADO') map[c.id] = c;
      }
      setCreditMap(map);
    } catch (err) {
      setCreditMap({});
    }
  };

  const handleEfectivoSubmit = async (e) => {
    e.preventDefault();
    if (!efectivoForm.credito_id || !efectivoForm.monto || parseFloat(efectivoForm.monto) <= 0) {
      toast.error('Seleccione un crédito e ingrese un monto válido');
      return;
    }
    setSubmittingEfectivo(true);
    try {
      await api.post('/pagos/efectivo', {
        credito_id: efectivoForm.credito_id,
        monto: efectivoForm.monto,
        cliente_id: efectivoForm.cliente_id,
        observacion: efectivoForm.observacion
      });
      toast.success('Pago en efectivo registrado correctamente');
      setEfectivoForm({ cliente_id: '', credito_id: '', monto: '', observacion: '' });
      setCreditMap({});
      loadPendientes();
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al registrar pago');
    } finally {
      setSubmittingEfectivo(false);
    }
  };

  const handleAprobar = async (pago) => {
    try {
      await api.put(`/pagos/${pago.id}/aprobar`, { observacion: 'Pago aprobado por administrador' });
      toast.success('Pago aprobado correctamente');
      loadPendientes();
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al aprobar');
    }
  };

  const openReject = (pago) => {
    setSelectedPago(pago);
    setRejectReason('');
    setRejectModal(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Debe indicar el motivo del rechazo');
      return;
    }
    try {
      await api.put(`/pagos/${selectedPago.id}/rechazar`, { observacion: rejectReason });
      toast.success('Pago rechazado');
      setRejectModal(false);
      loadPendientes();
      load();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al rechazar');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Pagos</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('todos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos los pagos
        </button>
        <button
          onClick={() => setTab('pendientes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'pendientes' ? 'bg-yellow-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock size={16} />
          Pendientes {pendientes.length > 0 && `(${pendientes.length})`}
        </button>
        <button
          onClick={() => setTab('efectivo')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'efectivo' ? 'bg-green-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <DollarSign size={16} />
          Pago en efectivo
        </button>
      </div>

      {tab === 'todos' && (
        <div>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Buscar cliente (nombre o cédula)</label>
                <input
                  type="text"
                  placeholder="Ej: Juan, Pérez, 12345..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={filtroDesde}
                  onChange={(e) => setFiltroDesde(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filtroHasta}
                  onChange={(e) => setFiltroHasta(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Método de pago</label>
                <select
                  value={filtroMetodo}
                  onChange={(e) => setFiltroMetodo(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="NEQUI">Nequi</option>
                  <option value="BANCOLOMBIA">Bancolombia</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="DAVIPLATA">Daviplata</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <button
                onClick={aplicarFiltros}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Search size={16} /> Filtrar
              </button>
              <button
                onClick={limpiarFiltros}
                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-300"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow">
            <DataTable columns={columns} data={data} loading={loading} />
          </div>
        </div>
      )}

      {tab === 'pendientes' && (
        <div className="space-y-4">
          {loadingPendientes ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
            </div>
          ) : pendientes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
              No hay pagos pendientes de aprobación
            </div>
          ) : (
            pendientes.map((pago) => (
              <div key={pago.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">PENDIENTE</span>
                      <span className="text-sm font-medium">{pago.metodo_pago}</span>
                    </div>
                    <p className="text-sm">
                      <strong>Cliente:</strong>{' '}
                      {pago.ventas?.clientes
                        ? `${pago.ventas.clientes.nombres} ${pago.ventas.clientes.apellidos || ''} (${pago.ventas.clientes.cedula || ''})`
                        : 'N/A'}
                    </p>
                    <p className="text-sm"><strong>Monto:</strong> ${Number(pago.valor).toFixed(2)}</p>
                    <p className="text-sm"><strong>Fecha solicitud:</strong> {new Date(pago.fecha).toLocaleString()}</p>
                    {pago.credito_info && (
                      <p className="text-sm text-slate-500">
                        Saldo crédito: ${Number(pago.credito_info.saldo).toFixed(2)} | Estado: {pago.credito_info.estado}
                      </p>
                    )}
                    {pago.observacion && (
                      <p className="text-xs text-slate-400">Observación: {pago.observacion}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    {pago.comprobante ? (
                      <button
                        onClick={() => setImagenModal(pago.comprobante)}
                        className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                      >
                        <Upload size={16} /> Ver comprobante
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Sin comprobante</span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAprobar(pago)}
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"
                      >
                        <CheckCircle size={16} /> Aprobar
                      </button>
                      <button
                        onClick={() => openReject(pago)}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700"
                      >
                        <XCircle size={16} /> Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'efectivo' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Registrar pago en efectivo</h2>
          <form onSubmit={handleEfectivoSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={efectivoForm.cliente_id}
                onChange={(e) => {
                  const id = e.target.value;
                  setEfectivoForm({ ...efectivoForm, cliente_id: id, credito_id: '' });
                  loadCreditos(id);
                }}
                required
              >
                <option value="">Seleccione un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} ({c.cedula})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Crédito</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={efectivoForm.credito_id}
                onChange={(e) => setEfectivoForm({ ...efectivoForm, credito_id: e.target.value })}
                required
              >
                <option value="">Seleccione un crédito</option>
                {Object.values(creditMap).map((c) => (
                  <option key={c.id} value={c.id}>
                    ${Number(c.monto_total || c.total).toFixed(2)} - Saldo: ${Number(c.saldo).toFixed(2)}
                  </option>
                ))}
              </select>
              {efectivoForm.credito_id && creditMap[efectivoForm.credito_id] && (
                <p className="text-xs text-slate-400 mt-1">
                  Saldo actual: ${Number(creditMap[efectivoForm.credito_id].saldo).toFixed(2)}
                  {' | '}Cuotas pendientes: {(creditMap[efectivoForm.credito_id].cuotas || []).filter(q => q.estado !== 'PAGADA').length}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ingrese el monto recibido"
                value={efectivoForm.monto}
                onChange={(e) => setEfectivoForm({ ...efectivoForm, monto: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observación (opcional)</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Nota sobre el pago"
                value={efectivoForm.observacion}
                onChange={(e) => setEfectivoForm({ ...efectivoForm, observacion: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submittingEfectivo}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              {submittingEfectivo ? 'Registrando...' : 'Registrar pago en efectivo'}
            </button>
          </form>
        </div>
      )}

      <Modal open={!!imagenModal} onClose={() => setImagenModal(null)} title="Comprobante de pago">
        {imagenModal && (
          <div className="flex justify-center">
            {imagenModal.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={imagenModal} alt="Comprobante" className="max-w-full max-h-96 rounded-lg" />
            ) : (
              <div className="text-center">
                <p className="mb-2 text-sm text-slate-500">Archivo: {imagenModal.split('/').pop()}</p>
                <a href={imagenModal} target="_blank" rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 inline-block"
                >
                  Descargar archivo
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Rechazar pago">
        <form onSubmit={handleReject} className="space-y-4">
          <p className="text-sm text-slate-600">
            Vas a rechazar el pago de <strong>${Number(selectedPago?.valor).toFixed(2)}</strong> por <strong>{selectedPago?.metodo_pago}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo del rechazo</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Indique el motivo del rechazo..."
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Rechazar pago
          </button>
        </form>
      </Modal>
    </div>
  );
}
