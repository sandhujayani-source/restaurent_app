require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('Restaurant Management App Backend');
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});