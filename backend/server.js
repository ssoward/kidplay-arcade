// All existing content
require('dotenv').config();
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

// CORS configuration - restrict to known origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173', 'https://kidplay-arcade.vercel.app'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production' && allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy restricts access from this origin.';
      return callback(new Error(msg), false);
    }
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
    console.error('AI ERROR:', err.response?.status || 'Network error');
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
      aiIntegration: !!process.env.AZURE_OPENAI_KEY
    }
  });
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

// Game sessions storage (in-memory for analytics)
let gameSessions = [];

// Analytics endpoint to record game session data
app.post('/api/admin/record-session', [
  body('gameType').isString().notEmpty(),
  body('score').optional().isNumeric(),
  body('duration').optional().isNumeric(),
  body('completed').optional().isBoolean(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const sessionData = {
    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    gameType: req.body.gameType,
    score: req.body.score || 0,
    duration: req.body.duration || 0,
    completed: req.body.completed || false,
    timestamp: new Date().toISOString(),
    metadata: req.body.metadata || {}
  };

  gameSessions.push(sessionData);
  
  // Keep only last 1000 sessions to prevent memory issues
  if (gameSessions.length > 1000) {
    gameSessions = gameSessions.slice(-1000);
  }

  console.log(`📊 Analytics: Recorded ${sessionData.gameType} session (ID: ${sessionData.id})`);
  res.json({ success: true, sessionId: sessionData.id });
});

// Validation rules for AI endpoint
const aiValidationRules = [
  body('history').optional().isArray().withMessage('History must be an array'),
  body('board').optional().custom((value) => {
    if (Array.isArray(value) || typeof value === 'string') return true;
    throw new Error('Board must be an array or string');
  }),
  body('possibleMoves').optional().isArray().withMessage('Possible moves must be an array'),
  body('systemPrompt').optional().isString().isLength({ max: 5000 }).withMessage('System prompt must be a string with max 5000 characters'),
  body('game').optional().isString().isIn(['dots-and-boxes', 'word-guess-generator', 'trivia-generator']).withMessage('Invalid game type'),
  body('difficulty').optional().isString().isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
  body('player').optional().isInt({ min: 0, max: 10 }).withMessage('Player must be an integer between 0 and 10'),
  body('state').optional().isObject().withMessage('State must be an object'),
  body('userMessage').optional().isString().isLength({ max: 1000 }).withMessage('User message must be a string with max 1000 characters'),
];

app.post('/api/ask-ai', aiLimiter, aiValidationRules, validateRequest, async (req, res) => {
  // Support both flat and nested (checkers) formats for Checkers
  let { history, board, possibleMoves, checkers, systemPrompt, chess } = req.body;

  // If nested under checkers, extract board, possibleMoves, and systemPrompt
  if (!board && checkers && Array.isArray(checkers.board) && Array.isArray(checkers.possibleMoves)) {
    board = checkers.board;
    possibleMoves = checkers.possibleMoves;
    if (!systemPrompt && checkers.systemPrompt){
        systemPrompt = checkers.systemPrompt;
    } 
  }

  // If nested under chess, extract board, possibleMoves, and systemPrompt
  if (!board && chess && chess.board && Array.isArray(chess.possibleMoves)) {
    board = chess.board;
    possibleMoves = chess.possibleMoves;
    if (!systemPrompt && chess.systemPrompt) systemPrompt = chess.systemPrompt;
  }

  // Checkers AI request
  if (Array.isArray(board) && Array.isArray(possibleMoves)) {
    console.log('--- CHECKERS AI REQUEST ---');
    console.log('Board size:', board.length);
    console.log('Number of possible moves:', possibleMoves.length);
    try {
      // Use systemPrompt from request, or fallback to default
      const systemPromptObj = systemPrompt ? { role: 'system', content: systemPrompt } : undefined;
      const userPrompt = {
        role: 'user',
        content: `Board: ${JSON.stringify(board)}\nPossible Moves: ${JSON.stringify(possibleMoves)}`
      };
      const messages = systemPromptObj ? [systemPromptObj, userPrompt] : [userPrompt];
      const response = await axios.post(
        AZURE_ENDPOINT,
        {
          messages,
          max_tokens: 32,
          temperature: 0.2,
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
      let aiMove = response.data.choices?.[0]?.message?.content || '';
      console.log('AI move received');
      // Remove Markdown code block formatting if present
      aiMove = aiMove.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '').replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/, '$1').trim();
      // Try to parse the move as JSON
      try {
        aiMove = JSON.parse(aiMove);
      } catch (e) {
        // fallback: pick a random move
        aiMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        console.log('AI response not valid JSON, using random move');
      }
      return res.json({ move: aiMove });
    } catch (err) {
      console.error('Checkers AI ERROR:', err.response?.data || err.message);
      // fallback: pick a random move
      const fallbackMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      return res.json({ move: fallbackMove, error: 'AI call failed, used random move.' });
    }
  }

  // Chess AI request (board is FEN string, possibleMoves is array)
  if (typeof board === 'string' && Array.isArray(possibleMoves)) {
    console.log('--- CHESS AI REQUEST ---');
    console.log('Number of possible moves:', possibleMoves.length);
    try {
      const systemPromptObj = systemPrompt ? { role: 'system', content: systemPrompt } : undefined;
      const userPrompt = {
        role: 'user',
        content: `FEN: ${board}\nPossible Moves: ${JSON.stringify(possibleMoves)}`
      };
      const messages = systemPromptObj ? [systemPromptObj, userPrompt] : [userPrompt];
      const response = await axios.post(
        AZURE_ENDPOINT,
        {
          messages,
          max_tokens: 16,
          temperature: 0.2,
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
      let aiMove = response.data.choices?.[0]?.message?.content || '';
      console.log('AI move received');
      aiMove = aiMove.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '').replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/, '$1').trim();
      // Only return a move that is in possibleMoves
      if (!possibleMoves.includes(aiMove)) {
        aiMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        console.log('AI response not valid move, using random move');
      }
      return res.json({ move: aiMove });
    } catch (err) {
      console.error('Chess AI ERROR:', err.response?.data || err.message);
      const fallbackMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      return res.json({ move: fallbackMove, error: 'AI call failed, used random move.' });
    }
  }

  // Dots and Boxes AI request
  if (req.body.game === 'dots-and-boxes' && req.body.state && typeof req.body.player === 'number') {
    const { state, player, systemPrompt } = req.body;
    // Validate state structure
    if (!state.hLines || !state.vLines || !state.boxes) {
      return res.status(400).json({ error: 'Invalid state: hLines, vLines, and boxes are required.' });
    }
    console.log('--- DOTS AND BOXES AI REQUEST ---');
    try {
      const systemPromptObj = systemPrompt ? { role: 'system', content: systemPrompt } : undefined;
      const userPrompt = {
        role: 'user',
        content: `State: ${JSON.stringify(state)}\nPlayer: ${player}`
      };
      const messages = systemPromptObj ? [systemPromptObj, userPrompt] : [userPrompt];
      console.log('System Prompt configured:', !!systemPromptObj);
      console.log('User request processed');

      const response = await axios.post(
        AZURE_ENDPOINT,
        {
          messages,
          max_tokens: 32,
          temperature: 0.2,
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
      let aiMove = response.data.choices?.[0]?.message?.content || '';
      aiMove = aiMove.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '').replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/, '$1').trim();
      try {
        aiMove = JSON.parse(aiMove);
      } catch (e) {
        // fallback: pick first available move
        // Find first available hLine
        for (let r = 0; r < state.hLines.length; r++) for (let c = 0; c < state.hLines[0].length; c++) if (!state.hLines[r][c]) return res.json({ move: { row: r, col: c, orientation: 'h' }, error: 'AI response not valid JSON, used fallback.' });
        for (let r = 0; r < state.vLines.length; r++) for (let c = 0; c < state.vLines[0].length; c++) if (!state.vLines[r][c]) return res.json({ move: { row: r, col: c, orientation: 'v' }, error: 'AI response not valid JSON, used fallback.' });
        return res.status(400).json({ error: 'No available moves.' });
      }
      console.log('AI move generated successfully'); // Log the parsed AI move
      return res.json({ move: aiMove });
    } catch (err) {
      console.error('Dots and Boxes AI ERROR:', err.response?.data || err.message);
      // fallback: pick first available move
      const state = req.body.state;
      for (let r = 0; r < state.hLines.length; r++) for (let c = 0; c < state.hLines[0].length; c++) if (!state.hLines[r][c]) return res.json({ move: { row: r, col: c, orientation: 'h' }, error: 'AI call failed, used fallback.' });
      for (let r = 0; r < state.vLines.length; r++) for (let c = 0; c < state.vLines[0].length; c++) if (!state.vLines[r][c]) return res.json({ move: { row: r, col: c, orientation: 'v' }, error: 'AI call failed, used fallback.' });
      return res.status(400).json({ error: 'No available moves.' });
    }
  }

  // Word Guess Word Generator AI request
  if (req.body.game === 'word-guess-generator' && req.body.difficulty && req.body.systemPrompt) {
    console.log('--- WORD GUESS GENERATOR AI REQUEST ---');
    const { difficulty, systemPrompt, userMessage } = req.body;
    console.log('Difficulty:', difficulty);
    console.log('Request processed');
    
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage || `Generate a ${difficulty} difficulty word.` }
      ];
      
      const response = await axios.post(
        AZURE_ENDPOINT,
        {
          messages,
          max_tokens: 16,
          temperature: 0.7,
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
      
      let word = response.data.choices?.[0]?.message?.content || '';
      word = word.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '').replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/, '$1').trim();
      
      // Simple validation: should be a single word
      if (!word || word.includes(' ') || word.length < 3) {
        const fallbackWords = {
          easy: ['cat', 'dog', 'sun', 'car', 'book'],
          medium: ['garden', 'planet', 'kitchen', 'friend', 'school'],
          hard: ['elephant', 'computer', 'adventure', 'butterfly', 'mysterious']
        };
        word = fallbackWords[difficulty][Math.floor(Math.random() * fallbackWords[difficulty].length)];
      }
      
      return res.json({ word: word.toLowerCase() });
    } catch (err) {
      console.error('Word Generator AI ERROR:', err.response?.data || err.message);
      const fallbackWords = {
        easy: ['cat', 'dog', 'sun', 'car', 'book'],
        medium: ['garden', 'planet', 'kitchen', 'friend', 'school'],
        hard: ['elephant', 'computer', 'adventure', 'butterfly', 'mysterious']
      };
      const word = fallbackWords[difficulty][Math.floor(Math.random() * fallbackWords[difficulty].length)];
      return res.json({ word, error: 'AI call failed, used fallback word.' });
    }
  }

  // Trivia Generator AI request
  if (req.body.game === 'trivia-generator' && req.body.difficulty && req.body.systemPrompt) {
    console.log('--- TRIVIA GENERATOR AI REQUEST ---');
    const { difficulty, systemPrompt, userMessage } = req.body;
    
    const fallbackQuestions = () => [
      {
        question: "What color do you get when you mix red and blue?",
        options: ["Green", "Purple", "Orange", "Yellow"],
        correct: 1
      },
      {
        question: "How many legs does a spider have?",
        options: ["6", "8", "10", "12"],
        correct: 1
      },
      {
        question: "What is the largest planet in our solar system?",
        options: ["Earth", "Mars", "Jupiter", "Saturn"],
        correct: 2
      },
      {
        question: "Which animal is known as the 'King of the Jungle'?",
        options: ["Tiger", "Lion", "Elephant", "Bear"],
        correct: 1
      },
      {
        question: "What do bees make?",
        options: ["Milk", "Honey", "Butter", "Cheese"],
        correct: 1
      }
    ];
    
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage || `Generate 5 ${difficulty} difficulty trivia questions.` }
      ];
      
      const response = await callAI(messages, 512, 0.7, fallbackQuestions);
      
      let questions;
      if (typeof response === 'string') {
        try {
          // Clean up the response - remove any markdown formatting
          let cleanResponse = response.trim();
          cleanResponse = cleanResponse.replace(/^```[a-zA-Z]*\n?|```$/g, '');
          cleanResponse = cleanResponse.replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/, '$1');
          
          questions = JSON.parse(cleanResponse);
          
          // Validate the structure
          if (!Array.isArray(questions) || questions.length !== 5) {
            throw new Error('Invalid questions array');
          }
          
          questions.forEach((q, index) => {
            if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
                typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
              throw new Error(`Invalid question structure at index ${index}`);
            }
          });
          
        } catch (parseError) {
          console.log('Failed to parse AI trivia response, using fallback questions');
          questions = fallbackQuestions();
        }
      } else {
        questions = response;
      }
      
      console.log('Trivia questions generated successfully');
      return res.json({ questions });
      
    } catch (err) {
      console.error('Trivia Generator AI ERROR:', err.response?.data || err.message);
      return res.json({ questions: fallbackQuestions(), error: 'AI call failed, used fallback questions.' });
    }
  }

  // Chat-based AI request (default)
  if (Array.isArray(history)) {
    console.log('--- AI CHAT REQUEST ---');
    console.log('Number of messages in history:', history.length);
    try {
      const response = await axios.post(
        AZURE_ENDPOINT,
        {
          messages: history,
          max_tokens: 300,
          temperature: 0.7,
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
      const aiMessage = response.data.choices?.[0]?.message?.content || '';
      console.log('AI response received');
      res.json({ message: aiMessage });
    } catch (err) {
      console.error('AI ERROR:', err.response?.data || err.message);
      res.status(500).json({ error: 'AI call failed' });
    }
    return;
  }

  // Enhanced error logging for debugging
  console.error('Invalid /api/ask-ai request body - missing required fields');
  return res.status(400).json({
    error: 'Missing or invalid request body. Must include either {history: array} or {board: array, possibleMoves: array} (flat or under checkers).',
    received: Object.keys(req.body)
  });
});

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
