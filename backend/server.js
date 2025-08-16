const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Task = require('./models/Task');
const taskRoutes = require('./routes/tasks');
const knowledgeBaseRoutes = require('./routes/knowledgeBase');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/test');
const testAuthRoutes = require('./routes/test-auth');
const cleanupRoutes = require('./routes/cleanup');

const app = express();
const PORT = process.env.PORT || 5002; // Changed to port 5002 to avoid conflicts with existing process

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from public directory

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Vivek123:Vivek123@cluster0.bcqjhjq.mongodb.net/todoapp?retryWrites=true&w=majority';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Todo App Backend');
});

// Mount routes
app.use('/tasks', taskRoutes);
app.use('/knowledge', knowledgeBaseRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/test', testRoutes); // For testing/debugging only - remove in production
app.use('/test-auth', testAuthRoutes); // For auth debugging only - remove in production
app.use('/cleanup', cleanupRoutes); // For development only - remove in production

// Add sample routes for login and register (for convenience)
app.get('/login', (req, res) => {
  res.send('Login page - Use POST /auth/login for actual login');
});

app.get('/register', (req, res) => {
  res.send('Register page - Use POST /auth/register for actual registration');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// CRUD operations for tasks
app.post('/tasks', async (req, res) => {
  try {
    console.log('Received POST request to /tasks:', req.body);
    const task = new Task(req.body);
    const savedTask = await task.save();
    console.log('Task saved successfully:', savedTask);
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error saving task:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/tasks', async (req, res) => {
  try {
    console.log('Fetching all tasks');
    const tasks = await Task.find();
    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    console.log(`Updating task ${req.params.id}:`, req.body);
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { 
      new: true, 
      runValidators: true 
    });
    if (!task) {
      console.log(`Task ${req.params.id} not found`);
      return res.status(404).json({ error: 'Task not found' });
    }
    console.log('Task updated successfully:', task);
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    console.log(`Deleting task ${req.params.id}`);
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      console.log(`Task ${req.params.id} not found`);
      return res.status(404).json({ error: 'Task not found' });
    }
    console.log('Task deleted successfully');
    res.json(task);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
