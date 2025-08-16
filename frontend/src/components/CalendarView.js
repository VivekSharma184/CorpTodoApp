import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import taskService from '../services/TaskService';

const CalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [taskDisplay, setTaskDisplay] = useState('compact'); // 'compact' or 'detailed'
  
  // Define today at component level to be accessible everywhere
  const today = new Date();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const allTasks = await taskService.getTasks();
      // Filter only tasks with due dates
      const tasksWithDates = allTasks.filter(task => task.dueDate);
      setTasks(tasksWithDates);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Generate calendar days for the current month or week
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const calendarDays = [];
    
    if (viewMode === 'month') {
      // First day of the month
      const firstDayOfMonth = new Date(year, month, 1);
      // Last day of the month
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
      const firstDayWeekday = firstDayOfMonth.getDay();
      
      // Add empty cells for days before the first day of month
      for (let i = 0; i < firstDayWeekday; i++) {
        calendarDays.push({ day: null, date: null });
      }
      
      // Add cells for each day of the month
      for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(year, month, day);
        calendarDays.push(createDayObject(date));
      }
    } else if (viewMode === 'week') {
      // Get the current date or selected date
      const baseDate = selectedDate ? new Date(selectedDate) : new Date(currentDate);
      
      // Find the first day of the week (Sunday)
      const firstDayOfWeek = new Date(baseDate);
      firstDayOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
      
      // Generate 7 days for the week view
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        calendarDays.push(createDayObject(date));
      }
    }
    
    return calendarDays;
  };
  
  // Helper to create a day object with tasks and metrics
  const createDayObject = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    const day = date.getDate();
    
    // Check if there are any tasks due on this day
    const dayTasks = tasks.filter(task => {
      const taskDueDate = new Date(task.dueDate);
      return (
        taskDueDate.getFullYear() === date.getFullYear() &&
        taskDueDate.getMonth() === date.getMonth() &&
        taskDueDate.getDate() === date.getDate()
      );
    });
    
    // Sort tasks by priority (high → medium → low)
    const sortedTasks = [...dayTasks].sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
    });
    
    // Calculate task metrics for this day
    const highPriorityCount = dayTasks.filter(t => t.priority === 'high').length;
    const mediumPriorityCount = dayTasks.filter(t => t.priority === 'medium').length;
    const lowPriorityCount = dayTasks.filter(t => t.priority === 'low').length;
    const completedCount = dayTasks.filter(t => t.completed).length;
    
    // Calculate task distribution by category
    const categoryCounts = {};
    dayTasks.forEach(task => {
      if (task.category) {
        categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
      }
    });
    
    // Get the most common category
    let dominantCategory = null;
    let maxCount = 0;
    
    Object.keys(categoryCounts).forEach(category => {
      if (categoryCounts[category] > maxCount) {
        maxCount = categoryCounts[category];
        dominantCategory = category;
      }
    });
    
    // Get total estimated time for tasks this day
    const totalEstimatedTime = dayTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
    
    // Create category groups for better visualization
    const categoryGroups = {};
    dayTasks.forEach(task => {
      const category = task.category || 'uncategorized';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(task);
    });
    
    return {
      day,
      date: formattedDate,
      fullDate: date,
      hasTask: dayTasks.length > 0,
      tasks: sortedTasks,
      categoryGroups,
      isToday: 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear(),
      isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      metrics: {
        total: dayTasks.length,
        highPriority: highPriorityCount,
        mediumPriority: mediumPriorityCount,
        lowPriority: lowPriorityCount,
        completed: completedCount,
        incomplete: dayTasks.length - completedCount,
        dominantCategory,
        totalEstimatedTime,
        categories: Object.keys(categoryCounts).map(category => ({
          name: category,
          count: categoryCounts[category]
        })).sort((a, b) => b.count - a.count)
      }
    };
  };

  // Handle navigation (month or week)
  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedDateTasks([]);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedDateTasks([]);
  };

  // Toggle between month and week view
  const toggleViewMode = () => {
    setViewMode(viewMode === 'month' ? 'week' : 'month');
  };

  // Toggle between compact and detailed task display
  const toggleTaskDisplay = () => {
    setTaskDisplay(taskDisplay === 'compact' ? 'detailed' : 'compact');
  };

  // Handle date selection
  const handleDateClick = (date, tasks) => {
    setSelectedDate(date);
    setSelectedDateTasks(tasks);
  };

  // Format date to display month and year or week range
  const formatPeriod = (date) => {
    if (viewMode === 'month') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      // For week view, show date range
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
      
      return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-col md:flex-row md:space-x-4">
        {/* Calendar Column - Left Side */}
        <div className={`${selectedDate ? 'md:w-7/12' : 'w-full'}`}>
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold mr-3">{formatPeriod(currentDate)}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleViewMode()}
                  className={`px-3 py-1 text-sm rounded ${viewMode === 'month' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => toggleViewMode()}
                  className={`px-3 py-1 text-sm rounded ${viewMode === 'week' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                >
                  Week
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => toggleTaskDisplay()}
                className="px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center"
                title={taskDisplay === 'compact' ? 'Show detailed tasks' : 'Show compact tasks'}
              >
                <i className={`fas ${taskDisplay === 'compact' ? 'fa-list' : 'fa-list-alt'} mr-1`}></i>
                {taskDisplay === 'compact' ? 'Compact' : 'Detailed'}
              </button>
              <div className="space-x-2">
                <button
                  onClick={previousPeriod}
                  className="px-3 py-1 rounded hover:bg-gray-100"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  className="px-3 py-1 rounded hover:bg-gray-100 font-medium"
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDate(null);
                    setSelectedDateTasks([]);
                  }}
                >
                  Today
                </button>
                <button
                  onClick={nextPeriod}
                  className="px-3 py-1 rounded hover:bg-gray-100"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className={`grid grid-cols-7 gap-px bg-gray-200 ${viewMode === 'week' ? 'h-[400px]' : ''}`}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div 
                key={day} 
                className="bg-white p-2 text-center font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
            
            {/* Calendar cells */}
            {generateCalendarDays().map((day, i) => {
              const categoryColors = {
                work: 'border-blue-400',
                personal: 'border-purple-400',
                health: 'border-green-400',
                finance: 'border-yellow-400',
                study: 'border-indigo-400',
                default: 'border-gray-300'
              };
              
              const dominantCategoryColor = day.metrics?.dominantCategory 
                ? categoryColors[day.metrics.dominantCategory] || categoryColors.default
                : '';
                
              return (
                <div 
                  key={i} 
                  onClick={() => day.date && handleDateClick(day.date, day.tasks)}
                  className={`bg-white ${viewMode === 'week' ? 'h-full' : 'min-h-[100px]'} p-2 relative
                    ${day.date ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${!day.isCurrentMonth ? 'bg-gray-50' : ''}
                    ${day.date === selectedDate ? 'ring-2 ring-primary ring-inset' : ''}
                    ${dominantCategoryColor ? `border-l-4 ${dominantCategoryColor}` : ''}`}
                >
                  {day.day && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm
                          ${day.isToday ? 'bg-primary text-white font-medium' : ''}`}
                        >
                          {day.day}
                        </span>
                        
                        {/* Task count and priority indicators */}
                        {day.hasTask && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-medium bg-gray-100 px-1 rounded">
                              {day.metrics.total}
                            </span>
                            <div className="flex space-x-1">
                              {day.metrics.highPriority > 0 && (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                              {day.metrics.mediumPriority > 0 && (
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              )}
                              {day.metrics.lowPriority > 0 && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Task previews with category grouping */}
                      <div className="space-y-1 mt-1">
                        {taskDisplay === 'compact' ? (
                          // Compact task display
                          <>
                            {/* Show top 2 tasks based on priority */}
                            {day.tasks.slice(0, 2).map((task) => (
                              <div 
                                key={task._id} 
                                className={`text-xs px-1.5 py-0.5 rounded-sm truncate flex items-center
                                ${task.priority === 'high' ? 'bg-red-50 text-red-800 border-l-2 border-red-500' :
                                  task.priority === 'medium' ? 'bg-yellow-50 text-yellow-800 border-l-2 border-yellow-500' :
                                  'bg-blue-50 text-blue-800 border-l-2 border-blue-500'}
                                ${task.completed ? 'line-through opacity-50' : ''}`}
                              >
                                <span className="truncate">{task.title}</span>
                              </div>
                            ))}
                            
                            {/* More tasks indicator with categories */}
                            {day.tasks.length > 2 && (
                              <div className="text-xs bg-gray-50 px-1.5 py-0.5 rounded-sm flex justify-between items-center">
                                <span className="text-gray-500">+{day.tasks.length - 2} more</span>
                                {day.metrics.categories.length > 0 && (
                                  <span className="text-gray-400 text-[10px]">
                                    {day.metrics.categories[0].name}
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          // Detailed task display - group by category
                          <>
                            {viewMode === 'week' && Object.entries(day.categoryGroups).map(([category, tasks]) => (
                              <div key={category} className="mb-1">
                                <div className="text-[10px] font-medium text-gray-500 uppercase mb-0.5">{category}</div>
                                {tasks.slice(0, 2).map(task => (
                                  <div 
                                    key={task._id}
                                    className={`text-xs mb-1 px-1 py-0.5 rounded-sm flex items-center justify-between
                                    ${task.priority === 'high' ? 'bg-red-50 border-l-2 border-red-500' : 
                                      task.priority === 'medium' ? 'bg-yellow-50 border-l-2 border-yellow-500' : 
                                      'bg-blue-50 border-l-2 border-blue-500'}
                                    ${task.completed ? 'line-through opacity-50' : ''}`}
                                  >
                                    <span className="truncate pr-1">{task.title}</span>
                                    {task.estimatedTime && (
                                      <span className="text-[9px] text-gray-500 whitespace-nowrap">{task.estimatedTime}m</span>
                                    )}
                                  </div>
                                ))}
                                {tasks.length > 2 && (
                                  <div className="text-[10px] text-gray-500">+{tasks.length - 2} more</div>
                                )}
                              </div>
                            ))}
                            
                            {/* For month view, simplified category view */}
                            {viewMode === 'month' && day.metrics.categories.slice(0, 2).map(category => (
                              <div key={category.name} className="text-xs mb-1 flex justify-between items-center py-0.5 px-1 bg-gray-50 rounded-sm">
                                <span>{category.name}</span>
                                <span className="text-gray-500">{category.count}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      
                      {/* Time indicator for week view */}
                      {viewMode === 'week' && day.metrics.totalEstimatedTime > 0 && (
                        <div className="absolute bottom-1 right-1 text-[10px] text-gray-500 bg-gray-50 px-1 rounded">
                          {Math.floor(day.metrics.totalEstimatedTime / 60)}h {day.metrics.totalEstimatedTime % 60}m
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Task details for selected date - Side Panel (Right Side) */}
        {selectedDate && (
          <div className="mt-4 md:mt-0 md:w-5/12 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pl-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">
                Tasks for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-sm text-gray-500"
              >
                <i className="fas fa-times"></i> Close
              </button>
            </div>

            {selectedDateTasks.length > 0 && (
              <div className="mb-4">
                <div className="flex space-x-4">
                  <div className="text-xs">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                    <span className="text-gray-700">
                      {selectedDateTasks.filter(t => t.priority === 'high').length} high
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                    <span className="text-gray-700">
                      {selectedDateTasks.filter(t => t.priority === 'medium').length} medium
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                    <span className="text-gray-700">
                      {selectedDateTasks.filter(t => t.priority === 'low').length} low
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <i className="far fa-calendar-times text-3xl text-gray-300 mb-2"></i>
                <p className="text-gray-500">No tasks scheduled for this day.</p>
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-auto pr-2">
                {selectedDateTasks.map((task) => {
                  const categoryColor = task.category === 'work' ? 'bg-blue-100 text-blue-800' :
                    task.category === 'personal' ? 'bg-purple-100 text-purple-800' :
                    task.category === 'health' ? 'bg-green-100 text-green-800' :
                    task.category === 'finance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800';
                    
                  const priorityColor = task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500';
                    
                  return (
                    <div 
                      key={task._id} 
                      className={`py-3 px-2 ${task.completed ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2.5 ${priorityColor}`}></div>
                          <span className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {task.estimatedTime && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              <i className="far fa-clock mr-1"></i>
                              {task.estimatedTime} min
                            </span>
                          )}
                          
                          <span className={`text-xs px-2 py-0.5 rounded ${categoryColor}`}>
                            {task.category}
                          </span>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm ml-5 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center mt-1.5 ml-5">
                        <div className="flex items-center space-x-2">
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded">
                                  #{tag}
                                </span>
                              ))}
                              {task.tags.length > 2 && (
                                <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {task.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;