import React, { useState, useEffect } from 'react';
import { TaskAPI } from '../services/apiService';

const StatusReport = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('daily');
  const [reportContent, setReportContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  useEffect(() => {
    fetchTasks();
  }, []);
  
  useEffect(() => {
    if (tasks.length > 0) {
      generateReport(reportType, startDate, endDate);
    }
  }, [tasks, reportType, startDate, endDate]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await TaskAPI.getAllTasks();
      setTasks(tasksData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
      setLoading(false);
    }
  };

  const getCompletedToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // For debugging
    console.log('All tasks:', tasks);
    console.log('Completed tasks:', tasks.filter(task => task.status === 'completed' || task.completed));
    
    return tasks.filter(task => {
      // Check for tasks marked with status 'completed' or the completed flag
      const isCompleted = task.status === 'completed' || task.completed;
      
      if (isCompleted) {
        // If there's no completedAt timestamp, check if it was modified today
        if (!task.completedAt) {
          if (task.updatedAt) {
            const updatedDate = new Date(task.updatedAt);
            return updatedDate >= today;
          }
          // If no timestamps at all, don't include in today's completed tasks
          return false;
        }
        
        try {
          const completedDate = new Date(task.completedAt);
          return completedDate >= today;
        } catch (e) {
          console.error('Error parsing completedAt date:', e);
          return false; // Don't include task if date parsing fails
        }
      }
      return false;
    });
  };

  const getCompletedInDateRange = (start, end) => {
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      // Include all tasks marked as completed within date range
      if (task.completed) {
        // Check completion date
        if (task.completedAt) {
          try {
            const completedDate = new Date(task.completedAt);
            return completedDate >= startDate && completedDate <= endDate;
          } catch (e) {
            console.error('Error parsing completedAt date:', e);
            return false;
          }
        }
        // Check updated date if no completion date
        else if (task.updatedAt) {
          try {
            const updatedDate = new Date(task.updatedAt);
            return updatedDate >= startDate && updatedDate <= endDate;
          } catch (e) {
            console.error('Error parsing updatedAt date:', e);
            return false;
          }
        }
      }
      return false;
    });
  };
  
  const getCompletedThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go to beginning of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      // Include all tasks marked as completed this week
      if (task.completed) {
        // If completedAt is missing, include it if it was likely completed recently
        if (!task.completedAt) return true;
        
        try {
          const completedDate = new Date(task.completedAt);
          return completedDate >= startOfWeek;
        } catch (e) {
          console.error('Error parsing completedAt date:', e);
          return true; // Include task if date parsing fails
        }
      }
      return false;
    });
  };

  const getInProgress = () => {
    // Only return tasks explicitly marked as 'in-progress'
    return tasks.filter(task => 
      task.status === 'in-progress' && !task.completed
    );
  };

  const getUpcoming = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return tasks.filter(task => {
      // Don't include completed tasks or in-progress tasks
      if (task.completed || task.status === 'completed' || task.status === 'in-progress') {
        return false;
      }
      
      // Include all new tasks
      if (task.status === 'new') {
        return true;
      }
      
      // For tasks without status, use due date for next week
      if (!task.status && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        return dueDate > today && dueDate <= nextWeek;
      }
      
      // Include tasks due today if they're not marked as in-progress
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0); // Normalize to start of day
        if (dueDate.getTime() === today.getTime()) {
          return true;
        }
      }
      
      return false;
    }).sort((a, b) => {
      // Sort by due date if available
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } 
      // Tasks with due dates come first
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // Then sort by priority
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
    });
  };

  const getBlockers = () => {
    // Look for high priority tasks that are overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      
      const dueDate = new Date(task.dueDate);
      return dueDate < today && task.priority === 'high';
    });
  };

  const generateReport = (type, customStartDate = null, customEndDate = null) => {
    let report = '';
    
    if (type === 'daily') {
      const completed = getCompletedToday();
      const inProgress = getInProgress();
      const blockers = getBlockers();
      
      report = `## Daily Status Update: ${new Date().toLocaleDateString()}\n\n`;
      
      report += `### Completed Today (${completed.length}):\n`;
      if (completed.length > 0) {
        completed.forEach(task => {
          report += `- ✅ ${task.title}\n`;
          if (task.notes && task.notes.trim()) {
            report += `    Note: ${task.notes.trim()}\n`;
          }
        });
      } else {
        report += `- No completed tasks yet today\n`;
      }
      
      report += `\n### In Progress (${inProgress.length}):\n`;
      if (inProgress.length > 0) {
        inProgress.forEach(task => {
          report += `- 🔄 ${task.title}`;
          
          if (task.estimatedTime) {
            report += ` (Est: ${task.estimatedTime} min)`;
          }
          
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            report += ` (Due: ${dueDate.toLocaleDateString()})`;
          }
          
          report += '\n';
          
          if (task.notes && task.notes.trim()) {
            report += `    Note: ${task.notes.trim()}\n`;
          }
        });
      } else {
        report += `- No tasks currently in progress\n`;
      }
      
      if (blockers.length > 0) {
        report += `\n### Blockers (${blockers.length}):\n`;
        blockers.forEach(task => {
          report += `- ⚠️ ${task.title}`;
          if (task.dueDate) {
            const daysOverdue = Math.floor((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
            report += ` (${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue)`;
          }
          report += '\n';
          if (task.notes && task.notes.trim()) {
            report += `    Note: ${task.notes.trim()}\n`;
          }
        });
      }
      
      // Add the Upcoming Tasks section to daily report
      const upcoming = getUpcoming();
      report += `\n### Upcoming Tasks (${upcoming.length}):\n`;
      if (upcoming.length > 0) {
        upcoming.forEach(task => {
          report += `- 📅 ${task.title}`;
          
          // Show status for clarity
          report += ` [${task.status || 'new'}]`;
          
          // Show due date if available
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (dueDate.getTime() === today.getTime()) {
              report += ` (Due: Today)`;
            } else {
              report += ` (Due: ${dueDate.toLocaleDateString()})`;
            }
          }
          
          if (task.estimatedTime) {
            report += ` (Est: ${task.estimatedTime} min)`;
          }
          
          report += '\n';
          
          if (task.notes && task.notes.trim()) {
            report += `    Note: ${task.notes.trim()}\n`;
          }
        });
      } else {
        report += `- No upcoming tasks\n`;
      }
    }
    else if (type === 'weekly') {
      const completed = getCompletedThisWeek();
      const upcoming = getUpcoming();
      
      report = `## Weekly Status Report: Week of ${getStartOfWeekDate()}\n\n`;
      
      report += `### Completed This Week (${completed.length}):\n`;
      if (completed.length > 0) {
        // Group tasks by completion date
        const tasksByDate = {};
        
        completed.forEach(task => {
          let dateStr = 'Unknown Date';
          
          // Try to get completion date
          if (task.completedAt) {
            dateStr = new Date(task.completedAt).toLocaleDateString();
          } else if (task.updatedAt) {
            dateStr = new Date(task.updatedAt).toLocaleDateString();
          }
          
          if (!tasksByDate[dateStr]) {
            tasksByDate[dateStr] = [];
          }
          
          tasksByDate[dateStr].push(task);
        });
        
        // Sort dates (most recent first)
        const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
          // Handle 'Unknown Date' specially
          if (a === 'Unknown Date') return 1;
          if (b === 'Unknown Date') return -1;
          
          return new Date(b) - new Date(a);
        });
        
        // Output tasks grouped by date
        sortedDates.forEach(date => {
          report += `\n**${date}**:\n`;
          
          tasksByDate[date].forEach(task => {
            report += `- ✅ ${task.title}\n`;
            if (task.notes && task.notes.trim()) {
              report += `    Note: ${task.notes.trim()}\n`;
            }
          });
        });
      } else {
        report += `- No completed tasks this week\n`;
      }
      
      const timeSpent = completed.reduce((sum, task) => sum + (task.actualTime || 0), 0);
      if (timeSpent > 0) {
        const hours = Math.floor(timeSpent / 60);
        const minutes = timeSpent % 60;
        report += `\nTotal time tracked: ${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}\n`;
      }
      
      report += `\n### Coming Up Next Week (${upcoming.length}):\n`;
      if (upcoming.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        upcoming.forEach(task => {
          const dueDate = new Date(task.dueDate);
          const diffTime = Math.abs(dueDate - today);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          report += `- 📅 ${task.title} (Due: ${dueDate.toLocaleDateString()}, ${diffDays} ${diffDays === 1 ? 'day' : 'days'} from now)\n`;
          if (task.notes && task.notes.trim()) {
            report += `    Note: ${task.notes.trim()}\n`;
          }
        });
      } else {
        report += `- No upcoming tasks for next week\n`;
      }
      
      // Include key achievements and insights
      report += '\n### Key Achievements:\n';
      report += '- [Add your key achievement here]\n';
      report += '- [Add your key achievement here]\n';
      
      report += '\n### Notes & Insights:\n';
      report += '- [Add any additional notes or insights here]\n';
    }
    else if (type === 'custom') {
      if (!customStartDate || !customEndDate) {
        setReportContent('Please select both start and end dates.');
        return;
      }
      
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setReportContent('Invalid date selection.');
        return;
      }
      
      // Check if start date is before end date
      if (start > end) {
        setReportContent('Start date must be before end date.');
        return;
      }
      
      const completed = getCompletedInDateRange(customStartDate, customEndDate);
      
      // Format dates for display
      const startFormatted = start.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });
      const endFormatted = end.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });
      
      report = `## Custom Date Range Report: ${startFormatted} to ${endFormatted}\n\n`;
      
      report += `### Completed Tasks (${completed.length}):\n`;
      if (completed.length > 0) {
        // Group tasks by completion date
        const tasksByDate = {};
        
        completed.forEach(task => {
          let dateStr = 'Unknown Date';
          
          // Try to get completion date
          if (task.completedAt) {
            dateStr = new Date(task.completedAt).toLocaleDateString();
          } else if (task.updatedAt) {
            dateStr = new Date(task.updatedAt).toLocaleDateString();
          }
          
          if (!tasksByDate[dateStr]) {
            tasksByDate[dateStr] = [];
          }
          
          tasksByDate[dateStr].push(task);
        });
        
        // Sort dates (most recent first)
        const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
          // Handle 'Unknown Date' specially
          if (a === 'Unknown Date') return 1;
          if (b === 'Unknown Date') return -1;
          
          return new Date(b) - new Date(a);
        });
        
        // Output tasks grouped by date
        sortedDates.forEach(date => {
          report += `\n**${date}**:\n`;
          
          tasksByDate[date].forEach(task => {
            report += `- ✅ ${task.title}`;
            
            // Add category if available
            if (task.category) {
              report += ` (${task.category})`;
            }
            
            report += '\n';
          });
        });
        
        // Include time tracking info if available
        const timeSpent = completed.reduce((sum, task) => sum + (task.actualTime || 0), 0);
        if (timeSpent > 0) {
          const hours = Math.floor(timeSpent / 60);
          const minutes = timeSpent % 60;
          report += `\nTotal time tracked: ${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}\n`;
        }
      } else {
        report += `- No tasks completed in this date range\n`;
      }
      
      // Calculate date range metrics
      const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const avgTasksPerDay = totalDays > 0 ? (completed.length / totalDays).toFixed(1) : 0;
      
      report += `\n### Summary Metrics:\n`;
      report += `- Date Range: ${totalDays} days\n`;
      report += `- Total Tasks Completed: ${completed.length}\n`;
      report += `- Average Tasks Per Day: ${avgTasksPerDay}\n`;
      
      // Include categories breakdown if tasks have categories
      const categoriesMap = {};
      completed.forEach(task => {
        const category = task.category || 'Uncategorized';
        categoriesMap[category] = (categoriesMap[category] || 0) + 1;
      });
      
      if (Object.keys(categoriesMap).length > 0) {
        report += `\n### Category Breakdown:\n`;
        for (const [category, count] of Object.entries(categoriesMap).sort((a, b) => b[1] - a[1])) {
          const percentage = ((count / completed.length) * 100).toFixed(1);
          report += `- ${category}: ${count} tasks (${percentage}%)\n`;
        }
      }
      
      // Include key achievements and insights
      report += '\n### Key Achievements:\n';
      report += '- [Add your key achievement here]\n';
      report += '- [Add your key achievement here]\n';
      
      report += '\n### Notes & Insights:\n';
      report += '- [Add any additional notes or insights here]\n';
    }
    
    setReportContent(report);
  };

  const getStartOfWeekDate = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    return startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reportContent).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Failed to copy report: ', err);
      }
    );
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
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Status Report Generator</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              setReportType('daily');
              setShowDatePicker(false);
            }}
            className={`px-4 py-2 rounded-md ${
              reportType === 'daily' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Daily Standup
          </button>
          <button
            onClick={() => {
              setReportType('weekly');
              setShowDatePicker(false);
            }}
            className={`px-4 py-2 rounded-md ${
              reportType === 'weekly' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Weekly Summary
          </button>
          <button
            onClick={() => {
              setReportType('custom');
              setShowDatePicker(true);
              // Set default dates if empty
              if (!startDate) {
                const defaultStart = new Date();
                defaultStart.setDate(defaultStart.getDate() - 14); // Two weeks ago
                setStartDate(defaultStart.toISOString().split('T')[0]);
              }
              if (!endDate) {
                setEndDate(new Date().toISOString().split('T')[0]); // Today
              }
            }}
            className={`px-4 py-2 rounded-md ${
              reportType === 'custom' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Custom Range
          </button>
        </div>
        
        {showDatePicker && (
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Date Range:</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date:</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date:</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                />
              </div>
              <button
                onClick={() => generateReport('custom', startDate, endDate)}
                className="mt-4 px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark"
              >
                Generate Report
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Generated Report</h3>
            <button
              onClick={copyToClipboard}
              className="text-primary hover:text-primary-dark text-sm flex items-center"
            >
              {copied ? (
                <>
                  <i className="fas fa-check mr-1"></i> Copied!
                </>
              ) : (
                <>
                  <i className="far fa-copy mr-1"></i> Copy to Clipboard
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap font-mono text-sm">{reportContent}</pre>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>
            This report is generated based on your task data. Copy and paste it into your team chat, 
            email, or documents. You can also edit it before sharing.
          </p>
        </div>
      </div>
      
      {/* Usage Tips */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Pro Tips:</h3>
        <ul className="list-disc pl-5 text-blue-700 space-y-1">
          <li>Use the <strong>Daily Standup</strong> format for daily team meetings</li>
          <li>Use the <strong>Weekly Summary</strong> format for weekly status updates</li>
          <li>Add your key achievements manually after copying the report</li>
          <li>For better reports, make sure to complete your tasks using the time tracking feature</li>
        </ul>
      </div>
    </div>
  );
};

export default StatusReport;
