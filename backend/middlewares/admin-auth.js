// Admin authentication middleware
const adminAuth = (req, res, next) => {
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
      // Decode the Base64-encoded token
      const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
      session = JSON.parse(decodedToken);
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Invalid token format' 
      });
    }

    // Verify session details
    const { email, loginTime, sessionId } = session;
    
    // Validate required fields
    if (!email || !loginTime || !sessionId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Incomplete token data' 
      });
    }

    // Check if email matches admin
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden - Invalid admin credentials' 
      });
    }

    // Check if session is expired (24 hours)
    const now = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    if (now - loginTime > sessionDuration) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Session expired' 
      });
    }

    // Session is valid, attach admin info to req object
    req.adminSession = session;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during authentication' 
    });
  }
};

module.exports = adminAuth;
