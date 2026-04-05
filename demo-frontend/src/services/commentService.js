import { httpClient, unwrapData } from './http';

function buildParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export const commentService = {
  async getTicketComments(ticketId, filters = {}) {
    const response = await httpClient.get(`/api/tickets/${ticketId}/comments`, {
      params: buildParams(filters),
    });
    return unwrapData(response);
  },

  async getTaskComments(taskId, filters = {}) {
    return this.getTicketComments(taskId, filters);
  },

  async createComment(ticketId, payload) {
    const response = await httpClient.post(`/api/tickets/${ticketId}/comments`, payload);
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
