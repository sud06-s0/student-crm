// server/routes/leads.js
const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController.js');

// Middleware for all leads routes
router.use((req, res, next) => {
  console.log(`Leads API: ${req.method} ${req.path}`);
  next();
});

// GET /api/leads/test - Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Leads API is working perfectly!', 
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// GET /api/leads/options - Get field options for Make.com
router.get('/options', async (req, res) => {
  try {
    await leadsController.getOptions(req, res);
  } catch (error) {
    console.error('Options route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get options',
      message: error.message
    });
  }
});

// POST /api/leads/create - Create new lead from Make.com
router.post('/create', async (req, res) => {
  try {
    await leadsController.createLead(req, res);
  } catch (error) {
    console.error('Create lead route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lead',
      message: error.message
    });
  }
});

// GET /api/leads - Get all leads (optional for testing)
router.get('/', (req, res) => {
  res.json({
    message: 'Leads API endpoints',
    endpoints: {
      test: 'GET /api/leads/test',
      options: 'GET /api/leads/options',
      create: 'POST /api/leads/create'
    }
  });
});

module.exports = router;