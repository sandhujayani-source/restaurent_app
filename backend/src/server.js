require('dotenv').config();

const app = require('./app');
const pool = require('./config/database');
const { validateEnvironment } = require('./config/env');
const initializeDatabase = require('./config/initializeDatabase');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        validateEnvironment();
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log('Restaurant Management App Backend');
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Backend startup failed:', error.message);
        await pool.end();
        process.exitCode = 1;
    }
}

startServer();