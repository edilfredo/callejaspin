import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCircle, Tag, Package,
  Boxes, ShoppingCart, CreditCard, HandCoins, DollarSign,
  BarChart3, LogOut
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'VENDEDOR', 'CAJERO', 'BODEGA'] },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
  { to: '/clientes', label: 'Clientes', icon: UserCircle, roles: ['ADMIN', 'VENDEDOR', 'CAJERO'] },
  { to: '/categorias', label: 'Categorías', icon: Tag, roles: ['ADMIN', 'BODEGA'] },
  { to: '/productos', label: 'Productos', icon: Package, roles: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
  { to: '/inventario', label: 'Inventario', icon: Boxes, roles: ['ADMIN', 'BODEGA'] },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart, roles: ['ADMIN', 'VENDEDOR', 'CAJERO'] },
  { to: '/creditos', label: 'Créditos', icon: CreditCard, roles: ['ADMIN', 'VENDEDOR', 'CAJERO'] },
  { to: '/plan-separe', label: 'Plan Separe', icon: HandCoins, roles: ['ADMIN', 'VENDEDOR', 'CAJERO'] },
  { to: '/pagos', label: 'Pagos', icon: DollarSign, roles: ['ADMIN', 'CAJERO', 'VENDEDOR'] },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['ADMIN', 'VENDEDOR'] },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold">CallejasPin</h1>
        <p className="text-sm text-slate-400 capitalize">{user?.rol?.toLowerCase()}</p>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => item.roles.includes(user?.rol))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 text-slate-400 hover:text-white text-sm w-full"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
