const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const geolocationService = require('../services/geolocation');
const Profile = require('../models/Profile');

// Get nearby profiles
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 50, filters = {} } = req.query;
    
    // Validate coordinates
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        error: 'Longitude and latitude are required'
      });
    }

    const coords = {
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude)
    };

    if (!geolocationService.validateCoordinates(coords.longitude, coords.latitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates provided'
      });
    }

    // Parse filters
    const parsedFilters = {};
    if (filters.ageRange) {
      try {
        parsedFilters.ageRange = JSON.parse(filters.ageRange);
      } catch (e) {
        parsedFilters.ageRange = { min: 18, max: 100 };
      }
    }

    if (filters.gender) {
      parsedFilters.gender = filters.gender;
    }

    if (filters.interests) {
      try {
        parsedFilters.interests = JSON.parse(filters.interests);
      } catch (e) {
        parsedFilters.interests = [];
      }
    }

    // Find nearby profiles
    const profiles = await geolocationService.findProfilesNearby(
      coords,
      parseFloat(maxDistance),
      parsedFilters
    );

    res.json({
      success: true,
      data: {
        profiles,
        total: profiles.length,
        searchCenter: coords,
        maxDistance: parseFloat(maxDistance)
      }
    });

  } catch (error) {
    console.error('❌ Error getting nearby profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get nearby profiles',
      details: error.message
    });
  }
});

// Update user location
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { coordinates, city, state, country, timezone } = req.body;
    const userId = req.user.id;

    // Validate coordinates
    if (!coordinates || !geolocationService.validateCoordinates(coordinates[0], coordinates[1])) {
      return res.status(400).json({
        success: false,
        error: 'Valid coordinates are required'
      });
    }

    // Update location
    await geolocationService.updateUserLocation(userId, {
      coordinates,
      city: city || 'Unknown City',
      state: state || 'Unknown State',
      country: country || 'Unknown Country',
      timezone: timezone || 'UTC'
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        coordinates,
        city,
        state,
        country,
        timezone
      }
    });

  } catch (error) {
    console.error('❌ Error updating location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
      details: error.message
    });
  }
});

// Get distance between two users
router.get('/distance/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const distance = await geolocationService.getDistanceBetweenUsers(currentUserId, userId);

    if (distance === null) {
      return res.status(404).json({
        success: false,
        error: 'Could not calculate distance (location data missing)'
      });
    }

    res.json({
      success: true,
      data: {
        distance,
        unit: 'km',
        user1: currentUserId,
        user2: userId
      }
    });

  } catch (error) {
    console.error('❌ Error calculating distance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate distance',
      details: error.message
    });
  }
});

// Get location statistics (admin only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = await geolocationService.getLocationStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error getting location stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get location statistics',
      details: error.message
    });
  }
});

// Get nearby cities
router.get('/cities', authenticateToken, async (req, res) => {
  try {
    const { longitude, latitude, radius = 50 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        error: 'Longitude and latitude are required'
      });
    }

    const coords = {
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude)
    };

    if (!geolocationService.validateCoordinates(coords.longitude, coords.latitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates provided'
      });
    }

    const cities = await geolocationService.getNearbyCities(coords, parseFloat(radius));

    res.json({
      success: true,
      data: cities
    });

  } catch (error) {
    console.error('❌ Error getting nearby cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get nearby cities',
      details: error.message
    });
  }
});

// Get user's current location info
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await Profile.findOne({ userId }).select('location');
    
    if (!profile || !profile.location.coordinates) {
      return res.status(404).json({
        success: false,
        error: 'Location not set for this user'
      });
    }

    res.json({
      success: true,
      data: profile.location
    });

  } catch (error) {
    console.error('❌ Error getting current location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current location',
      details: error.message
    });
  }
});

module.exports = router;
