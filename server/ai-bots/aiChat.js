const PERSONALITIES = {
  friendly: {
    name: 'Friendly',
    description: 'Warm, approachable, and genuinely interested in others',
    traits: ['empathetic', 'supportive', 'curious', 'positive']
  },
  flirty: {
    name: 'Flirty',
    description: 'Playful, charming, and romantic',
    traits: ['playful', 'charming', 'romantic', 'confident']
  },
  casual: {
    name: 'Casual',
    description: 'Relaxed, easy-going, and natural',
    traits: ['relaxed', 'natural', 'easy-going', 'authentic']
  },
  intellectual: {
    name: 'Intellectual',
    description: 'Thoughtful, curious, and engaging',
    traits: ['thoughtful', 'curious', 'analytical', 'engaging']
  }
};

const RESPONSE_TEMPLATES = {
  greeting: {
    friendly: "Hey there! 😊 How's your day going?",
    flirty: "Well hello there! 😉 You're looking quite lovely today!",
    casual: "Hey! What's up?",
    intellectual: "Hello! I'm curious about your day. What's been on your mind?"
  },
  question: {
    friendly: "That's really interesting! Tell me more about that! 😊",
    flirty: "I love how passionate you are about that! Tell me everything! 💕",
    casual: "Cool! I'd love to hear more about that.",
    intellectual: "Fascinating! I'd really like to understand your perspective on that."
  },
  agreement: {
    friendly: "I totally agree with you! That's such a great point! 👍",
    flirty: "You're absolutely right! I love how we think alike! 💫",
    casual: "Yeah, I'm with you on that one.",
    intellectual: "Excellent observation! I think you've hit on something important there."
  },
  encouragement: {
    friendly: "You're doing amazing! Keep being you! ✨",
    flirty: "You're absolutely incredible! I'm so impressed by you! 💖",
    casual: "That's awesome! Keep it up!",
    intellectual: "That's a really impressive approach. You should be proud of yourself."
  }
};

// Analyze message content for context
function analyzeMessage(message) {
  const lowerMessage = message.toLowerCase();
  
  const context = {
    isGreeting: /^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(message),
    isQuestion: /\?$/.test(message),
    isPositive: /(great|amazing|wonderful|awesome|love|like|good|happy|excited)/i.test(lowerMessage),
    isNegative: /(bad|terrible|awful|hate|dislike|sad|angry|frustrated)/i.test(lowerMessage),
    isWorkRelated: /(work|job|career|office|meeting|project|boss)/i.test(lowerMessage),
    isPersonal: /(family|friend|relationship|dating|love|heart)/i.test(lowerMessage),
    isHobby: /(hobby|interest|passion|fun|enjoy|music|sport|travel)/i.test(lowerMessage),
    isCasual: /(how are you|what's up|how's it going|what's new)/i.test(lowerMessage)
  };
  
  return context;
}

// Generate response based on personality and context
function generateResponse(message, personality, context, profile = null) {
  const lowerMessage = message.toLowerCase();
  const personalityType = personality || 'friendly';
  
  // Handle greetings
  if (context.isGreeting) {
    return RESPONSE_TEMPLATES.greeting[personalityType] || RESPONSE_TEMPLATES.greeting.friendly;
  }
  
  // Handle questions
  if (context.isQuestion) {
    return RESPONSE_TEMPLATES.question[personalityType] || RESPONSE_TEMPLATES.question.friendly;
  }
  
  // Handle positive messages
  if (context.isPositive) {
    return RESPONSE_TEMPLATES.agreement[personalityType] || RESPONSE_TEMPLATES.agreement.friendly;
  }
  
  // Handle negative messages
  if (context.isNegative) {
    return generateSupportiveResponse(personalityType, message);
  }
  
  // Handle work-related topics
  if (context.isWorkRelated) {
    return generateWorkResponse(personalityType, message, profile);
  }
  
  // Handle personal topics
  if (context.isPersonal) {
    return generatePersonalResponse(personalityType, message, profile);
  }
  
  // Handle hobby topics
  if (context.isHobby) {
    return generateHobbyResponse(personalityType, message, profile);
  }
  
  // Default response
  return generateDefaultResponse(personalityType, message, profile);
}

// Generate supportive responses for negative messages
function generateSupportiveResponse(personality, message) {
  const responses = {
    friendly: "I'm sorry you're going through that. I'm here to listen and support you! 💙",
    flirty: "I hate seeing you down! You're too amazing to feel that way. Let me cheer you up! 💕",
    casual: "That sounds rough. Want to talk about it?",
    intellectual: "That's a challenging situation. I'd like to understand more about what you're experiencing."
  };
  
  return responses[personality] || responses.friendly;
}

// Generate work-related responses
function generateWorkResponse(personality, message, profile) {
  const responses = {
    friendly: "Work can be challenging sometimes! I hope you're finding ways to stay positive! 😊",
    flirty: "I love how dedicated you are to your work! That's really attractive! 💫",
    casual: "Work stuff, huh? Sometimes it's just part of life.",
    intellectual: "Work dynamics can be quite complex. I find it interesting how different people approach their careers."
  };
  
  return responses[personality] || responses.friendly;
}

// Generate personal responses
function generatePersonalResponse(personality, message, profile) {
  const responses = {
    friendly: "Relationships and personal connections are so important! I love that you're thinking about that! 💕",
    flirty: "I love how you think about relationships! It shows you have a beautiful heart! 💖",
    casual: "Personal stuff is always interesting to talk about.",
    intellectual: "Personal relationships are fascinating. They reveal so much about human nature and connection."
  };
  
  return responses[personality] || responses.friendly;
}

// Generate hobby responses
function generateHobbyResponse(personality, message, profile) {
  const responses = {
    friendly: "I love that you're passionate about your interests! That's so inspiring! ✨",
    flirty: "I love how passionate you are! It's really attractive when someone has interests they care about! 💫",
    casual: "That's cool! Hobbies make life more interesting.",
    intellectual: "Personal interests are fascinating. They often reveal a lot about someone's personality and values."
  };
  
  return responses[personality] || responses.friendly;
}

// Generate default responses
function generateDefaultResponse(personality, message, profile) {
  const responses = {
    friendly: "That's really interesting! I'd love to hear more about your thoughts on that! 😊",
    flirty: "I love how you think! You're really fascinating! 💕",
    casual: "That's cool! Tell me more.",
    intellectual: "That's an interesting perspective. I'd like to understand your thoughts better."
  };
  
  return responses[personality] || responses.friendly;
}

// Simulate typing delay (2-5 seconds)
function simulateTypingDelay() {
  const baseDelay = 2000; // 2 seconds base
  const randomDelay = Math.random() * 3000; // 0-3 seconds random
  const messageLength = Math.random() * 1000; // 0-1 second based on message length
  
  const calculatedDelay = baseDelay + randomDelay + messageLength;
  const multiplier = Math.random() * 0.5 + 0.75; // 0.75-1.25x multiplier
  
  return Math.min(calculatedDelay * multiplier, 5000); // Max 5 seconds
}

// Helper functions
function getOccupationBenefit(occupation) {
  const benefits = {
    'teacher': 'help people learn and grow',
    'engineer': 'solve complex problems',
    'doctor': 'help people stay healthy',
    'artist': 'express creativity',
    'writer': 'tell stories and share ideas',
    'designer': 'create beautiful things',
    'manager': 'lead and inspire teams',
    'developer': 'build amazing technology'
  };
  return benefits[occupation.toLowerCase()] || 'make a positive impact';
}

function getLocationFeature(location) {
  const features = {
    'new york': 'amazing energy and culture',
    'los angeles': 'beautiful weather and creativity',
    'chicago': 'great food and architecture',
    'miami': 'beautiful beaches and nightlife',
    'seattle': 'stunning nature and tech scene',
    'austin': 'amazing music and food',
    'denver': 'beautiful mountains and outdoor activities',
    'portland': 'unique culture and great food'
  };
  return features[location.toLowerCase()] || 'wonderful people and culture';
}

// Main function to generate bot reply
async function generateBotReply(userMessage, botProfile) {
  try {
    // Determine bot personality based on profile
    const personalities = Object.keys(PERSONALITIES);
    const personality = botProfile.personality || personalities[Math.floor(Math.random() * personalities.length)];
    
    // Analyze user message for context
    const context = analyzeMessage(userMessage);
    
    // Generate response
    const response = generateResponse(userMessage, personality, context, botProfile);
    
    // Add some personalization based on bot's interests
    if (botProfile.interests && botProfile.interests.length > 0) {
      const randomInterest = botProfile.interests[Math.floor(Math.random() * botProfile.interests.length)];
      const personalResponse = `By the way, I love ${randomInterest}! We should definitely talk about that sometime! 💫`;
      return `${response}\n\n${personalResponse}`;
    }
    
    return response;
  } catch (error) {
    console.error('Error generating bot reply:', error);
    return "That's really interesting! I'd love to hear more about that! 😊";
  }
}

// Function to randomly initiate conversations
function generateInitiativeMessage(botProfile) {
  const initiativeMessages = [
    `Hey! I noticed we matched and I think you're really interesting! Would love to chat! 😊`,
    `Hi there! I'm excited to get to know you better! You seem amazing! ✨`,
    `Hello! I couldn't help but be drawn to your profile. Let's talk! 💫`,
    `Hey! I think we might have something special here. Want to find out? 😉`,
    `Hi! I'm really looking forward to our conversation! You seem wonderful! 💕`
  ];
  
  const randomMessage = initiativeMessages[Math.floor(Math.random() * initiativeMessages.length)];
  return randomMessage;
}

module.exports = {
  generateBotReply,
  generateInitiativeMessage,
  simulateTypingDelay,
  PERSONALITIES,
  RESPONSE_TEMPLATES
}; 