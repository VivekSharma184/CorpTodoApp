import React, { useState, useEffect } from 'react';

const TaskTemplates = ({ onSelectTemplate }) => {
  // Default templates - in a real app these would be stored in the database
  const defaultTemplates = [
    {
      id: 'template1',
      name: 'Daily Stand-up',
      template: {
        title: 'Daily Stand-up Meeting',
        description: 'Discuss: 1. What I did yesterday 2. What I\'ll do today 3. Any blockers',
        priority: 'medium',
        dueDate: '',
      }
    },
    {
      id: 'template2',
      name: 'Weekly Report',
      template: {
        title: 'Prepare Weekly Report',
        description: 'Compile key metrics, challenges, and achievements for the week',
        priority: 'high',
        dueDate: '',
      }
    },
    {
      id: 'template3',
      name: 'Follow-up Email',
      template: {
        title: 'Send Follow-up Email',
        description: 'Send follow-up email regarding the discussion points from the meeting',
        priority: 'low',
        dueDate: '',
      }
    }
  ];

  // Local state to store templates
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    // Load saved templates from localStorage or use defaults
    const savedTemplates = localStorage.getItem('taskTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      setTemplates(defaultTemplates);
      localStorage.setItem('taskTemplates', JSON.stringify(defaultTemplates));
    }
  }, []);

  const handleSelectTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    setShowTemplates(false);
  };

  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setShowTemplates(!showTemplates)}
        className="flex items-center text-sm text-gray-600 hover:text-primary"
        type="button"
      >
        <i className="fas fa-file-alt mr-1"></i> Templates
      </button>

      {showTemplates && (
        <div className="absolute z-10 mt-2 w-64 bg-white rounded-md shadow-lg border">
          <div className="py-1">
            <h3 className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
              Select Template
            </h3>
            {templates.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectTemplate(item.template)}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTemplates;
