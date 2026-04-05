export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

export interface WalletBalanceResponse {
  success: boolean;
  wallet_id: string;
  user_id: string;
  balance_paise: string;
  held_paise: string;
  available_paise: string;
  kyc_tier: 'MINIMUM' | 'FULL';
  is_active: boolean;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  entry_type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'HOLD_RELEASE';
  amount_paise: string;
  balance_after_paise: string;
  held_paise_after: string;
  transaction_type: string;
  reference_id: string | null;
  description: string | null;
  idempotency_key: string;
  hold_id: string | null;
  created_at: string;
  payment_source?: string; // e.g. "UPI - HDFC Bank", "Debit Card", "Net Banking"
}

export interface LedgerResponse {
  success: boolean;
  wallet_id: string;
  entries: LedgerEntry[];
  pagination: { next_cursor: string | null; has_more: boolean };
}

export interface SagaResponse {
  success: boolean;
  saga_id: string;
  saga_type: string;
  status: 'STARTED' | 'RUNNING' | 'COMPLETED' | 'COMPENSATING' | 'COMPENSATED' | 'DLQ';
  result?: Record<string, unknown>;
  error?: string;
}

export interface KycStatusResponse {
  wallet_id: string;
  kyc_state: string;
  kyc_tier: 'MINIMUM' | 'FULL';
  wallet_expiry_date: string | null;
  ckyc_number: string | null;
  pan_masked: string | null;
  aadhaar_verified: boolean;
}

export interface LimitsCheckResponse {
  success: boolean;
  allowed: boolean;
  wallet_id: string;
  kyc_tier: 'MINIMUM' | 'FULL';
  txn_type: string;
  amount_paise: string;
}

export interface LimitsUsageResponse {
  wallet_id: string;
  kyc_tier: string;
  current_balance_paise: string;
  monthly_p2p_mtd_paise?: string;
  annual_load_ytd_paise?: string;
}

export interface WalletStatusResponse {
  wallet_id: string;
  user_id: string;
  state: 'ACTIVE' | 'SUSPENDED' | 'DORMANT' | 'EXPIRED' | 'CLOSED';
  kyc_tier: 'MINIMUM' | 'FULL';
  balance_paise: string;
  held_paise: string;
  available_paise: string;
  is_active: boolean;
  wallet_expiry_date?: string;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KycInitiateResponse {
  kyc_profile_id: string;
  kyc_state: string;
  next_step: string;
}

export interface AadhaarOtpSendResponse {
  transaction_id: string;
  expires_in_seconds: number;
}

export interface AadhaarOtpVerifyResponse {
  new_state: string;
  wallet_expiry_date: string;
}
