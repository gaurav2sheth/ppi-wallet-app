interface StatusBannerProps {
  variant: 'info' | 'warning' | 'error' | 'success';
  title: string;
  children?: React.ReactNode;
}

const styles = {
  info: 'bg-blue-50 border-l-4 border-l-primary-navy text-primary-text',
  warning: 'bg-amber-50 border-l-4 border-l-primary-orange text-amber-900',
  error: 'bg-red-50 border-l-4 border-l-primary-red text-red-900',
  success: 'bg-green-50 border-l-4 border-l-primary-green text-green-900',
};

export function StatusBanner({ variant, title, children }: StatusBannerProps) {
  return (
    <div className={`${styles[variant]} rounded-r-xl p-4`}>
      <p className="font-semibold text-sm">{title}</p>
      {children && <p className="text-xs mt-1 opacity-80">{children}</p>}
    </div>
  );
}
