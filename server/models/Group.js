const mongoose = require('mongoose');

// Function to generate unique 6-character alphanumeric code
function generateJoinCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        totalPoints: {
            type: Number,
            default: 0
        }
    }],
    rules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rule'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    joinCode: {
        type: String,
        unique: true,
        required: false,
        uppercase: true,
        length: 6
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster lookups
groupSchema.index({ joinCode: 1 });

// Pre-save hook to generate unique join code
groupSchema.pre('save', async function (next) {
    if (!this.joinCode) {
        let code;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            code = generateJoinCode();
            const existing = await this.constructor.findOne({ joinCode: code });
            if (!existing) {
                isUnique = true;
                this.joinCode = code;
            }
            attempts++;
        }

        if (!isUnique) {
            return next(new Error('Failed to generate unique join code'));
        }
    }
    next();
});

module.exports = mongoose.model('Group', groupSchema);
