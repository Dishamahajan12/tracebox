import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { loadStoredAuth } from '../utils/storage';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

httpClient.interceptors.request.use((config) => {
  const { token } = loadStoredAuth();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const shouldHandleUnauthorized =
      error?.response?.status === 401 &&
      !error?.config?.skipAuthHandling &&
      !error?.config?.url?.includes('/api/auth/');

    if (shouldHandleUnauthorized && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tracebox:unauthorized'));
    }

    return Promise.reject(error);
  },
);

export function unwrapData(response) {
  return response.data?.data;
}
