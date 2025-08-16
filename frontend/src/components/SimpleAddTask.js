import React, { useState } from 'react';
import taskService from '../services/TaskService';

const SimpleAddTask = ({ onTaskAdded }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  const [task, setTask] = useState({
    title: '',
    dueDate: getTodayDate(), // Default to today's date
    priority: 'medium',
    category: 'work', // Default to work category
    status: 'in-progress' // Default to in-progress
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask({ ...task, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!task.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const addedTask = await taskService.addTask(task);
      
      // Reset form
      setTask({
        title: '',
        dueDate: getTodayDate(), // Reset to today's date
        priority: 'medium',
        category: 'work', // Reset to work category
        status: 'in-progress' // Reset to in-progress
      });
      
      setIsExpanded(false);
      setLoading(false);
      
      // Notify parent
      if (onTaskAdded) {
        onTaskAdded(addedTask);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTask({
      title: '',
      dueDate: getTodayDate(), // Reset to today's date
      priority: 'medium',
      category: 'work', // Reset to work category
      status: 'in-progress' // Reset to in-progress
    });
    setIsExpanded(false);
    setError(null);
  };

  // Get tomorrow's date in YYYY-MM-DD format for the datepicker max date
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 text-left text-gray-500 hover:bg-gray-50 rounded-lg flex items-center"
        >
          <i className="fas fa-plus text-gray-400 mr-3"></i>
          <span>Add new task...</span>
        </button>
      ) : (
        <div className="p-4">
          <h3 className="text-lg font-medium mb-4">Add New Task</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title*
              </label>
              <input
                type="text"
                name="title"
                value={task.title}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={task.dueDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={task.status}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={task.priority}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={task.category}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Category</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="finance">Finance</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
                    Adding...
                  </>
                ) : (
                  'Add Task'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SimpleAddTask;
