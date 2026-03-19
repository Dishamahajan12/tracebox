import { httpClient, unwrapData } from './http';

export const userService = {
  async getCurrentUser(config = {}) {
    const response = await httpClient.get('/api/users/me', config);
    return unwrapData(response);
  },

  async updateCurrentUser(payload) {
    const response = await httpClient.put('/api/users/me', payload);
    return unwrapData(response);
  },
};
