import { api, apiReachable } from './client';
import { mockApi } from './mock';
import type { KycStatusResponse, KycInitiateResponse, AadhaarOtpSendResponse, AadhaarOtpVerifyResponse } from '../types/api.types';
import { v4 as uuidv4 } from 'uuid';

export const kycApi = {
  getStatus: async (walletId: string): Promise<KycStatusResponse> => {
    try {
      return await api.get(`/kyc/status/${walletId}`);
    } catch (err) {
      if (!apiReachable) return mockApi.getKycStatus(walletId);
      throw err;
    }
  },

  initiate: async (body: { wallet_id: string; name: string; dob: string; gender?: string }): Promise<KycInitiateResponse> => {
    try {
      return await api.post('/kyc/initiate', body);
    } catch (err) {
      if (!apiReachable) return { kyc_profile_id: uuidv4(), kyc_state: 'MIN_KYC', next_step: 'AADHAAR_OTP' };
      throw err;
    }
  },

  sendAadhaarOtp: async (body: { wallet_id: string; aadhaar_number: string; transaction_id: string }): Promise<AadhaarOtpSendResponse> => {
    try {
      return await api.post('/kyc/aadhaar/otp-send', body);
    } catch (err) {
      if (!apiReachable) return { transaction_id: body.transaction_id, expires_in_seconds: 300 };
      throw err;
    }
  },

  verifyAadhaarOtp: async (body: { wallet_id: string; aadhaar_number: string; otp: string; transaction_id: string }): Promise<AadhaarOtpVerifyResponse> => {
    try {
      return await api.post('/kyc/aadhaar/otp-verify', body);
    } catch (err) {
      if (!apiReachable) {
        const exp = new Date();
        exp.setMonth(exp.getMonth() + 12);
        return { new_state: 'MIN_KYC', wallet_expiry_date: exp.toISOString().split('T')[0] };
      }
      throw err;
    }
  },
};
