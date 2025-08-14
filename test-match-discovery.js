const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  email: 'emma.wilson@zenverse.ai',
  password: 'password123'
};

async function testMatchDiscovery() {
  try {
    console.log('🧪 Testing Match Discovery Functionality...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Get discovery profiles
    console.log('2️⃣ Getting discovery profiles...');
    const profilesResponse = await axios.get(`${API_BASE_URL}/matches/discover`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const profiles = profilesResponse.data.data.profiles;
    console.log(`✅ Found ${profiles.length} profiles\n`);

    // Step 3: Get stats
    console.log('3️⃣ Getting user stats...');
    const statsResponse = await axios.get(`${API_BASE_URL}/matches/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const stats = statsResponse.data.data.stats;
    console.log(`✅ Stats: ${stats.remaining} remaining, ${stats.liked} liked, ${stats.passed} passed\n`);

    // Step 4: Test swiping on first profile
    if (profiles.length > 0) {
      console.log('4️⃣ Testing swipe functionality...');
      const firstProfile = profiles[0];
      console.log(`   Swiping on: ${firstProfile.name} (${firstProfile.age})`);
      
      const swipeResponse = await axios.post(`${API_BASE_URL}/matches/swipe`, {
        targetUserId: firstProfile.userId._id,
        action: 'like'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const swipeResult = swipeResponse.data.data;
      console.log(`   ✅ Swipe result: ${swipeResult.isMatch ? 'MATCH! 🎉' : 'No match'}`);
      
      if (swipeResult.isMatch) {
        console.log(`   💕 Matched with: ${swipeResult.match.user.name}`);
      }
    }

    // Step 5: Get updated stats
    console.log('\n5️⃣ Getting updated stats...');
    const updatedStatsResponse = await axios.get(`${API_BASE_URL}/matches/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const updatedStats = updatedStatsResponse.data.data.stats;
    console.log(`✅ Updated stats: ${updatedStats.remaining} remaining, ${updatedStats.liked} liked, ${updatedStats.passed} passed\n`);

    console.log('🎉 Match Discovery Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('Full error:', error);
  }
}

// Run the test
testMatchDiscovery();
