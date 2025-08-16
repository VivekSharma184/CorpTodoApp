# TaskMaster - Corporate Todo App

A modern todo application for tracking daily corporate tasks with history insights.

## Features

- **Task Management**
  - Create, edit, and delete tasks
  - Set priority levels (High, Medium, Low)
  - Assign due dates
  - Add detailed descriptions
  - Mark tasks as completed

- **Task Organization**
  - Filter tasks by priority
  - Sort completed tasks by date or priority
  - View task history

- **Insights & Analytics**
  - Visual charts for task completion rates
  - Priority distribution analysis
  - Historical performance tracking
  - Time-based filtering (weekly, monthly, yearly)

- **Calendar View**
  - Calendar visualization of tasks
  - Due date tracking
  - Daily task overview

## Tech Stack

- **Frontend**
  - React.js
  - Tailwind CSS for styling
  - Chart.js for data visualization

- **Backend**
  - Node.js with Express
  - MongoDB (via MongoDB Atlas)
  
## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB Atlas account (or local MongoDB installation)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/taskmaster.git
   cd taskmaster
   ```

2. Install backend dependencies
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```
   cd ../frontend
   npm install
   ```

4. Configure environment variables (backend)
   - Create a `.env` file in the backend directory with the following content:
   ```
   PORT=3001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key_for_jwt
   ```

### Running the Application

1. Start the backend server
   ```
   cd backend
   npm start
   ```
   The backend server will run on http://localhost:3001

2. Start the frontend development server
   ```
   cd frontend
   npm start
   ```
   The frontend will run on http://localhost:3002

3. Access the application in your browser at http://localhost:3002

### Production Build

To create a production build of the frontend:
```
cd frontend
npm run build
```
This will generate optimized files in the `build` directory.

## Usage

1. **Adding Tasks**
   - Click "Add Task" button
   - Fill in task details (title, description, priority, due date)
   - Click "Save Task"

2. **Managing Tasks**
   - Click the checkbox to mark tasks as completed
   - Use the filter buttons to view tasks by priority
   - Delete tasks using the trash icon

3. **Viewing Insights**
   - Navigate to the "Insights" tab
   - Select time frame (week, month, year)
   - Analyze task completion and priority distribution

4. **Calendar View**
   - Navigate to the "Calendar" tab
   - Click on dates to view scheduled tasks
   - Navigate between months using the arrows

## Deployment

The application is configured for deployment to Netlify.

### Frontend Deployment

1. Ensure you have the required configuration files:
   - `netlify.toml` - Contains build and redirect settings
   - `.gitignore` - Prevents unnecessary files from being deployed

2. Deploy via Netlify CLI:
   ```
   cd frontend
   npm install -g netlify-cli
   netlify deploy
   ```

3. For production deployment:
   ```
   netlify deploy --prod
   ```

### Backend Deployment

The backend can be deployed to platforms like Heroku, Render, or Railway:

1. Create an account on your preferred hosting platform
2. Connect your GitHub repository
3. Configure the environment variables:
   - `PORT`
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Deploy the backend service

## Troubleshooting

### Common Issues

- **Backend connection errors**: Verify that your backend server is running and the frontend configuration points to the correct backend URL.
- **MongoDB connection issues**: Check your MongoDB connection string and ensure your IP is whitelisted in MongoDB Atlas.
- **Port conflicts**: If ports 3001 or 3002 are already in use, you can modify them in the respective configuration files.

## License

MIT
