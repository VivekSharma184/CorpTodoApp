import React, { useState, useEffect } from 'react';
import { TaskAPI } from '../services/apiService';

const TodayPlan = () => {
  const [tasks, setTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planningMode, setPlanningMode] = useState(false);
  const [morningReflection, setMorningReflection] = useState('');

  useEffect(() => {
    fetchTasks();
    // Check if we've already done morning reflection today
    const lastReflectionDate = localStorage.getItem('lastMorningReflectionDate');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastReflectionDate !== today) {
      setPlanningMode(true);
    }
    
    // Load saved reflection for today if it exists
    const savedReflection = localStorage.getItem('morningReflection_' + today);
    if (savedReflection) {
      setMorningReflection(savedReflection);
    }
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await TaskAPI.getAllTasks();
      
      // Filter only non-completed tasks
      const incompleteTasks = allTasks.filter(task => !task.completed);
      setTasks(incompleteTasks);
      
      // Get tasks marked for today
      const today = new Date().toISOString().split('T')[0];
      const tasksForToday = incompleteTasks.filter(task => {
        if (task.plannedForToday) return true;
        if (task.dueDate === today) return true;
        return false;
      });
      
      setTodayTasks(tasksForToday);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
      setLoading(false);
    }
  };

  const markTaskForToday = async (task) => {
    try {
      const updatedTask = { ...task, plannedForToday: true };
      await axios.put(`${API_BASE_URL}/tasks/${task._id}`, updatedTask);
      
      // Update local state
      setTasks(tasks.map(t => t._id === task._id ? updatedTask : t));
      setTodayTasks([...todayTasks, updatedTask]);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const removeTaskFromToday = async (task) => {
    try {
      const updatedTask = { ...task, plannedForToday: false };
      await axios.put(`${API_BASE_URL}/tasks/${task._id}`, updatedTask);
      
      // Update local state
      setTasks(tasks.map(t => t._id === task._id ? updatedTask : t));
      setTodayTasks(todayTasks.filter(t => t._id !== task._id));
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const toggleTaskCompletion = async (task) => {
    try {
      const updatedTask = { 
        ...task, 
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      };
      
      await axios.put(`${API_BASE_URL}/tasks/${task._id}`, updatedTask);
      
      // Update local state
      setTasks(tasks.map(t => t._id === task._id ? updatedTask : t));
      if (updatedTask.completed) {
        setTodayTasks(todayTasks.filter(t => t._id !== task._id));
      } else {
        // If uncompleting a task for today
        if (task.plannedForToday) {
          setTodayTasks(todayTasks.map(t => t._id === task._id ? updatedTask : t));
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const completeMorningPlanning = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastMorningReflectionDate', today);
    localStorage.setItem('morningReflection_' + today, morningReflection);
    setPlanningMode(false);
  };

  const formatTimeEstimate = (totalMinutes) => {
    if (!totalMinutes) return '0 min';
    if (totalMinutes < 60) return `${totalMinutes} min`;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours}h ${minutes}m`;
  };

  const getTotalEstimatedTime = () => {
    return todayTasks.reduce((total, task) => total + (task.estimatedTime || 0), 0);
  };

  const getRecommendedTasks = () => {
    // Get tasks due today or overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks
      .filter(task => {
        if (todayTasks.some(t => t._id === task._id)) return false;
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate <= today || task.priority === 'high';
      })
      .sort((a, b) => {
        // Sort by priority first
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        // Then by due date
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        
        return 0;
      })
      .slice(0, 3); // Top 3 recommended tasks
  };

  const getMotivationalMessage = () => {
    const messages = [
      "You've got this! Focus on one task at a time.",
      "Progress is progress, no matter how small.",
      "Remember to take breaks between tasks.",
      "Today's plan is tomorrow's accomplishment.",
      "Small steps lead to big achievements."
    ];
    
    // Return random message based on date so it changes each day
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    return messages[dayOfYear % messages.length];
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {planningMode ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{getGreeting()}! Let's plan your day.</h2>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              What's your main focus for today?
            </label>
            <textarea
              value={morningReflection}
              onChange={(e) => setMorningReflection(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring focus:ring-blue-200"
              placeholder="I want to accomplish..."
              rows={3}
            />
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3">Recommended tasks for today:</h3>
            <div className="space-y-2">
              {getRecommendedTasks().map(task => (
                <div key={task._id} className="flex items-center bg-white rounded-md p-3 shadow-sm">
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.dueDate && (
                      <div className="text-sm text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => markTaskForToday(task)}
                    className="ml-2 bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded-md text-sm"
                  >
                    Add to Today
                  </button>
                </div>
              ))}
              
              {getRecommendedTasks().length === 0 && (
                <p className="text-gray-500 italic">No urgent tasks recommended.</p>
              )}
            </div>
          </div>
          
          <button
            onClick={completeMorningPlanning}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-md"
          >
            Complete Planning
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Today's Plan</h2>
            <button
              onClick={() => setPlanningMode(true)}
              className="text-primary hover:text-primary-dark text-sm flex items-center"
            >
              <i className="fas fa-pen mr-1"></i> Edit Plan
            </button>
          </div>
          
          {morningReflection && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <h3 className="font-medium text-sm text-blue-800 mb-1">Today's Focus</h3>
              <p className="text-gray-700">{morningReflection}</p>
            </div>
          )}
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Tasks for Today</h3>
              <span className="text-sm text-gray-500">
                {todayTasks.length} tasks • {formatTimeEstimate(getTotalEstimatedTime())}
              </span>
            </div>
            
            {todayTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4 italic">
                No tasks planned for today. Add some tasks to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task, index) => (
                  <div 
                    key={task._id}
                    className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="mr-3 flex-shrink-0">
                      <button
                        onClick={() => toggleTaskCompletion(task)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          task.completed ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}
                      >
                        {task.completed && <i className="fas fa-check text-xs text-white"></i>}
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                        {task.priority && (
                          <span 
                            className={`px-2 py-0.5 rounded-full ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}
                        
                        {task.estimatedTime && (
                          <span className="flex items-center">
                            <i className="far fa-clock mr-1"></i>
                            {task.estimatedTime} min
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeTaskFromToday(task)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                      title="Remove from today"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 bg-yellow-50 rounded-md text-center">
            <p className="text-gray-700 italic">{getMotivationalMessage()}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium mb-3">Add Tasks to Today</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks
            .filter(task => !task.completed && !todayTasks.some(t => t._id === task._id))
            .map(task => (
              <div
                key={task._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                    {task.priority && (
                      <span 
                        className={`px-2 py-0.5 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
                    
                    {task.dueDate && (
                      <span className="flex items-center">
                        <i className="far fa-calendar mr-1"></i>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => markTaskForToday(task)}
                  className="ml-2 text-primary hover:text-primary-dark"
                  title="Add to today"
                >
                  <i className="fas fa-plus-circle text-lg"></i>
                </button>
              </div>
            ))}
            
          {tasks.filter(task => !task.completed && !todayTasks.some(t => t._id === task._id)).length === 0 && (
            <p className="text-gray-500 text-center py-4 italic">
              No more tasks available to add.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayPlan;
