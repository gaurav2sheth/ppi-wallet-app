import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn('bg-white rounded-2xl shadow-sm p-4', onClick && 'cursor-pointer active:scale-[0.99] transition-transform', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
