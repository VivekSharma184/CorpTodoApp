import offlineService from './OfflineService';
import { TaskAPI } from './apiService';
import { getCurrentUser } from './authService';

/**
 * TaskService - API wrapper that handles both online and offline operations
 */
class TaskService {
  // Get all tasks
  async getTasks() {
    // Check if user is authenticated
    const user = getCurrentUser();
    if (!user) {
      console.error('User not authenticated, cannot fetch tasks');
      return [];
    }
    
    try {
      // Try to use authenticated API first
      if (navigator.onLine) {
        const tasks = await TaskAPI.getAllTasks();
        return tasks;
      } else {
        // Fall back to offline service if offline
        return offlineService.getTasks();
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return offlineService.getTasks(); // Fallback to cached tasks
    }
  }
  
  // Add a new task
  async addTask(taskData) {
    try {
      if (navigator.onLine) {
        const result = await TaskAPI.createTask(taskData);
        return result;
      } else {
        return offlineService.addTask(taskData);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      return offlineService.addTask(taskData); // Try offline as fallback
    }
  }
  
  // Update a task
  async updateTask(taskId, taskData) {
    try {
      if (navigator.onLine) {
        const result = await TaskAPI.updateTask(taskId, taskData);
        return result;
      } else {
        return offlineService.updateTask(taskId, taskData);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      return offlineService.updateTask(taskId, taskData); // Try offline as fallback
    }
  }
  
  // Delete a task
  async deleteTask(taskId) {
    try {
      if (navigator.onLine) {
        await TaskAPI.deleteTask(taskId);
        return { success: true };
      } else {
        return offlineService.deleteTask(taskId);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      return offlineService.deleteTask(taskId); // Try offline as fallback
    }
  }
  
  // Check if we're online
  isOnline() {
    return offlineService.checkOnlineStatus();
  }
  
  // Get number of pending sync actions
  getPendingActionsCount() {
    return offlineService.loadPendingActions().length;
  }
  
  // Force sync of pending actions
  syncPendingActions() {
    return offlineService.syncPendingActions();
  }
  
  // Add listeners for online/offline events
  addConnectionStatusListener(callback) {
    const handler = (event) => {
      callback(event.detail.online);
    };
    
    window.addEventListener('connectionStatusChanged', handler);
    
    // Return a function to remove the listener
    return () => {
      window.removeEventListener('connectionStatusChanged', handler);
    };
  }
  
  // Add listeners for sync complete events
  addSyncCompleteListener(callback) {
    const handler = () => {
      callback();
    };
    
    window.addEventListener('offlineSyncComplete', handler);
    
    // Return a function to remove the listener
    return () => {
      window.removeEventListener('offlineSyncComplete', handler);
    };
  }
}

// Create a singleton instance
const taskService = new TaskService();
export default taskService;
