const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Message } = require('../models/Message');
const { Match } = require('../models/Match');
const { User } = require('../models/User');
const { Profile } = require('../models/Profile');

// Get user's conversations/matches
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all matches for the user
    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'matched'
    }).populate('user1 user2');
    
    const conversations = [];
    
    for (const match of matches) {
      const otherUserId = match.user1.toString() === userId ? match.user2 : match.user1;
      const otherUser = await User.findById(otherUserId);
      const otherProfile = await Profile.findOne({ userId: otherUserId });
      
      // Get last message
      const lastMessage = await Message.findOne({
        matchId: match._id
      }).sort({ createdAt: -1 });
      
      // Get unread count
      const unreadCount = await Message.countDocuments({
        matchId: match._id,
        receiver: userId,
        isRead: false
      });
      
      conversations.push({
        matchId: match._id,
        otherUser: {
          id: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          isOnline: otherUser.lastActive > new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
        },
        profile: otherProfile ? {
          age: otherProfile.age,
          bio: otherProfile.bio,
          occupation: otherProfile.occupation
        } : null,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          timestamp: lastMessage.createdAt,
          sender: lastMessage.sender
        } : null,
        unreadCount,
        matchedAt: match.matchedAt
      });
    }
    
    // Sort by last message timestamp
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return b.matchedAt - a.matchedAt;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return b.lastMessage.timestamp - a.lastMessage.timestamp;
    });
    
    res.json({
      success: true,
      conversations
    });
    
  } catch (error) {
    console.error('❌ Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get conversation messages
router.get('/conversation/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    
    // Verify user is part of this match
    const match = await Match.findById(matchId);
    if (!match || (match.user1.toString() !== userId && match.user2.toString() !== userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get messages
    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar');
    
    // Mark messages as read
    await Message.updateMany(
      { matchId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        messageType: msg.messageType,
        sender: msg.sender,
        receiver: msg.receiver,
        timestamp: msg.createdAt,
        isRead: msg.isRead,
        isAI: msg.sender.email ? msg.sender.email.includes('@zenverse.ai') : false
      }))
    });
    
  } catch (error) {
    console.error('❌ Error getting conversation:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Send message (for non-socket usage)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiverId, matchId, content, messageType = 'text' } = req.body;
    const senderId = req.user.id;
    
    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);
    if (!match || (match.user1.toString() !== senderId && match.user2.toString() !== senderId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Create message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      matchId,
      content,
      messageType,
      isRead: false
    });
    
    await message.save();
    
    // Populate sender info
    await message.populate('sender', 'name avatar');
    
    res.json({
      success: true,
      message: {
        id: message._id,
        content: message.content,
        messageType: message.messageType,
        sender: message.sender,
        receiver: message.receiver,
        timestamp: message.createdAt,
        isRead: false
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/read/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    
    // Verify user is part of this match
    const match = await Match.findById(matchId);
    if (!match || (match.user1.toString() !== userId && match.user2.toString() !== userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Mark messages as read
    const result = await Message.updateMany(
      { matchId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({
      success: true,
      updatedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });
    
    res.json({
      success: true,
      unreadCount
    });
    
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Search messages
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, matchId } = req.query;
    const userId = req.user.id;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    let searchFilter = {
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      content: { $regex: query, $options: 'i' }
    };
    
    if (matchId) {
      searchFilter.matchId = matchId;
    }
    
    const messages = await Message.find(searchFilter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        messageType: msg.messageType,
        sender: msg.sender,
        receiver: msg.receiver,
        timestamp: msg.createdAt,
        matchId: msg.matchId
      }))
    });
    
  } catch (error) {
    console.error('❌ Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// Delete message (soft delete)
router.delete('/message/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    const message = await Message.findById(messageId);
    if (!message || message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await message.softDelete();
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router; 