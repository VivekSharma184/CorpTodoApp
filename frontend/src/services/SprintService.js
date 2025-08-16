import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthHeader } from './authService';

class SprintService {
  // Get all sprints
  async getAllSprints() {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}/sprints`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching sprints:', error);
      throw error;
    }
  }

  // Get sprint details
  async getSprint(sprintId) {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}/sprints/${sprintId}`, { headers });
      return response.data;
    } catch (error) {
      console.error(`Error fetching sprint ${sprintId}:`, error);
      throw error;
    }
  }

  // Create a new sprint
  async createSprint(sprintData) {
    try {
      const headers = getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}/sprints`, sprintData, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating sprint:', error);
      throw error;
    }
  }

  // Update a sprint
  async updateSprint(sprintId, sprintData) {
    try {
      const headers = getAuthHeader();
      const response = await axios.put(`${API_BASE_URL}/sprints/${sprintId}`, sprintData, { headers });
      return response.data;
    } catch (error) {
      console.error(`Error updating sprint ${sprintId}:`, error);
      throw error;
    }
  }

  // Delete a sprint
  async deleteSprint(sprintId) {
    try {
      const headers = getAuthHeader();
      const response = await axios.delete(`${API_BASE_URL}/sprints/${sprintId}`, { headers });
      return response.data;
    } catch (error) {
      console.error(`Error deleting sprint ${sprintId}:`, error);
      throw error;
    }
  }

  // Get burndown chart data for a sprint
  async getBurndownData(sprintId) {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}/sprints/${sprintId}/burndown`, { headers });
      return response.data;
    } catch (error) {
      console.error(`Error fetching burndown data for sprint ${sprintId}:`, error);
      throw error;
    }
  }

  // Add a task to a sprint
  async addTaskToSprint(sprintId, taskId) {
    try {
      const headers = getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}/sprints/${sprintId}/tasks`, { taskId }, { headers });
      return response.data;
    } catch (error) {
      console.error(`Error adding task to sprint ${sprintId}:`, error);
      throw error;
    }
  }

  // Remove a task from a sprint
  async removeTaskFromSprint(sprintId, taskId) {
    try {
      const headers = getAuthHeader();
      const response = await axios.delete(`${API_BASE_URL}/sprints/${sprintId}/tasks/${taskId}`, { headers });
      return response.data;
    } catch (error) {
      console.error(`Error removing task from sprint ${sprintId}:`, error);
      throw error;
    }
  }
}

export default new SprintService();
