const mongoose = require('mongoose');

const confessionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Confession text is required'],
        trim: true,
        maxlength: [1000, 'Confession cannot be longer than 1000 characters']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: false
        },
        name: {
            type: String,
            required: false
        }
    },
    category: {
        type: String,
        enum: ['festival', 'cultural', 'personal', 'community', 'other'],
        default: 'other'
    },
    mood: {
        type: String,
        enum: ['happy', 'sad', 'excited', 'nostalgic', 'neutral'],
        default: 'neutral'
    },
    reactions: {
        likes: {
            type: Number,
            default: 0
        },
        hearts: {
            type: Number,
            default: 0
        },
        surprises: {
            type: Number,
            default: 0
        }
    },
    flags: {
        isAnonymous: {
            type: Boolean,
            default: true
        },
        isModerated: {
            type: Boolean,
            default: false
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        isPremium: {
            type: Boolean,
            default: false
        }
    },
    metadata: {
        deviceType: String,
        language: String,
        ipAddress: String
    },
    moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    moderationNotes: [{
        note: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    reports: [{
        reason: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'actioned', 'dismissed'],
            default: 'pending'
        }
    }]
}, {
    timestamps: true
});

// Indexes
confessionSchema.index({ 'location.coordinates': '2dsphere' });
confessionSchema.index({ createdAt: -1 });
confessionSchema.index({ category: 1, createdAt: -1 });
confessionSchema.index({ 'flags.isFeatured': 1, createdAt: -1 });

// Virtual for time since confession
confessionSchema.virtual('timeSince').get(function() {
    const now = new Date();
    const diffInSeconds = Math.floor((now - this.createdAt) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
});

// Methods
confessionSchema.methods.addReaction = async function(reactionType) {
    if (this.reactions.hasOwnProperty(reactionType)) {
        this.reactions[reactionType] += 1;
        await this.save();
    }
    return this.reactions;
};

confessionSchema.methods.removeReaction = async function(reactionType) {
    if (this.reactions.hasOwnProperty(reactionType) && this.reactions[reactionType] > 0) {
        this.reactions[reactionType] -= 1;
        await this.save();
    }
    return this.reactions;
};

confessionSchema.methods.report = async function(reason) {
    this.reports.push({ reason });
    if (this.reports.length >= 3) {
        this.moderationStatus = 'pending';
    }
    await this.save();
    return this.reports;
};

// Static methods
confessionSchema.statics.getFeatured = async function(limit = 10) {
    return this.find({
        'flags.isFeatured': true,
        moderationStatus: 'approved'
    })
    .sort('-createdAt')
    .limit(limit)
    .lean();
};

confessionSchema.statics.getNearby = async function(coordinates, maxDistance = 5000) {
    return this.find({
        'location.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                $maxDistance: maxDistance
            }
        },
        moderationStatus: 'approved'
    })
    .sort('-createdAt')
    .lean();
};

confessionSchema.statics.getByCategory = async function(category, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.find({
        category,
        moderationStatus: 'approved'
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .lean();
};

// Pre-save middleware
confessionSchema.pre('save', function(next) {
    // Sanitize text
    this.text = this.text.trim();
    
    // Set default location name if coordinates exist but name doesn't
    if (this.location.coordinates && this.location.coordinates.length && !this.location.name) {
        this.location.name = 'Anonymous Location';
    }
    
    next();
});

const Confession = mongoose.model('Confession', confessionSchema);

module.exports = Confession;
