import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { DollarSign, ArrowLeftRight, Package, ChevronDown, ChevronUp } from 'lucide-react';

const columns = [
  { key: 'fecha_inicio', label: 'Inicio', render: (r) => r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleDateString() : '-' },
  { key: 'monto_total', label: 'Total', render: (r) => `$${Number(r.monto_total).toFixed(2)}` },
  { key: 'saldo', label: 'Saldo', render: (r) => `$${Number(r.saldo).toFixed(2)}` },
  { key: 'estado', label: 'Estado' },
  {
    key: 'cliente', label: 'Cliente',
    render: (r) => r.clientes ? `${r.clientes.nombres} ${r.clientes.apellidos || ''}`.trim() : '-'
  },
];

export default function Creditos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [showDetalle, setShowDetalle] = useState(false);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/creditos')
      .then((res) => setData(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const verDetalle = async (credito) => {
    setSelected(credito);
    setLoadingPagos(true);
    setShowDetalle(true);
    try {
      const res = await api.get(`/creditos/${credito.id}/pagos`);
      setPagos(res.data.data || []);
    } catch {
      setPagos([]);
    } finally {
      setLoadingPagos(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Créditos</h1>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No hay créditos registrados</div>
        ) : (
          <div className="divide-y">
            {data.map((c) => (
              <div key={c.id}>
                <div
                  className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer gap-4 text-sm"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                >
                  <div className="w-24 shrink-0">{c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : '-'}</div>
                  <div className="w-28 shrink-0 font-medium">${Number(c.monto_total).toFixed(2)}</div>
                  <div className="w-28 shrink-0">${Number(c.saldo).toFixed(2)}</div>
                  <div className="w-20 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.estado === 'PAGADO' ? 'bg-green-100 text-green-700' :
                      c.estado === 'VENCIDO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{c.estado}</span>
                  </div>
                  <div className="flex-1 text-slate-600 truncate">
                    {c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos || ''}`.trim() : '-'}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); verDetalle(c); }}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Ver pagos
                    </button>
                    {expanded === c.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>
                {expanded === c.id && (
                  <div className="bg-slate-50 px-4 py-3 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(c.productos || []).length > 0 ? c.productos.map((d, i) => (
                        <div key={i} className="bg-white rounded border px-3 py-2 text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-slate-400 shrink-0" />
                            <span className="text-slate-700">{d.productos?.nombre || 'Producto'}</span>
                          </div>
                          <span className="text-slate-500 ml-2">
                            {d.cantidad} x ${Number(d.precio).toFixed(2)} = <strong>${Number(d.subtotal || d.precio * d.cantidad).toFixed(2)}</strong>
                          </span>
                        </div>
                      )) : (
                        <div className="col-span-full text-sm text-slate-400">Sin productos</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showDetalle} onClose={() => setShowDetalle(false)} title={selected ? `Crédito $${Number(selected.monto_total).toFixed(2)}` : 'Detalle'}>
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-sm grid grid-cols-3 gap-2">
              <div><span className="text-slate-500">Total</span><p className="font-bold">${Number(selected.monto_total).toFixed(2)}</p></div>
              <div><span className="text-slate-500">Saldo</span><p className="font-bold">${Number(selected.saldo).toFixed(2)}</p></div>
              <div><span className="text-slate-500">Abonado</span><p className="font-bold">${(Number(selected.monto_total) - Number(selected.saldo)).toFixed(2)}</p></div>
            </div>

            {(selected.productos || []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><Package size={16} /> Productos</h3>
                <div className="divide-y border rounded-lg text-sm">
                  {selected.productos.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                      <span>{d.productos?.nombre || 'Producto'} <span className="text-slate-400">x{d.cantidad}</span></span>
                      <span className="font-medium">${Number(d.subtotal || d.precio * d.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><DollarSign size={16} /> Pagos</h3>
              {loadingPagos ? (
                <div className="text-center py-4 text-slate-500">Cargando...</div>
              ) : pagos.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">No hay pagos registrados</div>
              ) : (
                <div className="divide-y border rounded-lg text-sm max-h-60 overflow-y-auto">
                  {pagos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        {p.tipo === 'abono' ? (
                          <ArrowLeftRight size={14} className="text-blue-500 shrink-0" />
                        ) : (
                          <DollarSign size={14} className="text-green-500 shrink-0" />
                        )}
                        <span>{new Date(p.fecha).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400">{p.tipo === 'abono' ? 'Abono' : p.metodo_pago || 'Pago'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${Number(p.valor).toFixed(2)}</span>
                        {p.estado && (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            p.estado === 'APROBADO' ? 'bg-green-100 text-green-700' :
                            p.estado === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{p.estado}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
