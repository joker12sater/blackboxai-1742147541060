const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    ticketing: {
        regular: {
            price: {
                type: Number,
                required: true
            },
            available: {
                type: Number,
                required: true
            }
        },
        vip: {
            price: {
                type: Number,
                required: true
            },
            available: {
                type: Number,
                required: true
            },
            benefits: [String]
        }
    },
    merchandise: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        price: {
            type: Number,
            required: true
        },
        discountPrice: Number,
        stock: {
            type: Number,
            required: true
        },
        images: [String]
    }],
    arContent: [{
        name: String,
        description: String,
        assetUrl: String,
        isPremium: {
            type: Boolean,
            default: false
        }
    }],
    gamification: {
        challenges: [{
            name: String,
            description: String,
            points: Number,
            requirements: [String]
        }],
        leaderboard: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            points: Number,
            achievements: [String]
        }]
    },
    analytics: {
        totalVisitors: {
            type: Number,
            default: 0
        },
        revenue: {
            type: Number,
            default: 0
        },
        popularAttractions: [{
            name: String,
            visits: Number
        }],
        merchSales: [{
            itemId: String,
            quantity: Number,
            revenue: Number
        }]
    }
}, {
    timestamps: true
});

// Indexes
festivalSchema.index({ 'location.coordinates': '2dsphere' });
festivalSchema.index({ 'date.start': 1, 'date.end': 1 });

// Static Methods
festivalSchema.statics.getGamificationData = async function(userId) {
    try {
        const festival = await this.findOne()
            .select('gamification')
            .lean();
        
        if (!festival) {
            throw new Error('Festival not found');
        }

        let userRank = null;
        if (userId) {
            userRank = festival.gamification.leaderboard.findIndex(
                entry => entry.userId.toString() === userId.toString()
            ) + 1;
        }

        return {
            challenges: festival.gamification.challenges,
            leaderboard: festival.gamification.leaderboard,
            userRank
        };
    } catch (error) {
        throw error;
    }
};

festivalSchema.statics.getVIPContent = async function(userId) {
    try {
        const festival = await this.findOne()
            .select('ticketing.vip arContent')
            .lean();

        if (!festival) {
            throw new Error('Festival not found');
        }

        return {
            vipBenefits: festival.ticketing.vip.benefits,
            premiumARContent: festival.arContent.filter(content => content.isPremium)
        };
    } catch (error) {
        throw error;
    }
};

festivalSchema.statics.getMerchandise = async function(userId) {
    try {
        const festival = await this.findOne()
            .select('merchandise')
            .lean();

        if (!festival) {
            throw new Error('Festival not found');
        }

        return festival.merchandise;
    } catch (error) {
        throw error;
    }
};

festivalSchema.statics.trackAnalyticsEvent = async function(eventType, eventData) {
    try {
        const festival = await this.findOne();
        
        if (!festival) {
            throw new Error('Festival not found');
        }

        switch (eventType) {
            case 'visit':
                festival.analytics.totalVisitors += 1;
                break;
            case 'purchase':
                festival.analytics.revenue += eventData.amount;
                break;
            case 'attraction':
                const attractionIndex = festival.analytics.popularAttractions
                    .findIndex(a => a.name === eventData.name);
                if (attractionIndex > -1) {
                    festival.analytics.popularAttractions[attractionIndex].visits += 1;
                } else {
                    festival.analytics.popularAttractions.push({
                        name: eventData.name,
                        visits: 1
                    });
                }
                break;
            case 'merchSale':
                const merchIndex = festival.analytics.merchSales
                    .findIndex(m => m.itemId === eventData.itemId);
                if (merchIndex > -1) {
                    festival.analytics.merchSales[merchIndex].quantity += eventData.quantity;
                    festival.analytics.merchSales[merchIndex].revenue += eventData.revenue;
                } else {
                    festival.analytics.merchSales.push({
                        itemId: eventData.itemId,
                        quantity: eventData.quantity,
                        revenue: eventData.revenue
                    });
                }
                break;
        }

        await festival.save();
        return festival.analytics;
    } catch (error) {
        throw error;
    }
};

festivalSchema.statics.getAnalyticsDashboard = async function(userId) {
    try {
        const festival = await this.findOne()
            .select('analytics')
            .lean();

        if (!festival) {
            throw new Error('Festival not found');
        }

        return festival.analytics;
    } catch (error) {
        throw error;
    }
};

const Festival = mongoose.model('Festival', festivalSchema);

module.exports = Festival;
