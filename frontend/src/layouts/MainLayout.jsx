import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import useAuthStore from '../store/authStore';
import { Toaster } from 'react-hot-toast';

export default function MainLayout() {
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
