const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rule',
        required: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'vetoed'],
        default: 'pending'
    },
    votes: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        vote: {
            type: Boolean,
            required: true
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

// Index for faster queries
eventSchema.index({ groupId: 1, createdAt: -1 });
eventSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
