import React, { useState } from 'react';
import axios from 'axios';

const QuickAddTask = ({ onTaskAdded }) => {
  const [quickTask, setQuickTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Parse the quick task input to extract potential metadata
  const parseQuickTask = (input) => {
    const task = { title: input, description: '', priority: 'medium', dueDate: '' };
    
    // Check for priority indicators with ! syntax
    if (input.includes('!!! ')) {
      task.priority = 'high';
      task.title = input.replace('!!! ', '');
    } else if (input.includes('!! ')) {
      task.priority = 'medium';
      task.title = input.replace('!! ', '');
    } else if (input.includes('! ')) {
      task.priority = 'low';
      task.title = input.replace('! ', '');
    }
    
    // Check for date keywords
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Format date as YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    if (task.title.toLowerCase().includes('today')) {
      task.dueDate = formatDate(today);
      task.title = task.title.replace(/today/i, '').trim();
    } else if (task.title.toLowerCase().includes('tomorrow')) {
      task.dueDate = formatDate(tomorrow);
      task.title = task.title.replace(/tomorrow/i, '').trim();
    }
    
    // Clean up any double spaces
    task.title = task.title.replace(/\\s+/g, ' ').trim();
    
    return task;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quickTask.trim()) return;
    
    setIsAdding(true);
    
    try {
      const taskData = parseQuickTask(quickTask);
      const response = await axios.post('http://localhost:5001/tasks', taskData);
      setQuickTask('');
      
      // Notify parent component that a task was added
      if (onTaskAdded) {
        onTaskAdded(response.data);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-6">
      <input
        type="text"
        value={quickTask}
        onChange={(e) => setQuickTask(e.target.value)}
        placeholder="Add task quickly (Use '!!!' for high priority, 'today' or 'tomorrow' for due date)"
        className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      <button
        type="submit"
        disabled={isAdding}
        className={`p-2 rounded-md text-white ${
          isAdding ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'
        }`}
      >
        {isAdding ? (
          <i className="fas fa-circle-notch fa-spin"></i>
        ) : (
          <i className="fas fa-plus"></i>
        )}
      </button>
    </form>
  );
};

export default QuickAddTask;
