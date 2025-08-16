import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthHeader } from './authService';
import api from './apiService';

// Keys for localStorage
const TASKS_CACHE_KEY = 'offline_tasks_cache';
const PENDING_ACTIONS_KEY = 'offline_pending_actions';

class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingActions = this.loadPendingActions();

    // Set up online/offline event listeners
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
  }

  // Handle online/offline status changes
  handleOnlineStatusChange = () => {
    const wasOffline = !this.isOnline;
    this.isOnline = navigator.onLine;
    
    // If we're coming back online, sync pending changes
    if (wasOffline && this.isOnline) {
      this.syncPendingActions();
    }
    
    // Dispatch event for UI components to update
    window.dispatchEvent(new CustomEvent('connectionStatusChanged', {
      detail: { online: this.isOnline }
    }));
  };

  // Check if we're online
  checkOnlineStatus() {
    return this.isOnline;
  }

  // Load cached tasks from localStorage
  loadCachedTasks() {
    const cachedTasks = localStorage.getItem(TASKS_CACHE_KEY);
    return cachedTasks ? JSON.parse(cachedTasks) : [];
  }

  // Save tasks to localStorage
  cacheTasks(tasks) {
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks));
  }

  // Load pending actions from localStorage
  loadPendingActions() {
    const pendingActions = localStorage.getItem(PENDING_ACTIONS_KEY);
    return pendingActions ? JSON.parse(pendingActions) : [];
  }

  // Save pending actions to localStorage
  savePendingActions() {
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(this.pendingActions));
  }

  // Add a pending action to be processed when online
  addPendingAction(action) {
    this.pendingActions.push({
      ...action,
      id: Date.now().toString(), // Unique ID for the action
      timestamp: new Date().toISOString()
    });
    this.savePendingActions();
  }

  // Process all pending actions when back online
  async syncPendingActions() {
    if (!this.isOnline || this.pendingActions.length === 0) return;
    
    console.log('Syncing pending actions:', this.pendingActions.length);
    
    // Create a copy of pending actions to process
    const actionsToProcess = [...this.pendingActions];
    
    // Clear pending actions list before processing
    // (any failures will be re-added)
    this.pendingActions = [];
    this.savePendingActions();
    
    for (const action of actionsToProcess) {
      try {
        await this.processAction(action);
      } catch (error) {
        console.error('Error processing offline action:', error, action);
        // Re-add the action to pending actions if it failed
        this.addPendingAction(action);
      }
    }
    
    // Refresh the local cache after syncing
    this.refreshTasksCache();
    
    // Notify app that sync is complete
    window.dispatchEvent(new CustomEvent('offlineSyncComplete'));
  }

  // Process a single pending action
  async processAction(action) {
    switch (action.type) {
      case 'ADD_TASK':
        await axios.post(`${API_BASE_URL}/tasks`, action.data);
        break;
        
      case 'UPDATE_TASK':
        await axios.put(`${API_BASE_URL}/tasks/${action.data._id}`, action.data);
        break;
        
      case 'DELETE_TASK':
        await axios.delete(`${API_BASE_URL}/tasks/${action.data._id}`);
        break;
        
      default:
        console.warn('Unknown offline action type:', action.type);
    }
  }

  // Get all tasks, either from server or cache
  async getTasks() {
    try {
      if (this.isOnline) {
        // We're online, get from server and update cache
        const response = await axios.get(`${API_BASE_URL}/tasks`);
        this.cacheTasks(response.data);
        return response.data;
      } else {
        // We're offline, get from cache
        return this.loadCachedTasks();
      }
    } catch (error) {
      console.error('Error getting tasks:', error);
      // On error, fall back to cache
      return this.loadCachedTasks();
    }
  }

  // Add a new task (or queue for later if offline)
  async addTask(taskData) {
    const tempId = `temp_${Date.now()}`; // Create a temporary ID
    const task = { ...taskData, _id: tempId, _isOffline: true };
    
    if (this.isOnline) {
      try {
        const response = await axios.post(`${API_BASE_URL}/tasks`, taskData);
        // Update cache with the server response
        const tasks = this.loadCachedTasks();
        this.cacheTasks([...tasks, response.data]);
        return response.data;
      } catch (error) {
        console.error('Error adding task:', error);
        // If API call fails, treat as offline
        this.addToOfflineCache(task);
        this.addPendingAction({
          type: 'ADD_TASK',
          data: taskData
        });
        return task;
      }
    } else {
      // We're offline, add to cache and queue
      this.addToOfflineCache(task);
      this.addPendingAction({
        type: 'ADD_TASK',
        data: taskData
      });
      return task;
    }
  }

  // Update an existing task (or queue for later if offline)
  async updateTask(taskId, taskData) {
    const updatedTask = { ...taskData, _id: taskId };
    
    if (this.isOnline) {
      try {
        const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, taskData);
        // Update cache with the server response
        this.updateLocalCache(response.data);
        return response.data;
      } catch (error) {
        console.error('Error updating task:', error);
        // If API call fails, treat as offline
        this.updateLocalCache(updatedTask);
        this.addPendingAction({
          type: 'UPDATE_TASK',
          data: updatedTask
        });
        return updatedTask;
      }
    } else {
      // We're offline, update cache and queue
      this.updateLocalCache(updatedTask);
      this.addPendingAction({
        type: 'UPDATE_TASK',
        data: updatedTask
      });
      return updatedTask;
    }
  }

  // Delete a task (or queue for later if offline)
  async deleteTask(taskId) {
    if (this.isOnline) {
      try {
        await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
        // Remove from cache
        this.removeFromCache(taskId);
        return true;
      } catch (error) {
        console.error('Error deleting task:', error);
        // If API call fails, treat as offline
        this.removeFromCache(taskId);
        this.addPendingAction({
          type: 'DELETE_TASK',
          data: { _id: taskId }
        });
        return true;
      }
    } else {
      // We're offline, remove from cache and queue
      this.removeFromCache(taskId);
      this.addPendingAction({
        type: 'DELETE_TASK',
        data: { _id: taskId }
      });
      return true;
    }
  }

  // Add a task to the local cache
  addToOfflineCache(task) {
    const tasks = this.loadCachedTasks();
    this.cacheTasks([...tasks, task]);
  }

  // Update a task in the local cache
  updateLocalCache(updatedTask) {
    const tasks = this.loadCachedTasks();
    const updatedTasks = tasks.map(task => 
      task._id === updatedTask._id ? updatedTask : task
    );
    this.cacheTasks(updatedTasks);
  }

  // Remove a task from the local cache
  removeFromCache(taskId) {
    const tasks = this.loadCachedTasks();
    const filteredTasks = tasks.filter(task => task._id !== taskId);
    this.cacheTasks(filteredTasks);
  }

  // Refresh the local cache with server data
  async refreshTasksCache() {
    if (this.isOnline) {
      try {
        const response = await this.fetchTasksFromAPI();
        this.cacheTasks(response);
      } catch (error) {
        console.error('Error refreshing tasks cache:', error);
      }
    }
  }

  // Get tasks from API
  async fetchTasksFromAPI() {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}/tasks`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks from API:', error);
      return [];
    }
  }

  // Create a task on the API
  async createTaskOnAPI(task) {
    try {
      const headers = getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}/tasks`, task, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating task on API:', error);
      throw error;
    }
  }

  // Update a task on the API
  async updateTaskOnAPI(taskId, taskData) {
    try {
      const headers = getAuthHeader();
      const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, taskData, { headers });
      return response.data;
    } catch (error) {
      console.error('Error updating task on API:', error);
      throw error;
    }
  }

  // Delete a task on the API
  async deleteTaskOnAPI(taskId) {
    try {
      const headers = getAuthHeader();
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, { headers });
    } catch (error) {
      console.error('Error deleting task on API:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const offlineService = new OfflineService();
export default offlineService;
