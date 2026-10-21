const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./config/swagger');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const menuRoutes = require('./routes/menu.routes');
const tableRoutes = require('./routes/table.routes');

const app = express();

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================================================
// HEALTH CHECK
// ==================================================

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'AHVANAM Restaurant Management API is running',
        timestamp: new Date().toISOString()
    });
});

// ==================================================
// SWAGGER OPENAPI JSON
// ==================================================

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    // Temporary diagnostic: check whether DELETE exists
    // in the Swagger document loaded by this application.
    console.log(
        'DELETE in live Swagger document:',
        Boolean(
            swaggerDocument.paths['/api/menu/items/{id}']?.delete
        )
    );

    res.status(200).json(swaggerDocument);
});

// ==================================================
// SWAGGER UI
// ==================================================

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
        explorer: true,
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
            filter: true,
            displayRequestDuration: true
        }
    })
);

// ==================================================
// API ROUTES
// ==================================================

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);

// ==================================================
// 404 HANDLER
// ==================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use((err, req, res, next) => {
    console.error('API Error:', err);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.status || err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? 'Internal server error'
                : err.message
    });
});

// ==================================================
// EXPORT APPLICATION
// ==================================================

module.exports = app;