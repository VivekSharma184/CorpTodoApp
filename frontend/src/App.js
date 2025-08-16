import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import OfflineIndicator from './components/OfflineIndicator';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

// Main application with authenticated routes
const MainApp = () => {
  const [activeView, setActiveView] = React.useState('tasks');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { logout } = useAuth();
  
  // Toggle sidebar for mobile view
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile header with menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-30 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">
          <i className="fas fa-clipboard-check mr-2"></i>
          TaskMaster
        </h1>
        <button 
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
        </button>
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar - fixed position on mobile, regular on desktop */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed left-0 top-0 bottom-0 z-30 w-64 md:w-64 md:static md:translate-x-0
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar 
          activeView={activeView} 
          setActiveView={(view) => {
            setActiveView(view);
            setSidebarOpen(false);
          }} 
          onLogout={logout}
        />
      </div>
      
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-4 pt-16 md:pt-4">
        <Dashboard activeView={activeView} />
      </main>
      <OfflineIndicator />
    </div>
  );
};

// Auth wrapper for Login/Register to provide authentication context
const AuthWrapper = ({ Component }) => {
  const { setIsAuthenticated, setCurrentUser } = useAuth();
  
  return <Component setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />;
};

// Root app component with routing and auth context
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

// Routes component to use auth context
const AppRoutes = () => {
  const { setIsAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
      <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
