import { create } from 'zustand';
import { useEffect } from 'react';

interface ToastState {
  message: string | null;
  variant: 'success' | 'error' | 'info';
  show: (message: string, variant?: 'success' | 'error' | 'info') => void;
  clear: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  variant: 'info',
  show: (message, variant = 'info') => {
    set({ message, variant });
    setTimeout(() => set({ message: null }), 3000);
  },
  clear: () => set({ message: null }),
}));

const variantStyles = {
  success: 'bg-paytm-green',
  error: 'bg-paytm-red',
  info: 'bg-paytm-navy',
};

export function ToastContainer() {
  const { message, variant, clear } = useToast();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(clear, 3000);
    return () => clearTimeout(t);
  }, [message, clear]);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[400px] w-[calc(100%-32px)] animate-[fadeIn_0.2s_ease-out]">
      <div className={`${variantStyles[variant]} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-center`}>
        {message}
      </div>
    </div>
  );
}
