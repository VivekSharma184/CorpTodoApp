import React, { createContext, useState, useContext } from 'react';

// Create a mock router context
const RouterContext = createContext();

// Mock Navigate component
export const Navigate = ({ to }) => {
  const { setCurrentPath } = useContext(RouterContext);
  React.useEffect(() => {
    setCurrentPath(to);
  }, [to, setCurrentPath]);
  return null;
};

// Mock Routes and Route components
export const Routes = ({ children }) => children;
export const Route = ({ path, element }) => {
  const { currentPath } = useContext(RouterContext);
  return currentPath === path ? element : null;
};

// Mock Router component
export const BrowserRouter = ({ children }) => {
  const [currentPath, setCurrentPath] = useState('/');
  
  return (
    <RouterContext.Provider value={{ currentPath, setCurrentPath }}>
      {children}
    </RouterContext.Provider>
  );
};

// Mock hook for navigation
export const useNavigate = () => {
  const { setCurrentPath } = useContext(RouterContext);
  return (path) => setCurrentPath(path);
};

export default RouterContext;
