const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8001;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// More permissive CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Pre-flight requests
app.options('*', cors());

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  
  // Add CORS headers on every response
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Mock user database
const users = [];

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Registration endpoint
app.post('/api/v1/auth/register', (req, res) => {
  console.log('Registration endpoint hit:', req.body);
  
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User already exists'
      });
    }
    
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In a real app, this would be hashed
      fullName,
      createdAt: new Date().toISOString()
    };
    
    // Add user to our mock database
    users.push(newUser);
    
    console.log('Created new user:', newUser);
    console.log('Current users in database:', users);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      status: 'success',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

// Login endpoint
app.post('/api/v1/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Verify password
    if (user.password !== password) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    console.log('User logged in successfully:', user);
    
    // Return success response without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      status: 'success',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Login failed due to server error'
    });
  }
});

// List all users (for debugging)
app.get('/api/v1/users', (req, res) => {
  console.log('Users list requested');
  res.json({
    status: 'success',
    users
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- GET http://localhost:${PORT}/health`);
  console.log(`- POST http://localhost:${PORT}/api/v1/auth/register`);
  console.log('- POST /api/v1/auth/login - User login');
  console.log('- GET /api/v1/users - List all users (debug)');
}); 