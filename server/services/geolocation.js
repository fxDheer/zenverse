const Profile = require('../models/Profile');
const User = require('../models/User');

class GeolocationService {
  constructor() {
    this.EARTH_RADIUS_KM = 6371;
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  // Convert degrees to radians
  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Find profiles within a certain radius
  async findProfilesNearby(coordinates, maxDistance, filters = {}) {
    try {
      const { longitude, latitude } = coordinates;
      
      // Build query with geospatial search
      const query = {
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: maxDistance * 1000 // Convert km to meters
          }
        },
        isPublic: true
      };

      // Add additional filters
      if (filters.ageRange) {
        query.age = {
          $gte: filters.ageRange.min || 18,
          $lte: filters.ageRange.max || 100
        };
      }

      if (filters.gender && filters.gender !== 'all') {
        query.gender = filters.gender;
      }

      if (filters.interests && filters.interests.length > 0) {
        query.interests = { $in: filters.interests };
      }

      // Execute query with distance calculation
      const profiles = await Profile.find(query)
        .populate('userId', 'name avatar isOnline lastActive')
        .limit(100); // Limit results for performance

      // Add distance information to each profile
      const profilesWithDistance = profiles.map(profile => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          profile.location.coordinates[1],
          profile.location.coordinates[0]
        );
        
        return {
          ...profile.toObject(),
          distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
        };
      });

      // Sort by distance
      profilesWithDistance.sort((a, b) => a.distance - b.distance);

      return profilesWithDistance;
    } catch (error) {
      console.error('❌ Error finding nearby profiles:', error);
      throw error;
    }
  }

  // Get user's current location from coordinates
  async getUserLocation(coordinates) {
    try {
      const { longitude, latitude } = coordinates;
      
      // This would typically integrate with a geocoding service like Google Maps
      // For now, we'll return a basic location object
      const location = {
        coordinates: [longitude, latitude],
        city: 'Unknown City',
        state: 'Unknown State',
        country: 'Unknown Country',
        timezone: 'UTC'
      };

      return location;
    } catch (error) {
      console.error('❌ Error getting user location:', error);
      throw error;
    }
  }

  // Update user's location
  async updateUserLocation(userId, locationData) {
    try {
      const { coordinates, city, state, country, timezone } = locationData;
      
      // Update both User and Profile models
      await Promise.all([
        User.findByIdAndUpdate(userId, {
          'location.coordinates': coordinates,
          'location.city': city,
          'location.state': state,
          'location.country': country,
          'location.timezone': timezone
        }),
        Profile.findOneAndUpdate(
          { userId },
          {
            'location.coordinates': coordinates,
            'location.city': city,
            'location.state': state,
            'location.country': country,
            'location.timezone': timezone
          }
        )
      ]);

      console.log(`📍 Updated location for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating user location:', error);
      throw error;
    }
  }

  // Get distance between two users
  async getDistanceBetweenUsers(userId1, userId2) {
    try {
      const [profile1, profile2] = await Promise.all([
        Profile.findOne({ userId: userId1 }),
        Profile.findOne({ userId: userId2 })
      ]);

      if (!profile1?.location?.coordinates || !profile2?.location?.coordinates) {
        return null;
      }

      const distance = this.calculateDistance(
        profile1.location.coordinates[1],
        profile1.location.coordinates[0],
        profile2.location.coordinates[1],
        profile2.location.coordinates[0]
      );

      return Math.round(distance * 10) / 10;
    } catch (error) {
      console.error('❌ Error calculating distance between users:', error);
      return null;
    }
  }

  // Get location statistics for admin purposes
  async getLocationStats() {
    try {
      const stats = await Profile.aggregate([
        {
          $match: {
            'location.coordinates': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$location.country',
            count: { $sum: 1 },
            cities: { $addToSet: '$location.city' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('❌ Error getting location stats:', error);
      throw error;
    }
  }

  // Validate coordinates
  validateCoordinates(longitude, latitude) {
    return (
      typeof longitude === 'number' &&
      typeof latitude === 'number' &&
      longitude >= -180 && longitude <= 180 &&
      latitude >= -90 && latitude <= 90
    );
  }

  // Get nearby cities (placeholder for future geocoding integration)
  async getNearbyCities(coordinates, radius = 50) {
    // This would integrate with a geocoding service
    // For now, return a placeholder
    return [
      { name: 'Nearby City 1', distance: Math.random() * radius },
      { name: 'Nearby City 2', distance: Math.random() * radius },
      { name: 'Nearby City 3', distance: Math.random() * radius }
    ];
  }
}

module.exports = new GeolocationService();
