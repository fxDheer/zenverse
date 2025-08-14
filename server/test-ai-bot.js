const { generateBotReply, generateInitiativeMessage, simulateTypingDelay, PERSONALITIES } = require('./ai-bots/aiChat');

// Test bot profile
const testBotProfile = {
  name: "Emma Wilson",
  age: 25,
  gender: "female",
  bio: "Adventure seeker and coffee enthusiast ☕️",
  interests: ["Hiking", "Photography", "Coffee", "Travel"],
  personality: "friendly",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400"
};

// Test messages
const testMessages = [
  "Hello! How are you?",
  "You're so beautiful!",
  "I love hiking too!",
  "What do you like to do for fun?",
  "You seem really interesting"
];

console.log('🤖 Testing AI Bot Engine...\n');

// Test 1: Generate initiative message
console.log('📝 Test 1: Initiative Message');
const initiativeMessage = generateInitiativeMessage(testBotProfile);
console.log(`Bot: ${initiativeMessage}\n`);

// Test 2: Generate replies to different messages
console.log('💬 Test 2: Message Responses');
testMessages.forEach((message, index) => {
  console.log(`User: ${message}`);
  generateBotReply(message, testBotProfile).then(reply => {
    console.log(`Bot: ${reply}\n`);
  });
});

// Test 3: Test typing delay
console.log('⏱️ Test 3: Typing Delay');
const delay = simulateTypingDelay();
console.log(`Typing delay: ${delay}ms (${delay/1000}s)\n`);

// Test 4: Test different personalities
console.log('🎭 Test 4: Different Personalities');
Object.keys(PERSONALITIES).forEach(personality => {
  const personalityProfile = { ...testBotProfile, personality };
  generateBotReply("Hello!", personalityProfile).then(reply => {
    console.log(`${personality.toUpperCase()}: ${reply}\n`);
  });
});

console.log('✅ AI Bot Engine Test Complete!'); 