const express = require('express');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const Group = require('../models/Group');
const Rule = require('../models/Rule');
const { emitToGroup } = require('../services/realtime');

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
            // Points were already added when event was created with pending status,
            // so we just need to change the status to approved
            event.status = 'approved';
            await event.save();
        }
    } catch (error) {
        console.error('Error auto-resolving expired events:', error);
    }
}

// Helper to build group:update payload
async function buildGroupUpdatePayload(groupId) {
    const group = await Group.findById(groupId);
    if (!group) return null;
    const sortedMembers = [...group.members].sort((a, b) => b.totalPoints - a.totalPoints);
    const rules = await Rule.find({ groupId: group._id });
    return {
        _id: group._id,
        name: group.name,
        description: group.description,
        joinCode: group.joinCode,
        members: sortedMembers,
        memberCount: group.members.length,
        rules,
        createdAt: group.createdAt,
        createdBy: group.createdBy
    };
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

        // Add points immediately when event is created with pending status
        const memberIndex = group.members.findIndex(
            m => m.userId.toString() === userId.toString()
        );

        if (memberIndex !== -1) {
            group.members[memberIndex].totalPoints += rule.points;
            await group.save();
        }

        // Build enriched event for websocket emit
        const targetMember = group.members.find(m => m.userId.toString() === userId.toString());
        const submitterMember = group.members.find(m => m.userId.toString() === submittedBy.toString());
        const enrichedEvent = {
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
            vetoCount: 0,
            createdAt: event.createdAt,
            expiresAt: event.expiresAt
        };

        // Emit to group room
        emitToGroup(groupId, 'events:new', enrichedEvent);

        // Also emit updated group (points changed)
        const groupUpdate = await buildGroupUpdatePayload(groupId);
        if (groupUpdate) {
            emitToGroup(groupId, 'group:update', groupUpdate);
        }

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

        // Cannot vote if the event is applied to the user
        if (event.userId.toString() === userId.toString()) {
            return res.status(400).json({ error: 'You cannot vote on your own event' });
        }

        // Cannot vote if you created the event (you can only veto events you didn't create)
        if (event.submittedBy.toString() === userId.toString()) {
            return res.status(400).json({ error: 'You cannot vote on events you created' });
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

        const wasPending = event.status === 'pending';
        if (vetoCount >= rule.vetoThreshold) {
            event.status = 'vetoed';
            
            // Remove points that were added when event was created (if it was pending)
            if (wasPending) {
                const group = await Group.findById(event.groupId);
                const memberIndex = group.members.findIndex(
                    m => m.userId.toString() === event.userId.toString()
                );

                if (memberIndex !== -1) {
                    group.members[memberIndex].totalPoints -= rule.points;
                    await group.save();
                }
            }
        }

        await event.save();

        // Emit events:update to group room
        emitToGroup(event.groupId, 'events:update', {
            _id: event._id,
            status: event.status,
            votes: event.votes,
            vetoCount
        });

        // If status changed to vetoed and points removed, emit group:update
        if (event.status === 'vetoed' && wasPending) {
            const groupUpdate = await buildGroupUpdatePayload(event.groupId);
            if (groupUpdate) {
                emitToGroup(event.groupId, 'group:update', groupUpdate);
            }
        }

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

// DELETE /api/events/:eventId - delete an event
router.delete('/:eventId', verifyToken, async (req, res) => {
    console.log('=== DELETE EVENT REQUEST ===');
    console.log('EventId from params:', req.params.eventId);
    console.log('UserId from token:', req.userId);
    
    try {
        const { eventId } = req.params;
        const userId = req.userId;

        if (!eventId) {
            console.error('Event ID is missing');
            return res.status(400).json({ error: 'Event ID is required' });
        }

        console.log('Looking up event:', eventId);
        const event = await Event.findById(eventId);
        if (!event) {
            console.error('Event not found:', eventId);
            return res.status(404).json({ error: 'Event not found' });
        }

        console.log('Event found:', {
            _id: event._id,
            status: event.status,
            submittedBy: event.submittedBy,
            userId: event.userId
        });

        // Check if user created the event
        if (event.submittedBy.toString() !== userId.toString()) {
            console.error('User is not the creator. UserId:', userId, 'SubmittedBy:', event.submittedBy);
            return res.status(403).json({ error: 'You can only delete events you created' });
        }
        
        console.log('User is authorized to delete this event');

        // Remove points for pending and approved events (vetoed events already had points removed)
        if (event.status === 'pending' || event.status === 'approved') {
            try {
                const group = await Group.findById(event.groupId);
                if (!group) {
                    console.error('Group not found for event deletion:', event.groupId);
                    // Continue with deletion even if group not found
                } else {
                    const rule = await Rule.findById(event.ruleId);
                    if (!rule) {
                        console.error('Rule not found for event deletion:', event.ruleId);
                        // Continue with deletion even if rule not found
                    } else {
                        const memberIndex = group.members.findIndex(
                            m => m.userId.toString() === event.userId.toString()
                        );

                        if (memberIndex !== -1) {
                            group.members[memberIndex].totalPoints -= rule.points;
                            await group.save();
                            console.log(`Removed ${rule.points} points from user ${event.userId} for deleted event`);
                        } else {
                            console.error('Member not found in group for event deletion');
                        }
                    }
                }
            } catch (pointsError) {
                console.error('Error removing points during event deletion:', pointsError);
                // Continue with deletion even if points removal fails
            }
        }

        // Delete the event
        console.log('Deleting event from database...');
        const deletedEvent = await Event.findByIdAndDelete(eventId);
        if (!deletedEvent) {
            console.error('Event was not deleted (may have been already deleted)');
            return res.status(404).json({ error: 'Event not found or already deleted' });
        }

        console.log('Event successfully deleted:', deletedEvent._id);

        // Emit events:delete to group room and updated group points
        emitToGroup(event.groupId, 'events:delete', { eventId: deletedEvent._id });
        const groupUpdate = await buildGroupUpdatePayload(event.groupId);
        if (groupUpdate) {
            emitToGroup(event.groupId, 'group:update', groupUpdate);
        }

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('=== ERROR DELETING EVENT ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        const errorMessage = error.message || 'Failed to delete event';
        res.status(500).json({ error: errorMessage });
    }
});

module.exports = router;
