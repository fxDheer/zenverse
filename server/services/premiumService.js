const User = require('../models/User');
const Profile = require('../models/Profile');

class PremiumService {
  constructor() {
    this.premiumFeatures = {
      unlimitedLikes: true,
      seeWhoLikedYou: true,
      advancedFilters: true,
      readReceipts: true,
      prioritySupport: true,
      profileBoosts: 5,
      travelMode: true,
      incognitoMode: true,
      advancedMatching: true,
      profileAnalytics: true,
      messageReminders: true,
      verifiedBadge: true
    };
  }

  // Check if user has premium access
  async isPremiumUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;

      if (!user.premium?.isPremium) return false;

      // Check if subscription has expired
      if (user.premium.expiresAt && user.premium.expiresAt < new Date()) {
        // Subscription expired, update user status
        await this.updatePremiumStatus(userId, false);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking premium status:', error);
      return false;
    }
  }

  // Update user's premium status
  async updatePremiumStatus(userId, isPremium, expiresAt = null, features = []) {
    try {
      const updateData = {
        'premium.isPremium': isPremium,
        'premium.expiresAt': expiresAt,
        'premium.features': features
      };

      if (!isPremium) {
        updateData['premium.expiresAt'] = null;
        updateData['premium.features'] = [];
      }

      await User.findByIdAndUpdate(userId, updateData);
      
      console.log(`✅ Premium status updated for user ${userId}: ${isPremium}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating premium status:', error);
      return false;
    }
  }

  // Create subscription
  async createSubscription(userId, planData) {
    try {
      const { planType, amount, currency = 'USD', paymentMethod } = planData;
      
      // Calculate expiration date based on plan type
      const expiresAt = this.calculateExpirationDate(planType);
      
      // Get features for the plan
      const features = this.getPlanFeatures(planType);
      
      // Update user's premium status
      const updated = await this.updatePremiumStatus(userId, true, expiresAt, features);
      
      if (updated) {
        // Log subscription creation
        console.log(`✅ Subscription created for user ${userId}: ${planType} plan`);
        
        return {
          success: true,
          subscription: {
            userId,
            planType,
            amount,
            currency,
            expiresAt,
            features
          }
        };
      }
      
      return { success: false, error: 'Failed to update premium status' };
    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel subscription
  async cancelSubscription(userId) {
    try {
      const updated = await this.updatePremiumStatus(userId, false);
      
      if (updated) {
        console.log(`✅ Subscription cancelled for user ${userId}`);
        return { success: true, message: 'Subscription cancelled successfully' };
      }
      
      return { success: false, error: 'Failed to cancel subscription' };
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's premium features
  async getUserPremiumFeatures(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.premium?.isPremium) {
        return { isPremium: false, features: {} };
      }

      // Check if subscription is still valid
      if (user.premium.expiresAt && user.premium.expiresAt < new Date()) {
        await this.updatePremiumStatus(userId, false);
        return { isPremium: false, features: {} };
      }

      return {
        isPremium: true,
        features: user.premium.features || [],
        expiresAt: user.premium.expiresAt,
        planType: this.getPlanTypeFromFeatures(user.premium.features)
      };
    } catch (error) {
      console.error('❌ Error getting premium features:', error);
      return { isPremium: false, features: {} };
    }
  }

  // Check if user can perform premium action
  async canPerformAction(userId, action) {
    try {
      const isPremium = await this.isPremiumUser(userId);
      
      if (!isPremium) {
        return { allowed: false, reason: 'Premium subscription required' };
      }

      // Check specific action limits
      switch (action) {
        case 'unlimitedLikes':
          return { allowed: true };
        
        case 'profileBoost':
          const user = await User.findById(userId);
          const boostCount = user.premium.features?.profileBoosts || 0;
          if (boostCount > 0) {
            return { allowed: true, remaining: boostCount };
          }
          return { allowed: false, reason: 'No profile boosts remaining' };
        
        case 'advancedFilters':
          return { allowed: true };
        
        case 'seeWhoLikedYou':
          return { allowed: true };
        
        default:
          return { allowed: true };
      }
    } catch (error) {
      console.error('❌ Error checking action permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  // Use profile boost
  async useProfileBoost(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.premium?.isPremium) {
        return { success: false, error: 'Premium subscription required' };
      }

      const currentBoosts = user.premium.features?.profileBoosts || 0;
      if (currentBoosts <= 0) {
        return { success: false, error: 'No profile boosts remaining' };
      }

      // Decrease boost count
      const updatedFeatures = user.premium.features.map(feature => 
        feature === 'profileBoosts' ? 'profileBoosts' : feature
      );
      
      await User.findByIdAndUpdate(userId, {
        'premium.features': updatedFeatures
      });

      console.log(`✅ Profile boost used by user ${userId}. Remaining: ${currentBoosts - 1}`);
      
      return { 
        success: true, 
        remaining: currentBoosts - 1,
        message: 'Profile boosted successfully!'
      };
    } catch (error) {
      console.error('❌ Error using profile boost:', error);
      return { success: false, error: error.message };
    }
  }

  // Get premium statistics
  async getPremiumStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$premium.isPremium',
            count: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$premium.isPremium', true] },
                  { $ifNull: ['$premium.amount', 0] },
                  0
                ]
              }
            }
          }
        }
      ]);

      const premiumUsers = stats.find(s => s._id === true)?.count || 0;
      const freeUsers = stats.find(s => s._id === false)?.count || 0;
      const totalRevenue = stats.find(s => s._id === true)?.totalRevenue || 0;

      return {
        premiumUsers,
        freeUsers,
        totalUsers: premiumUsers + freeUsers,
        premiumPercentage: totalUsers > 0 ? (premiumUsers / totalUsers * 100).toFixed(2) : 0,
        totalRevenue
      };
    } catch (error) {
      console.error('❌ Error getting premium stats:', error);
      return {};
    }
  }

  // Helper methods
  calculateExpirationDate(planType) {
    const now = new Date();
    switch (planType) {
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'quarterly':
        return new Date(now.setMonth(now.getMonth() + 3));
      case 'yearly':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        return new Date(now.setMonth(now.getMonth() + 1));
    }
  }

  getPlanFeatures(planType) {
    const baseFeatures = [
      'unlimitedLikes',
      'seeWhoLikedYou',
      'advancedFilters',
      'readReceipts',
      'prioritySupport',
      'travelMode',
      'incognitoMode',
      'advancedMatching',
      'profileAnalytics',
      'messageReminders',
      'verifiedBadge'
    ];

    // All plans get the same features for now
    // In the future, you could differentiate based on plan type
    return baseFeatures;
  }

  getPlanTypeFromFeatures(features) {
    // Simple logic to determine plan type from features
    // In a real app, you'd store the plan type explicitly
    if (features && features.length > 0) {
      return 'premium'; // Could be 'monthly', 'quarterly', 'yearly'
    }
    return 'free';
  }

  // Validate premium action
  validatePremiumAction(action, userId) {
    const validActions = [
      'unlimitedLikes',
      'seeWhoLikedYou',
      'advancedFilters',
      'readReceipts',
      'prioritySupport',
      'profileBoost',
      'travelMode',
      'incognitoMode',
      'advancedMatching',
      'profileAnalytics',
      'messageReminders',
      'verifiedBadge'
    ];

    return validActions.includes(action);
  }
}

module.exports = new PremiumService();

