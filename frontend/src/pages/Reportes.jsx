import { useState } from 'react';
import api from '../services/api';
import { BarChart3 } from 'lucide-react';

export default function Reportes() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async (endpoint) => {
    setLoading(true);
    try {
      const res = await api.get(`/reportes/${endpoint}`);
      setReportData({ endpoint, data: res.data.data });
    } catch (err) {
      setReportData({ endpoint, data: null, error: err.response?.data?.mensaje || 'Error' });
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    { key: 'ventas', label: 'Ventas por período', action: () => loadReport('ventas') },
    { key: 'productos-mas-vendidos', label: 'Productos más vendidos', action: () => loadReport('productos-mas-vendidos') },
    { key: 'clientes-frecuentes', label: 'Clientes frecuentes', action: () => loadReport('clientes-frecuentes') },
    { key: 'inventario-valorizado', label: 'Inventario valorizado', action: () => loadReport('inventario-valorizado') },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {reports.map((r) => (
          <button
            key={r.key}
            onClick={r.action}
            disabled={loading}
            className="bg-white rounded-lg shadow p-5 flex items-center gap-4 hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <div className="bg-blue-100 p-3 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <span className="font-medium text-left">{r.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {reportData && !loading && (
        <div className="bg-white rounded-lg shadow p-4">
          <pre className="text-sm text-slate-700 overflow-x-auto">
            {JSON.stringify(reportData.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
