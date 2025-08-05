// server/server.js - CORRECTED VERSION
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const leadsRoutes = require('./routes/leads.js');

// Import config to test connection
const { testConnection, testSettingsRetrieval } = require('./config/supabase.js');

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://your-domain.com', // Add your production domain
    'https://hook.eu1.make.com' // Add Make.com webhook domain
  ], 
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body keys:', Object.keys(req.body));
  }
  next();
});

// Routes
app.use('/api/leads', leadsRoutes);

// Health check endpoint - ENHANCED
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    const settingsAccessible = await testSettingsRetrieval();
    
    res.json({ 
      status: 'Server is running',
      database: dbConnected ? 'Connected' : 'Disconnected',
      settings: settingsAccessible ? 'Accessible' : 'Not accessible',
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      architecture: 'Unified settings table'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint - ENHANCED
app.get('/', (req, res) => {
  res.json({
    message: 'CRM API Server - CORRECTED VERSION',
    version: '2.0.0',
    architecture: 'Unified settings table from Supabase',
    endpoints: {
      health: '/health',
      leadsOptions: '/api/leads/options',
      createLead: '/api/leads/create',
      testLeads: '/api/leads/test'
    },
    changes: [
      'Now uses unified settings table instead of individual tables',
      'Proper field label mapping from settings',
      'Stage key support with backward compatibility',
      'Active-only filtering for dropdown options',
      'Consistent with main application architecture'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: {
      health: '/health',
      leadsOptions: '/api/leads/options',
      createLead: '/api/leads/create',
      testLeads: '/api/leads/test'
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CRM Server running on port ${PORT}`);
  console.log(`📊 Architecture: Unified settings table`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API endpoints: http://localhost:${PORT}/api/leads`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('================================');
});

module.exports = app;