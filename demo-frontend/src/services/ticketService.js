import { httpClient, unwrapData } from './http';
import { extractFilename } from '../utils/formatters';

function buildParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export const ticketService = {
  async getProjectTickets(projectId, filters = {}) {
    const response = await httpClient.get(`/api/projects/${projectId}/tickets`, {
      params: buildParams(filters),
    });
    return unwrapData(response);
  },

  async createTicket(projectId, payload) {
    const response = await httpClient.post(`/api/projects/${projectId}/tickets`, payload);
    return unwrapData(response);
  },

  async duplicateCheckTicket(projectId, payload) {
    const response = await httpClient.post(`/api/projects/${projectId}/tickets/duplicate-check`, payload);
    return unwrapData(response);
  },

  async getTicket(ticketId) {
    const response = await httpClient.get(`/api/tickets/${ticketId}`);
    return unwrapData(response);
  },

  async updateTicket(ticketId, payload) {
    const response = await httpClient.put(`/api/tickets/${ticketId}`, payload);
    return unwrapData(response);
  },

  async deleteTicket(ticketId) {
    const response = await httpClient.delete(`/api/tickets/${ticketId}`);
    return unwrapData(response);
  },

  async searchTicketAssignees(projectId, search = '') {
    const response = await httpClient.get(`/api/projects/${projectId}/tickets/assignees`, {
      params: buildParams({ search }),
    });
    return unwrapData(response);
  },

  async lookupTickets(filters = {}) {
    const response = await httpClient.get('/api/tickets/lookup', {
      params: buildParams(filters),
    });
    return unwrapData(response);
  },

  async getDuplicateTickets(ticketId) {
    const response = await httpClient.get(`/api/tickets/${ticketId}/duplicates`);
    return unwrapData(response);
  },

  async getTicketFiles(ticketId) {
    const response = await httpClient.get(`/api/tickets/${ticketId}/files`);
    return unwrapData(response);
  },

  async uploadTicketFile(ticketId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await httpClient.post(`/api/tickets/${ticketId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return unwrapData(response);
  },

  async downloadTicketFile(ticketId, attachmentId) {
    const response = await httpClient.get(`/api/tickets/${ticketId}/files/${attachmentId}`, {
      responseType: 'blob',
    });

    return {
      blob: response.data,
      filename:
        extractFilename(response.headers['content-disposition']) ||
        `ticket-${ticketId}-attachment-${attachmentId}`,
    };
  },

  async getTicketHistory(ticketId) {
    const response = await httpClient.get(`/api/tickets/${ticketId}/history`);
    return unwrapData(response);
  },
};
