const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const Match = require('../models/Match');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// @route   GET /api/matches/discover
// @desc    Get profiles for discovery/swiping
// @access  Private
router.get('/discover', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, distance = 50, ageMin = 18, ageMax = 100 } = req.query;
    const skip = (page - 1) * limit;

    // Get current user's profile
    const userProfile = await Profile.findOne({ userId: req.user._id });
    if (!userProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile first'
      });
    }

    // Build query for potential matches
    const query = {
      userId: { $ne: req.user._id }, // Exclude current user
      isPublic: true,
      isComplete: true
    };

    // Age filter
    if (ageMin && ageMax) {
      query.age = { $gte: parseInt(ageMin), $lte: parseInt(ageMax) };
    }

    // Get profiles
    const profiles = await Profile.find(query)
      .populate('userId', 'name email avatar lastActive')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Filter by distance if location is available
    let filteredProfiles = profiles;
    if (userProfile.location.coordinates && userProfile.location.coordinates[0] !== 0) {
      filteredProfiles = profiles.filter(profile => {
        if (!profile.location.coordinates || profile.location.coordinates[0] === 0) {
          return false;
        }
        const distance = userProfile.getDistanceFrom(profile);
        return distance !== null && distance <= parseInt(distance);
      });
    }

    // Get existing matches to exclude already swiped users
    const existingMatches = await Match.find({
      $or: [
        { user1: req.user._id },
        { user2: req.user._id }
      ]
    });

    const swipedUserIds = existingMatches.map(match => 
      match.user1.toString() === req.user._id.toString() ? match.user2 : match.user1
    );

    // Filter out already swiped users
    filteredProfiles = filteredProfiles.filter(profile => 
      !swipedUserIds.includes(profile.userId._id.toString())
    );

    // Add distance and compatibility info
    const profilesWithInfo = filteredProfiles.map(profile => {
      const profileData = {
        ...profile,
        distance: userProfile.getDistanceFrom(profile),
        compatibility: Math.floor(Math.random() * 40) + 60 // Mock compatibility for now
      };
      return profileData;
    });

    res.json({
      success: true,
      data: {
        profiles: profilesWithInfo,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: profilesWithInfo.length,
          hasMore: profilesWithInfo.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Discover profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discovery profiles',
      error: error.message
    });
  }
});

// @route   POST /api/matches/swipe
// @desc    Like or dislike a profile
// @access  Private
router.post('/swipe', authenticateToken, async (req, res) => {
  try {
    const { targetUserId, action } = req.body; // action: 'like', 'dislike', 'superlike'

    if (!['like', 'dislike', 'superlike'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be like, dislike, or superlike'
      });
    }

    // Check if target user exists and has a profile
    const targetProfile = await Profile.findOne({ userId: targetUserId, isPublic: true });
    if (!targetProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Find or create match
    const match = await Match.findOrCreateMatch(req.user._id, targetUserId);
    
    // Update user action
    await match.updateUserAction(req.user._id, action);

    // Check if it's a match
    const isMatch = match.isMatched();
    
    let matchData = null;
    if (isMatch) {
      // Get the other user's profile for match notification
      const otherUserProfile = await Profile.findOne({ userId: match.getOtherUser(req.user._id) })
        .populate('userId', 'name email avatar');
      
      matchData = {
        matchId: match._id,
        user: otherUserProfile.userId,
        profile: otherUserProfile,
        compatibility: match.compatibility
      };
    }

    res.json({
      success: true,
      message: `Profile ${action}d successfully`,
      data: {
        isMatch,
        match: matchData
      }
    });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process swipe',
      error: error.message
    });
  }
});

// @route   GET /api/matches/matches
// @desc    Get user's matches
// @access  Private
router.get('/matches', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get matched users
    const matches = await Match.find({
      $or: [
        { user1: req.user._id },
        { user2: req.user._id }
      ],
      status: 'matched'
    })
    .populate('user1', 'name email avatar lastActive')
    .populate('user2', 'name email avatar lastActive')
    .sort({ matchedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    // Get profiles for matched users
    const matchData = await Promise.all(
      matches.map(async (match) => {
        const otherUserId = match.user1._id.toString() === req.user._id.toString() 
          ? match.user2._id 
          : match.user1._id;
        
        const otherUser = match.user1._id.toString() === req.user._id.toString() 
          ? match.user2 
          : match.user1;
        
        const profile = await Profile.findOne({ userId: otherUserId }).lean();
        
        return {
          matchId: match._id,
          user: otherUser,
          profile,
          matchedAt: match.matchedAt,
          compatibility: match.compatibility,
          lastInteraction: match.lastInteraction
        };
      })
    );

    res.json({
      success: true,
      data: {
        matches: matchData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: matchData.length,
          hasMore: matchData.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get matches',
      error: error.message
    });
  }
});

// @route   GET /api/matches/:matchId
// @desc    Get specific match details
// @access  Private
router.get('/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user1: req.user._id },
        { user2: req.user._id }
      ]
    })
    .populate('user1', 'name email avatar lastActive')
    .populate('user2', 'name email avatar lastActive');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const otherUserId = match.user1._id.toString() === req.user._id.toString() 
      ? match.user2._id 
      : match.user1._id;
    
    const otherUser = match.user1._id.toString() === req.user._id.toString() 
      ? match.user2 
      : match.user1;
    
    const profile = await Profile.findOne({ userId: otherUserId });

    res.json({
      success: true,
      data: {
        match: {
          ...match.toObject(),
          otherUser,
          profile: profile ? profile.getPublicData() : null
        }
      }
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get match details',
      error: error.message
    });
  }
});

// @route   DELETE /api/matches/:matchId
// @desc    Unmatch a user
// @access  Private
router.delete('/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user1: req.user._id },
        { user2: req.user._id }
      ]
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Soft delete by setting status to rejected
    match.status = 'rejected';
    await match.save();

    res.json({
      success: true,
      message: 'Match removed successfully'
    });
  } catch (error) {
    console.error('Unmatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove match',
      error: error.message
    });
  }
});

// @route   GET /api/matches/stats
// @desc    Get user's matching statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [totalMatches, totalLikes, totalDislikes, remainingProfiles] = await Promise.all([
      Match.countDocuments({
        $or: [{ user1: req.user._id }, { user2: req.user._id }],
        status: 'matched'
      }),
      Match.countDocuments({
        $or: [{ user1: req.user._id }, { user2: req.user._id }],
        $or: [
          { user1: req.user._id, user1Action: 'like' },
          { user2: req.user._id, user2Action: 'like' }
        ]
      }),
      Match.countDocuments({
        $or: [{ user1: req.user._id }, { user2: req.user._id }],
        $or: [
          { user1: req.user._id, user1Action: 'dislike' },
          { user2: req.user._id, user2Action: 'dislike' }
        ]
      }),
      Profile.countDocuments({
        userId: { $ne: req.user._id },
        isPublic: true,
        isComplete: true
      })
    ]);

    // Calculate remaining profiles (not yet swiped)
    const swipedProfiles = totalLikes + totalDislikes;
    const remaining = Math.max(0, remainingProfiles - swipedProfiles);

    res.json({
      success: true,
      data: {
        stats: {
          remaining,
          liked: totalLikes,
          passed: totalDislikes,
          totalMatches,
          matchRate: totalLikes > 0 ? Math.round((totalMatches / totalLikes) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get matching statistics',
      error: error.message
    });
  }
});

module.exports = router; 