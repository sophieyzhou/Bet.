const express = require('express');
const jwt = require('jsonwebtoken');
const Group = require('../models/Group');
const User = require('../models/User');
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

// POST /api/groups/create - create a new group
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { name, description, rules } = req.body;
        const userId = req.userId;

        // Validation
        if (!name || name.trim().length < 3 || name.trim().length > 50) {
            return res.status(400).json({ error: 'Group name must be between 3 and 50 characters' });
        }

        if (description && description.length > 200) {
            return res.status(400).json({ error: 'Description must be less than 200 characters' });
        }

        if (!rules || !Array.isArray(rules) || rules.length < 1) {
            return res.status(400).json({ error: 'At least one rule is required' });
        }

        if (rules.length > 20) {
            return res.status(400).json({ error: 'Maximum 20 rules allowed' });
        }

        // Validate each rule
        for (const rule of rules) {
            if (!rule.description || rule.description.trim().length < 3 || rule.description.trim().length > 100) {
                return res.status(400).json({ error: 'Rule description must be between 3 and 100 characters' });
            }
            if (typeof rule.points !== 'number' || rule.points < -1000 || rule.points > 1000) {
                return res.status(400).json({ error: 'Rule points must be between -1000 and 1000' });
            }
            if (typeof rule.vetoThreshold !== 'number' || rule.vetoThreshold < 0 || rule.vetoThreshold > 100) {
                return res.status(400).json({ error: 'Veto threshold must be between 0 and 100' });
            }
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create the group with creator as first member
        const group = new Group({
            name: name.trim(),
            description: description?.trim() || '',
            members: [{
                userId: user._id,
                name: user.name,
                email: user.email,
                totalPoints: 0
            }],
            createdBy: userId,
            isActive: true
        });

        // Save group (this will trigger the join code generation)
        await group.save();

        // Create rules and link to group
        const ruleIds = [];
        for (const ruleData of rules) {
            const rule = new Rule({
                groupId: group._id,
                description: ruleData.description.trim(),
                points: ruleData.points,
                vetoThreshold: ruleData.vetoThreshold
            });
            await rule.save();
            ruleIds.push(rule._id);
        }

        // Update group with rule IDs
        group.rules = ruleIds;
        await group.save();

        // Update user's joinedGroups array
        if (!user.joinedGroups.includes(group._id)) {
            user.joinedGroups.push(group._id);
            await user.save();
        }

        res.status(201).json({
            success: true,
            group: {
                _id: group._id,
                name: group.name,
                description: group.description,
                joinCode: group.joinCode,
                memberCount: group.members.length,
                createdAt: group.createdAt
            },
            message: 'Group created successfully'
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// GET /api/groups/user - fetch groups for authenticated user
router.get('/user', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        // Find groups where the user is a member
        const groups = await Group.find({
            'members.userId': userId
        }).select('name description members createdAt');

        // Transform the data to include user's points and member count
        const userGroups = groups.map(group => {
            const userMember = group.members.find(member =>
                member.userId.toString() === userId.toString()
            );

            return {
                _id: group._id,
                name: group.name,
                description: group.description,
                memberCount: group.members.length,
                userPoints: userMember ? userMember.totalPoints : 0,
                createdAt: group.createdAt
            };
        });

        res.json({
            success: true,
            groups: userGroups
        });
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// GET /api/groups/:groupId - fetch specific group details
router.get('/:groupId', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if user is a member of this group
        const isMember = group.members.some(member =>
            member.userId.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Sort members by totalPoints (highest to lowest)
        const sortedMembers = [...group.members].sort((a, b) => b.totalPoints - a.totalPoints);

        res.json({
            success: true,
            group: {
                _id: group._id,
                name: group.name,
                description: group.description,
                joinCode: group.joinCode,
                members: sortedMembers,
                memberCount: group.members.length,
                createdAt: group.createdAt,
                createdBy: group.createdBy
            }
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Failed to fetch group' });
    }
});

module.exports = router;
