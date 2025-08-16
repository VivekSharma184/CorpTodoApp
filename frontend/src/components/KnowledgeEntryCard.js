import React from 'react';

const KnowledgeEntryCard = ({ entry, onClick }) => {
  // Function to get category badge color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'incident':
        return 'bg-red-100 text-red-800';
      case 'solution':
        return 'bg-green-100 text-green-800';
      case 'process':
        return 'bg-blue-100 text-blue-800';
      case 'reference':
        return 'bg-purple-100 text-purple-800';
      case 'other':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  // Function to strip HTML tags for preview
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Get plain text content for preview
  const getContentPreview = () => {
    const plainText = stripHtml(entry.content);
    return truncateText(plainText);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        {/* Status indicator */}
        {entry._isOffline && (
          <div className="text-xs text-gray-500 mb-1 flex items-center">
            <i className="fas fa-cloud-upload-alt mr-1"></i>
            <span>Pending sync</span>
          </div>
        )}
        
        {/* Title */}
        <h3 className="font-medium text-lg mb-2">{entry.title}</h3>
        
        {/* Category badge */}
        <div className="mb-3">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(entry.category)}`}>
            {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
          </span>
          
          {entry.status === 'draft' && (
            <span className="ml-2 inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
              Draft
            </span>
          )}
          
          {entry.version > 1 && (
            <span className="ml-2 text-xs text-gray-500">
              v{entry.version}
            </span>
          )}
        </div>
        
        {/* Content preview */}
        <div className="text-sm text-gray-600 mb-4">
          {getContentPreview()}
        </div>
        
        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {entry.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                +{entry.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
          <div>
            {formatDate(entry.updatedAt || entry.createdAt)}
          </div>
          <div className="flex items-center">
            {entry.relatedTasks && entry.relatedTasks.length > 0 && (
              <span className="flex items-center mr-3">
                <i className="fas fa-tasks mr-1"></i>
                {entry.relatedTasks.length}
              </span>
            )}
            <span>
              <i className="fas fa-eye mr-1"></i>
              View
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeEntryCard;
