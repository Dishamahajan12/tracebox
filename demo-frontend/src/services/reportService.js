import { httpClient, unwrapData } from './http';

function buildParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export const reportService = {
  async getProjectReports(projectId, filters = {}) {
    const response = await httpClient.get(`/api/projects/${projectId}/reports`, {
      params: buildParams(filters),
    });
    return unwrapData(response);
  },

  async createReport(projectId, payload) {
    const response = await httpClient.post(`/api/projects/${projectId}/reports`, payload);
    return unwrapData(response);
  },

  async getReport(reportId) {
    const response = await httpClient.get(`/api/reports/${reportId}`);
    return unwrapData(response);
  },

  async updateReport(reportId, payload) {
    const response = await httpClient.put(`/api/reports/${reportId}`, payload);
    return unwrapData(response);
  },
};
