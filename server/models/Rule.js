const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    points: {
        type: Number,
        required: true
    },
    vetoThreshold: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Rule', ruleSchema);
