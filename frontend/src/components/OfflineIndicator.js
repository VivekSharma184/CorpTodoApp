import React, { useState, useEffect } from 'react';
import taskService from '../services/TaskService';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(taskService.isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [showSyncMessage, setShowSyncMessage] = useState(false);
  
  useEffect(() => {
    // Initial state
    setIsOnline(taskService.isOnline());
    updatePendingCount();
    
    // Add event listener for connection status changes
    const removeListener = taskService.addConnectionStatusListener((online) => {
      setIsOnline(online);
      updatePendingCount();
      
      // If coming back online and we have pending changes, show sync message
      if (online && pendingCount > 0) {
        setShowSyncMessage(true);
        setTimeout(() => setShowSyncMessage(false), 3000);
      }
    });
    
    // Add event listener for sync completion
    const removeSyncListener = taskService.addSyncCompleteListener(() => {
      updatePendingCount();
      setShowSyncMessage(false);
    });
    
    return () => {
      removeListener();
      removeSyncListener();
    };
  }, [pendingCount]);
  
  const updatePendingCount = () => {
    setPendingCount(taskService.getPendingActionsCount());
  };
  
  // Handle manual sync button click
  const handleSync = () => {
    if (isOnline && pendingCount > 0) {
      setShowSyncMessage(true);
      taskService.syncPendingActions()
        .then(() => {
          updatePendingCount();
          setTimeout(() => setShowSyncMessage(false), 1000);
        });
    }
  };
  
  // Don't show anything if online and no pending changes
  if (isOnline && pendingCount === 0 && !showSyncMessage) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg 
      ${isOnline 
        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
      } transition-all duration-300 flex items-center`}
    >
      <div className="mr-2">
        {!isOnline && (
          <>
            <i className="fas fa-wifi-slash mr-1"></i>
            Offline
          </>
        )}
        
        {isOnline && pendingCount > 0 && (
          <>
            <i className="fas fa-cloud-upload-alt mr-1"></i>
            {showSyncMessage ? 'Syncing changes...' : `${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending`}
          </>
        )}
        
        {isOnline && pendingCount === 0 && showSyncMessage && (
          <>
            <i className="fas fa-check-circle mr-1"></i>
            All changes synced!
          </>
        )}
      </div>
      
      {isOnline && pendingCount > 0 && !showSyncMessage && (
        <button 
          onClick={handleSync}
          className="ml-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
        >
          Sync Now
        </button>
      )}
    </div>
  );
};

export default OfflineIndicator;
