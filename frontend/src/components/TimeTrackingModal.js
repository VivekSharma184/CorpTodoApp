import React, { useState } from 'react';
import taskService from '../services/TaskService';

const TimeTrackingModal = ({ task, onClose, onTaskUpdated }) => {
  const [actualTime, setActualTime] = useState(task.estimatedTime || 30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updatedTask = { 
        ...task, 
        completed: true, 
        actualTime: parseInt(actualTime),
        completedAt: new Date()
      };

      const result = await taskService.updateTask(task._id, updatedTask);

      setLoading(false);
      onTaskUpdated(result);
      onClose();
    } catch (error) {
      setError(`Failed to update task: ${error.response?.data?.error || error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Task Completed!</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">{task.title}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-clock mr-2"></i>
              <span>Estimated time: {task.estimatedTime} minutes</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How long did it actually take? (minutes)
              </label>
              <input
                type="number"
                value={actualTime}
                onChange={(e) => setActualTime(e.target.value)}
                min="1"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={() => {
                  // Just mark as complete without tracking time
                  handleSubmit({ preventDefault: () => {} });
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Skip time tracking
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
                    Saving...
                  </>
                ) : (
                  'Save & Complete'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingModal;
