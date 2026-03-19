import { httpClient, unwrapData } from './http';

function extractAuthPayload(response) {
  const data = unwrapData(response);

  if (data?.token) {
    return data;
  }

  const authorizationHeader = response.headers?.authorization || response.headers?.Authorization;
  const headerToken = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : '';

  if (response.data?.token || headerToken) {
    return {
      token: response.data?.token || headerToken,
      user: response.data?.user || data?.user || null,
    };
  }

  return data;
}

export const authService = {
  async signup(payload) {
    const response = await httpClient.post('/api/auth/signup', payload);
    return extractAuthPayload(response);
  },

  async login(payload) {
    const response = await httpClient.post('/api/auth/login', payload);
    return extractAuthPayload(response);
  },

  async forgotPassword(payload) {
    const response = await httpClient.post('/api/auth/forgot-password', payload);
    return unwrapData(response);
  },

  async verifyOtp(payload) {
    const response = await httpClient.post('/api/auth/verify-otp', payload);
    return unwrapData(response);
  },

  async resetPassword(payload) {
    const response = await httpClient.post('/api/auth/reset-password', payload);
    return unwrapData(response);
  },
};
