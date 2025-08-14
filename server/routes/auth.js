const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const { authenticateToken, generateToken } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      role: email.includes('admin') ? 'admin' : 'user' // Auto-admin for testing
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last active
    await user.updateLastActive();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const profile = await Profile.findOne({ userId: req.user._id });

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        profile: profile ? profile.getPublicData() : null
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      name, age, bio, avatar, interests, occupation, education,
      height, bodyType, relationshipStatus, lookingFor,
      hasChildren, wantsChildren, smoking, drinking, religion, languages,
      location
    } = req.body;

    // Update or create profile
    let profile = await Profile.findOne({ userId: req.user._id });
    
    if (!profile) {
      profile = new Profile({
        userId: req.user._id,
        name: req.user.name
      });
    }

    // Update profile fields
    if (name) profile.name = name;
    if (age) profile.age = age;
    if (bio) profile.bio = bio;
    if (avatar) profile.avatar = avatar;
    if (interests) profile.interests = interests;
    if (occupation) profile.occupation = occupation;
    if (education) profile.education = education;
    if (height) profile.height = height;
    if (bodyType) profile.bodyType = bodyType;
    if (relationshipStatus) profile.relationshipStatus = relationshipStatus;
    if (lookingFor) profile.lookingFor = lookingFor;
    if (hasChildren) profile.hasChildren = hasChildren;
    if (wantsChildren) profile.wantsChildren = wantsChildren;
    if (smoking) profile.smoking = smoking;
    if (drinking) profile.drinking = drinking;
    if (religion) profile.religion = religion;
    if (languages) profile.languages = languages;
    if (location) profile.location = location;

    // Update completion status
    profile.isComplete = profile.getCompletionPercentage() >= 70;
    profile.lastUpdated = new Date();

    await profile.save();

    // Update user name if provided
    if (name && name !== req.user.name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: profile.getPublicData(),
        completionPercentage: profile.getCompletionPercentage()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Update last active timestamp
    await req.user.updateLastActive();

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
});

module.exports = router; 