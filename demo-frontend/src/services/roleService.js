import { httpClient, unwrapData } from './http';

export const roleService = {
  async getRoles() {
    const response = await httpClient.get('/api/roles');
    return unwrapData(response);
  },
};
