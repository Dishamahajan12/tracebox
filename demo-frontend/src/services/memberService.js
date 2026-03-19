import { httpClient, unwrapData } from './http';

export const memberService = {
  async getProjectMembers(projectId) {
    const response = await httpClient.get(`/api/projects/${projectId}/members`);
    return unwrapData(response);
  },

  async addProjectMember(projectId, payload) {
    const response = await httpClient.post(`/api/projects/${projectId}/members`, payload);
    return unwrapData(response);
  },

  async updateProjectMember(projectId, userId, payload) {
    const response = await httpClient.put(`/api/projects/${projectId}/members/${userId}`, payload);
    return unwrapData(response);
  },

  async removeProjectMember(projectId, userId) {
    const response = await httpClient.delete(`/api/projects/${projectId}/members/${userId}`);
    return unwrapData(response);
  },
};
