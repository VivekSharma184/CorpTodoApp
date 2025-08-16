import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthHeader } from '../services/authService';

const UserDetailView = ({ userId, onClose, onUserUpdated }) => {
  const [userData, setUserData] = useState(null);
  const [userStats, setUserStats] = useState({ tasks: 0, knowledge: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeader();
      console.log('Fetching user data for ID:', userId);
      
      try {
        // Get user details
        const response = await axios.get(`${API_BASE_URL}/admin/users/${userId}`, { headers });
        console.log('User data response:', response.data);
        
        setUserData(response.data);
        setEditData({
          username: response.data.username,
          email: response.data.email,
          role: response.data.role || 'user'
        });
        
        // Get user stats
        try {
          const statsResponse = await axios.get(`${API_BASE_URL}/admin/users/${userId}/stats`, { headers });
          console.log('User stats response:', statsResponse.data);
          setUserStats(statsResponse.data);
        } catch (statsError) {
          console.error('Error fetching user stats:', statsError);
          // Default to 0 if we can't get stats
          setUserStats({ tasks: 0, knowledge: 0 });
        }
      } catch (userError) {
        console.error('Error fetching user details:', userError);
        throw userError;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setError(`Failed to fetch user data: ${error.response?.status} ${error.message}`);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const headers = getAuthHeader();
      await axios.put(`${API_BASE_URL}/admin/users/${userId}`, editData, { headers });
      setUserData({
        ...userData,
        ...editData
      });
      setEditing(false);
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error) {
      setError('Failed to update user data');
      console.error(error);
    }
  };

  const handleDeleteUserData = async (type) => {
    if (!window.confirm(`Are you sure you want to delete all ${type} for this user?`)) {
      return;
    }
    
    try {
      const headers = getAuthHeader();
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}/${type}`, { headers });
      
      // Update stats
      const newStats = { ...userStats };
      newStats[type] = 0;
      setUserStats(newStats);
      
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error) {
      setError(`Failed to delete user ${type}`);
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <div className="animate-pulse flex justify-center">
            <div className="h-8 w-8 border-4 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
          <p>{error || 'Failed to load user data'}</p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold">User Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="mb-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={editData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={editData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col md:flex-row md:items-center">
                <span className="w-full md:w-24 font-medium mb-1 md:mb-0">Username:</span>
                <span className="text-sm md:text-base">{userData.username}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <span className="w-full md:w-24 font-medium mb-1 md:mb-0">Email:</span>
                <span className="text-sm md:text-base break-all">{userData.email}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <span className="w-full md:w-24 font-medium mb-1 md:mb-0">Role:</span>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  userData.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {userData.role}
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <span className="w-full md:w-24 font-medium mb-1 md:mb-0">Created:</span>
                <span className="text-sm md:text-base">{new Date(userData.createdAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">User Statistics</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{userStats.tasks}</div>
              <div className="text-sm text-gray-600">Tasks</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-2xl md:text-3xl font-bold text-green-600">{userStats.knowledge}</div>
              <div className="text-sm text-gray-600">Knowledge Entries</div>
            </div>
          </div>
        </div>

        {/* Data management section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Data Management</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleDeleteUserData('tasks')}
              className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg shadow-sm flex items-center justify-between transition-colors"
            >
              <span className="flex items-center"><i className="fas fa-trash-alt mr-2"></i> Delete All Tasks</span>
              <span className="text-xs bg-red-200 py-1 px-2 rounded-full font-bold">{userStats.tasks}</span>
            </button>
            <button
              onClick={() => handleDeleteUserData('knowledge')}
              className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg shadow-sm flex items-center justify-between transition-colors"
            >
              <span className="flex items-center"><i className="fas fa-trash-alt mr-2"></i> Delete All Knowledge Entries</span>
              <span className="text-xs bg-red-200 py-1 px-2 rounded-full font-bold">{userStats.knowledge}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow transition-all flex items-center"
              >
                <i className="fas fa-times mr-2"></i> Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-all hover:translate-y-[-2px] flex items-center"
              >
                <i className="fas fa-save mr-2"></i> Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-all hover:translate-y-[-2px] flex items-center"
            >
              <i className="fas fa-edit mr-2"></i> Edit User
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailView;
