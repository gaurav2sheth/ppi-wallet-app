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
    <div className="w-full max-w-[430px] sm:max-w-2xl md:max-w-3xl lg:max-w-5xl mx-auto min-h-screen bg-primary-bg relative">
      <ToastContainer />
      <ScratchCardOverlay />
      <div className="pb-20 md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
