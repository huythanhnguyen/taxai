const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Tax Filing PWA Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock API endpoints for testing
app.get('/api/tax-forms', (req, res) => {
  res.json({
    success: true,
    data: {
      forms: [
        {
          id: '1',
          type: 'TNCN_ANNUAL',
          status: 'DRAFT',
          taxYear: 2024,
          periodStartDate: '2024-01-01',
          periodEndDate: '2024-12-31',
          totalTaxAmount: 0,
          totalPayableAmount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1
      }
    }
  });
});

app.post('/api/tax-forms', (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      form: {
        id: Date.now().toString(),
        ...req.body,
        status: 'DRAFT',
        totalTaxAmount: 0,
        totalPayableAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    message: 'Tax form created successfully'
  });
});

app.get('/api/tax-forms/templates', (req, res) => {
  res.json({
    success: true,
    data: {
      templates: [
        {
          id: '1',
          type: 'TNCN_ANNUAL',
          name: 'Tờ khai thuế TNCN năm 2024',
          version: '2024.1',
          effectiveDate: '2024-01-01'
        }
      ]
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Tax Filing PWA Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 