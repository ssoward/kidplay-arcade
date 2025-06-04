// Update User Preferences
app.put('/api/user/preferences', authenticateUser, [
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

// Forgot Password - Update to use DatabaseService
app.post('/api/user/forgot-password', [
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
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const id = `rst_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      
      // Token expires after 1 hour
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Store token in database (if we had a reset_tokens table)
      // For now, let's just log it
      console.log(`📧 Would send password reset email to ${email} with token: ${token}`);
      console.log(`📧 Reset link would expire at: ${expiresAt.toISOString()}`);
      
      // TODO: In a production environment, we would:
      // 1. Create a reset_tokens table in the database
      // 2. Store the token with the user ID and expiration time
      // 3. Send an email with a link to reset the password
      
      // Example code for a future DatabaseService method:
      // await DatabaseService.createPasswordResetToken({
      //   id,
      //   user_id: user.id,
      //   token,
      //   expires_at: expiresAt.toISOString()
      // });
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

// Get User Profile - Update to use DatabaseService
app.get('/api/user/profile', authenticateUser, async (req, res) => {
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

    // Remove sensitive data
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
