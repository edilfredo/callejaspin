import { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, DollarSign, CreditCard, HandCoins } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const cards = [
    { label: 'Ventas Hoy', value: `$${data?.ventas?.hoy?.toFixed(2) || '0.00'}`, icon: TrendingUp, color: 'bg-blue-500' },
    { label: 'Ventas del Mes', value: `$${data?.ventas?.mes?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Clientes Activos', value: data?.clientes_activos || 0, icon: Users, color: 'bg-purple-500' },
    { label: 'Productos', value: data?.productos_activos || 0, icon: Package, color: 'bg-orange-500' },
    { label: 'Créditos Pend.', value: `$${data?.creditos_pendientes?.toFixed(2) || '0.00'}`, icon: CreditCard, color: 'bg-red-500' },
    { label: 'Plan Separe Pend.', value: `$${data?.plan_separe_pendiente?.toFixed(2) || '0.00'}`, icon: HandCoins, color: 'bg-teal-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
