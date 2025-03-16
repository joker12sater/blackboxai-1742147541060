const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const festivalController = require('../controllers/festivalController');

// Public routes
router.get('/map', festivalController.getMapData);
router.get('/gossip', festivalController.getGossip);
router.get('/gamification', festivalController.getGamificationData);
router.get('/ar', festivalController.getARContent);
router.post('/confessions', festivalController.postConfession);
router.get('/merch', festivalController.getMerchDiscounts);

// Protected routes (require authentication)
router.get('/vip', auth.verifyToken, festivalController.getVIPContent);
router.post('/subscribe', auth.verifyToken, festivalController.subscribeVIP);

// Monetization routes
router.post('/payment/process', auth.verifyToken, festivalController.processPayment);
router.get('/premium/content', auth.verifyToken, festivalController.getPremiumContent);
router.post('/merch/purchase', auth.verifyToken, festivalController.purchaseMerch);

// Analytics routes for monetization tracking
router.post('/analytics/event', festivalController.trackEvent);
router.get('/analytics/dashboard', auth.verifyToken, festivalController.getAnalyticsDashboard);

module.exports = router;
