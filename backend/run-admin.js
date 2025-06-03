// Startup script for admin endpoints
const app = require('./app');
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 KidPlay Arcade Admin Backend listening on port ${PORT}`);
  console.log(`📊 Analytics API: Enabled`);
  console.log(`🔒 Admin endpoints ready`);
});