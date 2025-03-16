require('dotenv').config();

const config = {
    // Server Configuration
    server: {
        port: process.env.PORT || 5000,
        env: process.env.NODE_ENV || 'development',
        apiPrefix: '/api'
    },

    // Database Configuration
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whispernet',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        }
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },

    // External Services
    services: {
        // OpenAI Configuration
        openai: {
            apiKey: process.env.OPENAI_API_KEY,
            model: 'gpt-4'
        },

        // Stripe Configuration
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY,
            publicKey: process.env.STRIPE_PUBLIC_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            prices: {
                vip: process.env.STRIPE_VIP_PRICE_ID,
                premium: process.env.STRIPE_PREMIUM_PRICE_ID,
                basic: process.env.STRIPE_BASIC_PRICE_ID
            }
        },

        // AWS Configuration (for file storage)
        aws: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1',
            bucketName: process.env.AWS_BUCKET_NAME
        }
    },

    // Security Configuration
    security: {
        bcryptSaltRounds: 10,
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        }
    },

    // Email Configuration
    email: {
        from: process.env.EMAIL_FROM || 'noreply@whispernetheritage.com',
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        }
    },

    // Feature Flags
    features: {
        enableAI: process.env.ENABLE_AI === 'true',
        enablePayments: process.env.ENABLE_PAYMENTS === 'true',
        enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
        enableFileUploads: process.env.ENABLE_FILE_UPLOADS === 'true'
    },

    // Content Moderation
    moderation: {
        enableAutoModeration: process.env.ENABLE_AUTO_MODERATION === 'true',
        profanityFilter: process.env.ENABLE_PROFANITY_FILTER === 'true',
        maxConfessionLength: 1000,
        reportThreshold: 3
    },

    // Analytics
    analytics: {
        enableTracking: process.env.ENABLE_ANALYTICS === 'true',
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID
    },

    // Cache Configuration
    cache: {
        ttl: 60 * 60, // 1 hour in seconds
        checkPeriod: 60 * 60 // 1 hour in seconds
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined'
    }
};

// Environment-specific configurations
if (config.server.env === 'development') {
    config.security.cors.origin = 'http://localhost:3000';
    config.logging.level = 'debug';
}

// Validation
const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI',
    'STRIPE_SECRET_KEY',
    'OPENAI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.warn(`Warning: Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = config;
