import { httpClient, unwrapData } from './http';

export const commentService = {
  async getTaskComments(taskId) {
    const response = await httpClient.get(`/api/tasks/${taskId}/comments`);
    return unwrapData(response);
  },

  async createComment(taskId, payload) {
    const response = await httpClient.post(`/api/tasks/${taskId}/comments`, payload);
    return unwrapData(response);
  },

  async updateComment(commentId, payload) {
    const response = await httpClient.put(`/api/comments/${commentId}`, payload);
    return unwrapData(response);
  },

  async deleteComment(commentId) {
    const response = await httpClient.delete(`/api/comments/${commentId}`);
    return unwrapData(response);
  },
};
