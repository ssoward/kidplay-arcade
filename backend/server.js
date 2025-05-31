require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param, query } = require('express-validator');

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
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`CORS: Checking origin: ${origin || 'undefined'}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Get allowed origins from environment or use defaults
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    console.log(`CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
    
    // In development, also allow localhost variations
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('CORS: Allowing localhost in development');
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`CORS: Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS: Rejected origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT; 
const DEMO_MODE = process.env.DEMO_MODE === 'true';

console.log(`🔧 Environment loaded - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔧 ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS || 'NOT SET'}`);
console.log(`🔧 PORT: ${process.env.PORT || 'NOT SET'}`);

if (!AZURE_API_KEY || !AZURE_ENDPOINT) {
  if (DEMO_MODE) {
    console.warn('⚠️  Running in DEMO MODE - Azure credentials not configured');
    console.warn('   AI features will use fallback responses');
  } else {
    console.error('Missing AZURE_API_KEY or AZURE_ENDPOINT in .env');
    process.exit(1);
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

// Input validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

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

  // Default AI chat request
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
        limit: Math.min(parseInt(limit), 50) // Cap at 50 for safety
      },
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'KidPlay-Arcade/1.0'
      }
    });
    
    console.log(`🎵 iTunes API response: ${response.data.results?.length || 0} results`);
    
    // Return the iTunes API response
    res.json(response.data);
    
  } catch (error) {
    console.error('iTunes API error:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'iTunes service temporarily unavailable' });
    } else if (error.code === 'ECONNABORTED') {
      res.status(504).json({ error: 'iTunes search timed out' });
    } else {
      res.status(500).json({ error: 'Failed to search iTunes catalog' });
    }
  }
});

// Serve static files from the React app build folder (after API routes)
app.use(express.static(path.join(__dirname, '../build')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message });
  }
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Export app for testing
module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 KidPlay Arcade backend listening on port ${PORT}`);
    console.log(`📊 Rate limiting: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
    console.log(`🔒 Security headers: Enabled`);
  });
}
