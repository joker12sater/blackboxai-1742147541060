const Festival = require('../models/Festival');
const Confession = require('../models/Confession');
const mapService = require('../services/mapService');
const aiService = require('../services/aiService');
const arService = require('../services/arService');
const paymentService = require('../services/paymentService');
const moderationService = require('../services/moderationService');

// Map Data Controller
exports.getMapData = async (req, res) => {
    try {
        const mapData = await mapService.getFestivalMapData();
        res.json({ success: true, data: mapData });
    } catch (error) {
        console.error('Map Data Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching map data' });
    }
};

// AI-Powered Gossip Controller
exports.getGossip = async (req, res) => {
    try {
        const gossipData = await aiService.generateGossip();
        res.json({ success: true, data: gossipData });
    } catch (error) {
        console.error('Gossip Error:', error);
        res.status(500).json({ success: false, message: 'Error generating gossip' });
    }
};

// Gamification Controller
exports.getGamificationData = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const gamificationData = await Festival.getGamificationData(userId);
        res.json({ success: true, data: gamificationData });
    } catch (error) {
        console.error('Gamification Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching gamification data' });
    }
};

// AR Content Controller
exports.getARContent = async (req, res) => {
    try {
        const arContent = await arService.getARContent();
        res.json({ success: true, data: arContent });
    } catch (error) {
        console.error('AR Content Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching AR content' });
    }
};

// Anonymous Confessions Controller
exports.postConfession = async (req, res) => {
    try {
        const { text, location } = req.body;
        
        // Moderate content
        const isAppropriate = await moderationService.validateContent(text);
        if (!isAppropriate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Content violates community guidelines' 
            });
        }

        const confession = new Confession({ text, location });
        await confession.save();
        
        res.status(201).json({ success: true, data: confession });
    } catch (error) {
        console.error('Confession Error:', error);
        res.status(500).json({ success: false, message: 'Error posting confession' });
    }
};

// VIP Content Controller
exports.getVIPContent = async (req, res) => {
    try {
        const userId = req.user.id;
        const vipContent = await Festival.getVIPContent(userId);
        res.json({ success: true, data: vipContent });
    } catch (error) {
        console.error('VIP Content Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching VIP content' });
    }
};

// Merchandise Controller
exports.getMerchDiscounts = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const merchData = await Festival.getMerchandise(userId);
        res.json({ success: true, data: merchData });
    } catch (error) {
        console.error('Merchandise Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching merchandise' });
    }
};

// VIP Subscription Controller
exports.subscribeVIP = async (req, res) => {
    try {
        const { userId, paymentMethod } = req.body;
        const subscription = await paymentService.createSubscription(userId, paymentMethod);
        res.json({ success: true, data: subscription });
    } catch (error) {
        console.error('Subscription Error:', error);
        res.status(500).json({ success: false, message: 'Error processing subscription' });
    }
};

// Payment Processing Controller
exports.processPayment = async (req, res) => {
    try {
        const { amount, currency, paymentMethod } = req.body;
        const payment = await paymentService.processPayment({
            amount,
            currency,
            paymentMethod,
            userId: req.user.id
        });
        res.json({ success: true, data: payment });
    } catch (error) {
        console.error('Payment Error:', error);
        res.status(500).json({ success: false, message: 'Error processing payment' });
    }
};

// Premium Content Controller
exports.getPremiumContent = async (req, res) => {
    try {
        const userId = req.user.id;
        const premiumContent = await Festival.getPremiumContent(userId);
        res.json({ success: true, data: premiumContent });
    } catch (error) {
        console.error('Premium Content Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching premium content' });
    }
};

// Merchandise Purchase Controller
exports.purchaseMerch = async (req, res) => {
    try {
        const { merchId, quantity, paymentMethod } = req.body;
        const purchase = await paymentService.processMerchPurchase({
            merchId,
            quantity,
            paymentMethod,
            userId: req.user.id
        });
        res.json({ success: true, data: purchase });
    } catch (error) {
        console.error('Merch Purchase Error:', error);
        res.status(500).json({ success: false, message: 'Error processing merchandise purchase' });
    }
};

// Analytics Event Tracking Controller
exports.trackEvent = async (req, res) => {
    try {
        const { eventType, eventData } = req.body;
        const event = await Festival.trackAnalyticsEvent(eventType, eventData);
        res.json({ success: true, data: event });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ success: false, message: 'Error tracking analytics event' });
    }
};

// Analytics Dashboard Controller
exports.getAnalyticsDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const analytics = await Festival.getAnalyticsDashboard(userId);
        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error('Analytics Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching analytics dashboard' });
    }
};
