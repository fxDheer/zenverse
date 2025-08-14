const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = null;
let testUserId = null;

// Test data
const testLocation = {
  coordinates: [-74.006, 40.7128], // New York coordinates
  city: 'New York',
  state: 'NY',
  country: 'USA',
  timezone: 'America/New_York'
};

const testFilters = {
  maxDistance: 25,
  ageRange: { min: 20, max: 35 },
  gender: 'female',
  interests: ['Travel', 'Music']
};

// Helper function to make authenticated requests
const makeRequest = async (endpoint, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await axios(`${API_BASE_URL}${endpoint}`, config);
    return response.data;
  } catch (error) {
    console.error(`❌ API Error (${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
};

const testUserRegistration = async () => {
  console.log('\n🔍 Testing User Registration...');
  try {
    const userData = {
      name: 'Test User',
      email: 'testuser@geolocation.test',
      password: 'testpass123'
    };

    const response = await makeRequest('/auth/register', {
      method: 'POST',
      data: userData
    });

    console.log('✅ User registered successfully:', response.data.name);
    return true;
  } catch (error) {
    console.error('❌ User registration failed:', error.message);
    return false;
  }
};

const testUserLogin = async () => {
  console.log('\n🔍 Testing User Login...');
  try {
    const credentials = {
      email: 'testuser@geolocation.test',
      password: 'testpass123'
    };

    const response = await makeRequest('/auth/login', {
      method: 'POST',
      data: credentials
    });

    authToken = response.token;
    testUserId = response.user.id;
    console.log('✅ User logged in successfully:', response.user.name);
    return true;
  } catch (error) {
    console.error('❌ User login failed:', error.message);
    return false;
  }
};

const testLocationUpdate = async () => {
  console.log('\n🔍 Testing Location Update...');
  try {
    const response = await makeRequest('/geolocation/update', {
      method: 'PUT',
      data: testLocation
    });

    console.log('✅ Location updated successfully:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Location update failed:', error.message);
    return false;
  }
};

const testGetCurrentLocation = async () => {
  console.log('\n🔍 Testing Get Current Location...');
  try {
    const response = await makeRequest('/geolocation/current');
    console.log('✅ Current location retrieved:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Get current location failed:', error.message);
    return false;
  }
};

const testNearbyProfiles = async () => {
  console.log('\n🔍 Testing Nearby Profiles Search...');
  try {
    const params = new URLSearchParams({
      longitude: testLocation.coordinates[0].toString(),
      latitude: testLocation.coordinates[1].toString(),
      maxDistance: testFilters.maxDistance.toString(),
      filters: JSON.stringify(testFilters)
    });

    const response = await makeRequest(`/geolocation/nearby?${params}`);
    console.log('✅ Nearby profiles search successful:');
    console.log(`   - Found ${response.data.total} profiles`);
    console.log(`   - Search radius: ${response.data.maxDistance}km`);
    console.log(`   - Search center: ${JSON.stringify(response.data.searchCenter)}`);
    
    if (response.data.profiles.length > 0) {
      const firstProfile = response.data.profiles[0];
      console.log(`   - First profile: ${firstProfile.name} (${firstProfile.distance}km away)`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Nearby profiles search failed:', error.message);
    return false;
  }
};

const testDistanceCalculation = async () => {
  console.log('\n🔍 Testing Distance Calculation...');
  try {
    // First, let's get some profiles to test distance calculation
    const nearbyResponse = await makeRequest(`/geolocation/nearby?longitude=${testLocation.coordinates[0]}&latitude=${testLocation.coordinates[1]}&maxDistance=50`);
    
    if (nearbyResponse.data.profiles.length > 0) {
      const targetUserId = nearbyResponse.data.profiles[0].userId?._id || nearbyResponse.data.profiles[0]._id;
      
      const distanceResponse = await makeRequest(`/geolocation/distance/${targetUserId}`);
      console.log('✅ Distance calculation successful:', distanceResponse.data);
      return true;
    } else {
      console.log('⚠️ No profiles found to test distance calculation');
      return false;
    }
  } catch (error) {
    console.error('❌ Distance calculation failed:', error.message);
    return false;
  }
};

const testNearbyCities = async () => {
  console.log('\n🔍 Testing Nearby Cities...');
  try {
    const params = new URLSearchParams({
      longitude: testLocation.coordinates[0].toString(),
      latitude: testLocation.coordinates[1].toString(),
      radius: '50'
    });

    const response = await makeRequest(`/geolocation/cities?${params}`);
    console.log('✅ Nearby cities search successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Nearby cities search failed:', error.message);
    return false;
  }
};

const testLocationStats = async () => {
  console.log('\n🔍 Testing Location Statistics...');
  try {
    const response = await makeRequest('/geolocation/stats');
    console.log('✅ Location statistics retrieved:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Location statistics failed:', error.message);
    return false;
  }
};

const testInvalidCoordinates = async () => {
  console.log('\n🔍 Testing Invalid Coordinates Validation...');
  try {
    const invalidCoords = {
      longitude: 200, // Invalid longitude (> 180)
      latitude: 40.7128
    };

    const params = new URLSearchParams({
      longitude: invalidCoords.longitude.toString(),
      latitude: invalidCoords.latitude.toString(),
      maxDistance: '50'
    });

    await makeRequest(`/geolocation/nearby?${params}`);
    console.log('❌ Should have rejected invalid coordinates');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Invalid coordinates properly rejected:', error.response.data.error);
      return true;
    } else {
      console.error('❌ Unexpected error with invalid coordinates:', error.message);
      return false;
    }
  }
};

const testMissingCoordinates = async () => {
  console.log('\n🔍 Testing Missing Coordinates Validation...');
  try {
    await makeRequest('/geolocation/nearby?maxDistance=50');
    console.log('❌ Should have rejected missing coordinates');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Missing coordinates properly rejected:', error.response.data.error);
      return true;
    } else {
      console.error('❌ Unexpected error with missing coordinates:', error.message);
      return false;
    }
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Geolocation Services Test Suite...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Location Update', fn: testLocationUpdate },
    { name: 'Get Current Location', fn: testGetCurrentLocation },
    { name: 'Nearby Profiles Search', fn: testNearbyProfiles },
    { name: 'Distance Calculation', fn: testDistanceCalculation },
    { name: 'Nearby Cities', fn: testNearbyCities },
    { name: 'Location Statistics', fn: testLocationStats },
    { name: 'Invalid Coordinates Validation', fn: testInvalidCoordinates },
    { name: 'Missing Coordinates Validation', fn: testMissingCoordinates }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passedTests++;
    } catch (error) {
      console.error(`❌ Test "${test.name}" crashed:`, error.message);
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Geolocation services are working perfectly!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }

  console.log('\n🔧 Next Steps:');
  console.log('1. Check server logs for any errors');
  console.log('2. Verify MongoDB connection and indexes');
  console.log('3. Ensure all geolocation routes are properly mounted');
  console.log('4. Test frontend integration with real coordinates');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testLocation,
  testFilters
};

