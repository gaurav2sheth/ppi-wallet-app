import { Outlet, Navigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ToastContainer } from '../ui/Toast';
import { ScratchCardOverlay } from '../ui/ScratchCard';
import { useAuthStore } from '../../store/auth.store';

export function AuthGuard() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AppShell() {
  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-paytm-bg relative">
      <ToastContainer />
      <ScratchCardOverlay />
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
