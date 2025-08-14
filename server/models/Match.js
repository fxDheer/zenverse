const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'rejected', 'blocked'],
    default: 'pending'
  },
  user1Action: {
    type: String,
    enum: ['like', 'dislike', 'superlike', 'none'],
    default: 'none'
  },
  user2Action: {
    type: String,
    enum: ['like', 'dislike', 'superlike', 'none'],
    default: 'none'
  },
  matchedAt: {
    type: Date
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  compatibility: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    factors: [{
      factor: String,
      score: Number
    }]
  },
  conversation: {
    isActive: {
      type: Boolean,
      default: false
    },
    lastMessageAt: Date,
    messageCount: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    user1Preferences: {
      ageRange: {
        min: Number,
        max: Number
      },
      distance: Number,
      interests: [String]
    },
    user2Preferences: {
      ageRange: {
        min: Number,
        max: Number
      },
      distance: Number,
      interests: [String]
    }
  }
}, {
  timestamps: true
});

// Compound index to ensure unique matches
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Index for querying matches by user
matchSchema.index({ user1: 1, status: 1 });
matchSchema.index({ user2: 1, status: 1 });

// Index for matched users
matchSchema.index({ status: 1, matchedAt: -1 });

// Pre-save middleware to handle matching logic
matchSchema.pre('save', function(next) {
  // Check if both users have liked each other
  if (this.user1Action === 'like' && this.user2Action === 'like') {
    this.status = 'matched';
    this.matchedAt = new Date();
  } else if (this.user1Action === 'dislike' || this.user2Action === 'dislike') {
    this.status = 'rejected';
  }
  
  this.lastInteraction = new Date();
  next();
});

// Static method to find or create a match
matchSchema.statics.findOrCreateMatch = function(user1Id, user2Id) {
  return this.findOne({
    $or: [
      { user1: user1Id, user2: user2Id },
      { user1: user2Id, user2: user1Id }
    ]
  }).then(match => {
    if (match) {
      return match;
    }
    
    // Create new match
    return this.create({
      user1: user1Id,
      user2: user2Id
    });
  });
};

// Method to update user action
matchSchema.methods.updateUserAction = function(userId, action) {
  if (this.user1.toString() === userId.toString()) {
    this.user1Action = action;
  } else if (this.user2.toString() === userId.toString()) {
    this.user2Action = action;
  }
  
  return this.save();
};

// Method to check if users are matched
matchSchema.methods.isMatched = function() {
  return this.status === 'matched';
};

// Method to get the other user in the match
matchSchema.methods.getOtherUser = function(userId) {
  if (this.user1.toString() === userId.toString()) {
    return this.user2;
  }
  return this.user1;
};

// Method to calculate compatibility score
matchSchema.methods.calculateCompatibility = function(user1Profile, user2Profile) {
  let score = 0;
  const factors = [];
  
  // Age compatibility
  const ageDiff = Math.abs(user1Profile.age - user2Profile.age);
  const ageScore = Math.max(0, 100 - (ageDiff * 2));
  score += ageScore * 0.2;
  factors.push({ factor: 'age', score: ageScore });
  
  // Interests compatibility
  const commonInterests = user1Profile.interests.filter(interest => 
    user2Profile.interests.includes(interest)
  );
  const interestScore = (commonInterests.length / Math.max(user1Profile.interests.length, user2Profile.interests.length)) * 100;
  score += interestScore * 0.3;
  factors.push({ factor: 'interests', score: interestScore });
  
  // Location compatibility
  const distance = user1Profile.getDistanceFrom(user2Profile);
  if (distance !== null) {
    const distanceScore = Math.max(0, 100 - (distance * 2));
    score += distanceScore * 0.2;
    factors.push({ factor: 'distance', score: distanceScore });
  }
  
  // Relationship goals compatibility
  if (user1Profile.lookingFor === user2Profile.lookingFor) {
    score += 100 * 0.15;
    factors.push({ factor: 'relationship_goals', score: 100 });
  } else {
    factors.push({ factor: 'relationship_goals', score: 50 });
  }
  
  // Lifestyle compatibility
  const lifestyleFactors = ['smoking', 'drinking', 'hasChildren', 'wantsChildren'];
  let lifestyleScore = 0;
  lifestyleFactors.forEach(factor => {
    if (user1Profile[factor] === user2Profile[factor] && user1Profile[factor] !== 'prefer-not-to-say') {
      lifestyleScore += 25;
    }
  });
  score += lifestyleScore * 0.15;
  factors.push({ factor: 'lifestyle', score: lifestyleScore });
  
  this.compatibility = {
    score: Math.round(score),
    factors: factors
  };
  
  return this.save();
};

module.exports = mongoose.model('Match', matchSchema); 