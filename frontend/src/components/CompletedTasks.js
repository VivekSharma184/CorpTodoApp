import React, { useState, useEffect } from 'react';
import taskService from '../services/TaskService';

const CompletedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      const tasks = await taskService.getTasks();
      const completedTasks = tasks.filter(task => task.completed);
      setTasks(completedTasks);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskService.deleteTask(id);
      setTasks(tasks.filter(task => task._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const restoreTask = async (task) => {
    try {
      const updatedTask = { ...task, completed: false };
      await taskService.updateTask(task._id, updatedTask);
      setTasks(tasks.filter(t => t._id !== task._id));
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  // Sort tasks based on the selected sort criteria
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return 0;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Completed Tasks</h2>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border rounded-md px-2 py-1 text-sm"
          >
            <option value="date">Date Completed</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-10">
          <i className="fas fa-check-circle text-4xl text-gray-300"></i>
          <p className="mt-2 text-gray-500">No completed tasks yet. Complete a task to see it here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <div 
              key={task._id} 
              className="bg-white border rounded-md p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <button 
                    className="mt-1 w-5 h-5 rounded-full bg-primary border-primary flex items-center justify-center"
                  >
                    <i className="fas fa-check text-xs text-white"></i>
                  </button>
                  <div>
                    <h3 className="font-medium line-through text-gray-500">{task.title}</h3>
                    {task.description && <p className="text-gray-400 text-sm mt-1 line-through">{task.description}</p>}
                    <div className="flex items-center mt-2 space-x-3">
                      <span 
                        className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                      >
                        {task.priority === 'high' ? 'High' : 
                         task.priority === 'medium' ? 'Medium' : 'Low'}
                      </span>
                      <span className="text-xs text-gray-400">
                        <i className="far fa-calendar mr-1"></i>
                        Completed on {new Date(task.completedAt || task.updated_at || task.created_at).toLocaleDateString()}
                      </span>
                      {task.actualTime && (
                        <span className="text-xs text-gray-400 ml-2">
                          <i className="far fa-clock mr-1"></i>
                          {task.actualTime} min
                          {task.estimatedTime && (
                            <span className={`ml-1 ${task.actualTime <= task.estimatedTime ? 'text-green-500' : 'text-red-500'}`}>
                              ({task.actualTime <= task.estimatedTime ? '-' : '+'}
                              {Math.abs(task.actualTime - task.estimatedTime)} min)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => restoreTask(task)}
                    className="text-gray-400 hover:text-primary"
                    title="Restore task"
                  >
                    <i className="fas fa-undo"></i>
                  </button>
                  <button 
                    onClick={() => deleteTask(task._id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Delete task"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedTasks;
