// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { 
  authenticateToken, 
  authorizeRoles, 
  logActivity, 
  updateLastActivity,
  authLimiter,
  JWT_SECRET 
} = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validatePasswordChange,
  validateProfileUpdate,
  validateUserPreferences,
  sanitizeInput
} = require('../middleware/validation');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Generate random token for email verification and password reset
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register new user
router.post('/register', 
  authLimiter,
  sanitizeInput,
  validateRegistration,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        emailVerificationToken: generateRandomToken(),
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });

      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      // TODO: Send email verification (implement email service)
      console.log(`Email verification token for ${email}: ${user.emailVerificationToken}`);

      res.status(201).json({
        message: 'User registered successfully. Please check your email for verification.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Server error during registration',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

// Login user
router.post('/login',
  authLimiter,
  sanitizeInput,
  validateLogin,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email and include password for comparison
      const user = await User.findByEmail(email).select('+password');
      
      if (!user) {
        return res.status(400).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          error: 'Account is temporarily locked due to multiple failed login attempts',
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts();
        
        return res.status(400).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
          preferences: user.preferences,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Server error during login',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Server error during email verification',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Request password reset
router.post('/forgot-password',
  authLimiter,
  sanitizeInput,
  validatePasswordReset,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate password reset token
      user.passwordResetToken = generateRandomToken();
      user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      // TODO: Send password reset email (implement email service)
      console.log(`Password reset token for ${email}: ${user.passwordResetToken}`);

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        error: 'Server error during password reset request',
        code: 'PASSWORD_RESET_ERROR'
      });
    }
  }
);

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      error: 'Server error during password reset',
      code: 'PASSWORD_RESET_ERROR'
    });
  }
});

// Get current user profile
router.get('/me',
  authenticateToken,
  updateLastActivity,
  logActivity('GET_PROFILE'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Server error while fetching profile',
        code: 'PROFILE_FETCH_ERROR'
      });
    }
  }
);

// Update user profile
router.put('/profile',
  authenticateToken,
  sanitizeInput,
  validateProfileUpdate,
  updateLastActivity,
  logActivity('UPDATE_PROFILE'),
  async (req, res) => {
    try {
      const updates = req.body;
      
      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updates.password;
      delete updates.email;
      delete updates.role;
      delete updates.isActive;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        error: 'Server error while updating profile',
        code: 'PROFILE_UPDATE_ERROR'
      });
    }
  }
);

// Update user preferences
router.put('/preferences',
  authenticateToken,
  sanitizeInput,
  validateUserPreferences,
  updateLastActivity,
  logActivity('UPDATE_PREFERENCES'),
  async (req, res) => {
    try {
      const { preferences } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { preferences } },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        message: 'Preferences updated successfully',
        preferences: user.preferences
      });
    } catch (error) {
      console.error('Preferences update error:', error);
      res.status(500).json({
        error: 'Server error while updating preferences',
        code: 'PREFERENCES_UPDATE_ERROR'
      });
    }
  }
);

// Change password
router.put('/change-password',
  authenticateToken,
  sanitizeInput,
  validatePasswordChange,
  updateLastActivity,
  logActivity('CHANGE_PASSWORD'),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user._id).select('+password');
      
      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        error: 'Server error while changing password',
        code: 'PASSWORD_CHANGE_ERROR'
      });
    }
  }
);

// Logout (client-side token removal, but we can log it)
router.post('/logout',
  authenticateToken,
  logActivity('LOGOUT'),
  (req, res) => {
    res.json({
      message: 'Logged out successfully'
    });
  }
);

// Admin: Get all users (admin only)
router.get('/users',
  authenticateToken,
  authorizeRoles('admin'),
  logActivity('GET_ALL_USERS'),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      res.json({
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: 'Server error while fetching users',
        code: 'USERS_FETCH_ERROR'
      });
    }
  }
);

// Admin: Update user (admin only)
router.put('/users/:userId',
  authenticateToken,
  authorizeRoles('admin'),
  logActivity('UPDATE_USER_ADMIN'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      console.error('Admin user update error:', error);
      res.status(500).json({
        error: 'Server error while updating user',
        code: 'USER_UPDATE_ERROR'
      });
    }
  }
);

module.exports = router;