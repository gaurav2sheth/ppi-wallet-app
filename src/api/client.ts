import axios from 'axios';
import type { ApiError } from '../types/api.types';

const API_BASE = 'http://localhost:3000/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 3000,
  headers: { 'Content-Type': 'application/json' },
});

// Track whether the real API is reachable
export let apiReachable = false;

// Quick health check on init — silent, no console noise
api.get('/health')
  .then(() => { apiReachable = true; console.log('[API] Backend connected at localhost:3000'); })
  .catch(() => { apiReachable = false; console.log('[API] Backend unavailable — using mock data'); });

api.interceptors.response.use(
  (res) => {
    apiReachable = true;
    return res.data;
  },
  (err) => {
    if (!err.response) {
      apiReachable = false;
    }
    const apiError: ApiError = {
      code: err.response?.data?.code ?? 'NETWORK_ERROR',
      message: err.response?.data?.message ?? 'Something went wrong. Please try again.',
      statusCode: err.response?.status ?? 0,
    };
    return Promise.reject(apiError);
  }
);
