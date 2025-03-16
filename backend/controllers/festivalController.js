const Festival = require('../models/Festival');
const Confession = require('../models/Confession');
const paymentService = require('../services/paymentService');

/**
 * Festival Controller
 * Handles all festival-related operations
 */
const festivalController = {
    /**
     * Get festival map data
     */
    async getMapData(req, res) {
        try {
            const festivals = await Festival.find({ 
                'settings.isPublished': true,
                startDate: { $gte: new Date() }
            }).select('name location startDate category stats');

            res.json({
                success: true,
                data: festivals
            });
        } catch (error) {
            console.error('Map Data Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch map data'
            });
        }
    },

    /**
     * Get festival gossip feed
     */
    async getGossip(req, res) {
        try {
            const confessions = await Confession.find({
                festival: req.params.festivalId,
                status: 'approved',
                visibility: 'public'
            })
            .sort('-createdAt')
            .populate('author', 'username avatar')
            .limit(20);

            res.json({
                success: true,
                data: confessions
            });
        } catch (error) {
            console.error('Gossip Feed Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch gossip feed'
            });
        }
    },

    /**
     * Get gamification data
     */
    async getGamificationData(req, res) {
        try {
            const userId = req.user.id;
            const festivalId = req.params.festivalId;

            // Get user's achievements, points, and rankings
            const userStats = await Festival.aggregate([
                { $match: { _id: festivalId } },
                { $unwind: '$attendees' },
                { $match: { 'attendees.userId': userId } },
                { $project: {
                    points: '$attendees.points',
                    achievements: '$attendees.achievements',
                    rank: '$attendees.rank'
                }}
            ]);

            res.json({
                success: true,
                data: userStats[0] || { points: 0, achievements: [], rank: 'Newcomer' }
            });
        } catch (error) {
            console.error('Gamification Data Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch gamification data'
            });
        }
    },

    /**
     * Get AR content
     */
    async getARContent(req, res) {
        try {
            const festival = await Festival.findById(req.params.festivalId)
                .select('arContent location');

            if (!festival) {
                return res.status(404).json({
                    success: false,
                    error: 'Festival not found'
                });
            }

            res.json({
                success: true,
                data: festival.arContent
            });
        } catch (error) {
            console.error('AR Content Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch AR content'
            });
        }
    },

    /**
     * Post a confession
     */
    async postConfession(req, res) {
        try {
            const confession = new Confession({
                content: req.body.content,
                author: req.user.id,
                festival: req.params.festivalId,
                location: req.body.location,
                mood: req.body.mood,
                anonymous: req.body.anonymous
            });

            await confession.save();

            res.json({
                success: true,
                data: confession
            });
        } catch (error) {
            console.error('Confession Post Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to post confession'
            });
        }
    },

    /**
     * Get merchandise discounts
     */
    async getMerchDiscounts(req, res) {
        try {
            const festival = await Festival.findById(req.params.festivalId)
                .select('merchandise');

            if (!festival) {
                return res.status(404).json({
                    success: false,
                    error: 'Festival not found'
                });
            }

            res.json({
                success: true,
                data: festival.merchandise
            });
        } catch (error) {
            console.error('Merchandise Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch merchandise data'
            });
        }
    },

    /**
     * Purchase merchandise
     */
    async purchaseMerch(req, res) {
        try {
            const { items, paymentMethodId } = req.body;
            const festivalId = req.params.festivalId;

            // Calculate total amount
            const festival = await Festival.findById(festivalId);
            const total = items.reduce((sum, item) => {
                const merchItem = festival.merchandise.find(m => m.id === item.id);
                return sum + (merchItem.price * item.quantity);
            }, 0);

            // Create payment intent
            const paymentIntent = await paymentService.createPaymentIntent({
                amount: total,
                userId: req.user.id,
                festivalId,
                paymentMethodId
            });

            res.json({
                success: true,
                data: paymentIntent
            });
        } catch (error) {
            console.error('Purchase Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process purchase'
            });
        }
    },

    /**
     * Check VIP status middleware
     */
    async checkVIP(req, res, next) {
        try {
            const festival = await Festival.findById(req.params.festivalId);
            const isVIP = festival.vipAttendees.includes(req.user.id);

            if (!isVIP) {
                return res.status(403).json({
                    success: false,
                    error: 'VIP access required'
                });
            }

            next();
        } catch (error) {
            console.error('VIP Check Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to verify VIP status'
            });
        }
    },

    /**
     * Get VIP content
     */
    async getVIPContent(req, res) {
        try {
            const festival = await Festival.findById(req.params.festivalId)
                .select('vipContent');

            res.json({
                success: true,
                data: festival.vipContent
            });
        } catch (error) {
            console.error('VIP Content Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch VIP content'
            });
        }
    },

    /**
     * Subscribe to VIP status
     */
    async subscribe(req, res) {
        try {
            const { paymentMethodId } = req.body;
            const festivalId = req.params.festivalId;

            const festival = await Festival.findById(festivalId);
            const subscription = await paymentService.createSubscription({
                userId: req.user.id,
                email: req.user.email,
                paymentMethodId,
                priceId: festival.vipSubscriptionPriceId
            });

            res.json({
                success: true,
                data: subscription
            });
        } catch (error) {
            console.error('Subscription Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process subscription'
            });
        }
    },

    /**
     * Track analytics event
     */
    async trackEvent(req, res) {
        try {
            const { eventType, metadata } = req.body;
            const festivalId = req.params.festivalId;

            await Festival.findByIdAndUpdate(festivalId, {
                $push: {
                    analytics: {
                        eventType,
                        userId: req.user.id,
                        metadata,
                        timestamp: new Date()
                    }
                }
            });

            res.json({
                success: true,
                message: 'Event tracked successfully'
            });
        } catch (error) {
            console.error('Analytics Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to track event'
            });
        }
    },

    /**
     * Check admin status middleware
     */
    async checkAdmin(req, res, next) {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        next();
    },

    /**
     * Get analytics dashboard
     */
    async getDashboard(req, res) {
        try {
            const festivalId = req.params.festivalId;

            const analytics = await Festival.aggregate([
                { $match: { _id: festivalId } },
                { $unwind: '$analytics' },
                { $group: {
                    _id: '$analytics.eventType',
                    count: { $sum: 1 },
                    users: { $addToSet: '$analytics.userId' }
                }},
                { $project: {
                    eventType: '$_id',
                    count: 1,
                    uniqueUsers: { $size: '$users' }
                }}
            ]);

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            console.error('Dashboard Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch dashboard data'
            });
        }
    },

    /**
     * Process payment
     */
    async processPayment(req, res) {
        try {
            const { paymentMethodId, amount } = req.body;
            const festivalId = req.params.festivalId;

            const paymentIntent = await paymentService.createPaymentIntent({
                amount,
                userId: req.user.id,
                festivalId,
                paymentMethodId
            });

            res.json({
                success: true,
                data: paymentIntent
            });
        } catch (error) {
            console.error('Payment Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process payment'
            });
        }
    }
};

module.exports = festivalController;
