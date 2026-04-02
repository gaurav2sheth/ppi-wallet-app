// MCC (Merchant Category Code) based icon and category mapping
// Maps transaction_type + description keywords to visual category

export interface MccCategory {
  icon: string;
  label: string;
  bgColor: string;
  textColor: string;
}

const MCC_CATEGORIES: Record<string, MccCategory> = {
  taxi:        { icon: '🚕', label: 'Taxi',           bgColor: 'bg-amber-50',  textColor: 'text-amber-700' },
  food:        { icon: '🍔', label: 'Food',           bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  groceries:   { icon: '🛒', label: 'Groceries',      bgColor: 'bg-lime-50',   textColor: 'text-lime-700' },
  shopping:    { icon: '🛍️', label: 'Shopping',       bgColor: 'bg-pink-50',   textColor: 'text-pink-700' },
  fuel:        { icon: '⛽', label: 'Fuel',            bgColor: 'bg-red-50',    textColor: 'text-red-700' },
  travel:      { icon: '✈️', label: 'Travel',         bgColor: 'bg-sky-50',    textColor: 'text-sky-700' },
  entertainment: { icon: '🎬', label: 'Entertainment', bgColor: 'bg-violet-50', textColor: 'text-violet-700' },
  health:      { icon: '🏥', label: 'Health',          bgColor: 'bg-rose-50',   textColor: 'text-rose-700' },
  education:   { icon: '📚', label: 'Education',       bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  transfer:    { icon: '💸', label: 'Money Transfer',  bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  received:    { icon: '📥', label: 'Money Received',  bgColor: 'bg-green-50',  textColor: 'text-green-700' },
  bill:        { icon: '📄', label: 'Bill Payment',    bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  electricity: { icon: '💡', label: 'Electricity',     bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  wallet:      { icon: '💳', label: 'Add Money',       bgColor: 'bg-green-50',  textColor: 'text-green-700' },
  bank:        { icon: '🏦', label: 'Bank Transfer',   bgColor: 'bg-blue-50',   textColor: 'text-blue-700' },
  refund:      { icon: '↩️', label: 'Refund',          bgColor: 'bg-teal-50',   textColor: 'text-teal-700' },
  recharge:    { icon: '📱', label: 'Recharge',        bgColor: 'bg-cyan-50',   textColor: 'text-cyan-700' },
  subscription:{ icon: '🔁', label: 'Subscription',    bgColor: 'bg-fuchsia-50', textColor: 'text-fuchsia-700' },
  insurance:   { icon: '🛡️', label: 'Insurance',      bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
  default:     { icon: '💰', label: 'Payment',         bgColor: 'bg-gray-50',   textColor: 'text-gray-700' },
};

// Keyword → category mapping (case-insensitive match against description)
const KEYWORD_MAP: [string[], string][] = [
  [['uber', 'ola', 'taxi', 'cab', 'ride', 'rapido', 'auto'], 'taxi'],
  [['swiggy', 'zomato', 'food', 'restaurant', 'cafe', 'biryani', 'pizza', 'burger', 'tea', 'coffee', 'bar', 'dhaba', 'kitchen', 'bakery', 'rest bar'], 'food'],
  [['bigbasket', 'blinkit', 'grofers', 'grocery', 'zepto', 'dmart', 'supermarket', 'kirana'], 'groceries'],
  [['amazon', 'flipkart', 'myntra', 'shop', 'mall', 'store', 'retail', 'market'], 'shopping'],
  [['petrol', 'diesel', 'fuel', 'iocl', 'bpcl', 'hpcl', 'gas station'], 'fuel'],
  [['flight', 'airline', 'hotel', 'booking', 'makemytrip', 'goibibo', 'irctc', 'travel'], 'travel'],
  [['netflix', 'hotstar', 'prime', 'movie', 'theatre', 'spotify', 'gaming', 'entertainment'], 'entertainment'],
  [['hospital', 'doctor', 'pharmacy', 'medical', 'health', 'clinic', 'apollo', 'medplus'], 'health'],
  [['school', 'college', 'university', 'tuition', 'education', 'course', 'byju', 'unacademy'], 'education'],
  [['electric', 'mseb', 'bescom', 'power', 'discom'], 'electricity'],
  [['recharge', 'mobile recharge', 'dth', 'airtel', 'jio', 'vi ', 'vodafone'], 'recharge'],
  [['insurance', 'lic', 'hdfc life', 'policy'], 'insurance'],
  [['subscription', 'recurring', 'emi', 'loan'], 'subscription'],
];

// transaction_type → category mapping (direct match)
const TYPE_MAP: Record<string, string> = {
  ADD_MONEY: 'wallet',
  WALLET_LOAD: 'wallet',
  wallet_load: 'wallet',
  P2P_TRANSFER: 'transfer',
  p2p_transfer: 'transfer',
  WALLET_TO_BANK: 'bank',
  bank_transfer: 'bank',
  BILL_PAY: 'bill',
  bill_payment: 'bill',
  REFUND: 'refund',
};

export function getMccCategory(transactionType: string, description: string | null, entryType: string): MccCategory {
  // For credits that are P2P, show "received" instead of "transfer"
  if ((transactionType === 'P2P_TRANSFER' || transactionType === 'p2p_transfer') && entryType === 'CREDIT') {
    return MCC_CATEGORIES.received;
  }

  // Check direct type mapping first
  const directMatch = TYPE_MAP[transactionType];
  if (directMatch) return MCC_CATEGORIES[directMatch];

  // Check description keywords
  if (description) {
    const lower = description.toLowerCase();
    for (const [keywords, category] of KEYWORD_MAP) {
      if (keywords.some(kw => lower.includes(kw))) {
        return MCC_CATEGORIES[category];
      }
    }
  }

  // Fallback for MERCHANT_PAY — try description keywords, else default
  return MCC_CATEGORIES.default;
}

export function getAllCategories(): MccCategory[] {
  return Object.values(MCC_CATEGORIES).filter(c => c.label !== 'Payment');
}

export { MCC_CATEGORIES };
