const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log directory
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

// Custom format for logs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}${metaStr}`;
    })
);

// Console format (more colorful for development)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
);

// Daily rotate file transport for combined logs
const combinedFileTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: logFormat
});

// Daily rotate file transport for error logs only
const errorFileTransport = new DailyRotateFile({
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
});

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        combinedFileTransport,
        errorFileTransport
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

// Create specialized loggers for different modules
const createModuleLogger = (moduleName) => ({
    info: (message, meta = {}) => logger.info(`[${moduleName}] ${message}`, meta),
    warn: (message, meta = {}) => logger.warn(`[${moduleName}] ${message}`, meta),
    error: (message, meta = {}) => logger.error(`[${moduleName}] ${message}`, meta),
    debug: (message, meta = {}) => logger.debug(`[${moduleName}] ${message}`, meta),

    // Specialized logging methods
    request: (method, path, userId, meta = {}) => {
        logger.info(`[${moduleName}] ${method} ${path}`, { userId, ...meta });
    },
    success: (operation, meta = {}) => {
        logger.info(`[${moduleName}] ${operation} completed successfully`, meta);
    },
    failure: (operation, error, meta = {}) => {
        logger.error(`[${moduleName}] ${operation} failed`, {
            error: error.message,
            stack: error.stack,
            ...meta
        });
    }
});

// Pre-built module loggers
const loggers = {
    auth: createModuleLogger('AUTH'),
    tasks: createModuleLogger('TASKS'),
    goals: createModuleLogger('GOALS'),
    scheduled: createModuleLogger('SCHEDULED'),
    logs: createModuleLogger('LOGS'),
    chat: createModuleLogger('CHAT'),
    research: createModuleLogger('RESEARCH'),
    reflection: createModuleLogger('REFLECTION'),
    planner: createModuleLogger('PLANNER'),
    server: createModuleLogger('SERVER'),
    db: createModuleLogger('DATABASE')
};

module.exports = {
    logger,
    createModuleLogger,
    ...loggers
};
