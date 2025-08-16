import React, { useState, useEffect } from 'react';
import taskService from '../services/TaskService';
import SimpleAddTask from './SimpleAddTask';

const FocusView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('today');
  const [completingTask, setCompletingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasks = await taskService.getTasks();
      setTasks(tasks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again.');
      setLoading(false);
    }
  };
  
  // Handler for when a new task is added
  const handleTaskAdded = (newTask) => {
    setTasks([...tasks, newTask]);
  };

  const toggleTaskCompletion = async (task) => {
    try {
      // If task is being marked as completed
      if (!task.completed) {
        setCompletingTask(task);
        return;
      }

      // Otherwise, just mark it as incomplete
      const updatedTask = { ...task, completed: false, completedAt: null };
      const result = await taskService.updateTask(task._id, updatedTask);
      
      setTasks(tasks.map(t => 
        t._id === task._id ? result : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  // Filter tasks based on the active filter
  const getFilteredTasks = () => {
    if (!tasks) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    const incomplete = tasks.filter(task => !task.completed);

    switch (activeFilter) {
      case 'today':
        return incomplete.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      
      case 'this-week':
        return incomplete.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today && dueDate <= endOfWeek;
        });
        
      case 'important':
        return incomplete.filter(task => task.priority === 'high');
        
      case 'upcoming':
        return incomplete.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate > today;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
      case 'no-date':
        return incomplete.filter(task => !task.dueDate);
        
      default:
        return incomplete;
    }
  };

  // Group tasks by priority
  const groupTasksByPriority = (filteredTasks) => {
    const highPriority = filteredTasks.filter(task => task.priority === 'high');
    const mediumPriority = filteredTasks.filter(task => task.priority === 'medium');
    const lowPriority = filteredTasks.filter(task => 
      task.priority === 'low' || !task.priority
    );
    
    return { highPriority, mediumPriority, lowPriority };
  };

  const filteredTasks = getFilteredTasks();
  const groupedTasks = groupTasksByPriority(filteredTasks);

  const renderTaskGroup = (tasks, title, priorityClass) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 ${priorityClass}`}>{title}</h3>
        <div className="space-y-2">
          {tasks.map(task => (
            <div 
              key={task._id}
              className="bg-white rounded-lg shadow-sm p-3 border-l-4 hover:shadow transition-shadow"
              style={{ borderLeftColor: getPriorityColor(task.priority) }}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTaskCompletion(task)}
                  className="w-5 h-5 mr-3 cursor-pointer"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{task.title}</h4>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    {task.dueDate && (
                      <span className="mr-3">
                        <i className="far fa-calendar mr-1"></i>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.category && (
                      <span className="mr-3 px-2 py-1 rounded-full bg-gray-100">
                        {task.category}
                      </span>
                    )}
                    {task.estimatedTime && (
                      <span className="mr-3">
                        <i className="far fa-clock mr-1"></i>
                        {task.estimatedTime} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#ef4444'; // red-500
      case 'medium': return '#f59e0b'; // amber-500
      case 'low': return '#3b82f6'; // blue-500
      default: return '#6b7280'; // gray-500
    }
  };

  const getFilterLabel = () => {
    switch(activeFilter) {
      case 'today': return "Today's Tasks";
      case 'this-week': return "This Week";
      case 'important': return "Important Tasks";
      case 'upcoming': return "Upcoming Tasks";
      case 'no-date': return "Tasks Without Due Date";
      default: return "Focus View";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex overflow-x-auto pb-2 mb-6 border-b">
        <button
          onClick={() => setActiveFilter('today')}
          className={`px-4 py-2 whitespace-nowrap ${
            activeFilter === 'today'
              ? 'text-primary font-medium border-b-2 border-primary'
              : 'text-gray-600'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveFilter('this-week')}
          className={`px-4 py-2 whitespace-nowrap ${
            activeFilter === 'this-week'
              ? 'text-primary font-medium border-b-2 border-primary'
              : 'text-gray-600'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setActiveFilter('important')}
          className={`px-4 py-2 whitespace-nowrap ${
            activeFilter === 'important'
              ? 'text-primary font-medium border-b-2 border-primary'
              : 'text-gray-600'
          }`}
        >
          Important
        </button>
        <button
          onClick={() => setActiveFilter('upcoming')}
          className={`px-4 py-2 whitespace-nowrap ${
            activeFilter === 'upcoming'
              ? 'text-primary font-medium border-b-2 border-primary'
              : 'text-gray-600'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveFilter('no-date')}
          className={`px-4 py-2 whitespace-nowrap ${
            activeFilter === 'no-date'
              ? 'text-primary font-medium border-b-2 border-primary'
              : 'text-gray-600'
          }`}
        >
          No Due Date
        </button>
      </div>

      {/* Simple Add Task */}
      <SimpleAddTask onTaskAdded={handleTaskAdded} />
      
      <h2 className="text-xl font-bold mb-6">{getFilterLabel()}</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="text-center py-10">
          <i className="fas fa-check-circle text-4xl text-gray-300"></i>
          <p className="text-gray-500 mt-2">No tasks to focus on right now!</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeFilter === 'today'
              ? "Enjoy your day or add tasks for today."
              : activeFilter === 'important'
              ? "No high-priority tasks at the moment."
              : "Add some tasks to get started."}
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-semibold">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                </span>
                <span className="text-sm text-gray-500 ml-2">to focus on</span>
              </div>
              <div className="text-sm text-gray-500">
                Estimated time: {filteredTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0)} minutes
              </div>
            </div>
          </div>

          {renderTaskGroup(
            groupedTasks.highPriority, 
            'High Priority', 
            'text-red-600'
          )}
          
          {renderTaskGroup(
            groupedTasks.mediumPriority, 
            'Medium Priority', 
            'text-amber-600'
          )}
          
          {renderTaskGroup(
            groupedTasks.lowPriority, 
            'Low Priority', 
            'text-blue-600'
          )}
        </div>
      )}
    </div>
  );
};

export default FocusView;
