import { httpClient, unwrapData } from './http';

export const adminService = {
  async getDashboard() {
    const response = await httpClient.get('/api/admin/dashboard');
    return unwrapData(response);
  },

  async getUsers() {
    const response = await httpClient.get('/api/admin/users');
    return unwrapData(response);
  },

  async updateUser(userId, payload) {
    const response = await httpClient.put(`/api/admin/users/${userId}`, payload);
    return unwrapData(response);
  },
};
