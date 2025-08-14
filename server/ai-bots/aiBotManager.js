const { generateBotReply, generateInitiativeMessage, simulateTypingDelay } = require('./aiChat');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Match = require('../models/Match');
const Message = require('../models/Message');

class AIBotManager {
  constructor() {
    this.activeBots = new Map(); // userId -> bot instance
    this.conversationMemory = new Map(); // matchId -> conversation history
    this.botPersonalities = new Map(); // userId -> personality
    this.initiativeTimers = new Map(); // matchId -> timer
  }

  // Initialize AI bots from database
  async initializeBots() {
    try {
      console.log('🤖 Initializing AI bots...');
      
      // Find all AI users
      const aiUsers = await User.find({ role: 'ai' }).populate('profile');
      
      for (const user of aiUsers) {
        await this.activateBot(user._id.toString(), user.profile?.personality || 'friendly');
        console.log(`🤖 Activated AI bot: ${user.name} (${user.profile?.personality || 'friendly'})`);
      }
      
      console.log(`✅ Initialized ${aiUsers.length} AI bots`);
      return aiUsers.length;
    } catch (error) {
      console.error('❌ Error initializing AI bots:', error);
      return 0;
    }
  }

  // Activate a bot for a specific user
  async activateBot(userId, personality = 'friendly') {
    try {
      const user = await User.findById(userId).populate('profile');
      if (!user) {
        console.error(`❌ User not found for bot activation: ${userId}`);
        return false;
      }

      this.activeBots.set(userId, {
        userId,
        name: user.name,
        personality,
        profile: user.profile,
        isOnline: true,
        lastActive: new Date(),
        conversationCount: 0
      });

      this.botPersonalities.set(userId, personality);
      
      // Set bot as online
      await User.findByIdAndUpdate(userId, { 
        isOnline: true, 
        lastActive: new Date() 
      });

      console.log(`🤖 Bot activated: ${user.name} (${personality})`);
      return true;
    } catch (error) {
      console.error('❌ Error activating bot:', error);
      return false;
    }
  }

  // Deactivate a bot
  async deactivateBot(userId) {
    try {
      this.activeBots.delete(userId);
      this.botPersonalities.delete(userId);
      
      // Clear conversation memory for this bot
      for (const [matchId, memory] of this.conversationMemory.entries()) {
        if (memory.botUserId === userId) {
          this.conversationMemory.delete(matchId);
        }
      }

      // Set bot as offline
      await User.findByIdAndUpdate(userId, { 
        isOnline: false, 
        lastActive: new Date() 
      });

      console.log(`🤖 Bot deactivated: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deactivating bot:', error);
      return false;
    }
  }

  // Handle incoming message from human user
  async handleIncomingMessage(messageData, io) {
    try {
      const { senderId, receiverId, matchId, content } = messageData;
      
      // Check if receiver is an AI bot
      const receiver = await User.findById(receiverId);
      if (!receiver || receiver.role !== 'ai') {
        return false; // Not an AI bot
      }

      // Get bot instance
      const bot = this.activeBots.get(receiverId);
      if (!bot) {
        console.error(`❌ Bot not active: ${receiverId}`);
        return false;
      }

      // Update bot's last active time
      bot.lastActive = new Date();
      bot.conversationCount++;

      // Get or create conversation memory
      let memory = this.conversationMemory.get(matchId);
      if (!memory) {
        memory = {
          matchId,
          botUserId: receiverId,
          humanUserId: senderId,
          messages: [],
          personality: bot.personality,
          conversationStart: new Date(),
          messageCount: 0
        };
        this.conversationMemory.set(matchId, memory);
      }

      // Add human message to memory
      memory.messages.push({
        sender: 'human',
        content,
        timestamp: new Date()
      });
      memory.messageCount++;

      // Generate AI response
      const aiResponse = await this.generateResponse(matchId, content, bot);
      
      if (aiResponse) {
        // Simulate typing delay
        const typingDelay = await simulateTypingDelay(aiResponse.length, bot.personality);
        
        // Send typing indicator
        io.to(matchId).emit('user_typing', {
          userId: receiverId,
          matchId,
          isTyping: true
        });

        // Wait for typing delay
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        // Stop typing indicator
        io.to(matchId).emit('user_typing', {
          userId: receiverId,
          matchId,
          isTyping: false
        });

        // Send AI response
        const aiMessage = {
          sender: receiverId,
          receiver: senderId,
          matchId,
          content: aiResponse,
          messageType: 'text',
          isAI: true,
          timestamp: new Date()
        };

        // Save message to database
        const savedMessage = await Message.create(aiMessage);
        
        // Add AI message to memory
        memory.messages.push({
          sender: 'ai',
          content: aiResponse,
          timestamp: new Date()
        });
        memory.messageCount++;

        // Broadcast message to chat room
        io.to(matchId).emit('receive_message', {
          ...savedMessage.toObject(),
          senderName: bot.name,
          isAI: true
        });

        console.log(`🤖 AI response sent: ${bot.name} -> "${aiResponse}"`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
      return false;
    }
  }

  // Generate AI response
  async generateResponse(matchId, humanMessage, bot) {
    try {
      const memory = this.conversationMemory.get(matchId);
      if (!memory) {
        console.error(`❌ No conversation memory for match: ${matchId}`);
        return null;
      }

      // Get recent conversation context (last 10 messages)
      const recentMessages = memory.messages.slice(-10);
      const context = recentMessages.map(msg => ({
        role: msg.sender === 'human' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Generate response using AI chat engine
      const response = await generateBotReply(
        humanMessage,
        bot.personality,
        context,
        bot.profile
      );

      return response;
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      return "I'm having trouble thinking of a response right now. Can we talk about something else?";
    }
  }

  // Initiate conversation from AI bot
  async initiateConversation(matchId, io) {
    try {
      const memory = this.conversationMemory.get(matchId);
      if (!memory) {
        console.error(`❌ No conversation memory for match: ${matchId}`);
        return false;
      }

      const bot = this.activeBots.get(memory.botUserId);
      if (!bot) {
        console.error(`❌ Bot not active: ${memory.botUserId}`);
        return false;
      }

      // Check if conversation is stale (no messages in last 2 hours)
      const lastMessage = memory.messages[memory.messages.length - 1];
      const timeSinceLastMessage = lastMessage ? 
        Date.now() - lastMessage.timestamp.getTime() : 
        Date.now() - memory.conversationStart.getTime();

      if (timeSinceLastMessage < 2 * 60 * 60 * 1000) { // 2 hours
        return false; // Too recent
      }

      // Generate initiative message
      const initiativeMessage = await generateInitiativeMessage(
        bot.personality,
        memory.messages,
        bot.profile
      );

      if (initiativeMessage) {
        // Simulate typing delay
        const typingDelay = await simulateTypingDelay(initiativeMessage.length, bot.personality);
        
        // Send typing indicator
        io.to(matchId).emit('user_typing', {
          userId: memory.botUserId,
          matchId,
          isTyping: true
        });

        // Wait for typing delay
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        // Stop typing indicator
        io.to(matchId).emit('user_typing', {
          userId: memory.botUserId,
          matchId,
          isTyping: false
        });

        // Send initiative message
        const aiMessage = {
          sender: memory.botUserId,
          receiver: memory.humanUserId,
          matchId,
          content: initiativeMessage,
          messageType: 'text',
          isAI: true,
          timestamp: new Date()
        };

        // Save message to database
        const savedMessage = await Message.create(aiMessage);
        
        // Add to memory
        memory.messages.push({
          sender: 'ai',
          content: initiativeMessage,
          timestamp: new Date()
        });
        memory.messageCount++;

        // Broadcast message
        io.to(matchId).emit('receive_message', {
          ...savedMessage.toObject(),
          senderName: bot.name,
          isAI: true
        });

        console.log(`🤖 AI initiated conversation: ${bot.name} -> "${initiativeMessage}"`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error initiating conversation:', error);
      return false;
    }
  }

  // Schedule initiative conversations
  scheduleInitiativeConversations(io) {
    // Clear existing timers
    for (const timer of this.initiativeTimers.values()) {
      clearInterval(timer);
    }
    this.initiativeTimers.clear();

    // Schedule new initiative checks every 30 minutes
    const initiativeInterval = setInterval(async () => {
      try {
        console.log('🤖 Checking for initiative conversations...');
        
        // Get all active matches with AI bots
        const matches = await Match.find({ 
          status: 'matched',
          $or: [
            { user1: { $in: Array.from(this.activeBots.keys()) } },
            { user2: { $in: Array.from(this.activeBots.keys()) } }
          ]
        });

        for (const match of matches) {
          const matchId = match._id.toString();
          
          // Check if this match has conversation memory
          if (this.conversationMemory.has(matchId)) {
            await this.initiateConversation(matchId, io);
          }
        }
      } catch (error) {
        console.error('❌ Error in initiative conversation check:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    console.log('🤖 Scheduled initiative conversations (every 30 minutes)');
  }

  // Get bot statistics
  getBotStats() {
    const stats = {
      totalBots: this.activeBots.size,
      onlineBots: Array.from(this.activeBots.values()).filter(bot => bot.isOnline).length,
      totalConversations: this.conversationMemory.size,
      totalMessages: Array.from(this.conversationMemory.values())
        .reduce((sum, memory) => sum + memory.messageCount, 0),
      personalities: {}
    };

    // Count personalities
    for (const personality of this.botPersonalities.values()) {
      stats.personalities[personality] = (stats.personalities[personality] || 0) + 1;
    }

    return stats;
  }

  // Get conversation memory for a match
  getConversationMemory(matchId) {
    return this.conversationMemory.get(matchId);
  }

  // Clear conversation memory
  clearConversationMemory(matchId) {
    this.conversationMemory.delete(matchId);
    console.log(`🧹 Cleared conversation memory for match: ${matchId}`);
  }

  // Get all active bots
  getActiveBots() {
    return Array.from(this.activeBots.values());
  }

  // Check if user is an AI bot
  isAIBot(userId) {
    return this.activeBots.has(userId);
  }

  // Get bot personality
  getBotPersonality(userId) {
    return this.botPersonalities.get(userId);
  }
}

// Create singleton instance
const aiBotManager = new AIBotManager();

module.exports = aiBotManager; 
 
 