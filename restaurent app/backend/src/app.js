const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const testProtectedRoutes = require('./routes/test-protected.routes');
const testRolesRoutes = require('./routes/test-roles.routes');

const notFoundMiddleware = require('./middleware/not-found.middleware');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Home endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Restaurant Management App API is running!',
        version: '1.0.0'
    });
});

// Health endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend server is healthy',
        timestamp: new Date().toISOString()
    });
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testProtectedRoutes);
app.use('/api/test-roles', testRolesRoutes);
// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
