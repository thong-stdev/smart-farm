require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { specs, swaggerUi } = require('./config/swagger');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://smart-farm-plum-mu.vercel.app',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Smart Farm API Documentation'
}));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Farm API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes (rate limiting applied per-route in route files)
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        code: 'NOT_FOUND'
    });
});

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`🌾 Smart Farm API - Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
    });
});

module.exports = app;
