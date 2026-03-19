import { httpClient, unwrapData } from './http';

export const projectService = {
  async createProject(payload) {
    const response = await httpClient.post('/api/projects', payload);
    return unwrapData(response);
  },

  async getProjects() {
    const response = await httpClient.get('/api/projects');
    return unwrapData(response);
  },

  async getProject(projectId) {
    const response = await httpClient.get(`/api/projects/${projectId}`);
    return unwrapData(response);
  },

  async updateProject(projectId, payload) {
    const response = await httpClient.put(`/api/projects/${projectId}`, payload);
    return unwrapData(response);
  },
};
