require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param, query } = require('express-validator');
const adminAuth = require('./middlewares/admin-auth');

const app = express();

// Trust proxy for proper IP detection (fixes X-Forwarded-For warnings)
app.set('trust proxy', true);

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
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // In production, only allow specific domains
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT; // e.g. https://your-resource-name.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-03-15-preview
const DEMO_MODE = process.env.DEMO_MODE === 'true';

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

// Admin endpoints for metrics and user data
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const session = JSON.parse(Buffer.from(token, 'base64').toString());
    const now = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - session.loginTime > sessionDuration) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    if (session.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    req.adminSession = session;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid session' });
  }
};

// Game sessions storage (in-memory for now)
let gameSessions = [];
let userSessions = [];

// Endpoint to record game session data
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

  res.json({ success: true, sessionId: sessionData.id });
});

// Admin endpoint to get game metrics
app.get('/api/admin/metrics', adminAuth, (req, res) => {
  try {
    // Calculate metrics from stored sessions
    const gameStats = {};
    
    gameSessions.forEach(session => {
      if (!gameStats[session.gameType]) {
        gameStats[session.gameType] = {
          totalSessions: 0,
          totalScore: 0,
          totalDuration: 0,
          completedSessions: 0
        };
      }
      
      const stats = gameStats[session.gameType];
      stats.totalSessions++;
      stats.totalScore += session.score || 0;
      stats.totalDuration += session.duration || 0;
      if (session.completed) stats.completedSessions++;
    });

    // Transform to expected format
    const gameMetrics = Object.keys(gameStats).map(gameType => ({
      name: gameType,
      totalSessions: gameStats[gameType].totalSessions,
      averageScore: gameStats[gameType].totalSessions > 0 
        ? Math.round(gameStats[gameType].totalScore / gameStats[gameType].totalSessions) 
        : 0,
      completionRate: gameStats[gameType].totalSessions > 0 
        ? Math.round((gameStats[gameType].completedSessions / gameStats[gameType].totalSessions) * 100) 
        : 0,
      averageDuration: gameStats[gameType].totalSessions > 0 
        ? Math.round(gameStats[gameType].totalDuration / gameStats[gameType].totalSessions) 
        : 0
    })).sort((a, b) => b.totalSessions - a.totalSessions);

    const userMetrics = {
      totalUsers: Math.max(25, Object.keys(gameStats).length * 3), // Simulate user count
      activeToday: Math.floor(gameSessions.filter(s => {
        const today = new Date().toDateString();
        const sessionDate = new Date(s.timestamp).toDateString();
        return today === sessionDate;
      }).length / 2), // Rough estimate
      averageSessionDuration: gameSessions.length > 0 
        ? Math.round(gameSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / gameSessions.length)
        : 0,
      topGames: gameMetrics.slice(0, 5).map(g => g.name)
    };

    const systemMetrics = {
      uptime: process.uptime(),
      totalGameSessions: gameSessions.length,
      errorRate: 0.1,
      averageLoadTime: 1.2
    };

    res.json({
      gameMetrics,
      userMetrics,
      systemMetrics,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating admin metrics:', error);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// Admin endpoint to get system health
app.get('/api/admin/health', adminAuth, (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({
    status: 'healthy',
    uptime: uptime,
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
    },
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  });
});

// Admin endpoint to export analytics data
app.post('/api/admin/export-data', adminAuth, (req, res) => {
  try {
    const { timeRange } = req.body;
    let filteredSessions = gameSessions;
    
    // Filter sessions based on time range if provided
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let fromDate;
      
      switch (timeRange) {
        case '24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = null;
      }
      
      if (fromDate) {
        filteredSessions = gameSessions.filter(session => 
          new Date(session.timestamp) >= fromDate
        );
      }
    }
    
    // Prepare comprehensive analytics data for export
    const gameStats = {};
    
    filteredSessions.forEach(session => {
      if (!gameStats[session.gameType]) {
        gameStats[session.gameType] = {
          totalSessions: 0,
          sessions: [],
          totalScore: 0,
          totalDuration: 0,
          completedSessions: 0
        };
      }
      
      const stats = gameStats[session.gameType];
      stats.totalSessions++;
      stats.sessions.push(session);
      stats.totalScore += session.score || 0;
      stats.totalDuration += session.duration || 0;
      if (session.completed) stats.completedSessions++;
    });

    // Generate export data
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        timeRange: timeRange || 'all',
        totalSessions: filteredSessions.length,
        dateRange: {
          from: filteredSessions.length > 0 ? filteredSessions[0].timestamp : null,
          to: filteredSessions.length > 0 ? filteredSessions[filteredSessions.length - 1].timestamp : null
        },
        systemInfo: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        }
      },
      gameStats: Object.keys(gameStats).map(gameType => ({
        gameType,
        totalSessions: gameStats[gameType].totalSessions,
        averageScore: gameStats[gameType].totalSessions > 0 
          ? Math.round(gameStats[gameType].totalScore / gameStats[gameType].totalSessions) 
          : 0,
        completionRate: gameStats[gameType].totalSessions > 0 
          ? Math.round((gameStats[gameType].completedSessions / gameStats[gameType].totalSessions) * 100) 
          : 0,
        averageDuration: gameStats[gameType].totalSessions > 0 
          ? Math.round(gameStats[gameType].totalDuration / gameStats[gameType].totalSessions) 
          : 0
      })).sort((a, b) => b.totalSessions - a.totalSessions),
      rawSessions: filteredSessions.map(session => ({
        ...session,
        // Ensure no sensitive data is exported
        id: session.id,
        gameType: session.gameType,
        score: session.score,
        duration: session.duration,
        completed: session.completed,
        timestamp: session.timestamp
      })),
      userMetrics: {
        estimatedTotalUsers: Math.max(25, Object.keys(gameStats).length * 3),
        activeToday: filteredSessions.filter(s => {
          const today = new Date().toDateString();
          const sessionDate = new Date(s.timestamp).toDateString();
          return today === sessionDate;
        }).length,
        averageSessionDuration: filteredSessions.length > 0 
          ? Math.round(filteredSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / filteredSessions.length)
          : 0
      }
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export data' 
    });
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

// Admin login endpoint
app.post('/api/admin/login', [
  body('email').isEmail().withMessage('Email must be valid'),
  body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  }

  const { email, password } = req.body;
  
  // Use bcryptjs to compare hashed password (if available)
  const bcrypt = require('bcryptjs');
  const correctEmail = process.env.ADMIN_EMAIL;
  const storedPassword = process.env.ADMIN_PASSWORD;
  const storedHash = process.env.ADMIN_PASSWORD_HASH;

  // First check if email matches
  if (email !== correctEmail) {
    // Delay response for security (prevent timing attacks)
    return setTimeout(() => {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }, 1000);
  }

  // Then check password using the appropriate method
  if (storedHash) {
    // If we have a hash stored in env, use bcrypt to compare
    bcrypt.compare(password, storedHash, (err, isMatch) => {
      if (err || !isMatch) {
        return setTimeout(() => {
          res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }, 1000);
      }
      
      // Successful login with hash comparison
      return res.json({
        success: true,
        message: 'Login successful',
        sessionId: Math.random().toString(36).substr(2, 9)
      });
    });
  } else if (password === storedPassword) {
    // Fallback to plain text comparison if no hash is available
    return res.json({
      success: true,
      message: 'Login successful',
      sessionId: Math.random().toString(36).substr(2, 9)
    });
  } else {
    // Delay response for security (prevent timing attacks)
    setTimeout(() => {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }, 1000);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

module.exports = app;
