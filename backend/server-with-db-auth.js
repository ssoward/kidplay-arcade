// Updated server.js implementation
// This file adds the user routes using the new database-backed implementation

// Import Express and the existing server app
const app = require('./server');

// Import and configure user routes
const configureUserRoutes = require('./user-auth-routes');

// Initialize session storage 
// Sessions are still in-memory but user data is in the database
const userSessions = new Map();

// Configure user routes with database integration
const userRoutes = configureUserRoutes(userSessions);

// Mount user routes on the app
app.use('/api/user', userRoutes);

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 KidPlay Arcade backend listening on port ${PORT}`);
    console.log(`📊 Rate limiting: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
    console.log(`🔒 Security headers: Enabled`);
    console.log(`🔐 User authentication: Using SQLite database`);
  });
}

module.exports = app;
