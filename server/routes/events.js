const express = require('express');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const Group = require('../models/Group');
const Rule = require('../models/Rule');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Helper function to auto-resolve expired events
async function autoResolveExpiredEvents(groupId) {
    try {
        const expiredEvents = await Event.find({
            groupId,
            status: 'pending',
            expiresAt: { $lt: new Date() }
        });

        for (const event of expiredEvents) {
            // Auto-approve the event
            event.status = 'approved';
            await event.save();

            // Update user's total points in group
            const group = await Group.findById(groupId);
            const rule = await Rule.findById(event.ruleId);

            if (group && rule) {
                const memberIndex = group.members.findIndex(
                    m => m.userId.toString() === event.userId.toString()
                );

                if (memberIndex !== -1) {
                    group.members[memberIndex].totalPoints += rule.points;
                    await group.save();
                }
            }
        }
    } catch (error) {
        console.error('Error auto-resolving expired events:', error);
    }
}

// POST /api/events/create - create a new event
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { groupId, userId, ruleId, description } = req.body;
        const submittedBy = req.userId;

        // Validation
        if (!groupId || !userId || !ruleId) {
            return res.status(400).json({ error: 'Group ID, User ID, and Rule ID are required' });
        }

        // Verify group exists and submitter is a member
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const isSubmitterMember = group.members.some(
            m => m.userId.toString() === submittedBy.toString()
        );
        if (!isSubmitterMember) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        // Verify target user is a member
        const isTargetMember = group.members.some(
            m => m.userId.toString() === userId.toString()
        );
        if (!isTargetMember) {
            return res.status(400).json({ error: 'Target user is not a member of this group' });
        }

        // Verify rule exists and belongs to group
        const rule = await Rule.findById(ruleId);
        if (!rule || rule.groupId.toString() !== groupId.toString()) {
            return res.status(400).json({ error: 'Invalid rule for this group' });
        }

        // Create event with 24-hour expiration
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const event = new Event({
            groupId,
            userId,
            submittedBy,
            ruleId,
            description: description || '',
            status: 'pending',
            expiresAt,
            votes: []
        });

        await event.save();

        res.status(201).json({
            success: true,
            event: {
                _id: event._id,
                groupId: event.groupId,
                userId: event.userId,
                submittedBy: event.submittedBy,
                ruleId: event.ruleId,
                description: event.description,
                status: event.status,
                expiresAt: event.expiresAt,
                createdAt: event.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// GET /api/events/group/:groupId - fetch events for a group
router.get('/group/:groupId', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { status } = req.query;
        const userId = req.userId;

        // Verify user is a member of the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const isMember = group.members.some(
            m => m.userId.toString() === userId.toString()
        );
        if (!isMember) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Auto-resolve expired events first
        await autoResolveExpiredEvents(groupId);

        // Build query
        const query = { groupId };
        if (status && ['pending', 'approved', 'vetoed'].includes(status)) {
            query.status = status;
        }

        // Fetch events
        const events = await Event.find(query).sort({ createdAt: -1 });

        // Populate with user names and rule details
        const enrichedEvents = await Promise.all(
            events.map(async (event) => {
                const rule = await Rule.findById(event.ruleId);
                const targetMember = group.members.find(
                    m => m.userId.toString() === event.userId.toString()
                );
                const submitterMember = group.members.find(
                    m => m.userId.toString() === event.submittedBy.toString()
                );

                const vetoCount = event.votes.filter(v => v.vote === false).length;

                return {
                    _id: event._id,
                    userId: event.userId,
                    userName: targetMember?.name || 'Unknown',
                    userEmail: targetMember?.email || '',
                    submittedBy: event.submittedBy,
                    submittedByName: submitterMember?.name || 'Unknown',
                    rule: {
                        _id: rule?._id,
                        description: rule?.description || 'Unknown rule',
                        points: rule?.points || 0,
                        vetoThreshold: rule?.vetoThreshold || 0
                    },
                    description: event.description,
                    status: event.status,
                    votes: event.votes,
                    vetoCount,
                    createdAt: event.createdAt,
                    expiresAt: event.expiresAt
                };
            })
        );

        res.json({
            success: true,
            events: enrichedEvents
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// POST /api/events/:eventId/vote - vote to veto an event
router.post('/:eventId/vote', verifyToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.userId;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if event is still pending
        if (event.status !== 'pending') {
            return res.status(400).json({ error: 'Event is no longer pending' });
        }

        // Check if event has expired
        if (new Date() > event.expiresAt) {
            return res.status(400).json({ error: 'Event has expired' });
        }

        // Check if user is a member of the group
        const group = await Group.findById(event.groupId);
        const isMember = group.members.some(
            m => m.userId.toString() === userId.toString()
        );
        if (!isMember) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if user is trying to vote on their own event
        if (event.userId.toString() === userId.toString()) {
            return res.status(400).json({ error: 'You cannot vote on your own event' });
        }

        // Check if user has already voted
        const existingVote = event.votes.find(
            v => v.userId.toString() === userId.toString()
        );
        if (existingVote) {
            return res.status(400).json({ error: 'You have already voted on this event' });
        }

        // Add veto vote (vote: false means veto)
        event.votes.push({
            userId,
            vote: false
        });

        // Check if veto threshold reached
        const rule = await Rule.findById(event.ruleId);
        const vetoCount = event.votes.filter(v => v.vote === false).length;

        if (vetoCount >= rule.vetoThreshold) {
            event.status = 'vetoed';
        }

        await event.save();

        res.json({
            success: true,
            event: {
                _id: event._id,
                status: event.status,
                votes: event.votes,
                vetoCount
            }
        });
    } catch (error) {
        console.error('Error voting on event:', error);
        res.status(500).json({ error: 'Failed to vote on event' });
    }
});

module.exports = router;
