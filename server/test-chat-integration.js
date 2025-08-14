const io = require('socket.io-client');
const { generateBotReply, generateInitiativeMessage } = require('./ai-bots/aiChat');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const TEST_USER_ID = 'test-user-123';
const TEST_BOT_ID = 'bot-user-456';
const TEST_MATCH_ID = 'test-match-789';

console.log('🧪 Testing Real-time Chat Integration...\n');

// Test 1: Socket.io Connection
console.log('📡 Test 1: Socket.io Connection');
const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Test 2: Join Chat Room
  console.log('\n💬 Test 2: Join Chat Room');
  socket.emit('join_chat', {
    userId: TEST_USER_ID,
    matchId: TEST_MATCH_ID
  });
  
  // Test 3: Send Message
  setTimeout(() => {
    console.log('\n📤 Test 3: Send Message');
    socket.emit('send_message', {
      senderId: TEST_USER_ID,
      receiverId: TEST_BOT_ID,
      matchId: TEST_MATCH_ID,
      content: 'Hello! How are you doing today?',
      messageType: 'text'
    });
  }, 1000);
  
  // Test 4: Typing Indicator
  setTimeout(() => {
    console.log('\n⌨️ Test 4: Typing Indicator');
    socket.emit('typing', {
      userId: TEST_USER_ID,
      matchId: TEST_MATCH_ID,
      isTyping: true
    });
    
    setTimeout(() => {
      socket.emit('typing', {
        userId: TEST_USER_ID,
        matchId: TEST_MATCH_ID,
        isTyping: false
      });
    }, 2000);
  }, 2000);
  
  // Test 5: User Online Status
  setTimeout(() => {
    console.log('\n🟢 Test 5: User Online Status');
    socket.emit('user_online', {
      userId: TEST_USER_ID,
      status: 'online'
    });
  }, 3000);
});

// Listen for events
socket.on('user_joined', (data) => {
  console.log('✅ User joined chat:', data);
});

socket.on('chat_history', (data) => {
  console.log('✅ Chat history received:', data.messages?.length || 0, 'messages');
});

socket.on('receive_message', (data) => {
  console.log('✅ Message received:', {
    sender: data.sender,
    content: data.content.substring(0, 50) + '...',
    isAI: data.isAI || false
  });
});

socket.on('user_typing', (data) => {
  console.log('✅ Typing indicator:', data);
});

socket.on('user_status_change', (data) => {
  console.log('✅ User status change:', data);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

// Test 6: AI Bot Response Simulation
console.log('\n🤖 Test 6: AI Bot Response Simulation');
const testBotProfile = {
  name: "Emma Wilson",
  age: 25,
  gender: "female",
  bio: "Adventure seeker and coffee enthusiast ☕️",
  interests: ["Hiking", "Photography", "Coffee", "Travel"],
  personality: "friendly",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400"
};

// Test AI response generation
generateBotReply("Hello! How are you?", testBotProfile).then(response => {
  console.log('✅ AI Bot Response:', response.substring(0, 100) + '...');
});

// Test initiative message
const initiativeMessage = generateInitiativeMessage(testBotProfile);
console.log('✅ Initiative Message:', initiativeMessage.substring(0, 100) + '...');

// Cleanup after tests
setTimeout(() => {
  console.log('\n🧹 Cleaning up...');
  socket.disconnect();
  console.log('✅ Tests completed!');
  process.exit(0);
}, 10000);

console.log('\n⏱️ Tests will run for 10 seconds...'); 