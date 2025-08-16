import React, { useState, useEffect } from 'react';
import taskService from '../services/TaskService';
import QuickAddTask from './QuickAddTask';
import SimpleAddTask from './SimpleAddTask';
import EditTaskModal from './EditTaskModal';
import TimeTrackingModal from './TimeTrackingModal';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium', 
    dueDate: '',
    category: 'work',
    estimatedTime: 30,
    tags: [],
    location: '',
    reminder: '',
    recurring: 'none',
    notes: ''
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const tasks = await taskService.getTasks();
      setTasks(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleTagAdd = () => {
    if (!tagInput.trim()) return;
    
    const newTags = newTask.tags ? [...newTask.tags] : [];
    if (!newTags.includes(tagInput.trim())) {
      newTags.push(tagInput.trim());
      setNewTask({ ...newTask, tags: newTags });
    }
    setTagInput('');
  };

  const handleTagRemove = (tagToRemove) => {
    const newTags = newTask.tags.filter(tag => tag !== tagToRemove);
    setNewTask({ ...newTask, tags: newTags });
  };

  const addTask = async () => {
    if (!newTask.title) {
      setError('Task title is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending task data:', newTask);
      const addedTask = await taskService.addTask(newTask);
      console.log('Added task:', addedTask);
      setTasks([...tasks, addedTask]);
      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'medium', 
        dueDate: '',
        category: 'work',
        estimatedTime: 30,
        tags: [],
        location: '',
        reminder: '',
        recurring: 'none',
        notes: ''
      });
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
      setError(
        `Failed to save task: ${error.message || 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (task) => {
    try {
      // If task is being marked as completed, show time tracking modal
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

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return !task.completed;
    return !task.completed && task.priority === filter;
  });

  return (
    <div>
      {/* Quick Add Task Form */}
      <QuickAddTask onTaskAdded={(newTask) => {
        setTasks([...tasks, newTask]);
      }} />

      {/* Simplified Add Task Form */}
      <SimpleAddTask onTaskAdded={(newTask) => {
        setTasks([...tasks, newTask]);
      }} />
      
      {/* Task Filtering Options */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-3 py-1 rounded-md ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('high')} 
            className={`px-3 py-1 rounded-md ${filter === 'high' ? 'bg-red-500 text-white' : 'bg-red-100 hover:bg-red-200'}`}
          >
            High Priority
          </button>
          <button 
            onClick={() => setFilter('medium')} 
            className={`px-3 py-1 rounded-md ${filter === 'medium' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 hover:bg-yellow-200'}`}
          >
            Medium Priority
          </button>
          <button 
            onClick={() => setFilter('low')} 
            className={`px-3 py-1 rounded-md ${filter === 'low' ? 'bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200'}`}
          >
            Low Priority
          </button>
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={(updatedTask) => {
            setTasks(tasks.map(task => 
              task._id === updatedTask._id ? updatedTask : task
            ));
          }}
        />
      )}

      {/* Time Tracking Modal */}
      {completingTask && (
        <TimeTrackingModal
          task={completingTask}
          onClose={() => setCompletingTask(null)}
          onTaskUpdated={(updatedTask) => {
            setTasks(tasks.map(task => 
              task._id === updatedTask._id ? updatedTask : task
            ));
            setCompletingTask(null);
          }}
        />
      )}

      {filteredTasks.length === 0 ? (
        <div className="text-center py-10">
          <i className="fas fa-clipboard-list text-4xl text-gray-300"></i>
          <p className="mt-2 text-gray-500">No tasks found. Add a new task to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div 
              key={task._id} 
              className="bg-white border rounded-md p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <button 
                    onClick={() => toggleTaskCompletion(task)}
                    className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center ${
                      task.completed ? 'bg-primary border-primary' : 'border-gray-300'
                    }`}
                  >
                    {task.completed && <i className="fas fa-check text-xs text-white"></i>}
                  </button>
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    {task.description && <p className="text-gray-600 text-sm mt-1">{task.description}</p>}
                    <div className="flex flex-wrap items-center mt-2 gap-2">
                      <span 
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {task.priority === 'high' ? 'High' : 
                         task.priority === 'medium' ? 'Medium' : 'Low'}
                      </span>
                      
                      {task.category && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                        </span>
                      )}
                      
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">
                          <i className="far fa-calendar mr-1"></i>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      
                      {task.estimatedTime && (
                        <span className="text-xs text-gray-500">
                          <i className="far fa-clock mr-1"></i>
                          {task.estimatedTime} min
                        </span>
                      )}
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.tags.map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setEditingTask(task)}
                    className="text-gray-400 hover:text-blue-500"
                    title="Edit task"
                  >
                    <i className="fas fa-edit"></i>
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

export default TaskList;
