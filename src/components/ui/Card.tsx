import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4',
        onClick && 'cursor-pointer active:scale-[0.99] transition-transform',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
