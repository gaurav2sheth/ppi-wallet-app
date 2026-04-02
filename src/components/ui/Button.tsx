import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-full transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-paytm-cyan text-white hover:brightness-110 shadow-sm',
    secondary: 'bg-paytm-navy text-white hover:bg-paytm-navy-dark',
    outline: 'border-2 border-paytm-cyan text-paytm-cyan hover:bg-paytm-cyan-light',
    danger: 'bg-paytm-red text-white hover:opacity-90',
    ghost: 'text-paytm-cyan hover:bg-paytm-cyan-light',
  };
  const sizes = {
    sm: 'px-5 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
