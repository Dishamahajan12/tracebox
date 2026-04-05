import { ticketService } from './ticketService';

export const taskService = {
  async getProjectTasks(projectId, filters = {}) {
    return ticketService.getProjectTickets(projectId, filters);
  },

  async createTask(projectId, payload) {
    return ticketService.createTicket(projectId, payload);
  },

  async getTask(taskId) {
    return ticketService.getTicket(taskId);
  },

  async updateTask(taskId, payload) {
    return ticketService.updateTicket(taskId, payload);
  },
};
