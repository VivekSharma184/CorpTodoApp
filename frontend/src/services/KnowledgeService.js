import { API_BASE_URL } from '../config';
import axios from 'axios';
import { getAuthHeader } from './authService';

// Keys for localStorage
const KNOWLEDGE_CACHE_KEY = 'offline_knowledge_cache';
const PENDING_KNOWLEDGE_ACTIONS_KEY = 'offline_pending_knowledge_actions';

class KnowledgeService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingActions = this.loadPendingActions();
    
    // Set up event listeners for online/offline status
    window.addEventListener('online', this.handleConnectionChange);
    window.addEventListener('offline', this.handleConnectionChange);
  }
  
  handleConnectionChange = () => {
    const wasOffline = !this.isOnline;
    this.isOnline = navigator.onLine;
    
    if (wasOffline && this.isOnline) {
      this.syncPendingActions();
    }
  };
  
  // Cache management
  loadCachedEntries() {
    const cachedEntries = localStorage.getItem(KNOWLEDGE_CACHE_KEY);
    return cachedEntries ? JSON.parse(cachedEntries) : [];
  }
  
  cacheEntries(entries) {
    localStorage.setItem(KNOWLEDGE_CACHE_KEY, JSON.stringify(entries));
  }
  
  loadPendingActions() {
    const pendingActions = localStorage.getItem(PENDING_KNOWLEDGE_ACTIONS_KEY);
    return pendingActions ? JSON.parse(pendingActions) : [];
  }
  
  savePendingActions() {
    localStorage.setItem(PENDING_KNOWLEDGE_ACTIONS_KEY, JSON.stringify(this.pendingActions));
  }
  
  addPendingAction(action) {
    this.pendingActions.push(action);
    this.savePendingActions();
  }
  
  removePendingAction(index) {
    this.pendingActions.splice(index, 1);
    this.savePendingActions();
  }
  
  // Add to local cache
  addToOfflineCache(entry) {
    const entries = this.loadCachedEntries();
    entries.push(entry);
    this.cacheEntries(entries);
  }
  
  // Update in local cache
  updateLocalCache(entry) {
    const entries = this.loadCachedEntries();
    const index = entries.findIndex(e => e._id === entry._id);
    
    if (index !== -1) {
      entries[index] = { ...entries[index], ...entry };
    } else {
      entries.push(entry);
    }
    
    this.cacheEntries(entries);
  }
  
  // Remove from cache
  removeFromCache(id) {
    const entries = this.loadCachedEntries();
    const filteredEntries = entries.filter(entry => entry._id !== id);
    this.cacheEntries(filteredEntries);
  }
  
  // Get all knowledge entries
  async getAllEntries(filters = {}) {
    try {
      if (this.isOnline) {
        // Build query parameters
        const params = new URLSearchParams();
        
        if (filters.category) params.append('category', filters.category);
        if (filters.status) params.append('status', filters.status);
        if (filters.tag) params.append('tag', filters.tag);
        if (filters.search) params.append('search', filters.search);
        
        const url = `${API_BASE_URL}/knowledge${params.toString() ? '?' + params.toString() : ''}`;
        const headers = getAuthHeader();
        const response = await axios.get(url, { headers });
        
        // Update cache
        this.cacheEntries(response.data);
        return response.data;
      } else {
        // Return from cache when offline
        const entries = this.loadCachedEntries();
        
        // Apply filters on the client side
        return this.filterEntries(entries, filters);
      }
    } catch (error) {
      console.error('Error fetching knowledge entries:', error);
      
      // Fall back to cache on error
      const entries = this.loadCachedEntries();
      return this.filterEntries(entries, filters);
    }
  }
  
  // Get all unique tags from knowledge entries
  async getAllTags() {
    try {
      if (this.isOnline) {
        // Get tags from the server
        const headers = getAuthHeader();
        const response = await axios.get(`${API_BASE_URL}/knowledge/tags`, { headers });
        return response.data || [];
      } else {
        // Extract tags from cached entries when offline
        const entries = this.loadCachedEntries();
        const allTags = entries.reduce((tags, entry) => {
          if (entry.tags && Array.isArray(entry.tags)) {
            return [...tags, ...entry.tags];
          }
          return tags;
        }, []);
        
        // Return unique tags
        return [...new Set(allTags)];
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      
      // Fall back to extracting tags from cache on error
      const entries = this.loadCachedEntries();
      const allTags = entries.reduce((tags, entry) => {
        if (entry.tags && Array.isArray(entry.tags)) {
          return [...tags, ...entry.tags];
        }
        return tags;
      }, []);
      
      return [...new Set(allTags)];
    }
  }
  
  // Filter entries on client side (for offline mode)
  filterEntries(entries, filters) {
    let filtered = [...entries];
    
    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    
    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    } else {
      // By default, don't show archived entries
      filtered = filtered.filter(e => e.status !== 'archived');
    }
    
    if (filters.tag) {
      filtered = filtered.filter(e => e.tags && e.tags.includes(filters.tag));
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchLower) || 
        e.content.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }
  
  // Get a single knowledge entry by ID
  async getEntry(id) {
    try {
      if (this.isOnline) {
        const headers = getAuthHeader();
        const response = await axios.get(`${API_BASE_URL}/knowledge/${id}`, { headers });
        return response.data;
      } else {
        const entries = this.loadCachedEntries();
        return entries.find(entry => entry._id === id);
      }
    } catch (error) {
      console.error(`Error fetching knowledge entry ${id}:`, error);
      
      // Fall back to cache
      const entries = this.loadCachedEntries();
      return entries.find(entry => entry._id === id);
    }
  }
  
  // Create a new entry
  async createEntry(entryData) {
    try {
      if (this.isOnline) {
        const headers = getAuthHeader();
        const response = await axios.post(`${API_BASE_URL}/knowledge`, entryData, { headers });
        
        // Update cache
        const entries = this.loadCachedEntries();
        this.cacheEntries([...entries, response.data]);
        
        return response.data;
      } else {
        // Store offline
        const tempId = `temp_${Date.now()}`;
        const entry = { ...entryData, _id: tempId, _isOffline: true };
        this.addToOfflineCache(entry);
        this.addPendingAction({
          type: 'CREATE_ENTRY',
          data: entryData
        });
        
        return entry;
      }
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      
      // Store offline
      const tempId = `temp_${Date.now()}`;
      const entry = { ...entryData, _id: tempId, _isOffline: true };
      this.addToOfflineCache(entry);
      this.addPendingAction({
        type: 'CREATE_ENTRY',
        data: entryData
      });
      
      return entry;
    }
  }
  
  // Update an existing entry
  async updateEntry(id, entryData) {
    try {
      if (this.isOnline) {
        const headers = getAuthHeader();
        const response = await axios.put(`${API_BASE_URL}/knowledge/${id}`, entryData, { headers });
        
        // Update cache
        this.updateLocalCache(response.data);
        
        return response.data;
      } else {
        // Update offline
        const updatedEntry = { ...entryData, _id: id };
        this.updateLocalCache(updatedEntry);
        this.addPendingAction({
          type: 'UPDATE_ENTRY',
          data: updatedEntry
        });
        
        return updatedEntry;
      }
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      
      // Update offline
      const updatedEntry = { ...entryData, _id: id };
      this.updateLocalCache(updatedEntry);
      this.addPendingAction({
        type: 'UPDATE_ENTRY',
        data: updatedEntry
      });
      
      return updatedEntry;
    }
  }
  
  // Delete an entry
  async deleteEntry(id) {
    try {
      if (this.isOnline) {
        const headers = getAuthHeader();
        await axios.delete(`${API_BASE_URL}/knowledge/${id}`, { headers });
        
        // Remove from cache
        this.removeFromCache(id);
        
        return true;
      } else {
        // Offline mode
        this.removeFromCache(id);
        this.addPendingAction({
          type: 'DELETE_ENTRY',
          data: { _id: id }
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
      
      // Still remove from cache even on error
      this.removeFromCache(id);
      this.addPendingAction({
        type: 'DELETE_ENTRY',
        data: { _id: id }
      });
      
      return false;
    }
  }
  
  // Process pending actions when back online
  async syncPendingActions() {
    if (!this.isOnline || this.pendingActions.length === 0) {
      return;
    }
    
    console.log(`Processing ${this.pendingActions.length} pending knowledge base actions`);
    
    // Clone the pending actions to work with
    const actions = [...this.pendingActions];
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      try {
        switch (action.type) {
          case 'CREATE_ENTRY':
            await this.processPendingCreate(action.data, i);
            break;
          case 'UPDATE_ENTRY':
            await this.processPendingUpdate(action.data, i);
            break;
          case 'DELETE_ENTRY':
            await this.processPendingDelete(action.data._id, i);
            break;
          default:
            console.warn(`Unknown action type: ${action.type}`);
            this.removePendingAction(i);
        }
      } catch (error) {
        console.error(`Error processing action ${action.type}:`, error);
      }
    }
  }
  
  // Process a pending create action
  async processPendingCreate(entryData, actionIndex) {
    try {
      const headers = getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}/knowledge`, entryData, { headers });
      
      // Update cache
      const entries = this.loadCachedEntries();
      const updatedEntries = entries.map(entry => {
        // Replace the temporary entry with the real one
        if (entry._isOffline && entry.title === entryData.title) {
          return response.data;
        }
        return entry;
      });
      
      this.cacheEntries(updatedEntries);
      this.removePendingAction(actionIndex);
      
    } catch (error) {
      console.error('Error processing pending create:', error);
      // Keep the action in the queue to try again later
    }
  }
  
  // Process a pending update action
  async processPendingUpdate(entryData, actionIndex) {
    try {
      // Skip if the entry has a temporary ID
      if (entryData._id.startsWith('temp_')) {
        this.removePendingAction(actionIndex);
        return;
      }
      
      const headers = getAuthHeader();
      const response = await axios.put(`${API_BASE_URL}/knowledge/${entryData._id}`, entryData, { headers });
      
      // Update cache
      this.updateLocalCache(response.data);
      this.removePendingAction(actionIndex);
      
    } catch (error) {
      console.error('Error processing pending update:', error);
      // Keep the action in the queue to try again later
    }
  }
  
  // Process a pending delete action
  async processPendingDelete(id, actionIndex) {
    try {
      // Skip if the entry has a temporary ID
      if (id.startsWith('temp_')) {
        this.removePendingAction(actionIndex);
        return;
      }
      
      const headers = getAuthHeader();
      await axios.delete(`${API_BASE_URL}/knowledge/${id}`, { headers });
      
      // Should already be removed from cache
      this.removePendingAction(actionIndex);
      
    } catch (error) {
      console.error('Error processing pending delete:', error);
      // Keep the action in the queue to try again later
    }
  }
  
  // Refresh the cache from the server
  async refreshKnowledgeCache() {
    if (this.isOnline) {
      try {
        const headers = getAuthHeader();
        const response = await axios.get(`${API_BASE_URL}/knowledge`, { headers });
        this.cacheEntries(response.data);
      } catch (error) {
        console.error('Error refreshing knowledge cache:', error);
      }
    }
  }
}

// Create a singleton instance
const knowledgeService = new KnowledgeService();

export default knowledgeService;
