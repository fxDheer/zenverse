const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'voice', 'emoji', 'system'],
    default: 'text'
  },
  mediaUrl: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  metadata: {
    deviceInfo: String,
    location: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ matchId: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

// Pre-save middleware
messageSchema.pre('save', function(next) {
  if (this.isNew) {
    this.metadata.timestamp = new Date();
  }
  next();
});

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1Id, user2Id, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ],
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('sender', 'name avatar')
  .populate('receiver', 'name avatar')
  .populate('replyTo', 'content sender')
  .lean();
};

// Static method to get unread messages count
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiver: userId,
    isRead: false,
    isDeleted: false
  });
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(senderId, receiverId) {
  return this.updateMany(
    {
      sender: senderId,
      receiver: receiverId,
      isRead: false,
      isDeleted: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => 
    reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji
  });
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => 
    reaction.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to get message preview (for notifications)
messageSchema.methods.getPreview = function() {
  if (this.messageType === 'text') {
    return this.content.length > 50 
      ? this.content.substring(0, 50) + '...' 
      : this.content;
  } else if (this.messageType === 'image') {
    return '📷 Image';
  } else if (this.messageType === 'voice') {
    return '🎤 Voice message';
  } else if (this.messageType === 'emoji') {
    return this.content;
  }
  return 'New message';
};

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  const now = new Date();
  const messageTime = this.createdAt;
  const diffInHours = (now - messageTime) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return messageTime.toLocaleDateString();
  }
});

// Ensure virtuals are included when converting to JSON
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema); 