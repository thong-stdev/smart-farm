// Simple logger for frontend
const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
    info: (msg, ...args) => {
        if (isDevelopment) console.log(`[INFO] ${msg}`, ...args);
    },
    warn: (msg, ...args) => {
        if (isDevelopment) console.warn(`[WARN] ${msg}`, ...args);
    },
    error: (msg, ...args) => {
        console.error(`[ERROR] ${msg}`, ...args);
    },
    debug: (msg, ...args) => {
        if (isDevelopment) console.debug(`[DEBUG] ${msg}`, ...args);
    }
};

export default logger;
