require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param, query } = require('express-validator');

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

module.exports = app;
