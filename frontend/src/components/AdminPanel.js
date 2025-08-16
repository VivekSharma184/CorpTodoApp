import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthHeader } from '../services/authService';
import UserDetailView from './UserDetailView';

const AdminPanel = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'admin', 'user'
  const [stats, setStats] = useState({ users: 0, tasks: 0, knowledgeEntries: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        // Try to fetch admin stats - if it works, the user is an admin
        const headers = getAuthHeader();
        await axios.get(`${API_BASE_URL}/admin/stats`, { headers });
        setIsAdmin(true);
        fetchStats();
        fetchUsers();
      } catch (error) {
        console.log('User is not an admin or not authenticated');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}/admin/users`, { headers });
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      setError('Failed to fetch users');
      console.error(error);
    }
  };

  const createUser = async () => {
    try {
      // Validate form fields
      if (!newUser.username || !newUser.email || !newUser.password) {
        setError('Please fill in all required fields');
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      const headers = getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}/admin/users`, newUser, { headers });
      
      // Update UI
      setSuccessMessage(`User ${newUser.username} created successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Clear form and hide it
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      setShowCreateUser(false);
      
      // Refresh user list and stats
      fetchUsers();
      fetchStats();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create user';
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Filter users based on search and role filter
  const filterUsers = (search, filter) => {
    let result = [...users];
    
    // Apply role filter
    if (filter !== 'all') {
      result = result.filter(user => user.role === filter);
    }
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(searchLower) || 
        user.email.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredUsers(result);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setUserSearch(value);
    filterUsers(value, userFilter);
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setUserFilter(value);
    filterUsers(userSearch, value);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchStats = async () => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, { headers });
      setStats(response.data);
    } catch (error) {
      setError('Failed to fetch statistics');
      console.error(error);
    }
  };

  const setupAdmin = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeader();
      await axios.post(`${API_BASE_URL}/admin/setup-admin`, {}, { headers });
      setIsAdmin(true);
      setSuccessMessage('You are now an admin!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
      fetchStats();
    } catch (error) {
      setError('Failed to setup admin account');
      console.error(error);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId) => {
    try {
      const headers = getAuthHeader();
      await axios.put(`${API_BASE_URL}/admin/users/${userId}/make-admin`, {}, { headers });
      setSuccessMessage('User promoted to admin');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (error) {
      setError('Failed to make user admin');
      console.error(error);
      setTimeout(() => setError(null), 3000);
    }
  };

  const removeAdmin = async (userId) => {
    try {
      const headers = getAuthHeader();
      await axios.put(`${API_BASE_URL}/admin/users/${userId}/remove-admin`, {}, { headers });
      setSuccessMessage('Admin privileges revoked');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (error) {
      setError('Failed to remove admin privileges');
      console.error(error);
      setTimeout(() => setError(null), 3000);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user and all their data?')) {
      try {
        const headers = getAuthHeader();
        await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, { headers });
        setSuccessMessage('User deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchUsers();
        fetchStats();
      } catch (error) {
        setError('Failed to delete user');
        console.error(error);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const viewUserDetails = (userId) => {
    setSelectedUserId(userId);
  };

  const handleUserUpdated = () => {
    // Refresh data after user is updated
    fetchUsers();
    fetchStats();
  };

  const clearAllTasks = async () => {
    if (window.confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
      try {
        const headers = getAuthHeader();
        await axios.delete(`${API_BASE_URL}/admin/data/tasks`, { headers });
        setSuccessMessage('All tasks deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchStats();
      } catch (error) {
        setError('Failed to delete tasks');
        console.error(error);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const clearAllKnowledge = async () => {
    if (window.confirm('Are you sure you want to delete ALL knowledge entries? This cannot be undone.')) {
      try {
        const headers = getAuthHeader();
        await axios.delete(`${API_BASE_URL}/admin/data/knowledge`, { headers });
        setSuccessMessage('All knowledge entries deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchStats();
      } catch (error) {
        setError('Failed to delete knowledge entries');
        console.error(error);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to delete ALL tasks and knowledge entries? This cannot be undone.')) {
      try {
        const headers = getAuthHeader();
        await axios.delete(`${API_BASE_URL}/admin/data/all`, { headers });
        setSuccessMessage('All data deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchStats();
      } catch (error) {
        setError('Failed to delete data');
        console.error(error);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>You must be logged in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>You don't have admin privileges.</p>
        </div>
        <button
          onClick={setupAdmin}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Become an Admin
        </button>
        {successMessage && (
          <div className="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Admin Panel</h1>
      
      {successMessage && (
        <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          {error}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-medium">Users</h3>
          <p className="text-3xl font-bold">{stats.users}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-medium">Tasks</h3>
          <p className="text-3xl font-bold">{stats.tasks}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-medium">Knowledge Entries</h3>
          <p className="text-3xl font-bold">{stats.knowledgeEntries}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-transparent hover:border-gray-300 hover:text-gray-600'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Manage Users
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 ${
                activeTab === 'data'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-transparent hover:border-gray-300 hover:text-gray-600'
              }`}
              onClick={() => setActiveTab('data')}
            >
              Manage Data
            </button>
          </li>
        </ul>
      </div>

      {/* Tab content */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-bold mb-4">User Management</h2>

          {/* Search and filter controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={handleSearchChange}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <i className="fas fa-search"></i>
                </div>
              </div>
              
              <select
                className="py-2 px-4 rounded-lg border border-gray-300"
                value={userFilter}
                onChange={handleFilterChange}
              >
                <option value="all">All Users</option>
                <option value="admin">Admins Only</option>
                <option value="user">Regular Users Only</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
          
          {!showCreateUser ? (
            <button 
              className="mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition-all hover:translate-y-[-2px]"
              onClick={() => setShowCreateUser(true)}
            >
              <i className="fas fa-user-plus mr-2"></i> Create New User
            </button>
          ) : (
            <div className="mb-6 p-4 border rounded bg-white">
              <h3 className="text-lg font-bold mb-3">Create New User</h3>
              <div className="grid grid-cols-1 gap-2 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={newUser.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow transition-all flex items-center"
                  onClick={() => setShowCreateUser(false)}
                >
                  <i className="fas fa-times mr-2"></i> Cancel
                </button>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-all hover:translate-y-[-2px] flex items-center"
                  onClick={createUser}
                >
                  <i className="fas fa-check mr-2"></i> Create User
                </button>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <div className="overflow-x-auto -mx-3 md:mx-0">
              <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-2 md:px-6 py-2 md:py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap border-b border-gray-200 text-xs md:text-sm">
                      {user.username}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap border-b border-gray-200 text-xs md:text-sm hidden md:table-cell">
                      {user.email}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap border-b border-gray-200">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap border-b border-gray-200 text-xs md:text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => viewUserDetails(user._id)}
                          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md flex items-center text-xs font-medium transition-colors"
                          title="View user details"
                        >
                          <i className="fas fa-eye mr-1"></i> View
                        </button>
                        
                        {user._id !== currentUser.id && (
                          <>
                            {user.role !== 'admin' ? (
                              <button
                                onClick={() => makeAdmin(user._id)}
                                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md flex items-center text-xs font-medium transition-colors"
                                title="Grant admin privileges"
                              >
                                <i className="fas fa-user-shield mr-1"></i> Make Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => removeAdmin(user._id)}
                                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md flex items-center text-xs font-medium transition-colors"
                                title="Remove admin privileges"
                              >
                                <i className="fas fa-user-slash mr-1"></i> Remove Admin
                              </button>
                            )}
                            <button
                              onClick={() => deleteUser(user._id)}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md flex items-center text-xs font-medium transition-colors"
                              title="Delete user"
                            >
                              <i className="fas fa-trash-alt mr-1"></i> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Data Management</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded">
              <h3 className="font-medium mb-2">Tasks</h3>
              <p className="text-sm text-gray-600 mb-2">
                Delete all tasks from all users. This action cannot be undone.
              </p>
              <button
                onClick={clearAllTasks}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg shadow transition-all hover:shadow-lg flex items-center justify-center space-x-2 text-sm"
              >
                <i className="fas fa-trash-alt"></i>
                <span>Delete All Tasks</span>
              </button>
            </div>
            
            <div className="p-4 border rounded">
              <h3 className="font-medium mb-2">Knowledge Base</h3>
              <p className="text-sm text-gray-600 mb-2">
                Delete all knowledge entries from all users. This action cannot be undone.
              </p>
              <button
                onClick={clearAllKnowledge}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg shadow transition-all hover:shadow-lg flex items-center justify-center space-x-2 text-sm"
              >
                <i className="fas fa-trash-alt"></i>
                <span>Delete All Knowledge Entries</span>
              </button>
            </div>
            
            <div className="p-4 border rounded">
              <h3 className="font-medium mb-2">All Data</h3>
              <p className="text-sm text-gray-600 mb-2">
                Delete all tasks and knowledge entries while preserving user accounts. This action cannot be undone.
              </p>
              <button
                onClick={clearAllData}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg shadow transition-all hover:shadow-lg flex items-center justify-center space-x-2 text-sm"
              >
                <i className="fas fa-exclamation-triangle"></i>
                <span>Reset All Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailView
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default AdminPanel;
