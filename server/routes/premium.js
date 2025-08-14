const express = require('express');
const router = express.Router();
const { authenticateToken, requirePremium } = require('../middleware/auth');
const premiumService = require('../services/premiumService');

// Get user's premium status and features
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const premiumInfo = await premiumService.getUserPremiumFeatures(userId);
    
    res.json({
      success: true,
      data: premiumInfo
    });
  } catch (error) {
    console.error('❌ Error getting premium status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get premium status',
      details: error.message
    });
  }
});

// Create subscription (simulate payment)
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType, amount, currency = 'USD', paymentMethod } = req.body;

    if (!planType || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Plan type and amount are required'
      });
    }

    // Validate plan type
    const validPlanTypes = ['monthly', 'quarterly', 'yearly'];
    if (!validPlanTypes.includes(planType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan type'
      });
    }

    // TODO: In a real app, you would:
    // 1. Process payment with Stripe/PayPal
    // 2. Verify payment success
    // 3. Create subscription record
    // 4. Update user premium status

    // For now, simulate successful payment
    const subscription = await premiumService.createSubscription(userId, {
      planType,
      amount,
      currency,
      paymentMethod
    });

    if (subscription.success) {
      res.json({
        success: true,
        message: 'Subscription created successfully',
        data: subscription.subscription
      });
    } else {
      res.status(400).json({
        success: false,
        error: subscription.error
      });
    }
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription',
      details: error.message
    });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has premium
    const isPremium = await premiumService.isPremiumUser(userId);
    if (!isPremium) {
      return res.status(400).json({
        success: false,
        error: 'No active premium subscription to cancel'
      });
    }

    const result = await premiumService.cancelSubscription(userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      details: error.message
    });
  }
});

// Check if user can perform premium action
router.post('/check-action', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      });
    }

    const canPerform = await premiumService.canPerformAction(userId, action);
    
    res.json({
      success: true,
      data: canPerform
    });
  } catch (error) {
    console.error('❌ Error checking action permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check action permission',
      details: error.message
    });
  }
});

// Use profile boost
router.post('/use-boost', authenticateToken, requirePremium, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await premiumService.useProfileBoost(userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          remaining: result.remaining
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error using profile boost:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to use profile boost',
      details: error.message
    });
  }
});

// Get premium statistics (admin only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = await premiumService.getPremiumStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error getting premium stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get premium statistics',
      details: error.message
    });
  }
});

// Get available premium features
router.get('/features', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const premiumInfo = await premiumService.getUserPremiumFeatures(userId);
    
    const availableFeatures = premiumService.premiumFeatures;
    
    res.json({
      success: true,
      data: {
        isPremium: premiumInfo.isPremium,
        availableFeatures,
        userFeatures: premiumInfo.features || []
      }
    });
  } catch (error) {
    console.error('❌ Error getting premium features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get premium features',
      details: error.message
    });
  }
});

// Upgrade user to premium (admin only)
router.post('/upgrade-user', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { targetUserId, planType, expiresAt } = req.body;

    if (!targetUserId || !planType) {
      return res.status(400).json({
        success: false,
        error: 'Target user ID and plan type are required'
      });
    }

    const features = premiumService.getPlanFeatures(planType);
    const expirationDate = expiresAt ? new Date(expiresAt) : premiumService.calculateExpirationDate(planType);

    const updated = await premiumService.updatePremiumStatus(
      targetUserId,
      true,
      expirationDate,
      features
    );

    if (updated) {
      res.json({
        success: true,
        message: 'User upgraded to premium successfully',
        data: {
          userId: targetUserId,
          planType,
          expiresAt: expirationDate,
          features
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to upgrade user'
      });
    }
  } catch (error) {
    console.error('❌ Error upgrading user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade user',
      details: error.message
    });
  }
});

// Downgrade user from premium (admin only)
router.post('/downgrade-user', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Target user ID is required'
      });
    }

    const updated = await premiumService.updatePremiumStatus(targetUserId, false);

    if (updated) {
      res.json({
        success: true,
        message: 'User downgraded from premium successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to downgrade user'
      });
    }
  } catch (error) {
    console.error('❌ Error downgrading user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to downgrade user',
      details: error.message
    });
  }
});

module.exports = router;

