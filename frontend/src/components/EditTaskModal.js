import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthHeader } from '../services/authService';

const EditTaskModal = ({ task, onClose, onTaskUpdated }) => {
  const [editedTask, setEditedTask] = useState({ ...task });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    setEditedTask({ ...task });
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Create updated task object
    const updatedTask = { ...editedTask, [name]: value };
    
    // Synchronize the status field with the completed flag
    if (name === 'status') {
      // If status is set to completed, also set the completed flag
      if (value === 'completed') {
        updatedTask.completed = true;
        updatedTask.completedAt = new Date().toISOString();
      } 
      // If status is changed from completed to something else, update completed flag
      else if (editedTask.status === 'completed' && value !== 'completed') {
        updatedTask.completed = false;
        updatedTask.completedAt = null;
      }
    }
    
    // Also synchronize in the other direction
    if (name === 'completed') {
      if (value === true) {
        updatedTask.status = 'completed';
        if (!updatedTask.completedAt) {
          updatedTask.completedAt = new Date().toISOString();
        }
      } else if (value === false && updatedTask.status === 'completed') {
        // Default to 'in-progress' when uncompleting a task
        updatedTask.status = 'in-progress';
        updatedTask.completedAt = null;
      }
    }
    
    setEditedTask(updatedTask);
    
    // Debug logging
    console.log('Task updated:', updatedTask);
  };

  const handleTagAdd = () => {
    if (!tagInput.trim()) return;
    
    const newTags = editedTask.tags ? [...editedTask.tags] : [];
    if (!newTags.includes(tagInput.trim())) {
      newTags.push(tagInput.trim());
      setEditedTask({ ...editedTask, tags: newTags });
    }
    setTagInput('');
  };

  const handleTagRemove = (tagToRemove) => {
    const newTags = editedTask.tags.filter(tag => tag !== tagToRemove);
    setEditedTask({ ...editedTask, tags: newTags });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Include auth headers with the request
      const headers = getAuthHeader();
      const response = await axios.put(
        `${API_BASE_URL}/tasks/${task._id}`, 
        editedTask, 
        { headers }
      );
      setLoading(false);
      onTaskUpdated(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Edit Task</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Title */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={editedTask.title || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Task title"
                  required
                />
              </div>

              {/* Priority and Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={editedTask.status || 'new'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={editedTask.priority || 'medium'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={editedTask.category || 'work'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="finance">Finance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Due Date and Estimated Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (minutes)</label>
                <input
                  type="number"
                  name="estimatedTime"
                  value={editedTask.estimatedTime || 30}
                  onChange={handleChange}
                  min="1"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              {/* Location and Reminder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={editedTask.location || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Where will this task take place?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder</label>
                <input
                  type="datetime-local"
                  name="reminder"
                  value={editedTask.reminder ? new Date(editedTask.reminder).toISOString().slice(0, 16) : ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              {/* Recurring */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
                <select
                  name="recurring"
                  value={editedTask.recurring || 'none'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Tags */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex">
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
                <div className="mt-2 flex flex-wrap gap-2">
                  {(editedTask.tags || []).map((tag, index) => (
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
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={editedTask.description || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Task description"
                  rows="3"
                ></textarea>
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={editedTask.notes || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Additional notes"
                  rows="2"
                ></textarea>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 ${
                  loading ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'
                } text-white rounded-md flex items-center`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
