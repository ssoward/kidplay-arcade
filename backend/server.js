require('dotenv').config();

// Environment validation function
function validateEnvironment() {
  const required = ['AZURE_API_KEY', 'AZURE_ENDPOINT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
  console.log('🌐 CORS Origins:', process.env.ALLOWED_ORIGINS || 'Using defaults');
  console.log('🤖 Azure Endpoint:', process.env.AZURE_ENDPOINT ? 
    process.env.AZURE_ENDPOINT.substring(0, 50) + '...' : 'Not configured');
}

// Validate environment on startup
validateEnvironment();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param, query } = require('express-validator');
const DatabaseService = require('./services/DatabaseService');

const app = express();

// Trust proxy for proper IP detection - specify trusted proxies for security
// In AWS with nginx reverse proxy, trust the first proxy (nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid breaking the frontend
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: 'Too many AI requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// CORS configuration - allow requests from same server and known origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173', 'https://kidplay-arcade.vercel.app'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (same-origin requests, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In production, allow requests from the same server (for SPA served by nginx)
    if (process.env.NODE_ENV === 'production') {
      // Allow requests from EC2 instance IP addresses or localhost
      if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|[\d.]+)(?::\d+)?$/)) {
        return callback(null, true);
      }
      
      // Allow requests from known allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      console.log('CORS blocked origin:', origin);
      const msg = 'CORS policy restricts access from this origin.';
      return callback(new Error(msg), false);
    }
    
    // In development, allow all origins
    return callback(null, true);
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Display loading info in console
console.log('🔧 Environment loaded - NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS || 'NOT SET');
console.log('🔧 PORT:', process.env.PORT || 'NOT SET');

// Azure AI configuration
const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Check Azure AI credentials
if (!AZURE_API_KEY || !AZURE_ENDPOINT) {
  if (DEMO_MODE) {
    console.warn('⚠️  Running in DEMO MODE - Azure credentials not configured');
    console.warn('   AI features will use fallback responses');
  } else {
    console.log('Missing AZURE_API_KEY or AZURE_ENDPOINT in .env');
  }
} else {
  console.log('✅ Azure OpenAI credentials configured');
}

// Helper function to handle AI calls with demo mode fallbacks
async function callAI(messages, maxTokens = 64, temperature = 0.7, fallbackFn) {
  if (DEMO_MODE || !AZURE_API_KEY || !AZURE_ENDPOINT) {
    console.log('🎮 DEMO MODE: Using fallback response');
    return fallbackFn();
  }
  
  try {
    console.log('AI REQUEST URL:', AZURE_ENDPOINT);
    console.log('AI REQUEST BODY:', JSON.stringify({ messages, max_tokens: maxTokens, temperature, top_p: 0.95, frequency_penalty: 0, presence_penalty: 0 }));
    const response = await axios.post(
      AZURE_ENDPOINT,
      {
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          'api-key': AZURE_API_KEY,
          'Ocp-Apim-Subscription-Key': AZURE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices?.[0]?.message?.content || '';
  } catch (err) {
    // Enhanced error logging for debugging
    if (err.response) {
      console.error('AI ERROR:', err.response.status, err.response.statusText);
      console.error('AI ERROR DATA:', JSON.stringify(err.response.data));
    } else {
      console.error('AI ERROR:', err.message);
    }
    return fallbackFn();
  }
}

// Validation error response handler
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// In-memory storage for user data (will be replaced by database integration)
// This will remain for backwards compatibility with existing frontend
const users = new Map();
const userSessions = new Map();

// Generate user ID
const generateUserId = () => Math.random().toString(36).substr(2, 9);

// Generate session token
const generateUserToken = (user) => {
  const session = {
    userId: user.id,
    email: user.email,
    loginTime: Date.now(),
    sessionId: Math.random().toString(36).substr(2, 9)
  };
  userSessions.set(session.sessionId, session);
  return Buffer.from(JSON.stringify(session)).toString('base64');
};

// Authentication middleware - in-memory sessions
const authenticateUser = (req, res, next) => {
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

    const { userId, sessionId } = session;
    
    if (!userId || !sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Incomplete token data'
      });
    }

    const storedSession = userSessions.get(sessionId);
    if (!storedSession) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Session not found'
      });
    }

    // Check if session is expired (24 hours)
    const now = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    if (now - storedSession.loginTime > sessionDuration) {
      userSessions.delete(sessionId);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Session expired'
      });
    }

    const user = users.get(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not found'
      });
    }

    // Attach user to request
    req.user = user;
    req.userSession = storedSession;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Basic API routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    version: '1.2.0',
    serverTime: new Date().toISOString(),
    features: {
      userAuth: true,
      games: true,
      aiIntegration: !!process.env.AZURE_API_KEY
    }
  });
});

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      cors_origins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      azure_api_configured: !!process.env.AZURE_API_KEY,
      azure_endpoint_configured: !!process.env.AZURE_ENDPOINT
    };

    // Test Azure API connection if configured
    if (process.env.AZURE_API_KEY && process.env.AZURE_ENDPOINT) {
      try {
        const testResponse = await axios.post(process.env.AZURE_ENDPOINT, {
          messages: [{ role: 'user', content: 'health check' }],
          max_tokens: 10
        }, {
          timeout: 5000,
          headers: { 'api-key': process.env.AZURE_API_KEY }
        });
        healthData.azure_api_status = 'connected';
      } catch (azureError) {
        healthData.azure_api_status = 'failed';
        healthData.azure_error = azureError.message;
      }
    } else {
      healthData.azure_api_status = 'not_configured';
    }
    
    res.json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static files from the React app in production
app.use(express.static(path.join(__dirname, '..', 'build')));

// Import and configure database-backed user routes
const configureUserRoutes = require('./user-auth-routes');
const userRoutes = configureUserRoutes(userSessions);
app.use('/api/user', userRoutes);

// Legacy user authentication routes (in-memory version) - keeping for backwards compatibility
app.post('/api/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('displayName').trim().isLength({ min: 2 })
], validateRequest, (req, res) => {
  const { email, password, displayName } = req.body;
  
  if (Array.from(users.values()).some(u => u.email === email)) {
    return res.status(409).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const userId = generateUserId();
  const newUser = {
    id: userId,
    email,
    password, // Note: In a real app, hash the password
    displayName,
    isVerified: true,
    createdAt: new Date(),
    lastActive: new Date(),
    preferences: {
      theme: 'light',
      soundEnabled: true,
      notificationsEnabled: false
    }
  };
  
  users.set(userId, newUser);
  
  const token = generateUserToken(newUser);
  
  // Don't send password in response
  const { password: _, ...userWithoutPassword } = newUser;
  
  res.json({
    success: true,
    message: 'Registration successful',
    token,
    user: userWithoutPassword
  });
});

app.post('/api/login', [
  body('email').isEmail(),
  body('password').exists()
], validateRequest, (req, res) => {
  const { email, password } = req.body;
  
  const user = Array.from(users.values()).find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
  
  const token = generateUserToken(user);
  
  // Update last active
  user.lastActive = new Date();
  
  // Don't send password in response
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: userWithoutPassword
  });
});

app.post('/api/validate-token', authenticateUser, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  
  res.json({
    success: true,
    user: userWithoutPassword
  });
});

app.get('/api/user-profile', authenticateUser, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  
  res.json({
    success: true,
    user: userWithoutPassword
  });
});

// Content routes
app.get('/api/games', (req, res) => {
  // Placeholder for game content API
  res.json({
    success: true,
    games: [
      {
        id: 'math-101',
        title: 'Math 101',
        description: 'Basic arithmetic practice',
        imageUrl: 'https://via.placeholder.com/300x200?text=Math+101',
        minAge: 5,
        maxAge: 8,
        categories: ['math', 'educational'],
        difficultyLevel: 'beginner',
        popularity: 85,
      },
      {
        id: 'spelling-bee',
        title: 'Spelling Bee',
        description: 'Practice spelling words',
        imageUrl: 'https://via.placeholder.com/300x200?text=Spelling+Bee',
        minAge: 6,
        maxAge: 10,
        categories: ['language', 'vocabulary', 'educational'],
        difficultyLevel: 'intermediate',
        popularity: 75,
      },
      {
        id: 'puzzle-quest',
        title: 'Puzzle Quest',
        description: 'Solve puzzles and brain teasers',
        imageUrl: 'https://via.placeholder.com/300x200?text=Puzzle+Quest',
        minAge: 7,
        maxAge: 12,
        categories: ['puzzles', 'logic', 'educational'],
        difficultyLevel: 'intermediate',
        popularity: 90,
      }
    ]
  });
});

// Get Sight Words
app.get('/api/sight-words', (req, res) => {
  res.json({
    categories: [
      {
        id: 'pre-k',
        name: 'Pre-K',
        words: ['a', 'and', 'go', 'I', 'see', 'the', 'to']
      },
      {
        id: 'kindergarten',
        name: 'Kindergarten',
        words: ['all', 'am', 'are', 'at', 'be', 'can', 'come', 'did', 'do', 'for', 'get', 'has', 'he', 'here', 'in', 'is', 'it', 'like', 'me', 'my', 'no', 'on', 'play', 'ran', 'run', 'said', 'saw', 'she', 'so', 'up', 'was', 'we', 'went', 'yes', 'you']
      },
      {
        id: 'first-grade',
        name: 'First Grade',
        words: ['about', 'after', 'again', 'an', 'any', 'as', 'ask', 'by', 'could', 'every', 'fly', 'from', 'give', 'going', 'had', 'have', 'her', 'him', 'his', 'how', 'just', 'know', 'let', 'live', 'may', 'of', 'old', 'once', 'open', 'over', 'put', 'round', 'some', 'stop', 'take', 'thank', 'them', 'then', 'think', 'walk', 'were', 'what', 'when', 'with']
      },
      {
        id: 'second-grade',
        name: 'Second Grade',
        words: ['always', 'around', 'because', 'been', 'before', 'best', 'both', 'buy', 'call', 'cold', 'does', 'don\'t', 'fast', 'first', 'five', 'found', 'gave', 'goes', 'green', 'its', 'jump', 'made', 'many', 'off', 'or', 'pull', 'read', 'right', 'sing', 'sit', 'sleep', 'tell', 'their', 'these', 'those', 'upon', 'us', 'use', 'very', 'wash', 'which', 'why', 'wish', 'work', 'would', 'write', 'your']
      }
    ]
  });
});

app.get('/api/math-facts/:level', [
  param('level').isIn(['addition', 'subtraction', 'multiplication', 'division'])
], validateRequest, (req, res) => {
  const { level } = req.params;
  
  let facts = [];
  
  switch(level) {
    case 'addition':
      for (let i = 0; i <= 10; i++) {
        for (let j = 0; j <= 10; j++) {
          facts.push({
            problem: `${i} + ${j} = ?`,
            answer: i + j
          });
        }
      }
      break;
      
    case 'subtraction':
      for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= i; j++) {
          facts.push({
            problem: `${i} - ${j} = ?`,
            answer: i - j
          });
        }
      }
      break;
      
    case 'multiplication':
      for (let i = 0; i <= 12; i++) {
        for (let j = 0; j <= 12; j++) {
          facts.push({
            problem: `${i} × ${j} = ?`,
            answer: i * j
          });
        }
      }
      break;
      
    case 'division':
      for (let i = 1; i <= 12; i++) {
        for (let j = 1; j <= 12; j++) {
          const product = i * j;
          facts.push({
            problem: `${product} ÷ ${i} = ?`,
            answer: j
          });
        }
      }
      break;
  }
  
  res.json({
    level,
    facts
  });
});

// iTunes API proxy to handle CORS issues on mobile
app.get('/api/itunes-search', [
  query('term').isString().isLength({ min: 1, max: 200 }).withMessage('Search term is required and must be 1-200 characters'),
  query('media').optional().isString().withMessage('Media must be a string'),
  query('entity').optional().isString().withMessage('Entity must be a string'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], validateRequest, async (req, res) => {
  try {
    const { term, media = 'music', entity = 'song', limit = 5 } = req.query;
    
    console.log(`🎵 iTunes search request: ${term}`);
    
    // Make request to iTunes API from backend (no CORS issues)
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term,
        media,
        entity,
        limit
      }
    });
    
    // Send response back to client
    res.json(response.data);
  } catch (error) {
    console.error('iTunes API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from iTunes API' });
  }
});

// Start the server directly when this file is run
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 KidPlay Arcade backend listening on port ${PORT}`);
    console.log(`📊 Rate limiting: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
    console.log(`🔒 Security headers: Enabled`);
  });
}

// Export the app for use in other files
module.exports = app;
