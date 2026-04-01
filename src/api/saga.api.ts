import { api, apiReachable } from './client';
import { mockApi } from './mock';
import { generateIdempotencyKey } from '../utils/idempotency';
import type { SagaResponse } from '../types/api.types';

async function sagaPost(path: string, body: Record<string, unknown>, sagaType: string, amountPaise: number, isCredit: boolean, description?: string): Promise<SagaResponse> {
  try {
    return await api.post(path, { ...body, idempotency_key: generateIdempotencyKey() });
  } catch (err) {
    if (!apiReachable) return mockApi.sagaSuccess(sagaType, amountPaise, isCredit, description);
    throw err;
  }
}

export const sagaApi = {
  addMoney: (wallet_id: string, amount_paise: number) =>
    sagaPost('/saga/add-money', { wallet_id, amount_paise }, 'ADD_MONEY', amount_paise, true, 'Wallet Top-up'),

  merchantPay: (wallet_id: string, merchant_id: string, amount_paise: number) =>
    sagaPost('/saga/merchant-pay', { wallet_id, merchant_id, amount_paise }, 'MERCHANT_PAY', amount_paise, false, `Payment to ${merchant_id}`),

  p2pTransfer: (wallet_id: string, beneficiary_wallet_id: string, amount_paise: number) =>
    sagaPost('/saga/p2p-transfer', { wallet_id, beneficiary_wallet_id, amount_paise }, 'P2P_TRANSFER', amount_paise, false, `Transfer to ${beneficiary_wallet_id.slice(0, 8)}...`),

  walletToBank: (wallet_id: string, amount_paise: number, bank_account: string, ifsc: string) =>
    sagaPost('/saga/wallet-to-bank', { wallet_id, amount_paise, bank_account, ifsc }, 'WALLET_TO_BANK', amount_paise, false, `Bank Transfer A/C ${bank_account}`),

  billPay: (wallet_id: string, biller_id: string, biller_ref: string, amount_paise: number) =>
    sagaPost('/saga/bill-pay', { wallet_id, biller_id, biller_ref, amount_paise }, 'BILL_PAY', amount_paise, false, `Bill Pay - ${biller_id}`),
};
