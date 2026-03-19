import { httpClient, unwrapData } from './http';

export const taskService = {
  async getProjectTasks(projectId) {
    const response = await httpClient.get(`/api/projects/${projectId}/tasks`);
    return unwrapData(response);
  },

  async createTask(projectId, payload) {
    const response = await httpClient.post(`/api/projects/${projectId}/tasks`, payload);
    return unwrapData(response);
  },

  async getTask(taskId) {
    const response = await httpClient.get(`/api/tasks/${taskId}`);
    return unwrapData(response);
  },

  async updateTask(taskId, payload) {
    const response = await httpClient.put(`/api/tasks/${taskId}`, payload);
    return unwrapData(response);
  },
};
