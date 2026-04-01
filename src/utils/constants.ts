export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  WALLET: '/wallet',
  WALLET_DETAIL: '/wallet/detail',
  ADD_MONEY: '/wallet/add-money',
  PAY: '/pay',
  SEND: '/send',
  TRANSFER_BANK: '/transfer-bank',
  BILL_PAY: '/bill-pay',
  PASSBOOK: '/passbook',
  KYC: '/kyc',
  PROFILE: '/profile',
} as const;

export const STORAGE_KEYS = {
  WALLET_ID: 'ppsl_wallet_id',
  USER_ID: 'ppsl_user_id',
  USER_NAME: 'ppsl_user_name',
  PHONE: 'ppsl_phone',
} as const;

export const AVATAR_COLORS = [
  '#E8B4B8', '#B4D4E8', '#D4E8B4', '#E8D4B4',
  '#B4E8D4', '#D4B4E8', '#E8E4B4', '#B4B8E8',
];

export function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  ADD_MONEY: 'Add Money',
  MERCHANT_PAY: 'Payment',
  P2P_TRANSFER: 'Money Transfer',
  WALLET_TO_BANK: 'Bank Transfer',
  BILL_PAY: 'Bill Payment',
  REFUND: 'Refund',
  WALLET_LOAD: 'Add Money',
  wallet_load: 'Add Money',
  merchant_payment: 'Payment',
  p2p_transfer: 'Money Transfer',
  bank_transfer: 'Bank Transfer',
  bill_payment: 'Bill Payment',
};

export const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  ADD_MONEY: 'bg-green-50 text-green-700',
  MERCHANT_PAY: 'bg-blue-50 text-blue-700',
  P2P_TRANSFER: 'bg-purple-50 text-purple-700',
  WALLET_TO_BANK: 'bg-orange-50 text-orange-700',
  BILL_PAY: 'bg-yellow-50 text-yellow-700',
  REFUND: 'bg-teal-50 text-teal-700',
};
