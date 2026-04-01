export function formatPaise(paiseStr: string | null | undefined): string {
  if (!paiseStr) return '₹0.00';
  const paise = BigInt(paiseStr);
  const sign = paise < 0n ? '-' : '';
  const abs = paise < 0n ? -paise : paise;
  const rupees = abs / 100n;
  const remainder = abs % 100n;
  const rupeesFormatted = rupees.toLocaleString('en-IN');
  return `${sign}₹${rupeesFormatted}.${remainder.toString().padStart(2, '0')}`;
}

export function rupeesToPaise(rupeeStr: string): number {
  const val = parseFloat(rupeeStr);
  if (isNaN(val) || val < 0) return 0;
  return Math.round(val * 100);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

export function truncateId(id: string, len = 8): string {
  if (id.length <= len) return id;
  return id.slice(0, len) + '...';
}
