import React, { useState, useEffect } from 'react';
import knowledgeService from '../services/KnowledgeService';
import KnowledgeEntryCard from './KnowledgeEntryCard';
import KnowledgeEntryEditor from './KnowledgeEntryEditor';
import KnowledgeEntryDetail from './KnowledgeEntryDetail';

const KnowledgeBase = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'detail', 'edit'
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    tag: ''
  });
  const [availableTags, setAvailableTags] = useState([]);
  
  useEffect(() => {
    fetchEntries();
    fetchTags();
  }, []);
  
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const entriesData = await knowledgeService.getAllEntries(filters);
      setEntries(entriesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching knowledge entries:', err);
      setError('Failed to load knowledge entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTags = async () => {
    try {
      // Check if getAllTags method exists
      if (typeof knowledgeService.getAllTags !== 'function') {
        console.warn('getAllTags method not available in knowledgeService');
        setAvailableTags([]);
        return;
      }
      
      const tags = await knowledgeService.getAllTags();
      // Make sure tags is an array
      setAvailableTags(Array.isArray(tags) ? tags : []);
    } catch (err) {
      console.error('Error fetching tags:', err);
      // Set empty array on error
      setAvailableTags([]);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const applyFilters = () => {
    fetchEntries();
  };
  
  const resetFilters = () => {
    setFilters({
      category: '',
      search: '',
      tag: ''
    });
    
    // Immediately fetch with reset filters
    knowledgeService.getAllEntries({}).then(data => {
      setEntries(data);
    });
  };
  
  const handleCreateEntry = async (entryData) => {
    try {
      await knowledgeService.createEntry(entryData);
      setCurrentView('list');
      fetchEntries();
      fetchTags();
    } catch (err) {
      console.error('Error creating entry:', err);
      return false;
    }
    return true;
  };
  
  const handleUpdateEntry = async (id, entryData) => {
    try {
      await knowledgeService.updateEntry(id, entryData);
      setCurrentView('detail');
      
      // Refresh the selected entry
      const updatedEntry = await knowledgeService.getEntry(id);
      setSelectedEntry(updatedEntry);
      
      // Refresh the list
      fetchEntries();
      fetchTags();
    } catch (err) {
      console.error('Error updating entry:', err);
      return false;
    }
    return true;
  };
  
  const handleDeleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await knowledgeService.deleteEntry(id);
        setCurrentView('list');
        fetchEntries();
        fetchTags();
      } catch (err) {
        console.error('Error deleting entry:', err);
      }
    }
  };
  
  const viewEntry = async (id) => {
    try {
      const entry = await knowledgeService.getEntry(id);
      setSelectedEntry(entry);
      setCurrentView('detail');
    } catch (err) {
      console.error('Error fetching entry details:', err);
      setError('Failed to load entry details.');
    }
  };
  
  const editEntry = (entry) => {
    setSelectedEntry(entry);
    setCurrentView('edit');
  };
  
  // Render appropriate view based on currentView state
  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <KnowledgeEntryEditor 
            onSave={handleCreateEntry}
            onCancel={() => setCurrentView('list')}
            availableTags={availableTags}
          />
        );
        
      case 'edit':
        return (
          <KnowledgeEntryEditor 
            entry={selectedEntry}
            onSave={(entryData) => handleUpdateEntry(selectedEntry._id, entryData)}
            onCancel={() => setCurrentView('detail')}
            availableTags={availableTags}
          />
        );
        
      case 'detail':
        return (
          <KnowledgeEntryDetail 
            entry={selectedEntry}
            onEdit={() => editEntry(selectedEntry)}
            onDelete={() => handleDeleteEntry(selectedEntry._id)}
            onBack={() => setCurrentView('list')}
          />
        );
        
      case 'list':
      default:
        return (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-grow">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search knowledge base..."
                    className="w-full p-2 border rounded-md"
                    value={filters.search}
                    onChange={handleFilterChange}
                    onKeyPress={e => e.key === 'Enter' && applyFilters()}
                  />
                </div>
                
                <div className="w-full md:w-auto">
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">All Categories</option>
                    <option value="incident">Incidents</option>
                    <option value="solution">Solutions</option>
                    <option value="process">Processes</option>
                    <option value="reference">References</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="w-full md:w-auto">
                  <select
                    name="tag"
                    value={filters.tag}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">All Tags</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={applyFilters}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={resetFilters}
                    className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
            
            {/* Entries List */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Knowledge Base</h3>
              <button
                onClick={() => setCurrentView('create')}
                className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded-md flex items-center text-sm"
              >
                <i className="fas fa-plus mr-1"></i> New Entry
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                <i className="fas fa-book text-4xl text-gray-300"></i>
                <p className="mt-2 text-gray-500">No knowledge entries found.</p>
                <button
                  onClick={() => setCurrentView('create')}
                  className="mt-4 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md"
                >
                  Create First Entry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entries.map(entry => (
                  <KnowledgeEntryCard 
                    key={entry._id} 
                    entry={entry}
                    onClick={() => viewEntry(entry._id)}
                  />
                ))}
              </div>
            )}
          </>
        );
    }
  };
  
  return (
    <div className="space-y-4">
      {renderContent()}
    </div>
  );
};

export default KnowledgeBase;
