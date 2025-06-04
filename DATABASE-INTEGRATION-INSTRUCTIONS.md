## Authentication Database Integration Update

### Overview
This document provides instructions for implementing the changes to complete the transition from in-memory user storage to SQLite database storage for KidPlay Arcade. We've created updated code for the endpoints that still need to be migrated.

### Completed Changes
1. We've migrated most user authentication endpoints to use DatabaseService:
   - User registration (`/api/user/register`)
   - User login (`/api/user/login`)
   - Token validation (`/api/user/validate`)
   - Profile updates (`/api/user/profile` - PUT method)

### Pending Changes
The following endpoints still need to be updated:
1. User preferences (`/api/user/preferences`)
2. Forgot password functionality (`/api/user/forgot-password`)
3. Get user profile (`/api/user/profile` - GET method)

### Implementation Instructions

#### 1. Update the User Preferences Endpoint
Replace the current implementation with:

```javascript
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
```

#### 2. Update the Forgot Password Endpoint
Replace the current implementation with:

```javascript
// Forgot Password (placeholder - would integrate with email service)
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
```

#### 3. Update the Get User Profile Endpoint
Replace the current implementation with:

```javascript
// Get User Profile
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
```

### Deployment
The deployment script (`deploy-to-aws.sh`) is already configured with the correct IP address (`3.81.165.163`), so no changes are needed there.

### Testing
After applying these changes, thoroughly test the application with the following steps:

1. Register a new user account and log in
2. Update user preferences and verify they persist after logout and login
3. Test the forgot password functionality (check console logs)
4. Verify that user profile information is correctly retrieved from the database
5. Confirm that all endpoints that were previously using in-memory storage now use the database

### Notes
- The database schema is already set up correctly with the required tables
- Sessions are still maintained in memory for simplicity, but could be migrated to the database in a future update
- If any additional endpoints are added in the future that require user data, make sure they also use DatabaseService instead of in-memory storage
