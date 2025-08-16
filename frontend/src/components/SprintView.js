import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import SprintService from '../services/SprintService';
import { TaskAPI } from '../services/apiService';

const SprintView = () => {
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [sprintTasks, setSprintTasks] = useState([]);
  const [isAddingSprint, setIsAddingSprint] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    goal: '',
    status: 'planning'
  });
  const [burndownData, setBurndownData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSprints();
    fetchTasks();
  }, []);

  useEffect(() => {
    if (activeSprint) {
      fetchSprintDetails(activeSprint._id);
      fetchBurndownData(activeSprint._id);
    }
  }, [activeSprint]);

  const fetchSprints = async () => {
    try {
      const sprintsData = await SprintService.getAllSprints();
      setSprints(sprintsData);
      
      // Set active sprint to the current one or the most recent one
      const currentSprint = response.data.find(s => s.status === 'active');
      if (currentSprint) {
        setActiveSprint(currentSprint);
      } else if (response.data.length > 0) {
        setActiveSprint(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
      setError('Failed to fetch sprints');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5002/tasks');
      // Filter out tasks that already have a sprint assigned
      setTasks(response.data.filter(task => !task.sprint));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchSprintDetails = async (sprintId) => {
    setLoading(true);
    try {
      const sprintData = await SprintService.getSprint(sprintId);
      setActiveSprint(sprintData);
      
      // Get tasks assigned to this sprint
      const sprintTasks = tasks.filter(task => task.sprint === sprintId);
      setSprintTasks(sprintTasks);
    } catch (error) {
      console.error(`Error fetching sprint ${sprintId} details:`, error);
      setError('Failed to fetch sprint details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBurndownData = async (sprintId) => {
    try {
      const data = await SprintService.getBurndownData(sprintId);
      setBurndownData(data);
    } catch (error) {
      console.error('Error fetching burndown data:', error);
      setError('Failed to fetch burndown data');
    }
  };

  const handleSprintSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5002/sprints', newSprint);
      
      setSprints([response.data, ...sprints]);
      setActiveSprint(response.data);
      setIsAddingSprint(false);
      setNewSprint({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        goal: '',
        status: 'planning'
      });
    } catch (error) {
      console.error('Error creating sprint:', error);
      setError('Failed to create sprint');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTaskToSprint = async (task) => {
    if (!activeSprint) return;
    
    try {
      await axios.post(`http://localhost:5002/sprints/${activeSprint._id}/tasks/${task._id}`, {
        storyPoints: task.storyPoints || 1
      });
      
      // Update UI
      setSprintTasks([...sprintTasks, task]);
      setTasks(tasks.filter(t => t._id !== task._id));
      
      // Refresh burndown data
      fetchBurndownData(activeSprint._id);
    } catch (error) {
      console.error('Error adding task to sprint:', error);
      setError('Failed to add task to sprint');
    }
  };

  const handleRemoveTaskFromSprint = async (task) => {
    if (!activeSprint) return;
    
    try {
      await axios.delete(`http://localhost:5002/sprints/${activeSprint._id}/tasks/${task._id}`);
      
      // Update UI
      setSprintTasks(sprintTasks.filter(t => t._id !== task._id));
      setTasks([...tasks, task]);
      
      // Refresh burndown data
      fetchBurndownData(activeSprint._id);
    } catch (error) {
      console.error('Error removing task from sprint:', error);
      setError('Failed to remove task from sprint');
    }
  };

  const updateSprintStatus = async (status) => {
    if (!activeSprint) return;
    
    try {
      const response = await axios.put(`http://localhost:5002/sprints/${activeSprint._id}`, {
        ...activeSprint,
        status
      });
      
      setActiveSprint(response.data);
      setSprints(sprints.map(s => s._id === response.data._id ? response.data : s));
    } catch (error) {
      console.error('Error updating sprint status:', error);
      setError('Failed to update sprint status');
    }
  };

  const calculateSprintProgress = () => {
    if (!sprintTasks.length) return 0;
    
    const completed = sprintTasks.filter(task => task.completed).length;
    return Math.round((completed / sprintTasks.length) * 100);
  };

  // Generate burndown chart
  const burndownChartData = burndownData ? {
    labels: burndownData.burndownData.dates,
    datasets: [
      {
        label: 'Ideal Burndown',
        data: burndownData.burndownData.ideal,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 2,
        tension: 0.1,
        fill: false
      },
      {
        label: 'Actual Burndown',
        data: burndownData.burndownData.actual,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 2,
        tension: 0.1,
        fill: false
      }
    ]
  } : null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Sprint Management</h2>
        <button 
          onClick={() => setIsAddingSprint(true)}
          className="flex items-center bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md"
        >
          <i className="fas fa-plus mr-2"></i> New Sprint
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sprint Form */}
      {isAddingSprint && (
        <div className="bg-gray-50 p-6 rounded-md mb-6 border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Create New Sprint</h3>
            <button 
              onClick={() => setIsAddingSprint(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={handleSprintSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Sprint Name</label>
                <input
                  type="text"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., Sprint 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newSprint.status}
                  onChange={(e) => setNewSprint({ ...newSprint, status: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={newSprint.startDate}
                  onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Sprint Goal</label>
                <textarea
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="What do we want to achieve in this sprint?"
                  rows="2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newSprint.description}
                  onChange={(e) => setNewSprint({ ...newSprint, description: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Additional details about this sprint"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <button 
                type="button"
                onClick={() => setIsAddingSprint(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className={`px-4 py-2 ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'} text-white rounded-md flex items-center`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : 'Create Sprint'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sprint Selector and Details */}
      {sprints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sprint List */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-gray-700 font-medium mb-4">Sprints</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sprints.map((sprint) => (
                <div
                  key={sprint._id}
                  onClick={() => setActiveSprint(sprint)}
                  className={`p-3 rounded-md cursor-pointer ${
                    activeSprint && activeSprint._id === sprint._id
                      ? 'bg-primary-light border-l-4 border-primary'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{sprint.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sprint.status === 'active' ? 'bg-green-100 text-green-800' :
                      sprint.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Sprint Details */}
          <div className="md:col-span-2">
            {activeSprint ? (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{activeSprint.name}</h3>
                  <div className="flex space-x-2">
                    {activeSprint.status === 'planning' && (
                      <button
                        onClick={() => updateSprintStatus('active')}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded"
                      >
                        Start Sprint
                      </button>
                    )}
                    {activeSprint.status === 'active' && (
                      <button
                        onClick={() => updateSprintStatus('completed')}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded"
                      >
                        Complete Sprint
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Period:</span>{' '}
                      {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
                    </p>
                    {activeSprint.goal && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Goal:</span> {activeSprint.goal}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-medium mr-2">Progress:</span>
                      <span className="text-sm">{calculateSprintProgress()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${calculateSprintProgress()}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {sprintTasks.filter(task => task.completed).length}/{sprintTasks.length} tasks completed
                    </p>
                  </div>
                </div>

                {/* Burndown Chart */}
                {burndownData && (
                  <div className="mt-6">
                    <h4 className="text-gray-700 font-medium mb-2">Burndown Chart</h4>
                    <div className="h-64">
                      <Bar
                        data={burndownChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Story Points Remaining'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Sprint Days'
                              }
                            }
                          },
                          plugins: {
                            title: {
                              display: true,
                              text: 'Sprint Burndown'
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <div>Start: {burndownData.totalPoints} points</div>
                      <div>Completed: {burndownData.completedPoints} points</div>
                      <div>Remaining: {burndownData.totalPoints - burndownData.completedPoints} points</div>
                    </div>
                  </div>
                )}

                {/* Sprint Tasks */}
                <div className="mt-8">
                  <h4 className="text-gray-700 font-medium mb-4">Sprint Tasks</h4>
                  
                  {sprintTasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No tasks in this sprint yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {sprintTasks.map(task => (
                        <div 
                          key={task._id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              task.completed ? 'bg-green-500' : 
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}></div>
                            <div>
                              <h5 className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                {task.title}
                              </h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {task.storyPoints || 1} {task.storyPoints === 1 ? 'point' : 'points'}
                                </span>
                                {task.priority && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {task.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveTaskFromSprint(task)}
                            className="text-gray-400 hover:text-red-500"
                            title="Remove from sprint"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Backlog Tasks */}
                {tasks.length > 0 && activeSprint.status !== 'completed' && (
                  <div className="mt-8">
                    <h4 className="text-gray-700 font-medium mb-4">Available Tasks</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {tasks.map(task => (
                        <div 
                          key={task._id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}></div>
                            <h5 className="font-medium">{task.title}</h5>
                          </div>
                          <button
                            onClick={() => handleAddTaskToSprint(task)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <i className="fas fa-plus-circle"></i> Add to Sprint
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <i className="fas fa-running text-4xl text-gray-300 mb-2"></i>
                <p className="text-gray-500">Select a sprint to view details or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <i className="fas fa-running text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 mb-4">No sprints created yet.</p>
          <p className="text-gray-500 mb-8">Create your first sprint to start managing your tasks in an agile way.</p>
        </div>
      )}
    </div>
  );
};

export default SprintView;
