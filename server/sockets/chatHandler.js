const User = require('../models/User');
const Profile = require('../models/Profile');
const Message = require('../models/Message');
const Match = require('../models/Match');
const aiBotManager = require('../ai-bots/aiBotManager');
const { generateBotReply, simulateTypingDelay } = require('../ai-bots/aiChat');

class ChatHandler {
  constructor(io) {
    this.io = io;
    this.typingUsers = new Map(); // matchId -> Set of typing user IDs
    this.aiBotManager = aiBotManager;
    
    // Start AI bot initiative conversations
    this.startAIBotInitiative();
  }

  // Handle socket connection
  handleConnection(socket) {
    console.log('🔌 New chat connection:', socket.id);
    
    // Join user to their personal room
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined personal room`);
    });

    // Join chat room
    socket.on('join_chat', (matchId) => {
      socket.join(`chat_${matchId}`);
      console.log(`💬 User joined chat room: ${matchId}`);
    });

    // Leave chat room
    socket.on('leave_chat', (matchId) => {
      socket.leave(`chat_${matchId}`);
      console.log(`💬 User left chat room: ${matchId}`);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });

    // Handle message sending
    socket.on('send_message', (data) => {
      this.handleMessage(socket, data);
    });

    // Handle message read
    socket.on('mark_read', (data) => {
      this.handleMessageRead(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('🔌 Chat connection disconnected:', socket.id);
    });
  }

  // Handle typing indicators
  handleTyping(socket, data) {
    const { userId, matchId, isTyping } = data;
    
    if (isTyping) {
      // Add user to typing set
      if (!this.typingUsers.has(matchId)) {
        this.typingUsers.set(matchId, new Set());
      }
      this.typingUsers.get(matchId).add(userId);
    } else {
      // Remove user from typing set
      if (this.typingUsers.has(matchId)) {
        this.typingUsers.get(matchId).delete(userId);
        if (this.typingUsers.get(matchId).size === 0) {
          this.typingUsers.delete(matchId);
        }
      }
    }

    // Broadcast typing status to other users in the chat
    socket.to(`chat_${matchId}`).emit('user_typing', {
      userId,
      matchId,
      isTyping
    });
  }

  // Handle incoming messages
  async handleMessage(socket, data) {
    try {
      const { senderId, receiverId, matchId, content, messageType = 'text' } = data;

      // Validate match exists
      const match = await Match.findById(matchId);
      if (!match) {
        socket.emit('error', { message: 'Match not found' });
        return;
      }

      // Save message to database
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        matchId,
        content,
        messageType,
        isRead: false
      });
      
      await message.save();
      
      // Broadcast message to chat room
      this.io.to(`chat_${matchId}`).emit('receive_message', {
        id: message._id,
        sender: senderId,
        receiver: receiverId,
        content,
        messageType,
        timestamp: message.createdAt,
        isRead: false
      });
      
      // Check if receiver is an AI bot
      const receiver = await User.findById(receiverId);
      if (receiver && receiver.email.includes('@zenverse.ai')) {
        await this.handleAIBotResponse(socket, data, receiver);
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // Handle AI bot responses
  async handleAIBotResponse(socket, originalMessage, botUser) {
    try {
      const { senderId, receiverId, matchId, content } = originalMessage;
      
      console.log(`🤖 AI Bot ${botUser.name} processing message: ${content}`);
      
      // Get bot profile
      const botProfile = await Profile.findOne({ userId: receiverId });
      if (!botProfile) {
        console.error('❌ Bot profile not found');
        return;
      }
      
      // Simulate typing delay
      const typingDelay = simulateTypingDelay();
      
      // Show typing indicator
      socket.to(`chat_${matchId}`).emit('user_typing', {
        userId: receiverId,
        matchId,
        isTyping: true
      });
      
      // Wait for typing delay
      setTimeout(async () => {
        try {
          // Generate AI response
          const aiResponse = await generateBotReply(content, botProfile);
          
          // Save AI message to database
          const aiMessage = new Message({
            sender: receiverId,
            receiver: senderId,
            matchId,
            content: aiResponse,
            messageType: 'text',
            isRead: false
          });
          
          await aiMessage.save();
          
          // Stop typing indicator
          socket.to(`chat_${matchId}`).emit('user_typing', {
            userId: receiverId,
            matchId,
            isTyping: false
          });
          
          // Send AI response
          this.io.to(`chat_${matchId}`).emit('receive_message', {
            id: aiMessage._id,
            sender: receiverId,
            receiver: senderId,
            content: aiResponse,
            messageType: 'text',
            timestamp: aiMessage.createdAt,
            isRead: false,
            isAI: true
          });
          
          console.log(`🤖 AI Bot ${botUser.name} replied: ${aiResponse}`);
          
        } catch (error) {
          console.error('❌ Error generating AI response:', error);
        }
      }, typingDelay);
      
    } catch (error) {
      console.error('❌ Error handling AI bot response:', error);
    }
  }

  // Handle message read status
  async handleMessageRead(socket, data) {
    try {
      const { matchId, userId } = data;
      
      // Mark messages as read
      await Message.updateMany(
        { 
          matchId, 
          receiver: userId, 
          isRead: false 
        },
        { isRead: true }
      );
      
      // Broadcast read status
      socket.to(`chat_${matchId}`).emit('messages_read', {
        matchId,
        userId
      });
      
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  // Get chat history
  async getChatHistory(matchId, limit = 50) {
    try {
      const messages = await Message.find({ matchId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'name avatar')
        .populate('receiver', 'name avatar');
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('❌ Error getting chat history:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount(userId) {
    try {
      const count = await Message.countDocuments({
        receiver: userId,
        isRead: false
      });
      return count;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  // Start AI bot initiative conversations
  startAIBotInitiative() {
    // Check for new matches every 5 minutes
    setInterval(async () => {
      try {
        await this.aiBotManager.scheduleInitiativeConversations(this.io);
      } catch (error) {
        console.error('❌ Error in AI bot initiative check:', error);
      }
    }, 5 * 60 * 1000);
  }

  // Get typing users for a match
  getTypingUsers(matchId) {
    return this.typingUsers.get(matchId) || new Set();
  }

  // Get AI bot statistics
  getAIBotStats() {
    return this.aiBotManager.getBotStats();
  }

  // Force AI bot to initiate conversation
  async forceAIBotInitiative(matchId) {
    try {
      const initiated = await this.aiBotManager.initiateConversation(matchId, this.io);
      return initiated;
    } catch (error) {
      console.error('❌ Error forcing AI bot initiative:', error);
      return false;
    }
  }

  // Get conversation memory for a match
  getConversationMemory(matchId) {
    return this.aiBotManager.getConversationMemory(matchId);
  }

  // Clear conversation memory for a match
  clearConversationMemory(matchId) {
    this.aiBotManager.clearConversationMemory(matchId);
  }
}

module.exports = ChatHandler; 