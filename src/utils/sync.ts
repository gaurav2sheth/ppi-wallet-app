// Sync wallet events to the admin dashboard via shared data bridge
const SYNC_URL = 'http://localhost:5173/api/sync';

function postSync(event: { type: string; data: Record<string, unknown> }) {
  fetch(SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(() => { /* silent - admin may not be running */ });
}

export function syncUserLogin(user: {
  wallet_id: string;
  user_id: string;
  name: string;
  phone: string;
  kyc_tier: string;
  kyc_state: string;
}) {
  postSync({
    type: 'user_login',
    data: {
      ...user,
      wallet_state: 'ACTIVE',
      is_active: true,
      last_activity_at: new Date().toISOString(),
    },
  });
}

export function syncTransaction(txn: {
  saga_id: string;
  wallet_id: string;
  user_name: string;
  saga_type: string;
  status: string;
  amount_paise: string;
  description: string;
  entry_type: string;
  counterparty?: string;
}) {
  postSync({
    type: 'transaction',
    data: {
      id: txn.saga_id,
      wallet_id: txn.wallet_id,
      user_name: txn.user_name,
      saga_type: txn.saga_type,
      status: txn.status,
      amount_paise: txn.amount_paise,
      description: txn.description,
      entry_type: txn.entry_type,
      counterparty: txn.counterparty ?? '',
      created_at: new Date().toISOString(),
    },
  });
}

export function syncBalanceUpdate(wallet_id: string, balance_paise: string, kyc_tier: string) {
  postSync({
    type: 'balance_update',
    data: { wallet_id, balance_paise, held_paise: '0', available_paise: balance_paise, kyc_tier },
  });
}

export function syncKycUpdate(wallet_id: string, kyc_state: string, kyc_tier: string) {
  postSync({
    type: 'kyc_update',
    data: { wallet_id, kyc_state, kyc_tier },
  });
}
