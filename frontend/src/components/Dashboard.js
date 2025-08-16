import React from 'react';
import TaskList from './TaskList';
import InsightsView from './InsightsView';
import CalendarView from './CalendarView';
import CompletedTasks from './CompletedTasks';
import FocusView from './FocusView';
import TodayPlan from './TodayPlan';
import StatusReport from './StatusReport';
import KnowledgeBase from './KnowledgeBase';
import AdminPanel from './AdminPanel';

const Dashboard = ({ activeView }) => {
  // Render different components based on the active view
  const renderView = () => {
    switch (activeView) {
      case 'today':
        return <TodayPlan />;
      case 'tasks':
        return <TaskList />;
      case 'focus':
        return <FocusView />;
      case 'completed':
        return <CompletedTasks />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'report':
        return <StatusReport />;
      case 'insights':
        return <InsightsView />;
      case 'calendar':
        return <CalendarView />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <TodayPlan />;
    }
  };

  // Get the title based on the active view
  const getViewTitle = () => {
    switch (activeView) {
      case 'today':
        return "Today's Plan";
      case 'tasks':
        return 'My Tasks';
      case 'focus':
        return 'Focus View';
      case 'completed':
        return 'Completed Tasks';
      case 'knowledge':
        return 'Knowledge Base';
      case 'report':
        return 'Status Report';
      case 'insights':
        return 'Task Insights';
      case 'calendar':
        return 'Task Calendar';
      default:
        return "Today's Plan";
    }
  };

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{getViewTitle()}</h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </header>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {renderView()}
      </div>
    </div>
  );
};

export default Dashboard;
