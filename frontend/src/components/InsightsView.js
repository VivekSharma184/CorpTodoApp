import React, { useState, useEffect } from 'react';
import { TaskAPI } from '../services/apiService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const InsightsView = () => {
  const [tasks, setTasks] = useState([]);
  const [timeFrame, setTimeFrame] = useState('week');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const tasks = await TaskAPI.getAllTasks();
      setTasks(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Calculate task statistics
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed).length;
  const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;
  const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium').length;
  const lowPriorityTasks = tasks.filter(task => task.priority === 'low').length;

  // Get tasks created in the selected time frame
  const getFilteredTasks = () => {
    const now = new Date();
    let cutoffDate;

    switch (timeFrame) {
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
    }

    return tasks.filter(task => new Date(task.created_at) >= cutoffDate);
  };

  // Task completion rate
  const filteredTasks = getFilteredTasks();
  const completionRate = filteredTasks.length > 0 
    ? Math.round((filteredTasks.filter(task => task.completed).length / filteredTasks.length) * 100) 
    : 0;

  // Task completion pie chart data
  const pieData = {
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [completedTasks, pendingTasks],
        backgroundColor: ['#4CAF50', '#FFC107'],
        borderColor: ['#43A047', '#FFB300'],
        borderWidth: 1,
      },
    ],
  };

  // Task priority distribution chart data
  const priorityData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Tasks by Priority',
        data: [highPriorityTasks, mediumPriorityTasks, lowPriorityTasks],
        backgroundColor: ['#F44336', '#FFC107', '#4CAF50'],
      },
    ],
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Task Insights</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setTimeFrame('week')} 
            className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'week' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          >
            Week
          </button>
          <button 
            onClick={() => setTimeFrame('month')} 
            className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'month' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          >
            Month
          </button>
          <button 
            onClick={() => setTimeFrame('year')} 
            className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'year' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Tasks</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold">{tasks.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Completion Rate</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold">{completionRate}%</p>
            <p className="ml-2 text-sm text-gray-500">in the last {timeFrame}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">High Priority Tasks</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold">{highPriorityTasks}</p>
            <p className="ml-2 text-sm text-gray-500">{pendingTasks > 0 ? `${Math.round((highPriorityTasks / tasks.length) * 100)}% of all tasks` : '0%'}</p>
          </div>
        </div>
      </div>

      {/* Time Tracking Stats */}
      <h3 className="text-lg font-semibold mt-8 mb-4">Time Tracking</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Stats Cards */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Time Tracked</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold">
              {tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0)}
            </p>
            <p className="ml-2 text-sm text-gray-500">minutes</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Avg. Estimated Time</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold">
              {tasks.length > 0 
                ? Math.round(tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0) / tasks.length) 
                : 0}
            </p>
            <p className="ml-2 text-sm text-gray-500">minutes/task</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Avg. Actual Time</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold">
              {tasks.filter(task => task.actualTime).length > 0
                ? Math.round(tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0) / 
                    tasks.filter(task => task.actualTime).length)
                : 0}
            </p>
            <p className="ml-2 text-sm text-gray-500">minutes/task</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mt-6">
        <h3 className="text-gray-700 font-medium mb-4">Time Estimation Accuracy</h3>
        <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
          {(() => {
            const tasksWithBothTimes = tasks.filter(task => task.actualTime && task.estimatedTime);
            const underestimated = tasksWithBothTimes.filter(task => task.actualTime > task.estimatedTime).length;
            const overestimated = tasksWithBothTimes.filter(task => task.actualTime < task.estimatedTime).length;
            const accurate = tasksWithBothTimes.filter(task => task.actualTime === task.estimatedTime).length;
            const total = tasksWithBothTimes.length || 1; // avoid division by zero
            
            return (
              <div className="flex h-full">
                <div 
                  className="bg-green-500 h-full" 
                  style={{ width: `${(accurate / total) * 100}%` }}
                  title={`Accurate: ${accurate} tasks`}
                ></div>
                <div 
                  className="bg-blue-500 h-full" 
                  style={{ width: `${(overestimated / total) * 100}%` }}
                  title={`Overestimated: ${overestimated} tasks`}
                ></div>
                <div 
                  className="bg-red-500 h-full" 
                  style={{ width: `${(underestimated / total) * 100}%` }}
                  title={`Underestimated: ${underestimated} tasks`}
                ></div>
              </div>
            );
          })()}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Accurate</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>Overestimated</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Underestimated</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Charts */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-700 font-medium mb-4">Task Completion</h3>
          <div className="h-64 flex items-center justify-center">
            {tasks.length > 0 ? (
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            ) : (
              <p className="text-gray-500">No task data available</p>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-700 font-medium mb-4">Task Priority Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {tasks.length > 0 ? (
              <Bar 
                data={priorityData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }} 
              />
            ) : (
              <p className="text-gray-500">No task data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
