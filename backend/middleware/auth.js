const jwt = require('jsonwebtoken');

// Load JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.'
        });
    }
};

// Middleware to check if user has VIP status
exports.checkVIPStatus = async (req, res, next) => {
    try {
        if (!req.user.isVIP) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. VIP subscription required.'
            });
        }
        next();
    } catch (error) {
        console.error('VIP Check Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking VIP status.'
        });
    }
};

// Middleware to check if user has premium status
exports.checkPremiumStatus = async (req, res, next) => {
    try {
        if (!req.user.isPremium) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Premium subscription required.'
            });
        }
        next();
    } catch (error) {
        console.error('Premium Check Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking premium status.'
        });
    }
};

// Generate JWT token
exports.generateToken = (userData) => {
    return jwt.sign(
        {
            id: userData._id,
            email: userData.email,
            isVIP: userData.isVIP,
            isPremium: userData.isPremium
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Refresh token middleware
exports.refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.body.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required.'
            });
        }

        try {
            const decoded = jwt.verify(refreshToken, JWT_SECRET);
            const newToken = exports.generateToken({
                _id: decoded.id,
                email: decoded.email,
                isVIP: decoded.isVIP,
                isPremium: decoded.isPremium
            });

            return res.json({
                success: true,
                data: { token: newToken }
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token.'
            });
        }
    } catch (error) {
        console.error('Refresh Token Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error refreshing token.'
        });
    }
};
