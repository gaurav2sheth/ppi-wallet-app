import axios from 'axios';
import type { ApiError } from '../types/api.types';

// In production (GitHub Pages), use the Render backend; locally try localhost:3000
const RENDER_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = RENDER_URL ? `${RENDER_URL}/api` : 'http://localhost:3000/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: RENDER_URL ? 15000 : 3000,  // Render free tier has cold starts
  headers: { 'Content-Type': 'application/json' },
});

// Track whether the real API is reachable
export let apiReachable = false;

// Quick health check on init — silent, no console noise
const healthUrl = RENDER_URL ? `${RENDER_URL}/health` : '/health';
api.get(healthUrl)
  .then(() => { apiReachable = true; console.log(`[API] Backend connected at ${API_BASE}`); })
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
