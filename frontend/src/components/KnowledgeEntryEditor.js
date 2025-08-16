import React, { useState, useEffect } from 'react';
import QuillEditor from './QuillEditor';

const KnowledgeEntryEditor = ({ entry = null, onSave, onCancel, availableTags = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'reference',
    tags: [],
    status: 'published'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');
  
  // Initialize form with entry data if editing
  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || '',
        content: entry.content || '',
        category: entry.category || 'reference',
        tags: entry.tags || [],
        status: entry.status || 'published'
      });
    }
  }, [entry]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagAdd = () => {
    if (!tagInput.trim()) return;
    
    // Check if tag already exists
    if (formData.tags.includes(tagInput.trim())) {
      setTagInput('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));
    
    setTagInput('');
  };
  
  const handleTagRemove = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  const handleTagSelect = (tag) => {
    if (formData.tags.includes(tag)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const success = await onSave(formData);
      if (success) {
        // Form submission was successful
        setFormData({
          title: '',
          content: '',
          category: 'reference',
          tags: [],
          status: 'published'
        });
      }
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">
        {entry ? 'Edit Knowledge Entry' : 'Create Knowledge Entry'}
      </h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            placeholder="Entry title"
            required
          />
        </div>
        
        {/* Category and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="incident">Incident</option>
              <option value="solution">Solution</option>
              <option value="process">Process</option>
              <option value="reference">Reference</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        
        {/* Content - Markdown Editor */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <QuillEditor 
            value={formData.content} 
            onChange={(value) => {
              setFormData(prev => ({ ...prev, content: value }));
            }} 
            height="400px" 
          />
          <p className="text-xs text-gray-500 mt-1">
            Use the formatting toolbar to add headings, lists, code blocks and more.
          </p>
        </div>
        
        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="flex-grow p-2 border rounded-l-md"
              placeholder="Add tag and press Enter"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
            />
            <button
              type="button"
              onClick={handleTagAdd}
              className="bg-gray-200 px-3 rounded-r-md hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          
          {/* Display current tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag, index) => (
              <div key={index} className="bg-gray-100 px-2 py-1 rounded-md flex items-center">
                <span className="text-sm">{tag}</span>
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="ml-1 text-gray-500 hover:text-red-500"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
          
          {/* Suggested tags */}
          {availableTags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Suggested tags:</p>
              <div className="flex flex-wrap gap-1">
                {availableTags
                  .filter(tag => !formData.tags.includes(tag))
                  .slice(0, 10)
                  .map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTagSelect(tag)}
                      className="text-xs bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded border border-gray-200"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className={`px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md flex items-center ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-circle-notch fa-spin mr-2"></i>
                {entry ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              entry ? 'Save Changes' : 'Create Entry'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KnowledgeEntryEditor;
