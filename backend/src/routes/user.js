// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { 
  authenticateToken, 
  authorizeRoles, 
  authorizeResource,
  logActivity, 
  updateLastActivity,
  apiLimiter 
} = require('../middleware/auth');
const {
  validateProfileUpdate,
  validateUserPreferences,
  validatePagination,
  validateUserId,
  sanitizeInput
} = require('../middleware/validation');

// Route to create a new user
router.get('/register', async (req, res) => {
  const { name, password, email, dob } = req.body;

  try {
    const checkEmail = await User.findOne({ email });

    if (!checkEmail) {
      const newUser = new User({
        name,
        password,
        email
      });

      const savedUser = await newUser.save();
      res.status(201).send("User created successfully");
    } else {
      res.status(400).send("User already exists");
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send("Server error");
  }
});

// Route to sign in a user
router.get('/users/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ name: username });

    if (user) {
      if (password === user.password) {
        res.status(200).send("Login successful");
      } else {
        res.status(400).send("Password doesn't match");
      }
    } else {
      res.status(400).send("User doesn't exist");
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send("Server error");
  }
});

// Get user profile by ID (admin or self)
router.get('/:userId',
  apiLimiter,
  authenticateToken,
  validateUserId,
  updateLastActivity,
  logActivity('GET_USER_PROFILE'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user can access this profile
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({
          error: 'Access denied - you can only view your own profile',
          code: 'PROFILE_ACCESS_DENIED'
        });
      }

      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        error: 'Server error while fetching user profile',
        code: 'PROFILE_FETCH_ERROR'
      });
    }
  }
);

// Update user profile by ID (admin or self)
router.put('/:userId',
  apiLimiter,
  authenticateToken,
  validateUserId,
  sanitizeInput,
  validateProfileUpdate,
  updateLastActivity,
  logActivity('UPDATE_USER_PROFILE'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      // Check if user can update this profile
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({
          error: 'Access denied - you can only update your own profile',
          code: 'PROFILE_UPDATE_DENIED'
        });
      }

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updates.password;
      delete updates.email;
      delete updates.role;
      delete updates.isActive;

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
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({
        error: 'Server error while updating user profile',
        code: 'PROFILE_UPDATE_ERROR'
      });
    }
  }
);

// Update user preferences by ID (admin or self)
router.put('/:userId/preferences',
  apiLimiter,
  authenticateToken,
  validateUserId,
  sanitizeInput,
  validateUserPreferences,
  updateLastActivity,
  logActivity('UPDATE_USER_PREFERENCES'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { preferences } = req.body;
      
      // Check if user can update this profile
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({
          error: 'Access denied - you can only update your own preferences',
          code: 'PREFERENCES_UPDATE_DENIED'
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { preferences } },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        message: 'Preferences updated successfully',
        preferences: user.preferences
      });
    } catch (error) {
      console.error('Update user preferences error:', error);
      res.status(500).json({
        error: 'Server error while updating user preferences',
        code: 'PREFERENCES_UPDATE_ERROR'
      });
    }
  }
);

// Delete user account (admin or self)
router.delete('/:userId',
  apiLimiter,
  authenticateToken,
  validateUserId,
  updateLastActivity,
  logActivity('DELETE_USER'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user can delete this account
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({
          error: 'Access denied - you can only delete your own account',
          code: 'ACCOUNT_DELETE_DENIED'
        });
      }

      // Prevent admin from deleting themselves
      if (req.user.role === 'admin' && req.user._id.toString() === userId) {
        return res.status(400).json({
          error: 'Admin cannot delete their own account',
          code: 'ADMIN_SELF_DELETE_ERROR'
        });
      }

      const user = await User.findByIdAndDelete(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        message: 'User account deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        error: 'Server error while deleting user account',
        code: 'ACCOUNT_DELETE_ERROR'
      });
    }
  }
);

// Admin: Get all users with pagination and search
router.get('/',
  apiLimiter,
  authenticateToken,
  authorizeRoles('admin'),
  validatePagination,
  updateLastActivity,
  logActivity('GET_ALL_USERS_ADMIN'),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', role = '', isActive = '' } = req.query;
      
      const query = {};
      
      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Role filter
      if (role) {
        query.role = role;
      }
      
      // Active status filter
      if (isActive !== '') {
        query.isActive = isActive === 'true';
      }

      const users = await User.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      res.json({
        users,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        error: 'Server error while fetching users',
        code: 'USERS_FETCH_ERROR'
      });
    }
  }
);

// Admin: Update user role
router.patch('/:userId/role',
  apiLimiter,
  authenticateToken,
  authorizeRoles('admin'),
  validateUserId,
  sanitizeInput,
  updateLastActivity,
  logActivity('UPDATE_USER_ROLE'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['user', 'admin', 'moderator'].includes(role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be user, admin, or moderator',
          code: 'INVALID_ROLE'
        });
      }

      // Prevent admin from changing their own role
      if (req.user._id.toString() === userId) {
        return res.status(400).json({
          error: 'Admin cannot change their own role',
          code: 'ADMIN_SELF_ROLE_CHANGE_ERROR'
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        message: 'User role updated successfully',
        user
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        error: 'Server error while updating user role',
        code: 'ROLE_UPDATE_ERROR'
      });
    }
  }
);

// Admin: Toggle user active status
router.patch('/:userId/status',
  apiLimiter,
  authenticateToken,
  authorizeRoles('admin'),
  validateUserId,
  updateLastActivity,
  logActivity('TOGGLE_USER_STATUS'),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Prevent admin from deactivating themselves
      if (req.user._id.toString() === userId) {
        return res.status(400).json({
          error: 'Admin cannot deactivate their own account',
          code: 'ADMIN_SELF_DEACTIVATE_ERROR'
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.json({
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        error: 'Server error while toggling user status',
        code: 'STATUS_TOGGLE_ERROR'
      });
    }
  }
);

// Get user statistics (admin only)
router.get('/stats/overview',
  apiLimiter,
  authenticateToken,
  authorizeRoles('admin'),
  updateLastActivity,
  logActivity('GET_USER_STATS'),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
      const adminUsers = await User.countDocuments({ role: 'admin' });
      const moderatorUsers = await User.countDocuments({ role: 'moderator' });
      
      // Users created in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.json({
        stats: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers,
          admins: adminUsers,
          moderators: moderatorUsers,
          recent: recentUsers,
          inactive: totalUsers - activeUsers,
          unverified: totalUsers - verifiedUsers
        },
        percentages: {
          activeRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0,
          verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0,
          recentRate: totalUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        error: 'Server error while fetching user statistics',
        code: 'STATS_FETCH_ERROR'
      });
    }
  }
);

module.exports = router;