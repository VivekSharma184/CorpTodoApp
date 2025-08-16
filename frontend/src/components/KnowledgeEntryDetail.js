import React, { useState, useEffect } from 'react';
import taskService from '../services/TaskService';
import knowledgeService from '../services/KnowledgeService';
import QuillEditor from './QuillEditor';
import { exportAsHtml, exportAsPdf } from '../utils/ExportUtils';

const KnowledgeEntryDetail = ({ entry, onEdit, onDelete, onBack }) => {

  const [tasks, setTasks] = useState([]);
  const [relatedTasks, setRelatedTasks] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  useEffect(() => {
    if (entry && entry.relatedTasks) {
      fetchRelatedTasks();
    }
  }, [entry]);
  
  const fetchRelatedTasks = async () => {
    try {
      const allTasks = await taskService.getTasks();
      
      // Filter tasks that are related to this entry
      const related = allTasks.filter(task => 
        entry.relatedTasks.some(relatedId => 
          relatedId === task._id || (typeof relatedId === 'object' && relatedId._id === task._id)
        )
      );
      
      setRelatedTasks(related);
    } catch (error) {
      console.error('Error fetching related tasks:', error);
    }
  };
  
  const fetchAllTasks = async () => {
    try {
      const allTasks = await taskService.getTasks();
      
      // Filter out already related tasks
      const availableTasks = allTasks.filter(task => 
        !entry.relatedTasks.some(relatedId => 
          relatedId === task._id || (typeof relatedId === 'object' && relatedId._id === task._id)
        )
      );
      
      setTasks(availableTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  
  const openLinkModal = async () => {
    await fetchAllTasks();
    setShowLinkModal(true);
  };
  
  const handleTaskSelection = (taskId) => {
    setSelectedTaskIds(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };
  
  const linkTasks = async () => {
    if (selectedTaskIds.length === 0) return;
    
    setLoading(true);
    
    try {
      await knowledgeService.linkToTasks(entry._id, selectedTaskIds);
      
      // Refresh the related tasks
      await fetchRelatedTasks();
      
      // Reset and close modal
      setSelectedTaskIds([]);
      setShowLinkModal(false);
    } catch (error) {
      console.error('Error linking tasks:', error);
      alert('Failed to link tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get category display name and color
  const getCategoryInfo = (category) => {
    let displayName = category.charAt(0).toUpperCase() + category.slice(1);
    let bgColor = '';
    
    switch (category) {
      case 'incident':
        bgColor = 'bg-red-100 text-red-800';
        break;
      case 'solution':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'process':
        bgColor = 'bg-blue-100 text-blue-800';
        break;
      case 'reference':
        bgColor = 'bg-purple-100 text-purple-800';
        break;
      default:
        bgColor = 'bg-gray-100 text-gray-800';
    }
    
    return { displayName, bgColor };
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // No entry provided
  if (!entry) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p>No knowledge entry selected.</p>
        <button
          onClick={onBack}
          className="mt-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
        >
          Back to List
        </button>
      </div>
    );
  }
  
  const categoryInfo = getCategoryInfo(entry.category);
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-blue-500 hover:text-blue-700"
              title="Edit"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-700"
              title="Delete"
            >
              <i className="fas fa-trash"></i>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(prev => !prev)}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center text-sm"
              >
                <i className="fas fa-download mr-1"></i> Export
              </button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportAsHtml(entry);
                        setShowExportOptions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <i className="fas fa-file-code mr-2"></i> Export as HTML
                    </button>
                    <button
                      onClick={() => {
                        exportAsPdf(entry);
                        setShowExportOptions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <i className="fas fa-file-pdf mr-2"></i> Export as PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">{entry.title}</h1>
        
        <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
          <span className={`px-2 py-1 rounded-full ${categoryInfo.bgColor}`}>
            {categoryInfo.displayName}
          </span>
          
          {entry.status === 'draft' && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              Draft
            </span>
          )}
          
          {entry.version > 1 && (
            <span className="text-gray-500">
              Version {entry.version}
            </span>
          )}
          
          <span className="text-gray-500">
            Updated {formatDate(entry.updatedAt)}
          </span>
        </div>
        
        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {entry.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        <QuillEditor
          value={entry.content}
          readOnly={true}
          height="auto"
        />
      </div>
      
      {/* Related Tasks */}
      <div className="p-6 border-t">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Related Tasks</h3>
          <button
            onClick={openLinkModal}
            className="text-primary hover:text-primary-dark text-sm flex items-center"
          >
            <i className="fas fa-link mr-1"></i>
            Link Tasks
          </button>
        </div>
        
        {relatedTasks.length > 0 ? (
          <div className="space-y-2">
            {relatedTasks.map(task => (
              <div key={task._id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-gray-500">
                    {task.priority === 'high' && <span className="text-red-500 mr-2">High</span>}
                    {task.dueDate && (
                      <span>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  {task.completed ? (
                    <span className="text-green-500">
                      <i className="fas fa-check-circle mr-1"></i>
                      Complete
                    </span>
                  ) : (
                    <span className="text-blue-500">
                      <i className="fas fa-clock mr-1"></i>
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 italic">
            No related tasks linked to this entry.
          </div>
        )}
      </div>
      
      {/* Link Tasks Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Link Tasks</h2>
                <button 
                  onClick={() => setShowLinkModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {tasks.length === 0 ? (
                <p className="text-center py-4 text-gray-500 italic">
                  No available tasks to link.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
                  {tasks.map(task => (
                    <div 
                      key={task._id}
                      className={`p-3 rounded-md cursor-pointer ${
                        selectedTaskIds.includes(task._id) 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => handleTaskSelection(task._id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task._id)}
                          onChange={() => handleTaskSelection(task._id)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-gray-500">
                            {task.priority === 'high' && <span className="text-red-500 mr-2">High</span>}
                            {task.dueDate && (
                              <span>
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={linkTasks}
                  disabled={selectedTaskIds.length === 0 || loading}
                  className={`px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md flex items-center ${
                    (selectedTaskIds.length === 0 || loading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin mr-2"></i>
                      Linking...
                    </>
                  ) : (
                    <>Link Selected ({selectedTaskIds.length})</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeEntryDetail;
