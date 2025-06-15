// User Authentication Routes for KidPlay Arcade
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const DatabaseService = require('./services/DatabaseService');

const router = express.Router();

// Generate user ID
const generateUserId = () => Math.random().toString(36).substr(2, 9);

// Generate JWT-like token (base64 encoded session info)
const generateUserToken = (user, userSessions) => {
  const session = {
    userId: user.id,
    email: user.email,
    loginTime: Date.now(),
    sessionId: Math.random().toString(36).substr(2, 9)
  };
  userSessions.set(session.sessionId, session);
  return Buffer.from(JSON.stringify(session)).toString('base64');
};

// Middleware to authenticate user requests
const authenticateUser = (userSessions) => (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    let session;
    
    try {
      const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
      session = JSON.parse(decodedToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid token format'
      });
    }

    const { userId, sessionId, loginTime } = session;
    
    if (!userId || !sessionId || !loginTime) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Incomplete token data'
      });
    }

    // Check if session exists
    const storedSession = userSessions.get(sessionId);
    if (!storedSession) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Session not found'
      });
    }

    // Check if session is expired (7 days)
    const now = Date.now();
    const sessionDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (now - loginTime > sessionDuration) {
      userSessions.delete(sessionId);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Session expired'
      });
    }

    // Attach user session to request
    req.userSession = storedSession;
    next();
  } catch (error) {
    console.error('User auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Configure the routes
const configureRoutes = (userSessions) => {
  const auth = authenticateUser(userSessions);

  // User Registration
  router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('displayName').trim().isLength({ min: 1, max: 50 }),
    body('accountType').isIn(['child', 'parent', 'educator']),
    body('parentEmail').optional().isEmail().normalizeEmail(),
    body('dateOfBirth').optional().isISO8601()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { email, password, displayName, accountType, parentEmail, dateOfBirth } = req.body;

    try {
      // Check if user already exists
      const existingUser = await DatabaseService.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email address'
        });
      }

      // Validate child account requirements
      if (accountType === 'child' && !parentEmail) {
        return res.status(400).json({
          success: false,
          message: 'Parent email is required for child accounts'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user object for database
      const userData = {
        id: generateUserId(),
        email,
        password_hash: hashedPassword,
        display_name: displayName,
        date_of_birth: dateOfBirth || null,
        avatar: null,
        preferences: JSON.stringify({
          theme: 'light',
          soundEnabled: true,
          difficulty: 'adaptive',
          aiInteraction: true,
          notificationsEnabled: false
        }),
        game_stats: JSON.stringify({
          gamesPlayed: 0,
          totalScore: 0,
          averageScore: 0,
          favoriteGames: [],
          achievements: [],
          streaks: { current: 0, longest: 0 },
          skillLevels: {}
        }),
        privacy_settings: JSON.stringify({
          dataCollection: true,
          analytics: true,
          personalization: true,
          shareProgress: false
        })
      };

      // Add parental controls for child accounts
      if (accountType === 'child') {
        userData.parental_controls = JSON.stringify({
          timeLimit: 60, // 60 minutes per day
          allowedGames: [],
          restrictedContent: [],
          sessionReminders: true,
          reportingEnabled: true,
          parentEmail: parentEmail
        });
      }

      // Create user in database
      const createdUser = await DatabaseService.createUser(userData);

      // Generate token
      const token = generateUserToken({
        id: createdUser.id,
        email: createdUser.email
      }, userSessions);

      // Prepare response user object
      const responseUser = {
        id: createdUser.id,
        email: createdUser.email,
        displayName: createdUser.display_name,
        dateOfBirth: createdUser.date_of_birth,
        accountType,
        parentEmail: accountType === 'child' ? parentEmail : undefined,
        isVerified: false, // Email verification required
        createdAt: new Date(),
        lastActive: new Date(),
        preferences: JSON.parse(createdUser.preferences),
        gameStats: JSON.parse(createdUser.game_stats),
        privacySettings: JSON.parse(createdUser.privacy_settings)
      };

      // Add parental controls to response if child account
      if (accountType === 'child') {
        responseUser.parentalControls = JSON.parse(createdUser.parental_controls);
      }

      res.json({
        success: true,
        message: 'Registration successful',
        token,
        user: responseUser
      });

      // TODO: Send verification email
      console.log(`📧 Would send verification email to ${email}`);
      if (accountType === 'child' && parentEmail) {
        console.log(`📧 Would send parental consent email to ${parentEmail}`);
      }

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  });

  // User Login
  router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    try {
      // Find user in database
      const user = await DatabaseService.getUserByEmail(email);
      if (!user) {
        // Delay response to prevent timing attacks
        return setTimeout(() => {
          res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }, 1000);
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!isMatch) {
        return setTimeout(() => {
          res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }, 1000);
      }

      // Update last login
      await DatabaseService.updateLastLogin(user.id);

      // Generate token
      const token = generateUserToken({
        id: user.id,
        email: user.email
      }, userSessions);

      // Prepare response user object
      const userResponse = {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        dateOfBirth: user.date_of_birth,
        avatar: user.avatar,
        isVerified: false, // TODO: implement email verification
        createdAt: user.created_at,
        lastActive: new Date(),
        preferences: user.preferences,
        gameStats: user.game_stats,
        privacySettings: user.privacy_settings
      };

      // Add parental controls if they exist
      if (user.parental_controls) {
        userResponse.parentalControls = user.parental_controls;
      }

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  });

  // Validate User Token
  router.post('/validate', auth, async (req, res) => {
    try {
      const { userId } = req.userSession;
      
      // Find user by ID in database
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prepare response user object
      const userResponse = {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        dateOfBirth: user.date_of_birth,
        avatar: user.avatar,
        isVerified: false, // TODO: implement email verification
        createdAt: user.created_at,
        lastActive: user.last_login,
        preferences: user.preferences,
        gameStats: user.game_stats,
        privacySettings: user.privacy_settings
      };

      // Add parental controls if they exist
      if (user.parental_controls) {
        userResponse.parentalControls = user.parental_controls;
      }

      res.json({
        success: true,
        user: userResponse
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during validation'
      });
    }
  });

  // Update User Profile
  router.put('/profile', auth, [
    body('displayName').optional().trim().isLength({ min: 1, max: 50 }),
    body('dateOfBirth').optional().isISO8601(),
    body('avatar').optional().isURL()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    try {
      const { userId } = req.userSession;
      const updates = req.body;

      // Get current user
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update allowed fields - map camelCase to snake_case
      const fieldMapping = {
        'displayName': 'display_name',
        'dateOfBirth': 'date_of_birth',
        'avatar': 'avatar'
      };
      const updatedFields = {};
      
      Object.keys(updates).forEach(field => {
        if (fieldMapping[field] && updates[field] !== undefined) {
          if (field === 'dateOfBirth' && updates[field]) {
            updatedFields[fieldMapping[field]] = new Date(updates[field]).toISOString();
          } else {
            updatedFields[fieldMapping[field]] = updates[field];
          }
        }
      });

      // Update user in database
      const updatedUser = await DatabaseService.updateUser(userId, updatedFields);

      // Remove sensitive data
      const { hashedPassword, ...userResponse } = updatedUser;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  });

  // Get User Profile
  router.get('/profile', auth, async (req, res) => {
    try {
      const { userId } = req.userSession;
      
      // Find user by ID in database
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prepare response user object
      const userResponse = {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        dateOfBirth: user.date_of_birth,
        avatar: user.avatar,
        isVerified: false, // TODO: implement email verification
        createdAt: user.created_at,
        lastActive: user.last_login,
        preferences: user.preferences,
        gameStats: user.game_stats,
        privacySettings: user.privacy_settings
      };

      // Add parental controls if they exist
      if (user.parental_controls) {
        userResponse.parentalControls = user.parental_controls;
      }

      res.json({
        success: true,
        user: userResponse
      });
    } catch (error) {
      console.error('Error retrieving user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // Update User Preferences
  router.put('/preferences', auth, [
    body('theme').optional().isIn(['light', 'dark', 'auto']),
    body('soundEnabled').optional().isBoolean(),
    body('difficulty').optional().isIn(['adaptive', 'easy', 'medium', 'hard']),
    body('aiInteraction').optional().isBoolean(),
    body('notificationsEnabled').optional().isBoolean()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    try {
      const { userId } = req.userSession;
      const newPreferences = req.body;

      // Find user
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Merge with existing preferences
      const updatedPreferences = { ...user.preferences, ...newPreferences };
      
      // Update preferences in database
      await DatabaseService.updateUser(userId, { preferences: updatedPreferences });

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: updatedPreferences
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences'
      });
    }
  });

  // Forgot Password
  router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    try {
      const { email } = req.body;
      
      // Check if user exists (don't reveal this information for security)
      const user = await DatabaseService.getUserByEmail(email);
      
      // Always respond with success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });

      if (user) {
        // Generate a unique token
        const token = crypto.randomBytes(32).toString('hex');
        const id = `rst_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        
        // Token expires after 1 hour
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        // For now, just log it since we don't have a password reset endpoint yet
        console.log(`📧 Would send password reset email to ${email} with token: ${token}`);
        console.log(`📧 Reset link would expire at: ${expiresAt.toISOString()}`);
      }
    } catch (error) {
      console.error('Error processing forgot password:', error);
      // Still return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }
  });

  // User Logout
  router.post('/logout', auth, (req, res) => {
    const { sessionId } = req.userSession;
    
    // Remove session
    userSessions.delete(sessionId);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  return router;
};

module.exports = configureRoutes;
