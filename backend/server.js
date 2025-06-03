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
  body('category').optional().isString().withMessage('Category must be a string'),
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

  // Trivia Generator AI request
  if (req.body.game === 'trivia-generator') {
    console.log('--- TRIVIA GENERATOR AI REQUEST ---');
    const { difficulty = 'medium', category = 'general' } = req.body;
    
    const fallbackQuestions = () => {
      if (category === 'medical-assistant') {
        // Priority Medical Assistant questions (the new 26 questions)
        const priorityMAQuestions = [
          {
            question: "What type of tissue is adipose tissue?",
            options: ["Epithelial", "Connective", "Muscle", "Nervous"],
            correct: 1
          },
          {
            question: "What is another term for club foot?",
            options: ["Talipes equinovarus", "Scoliosis", "Kyphosis", "Lordosis"],
            correct: 0
          },
          {
            question: "Which organelle within a cell provides spindle fibers attached to chromosomes during cell division?",
            options: ["Mitochondria", "Centriole", "Golgi apparatus", "Endoplasmic reticulum"],
            correct: 1
          },
          {
            question: "Which test is used to evaluate balance?",
            options: ["Romberg test", "Weber test", "Rinne test", "Snellen test"],
            correct: 0
          },
          {
            question: "What is the fungal infection affecting the mucous membranes, often in the mouth or throat?",
            options: ["Tinea pedis", "Candidiasis", "Ringworm", "Impetigo"],
            correct: 1
          },
          {
            question: "Which tissue specializes in secretion for the body?",
            options: ["Connective tissue", "Epithelial tissue", "Muscle tissue", "Nervous tissue"],
            correct: 1
          },
          {
            question: "Which of the following is NOT a form of meningitis?",
            options: ["Bacterial meningitis", "Viral meningitis", "Fungal meningitis", "Parasitic encephalitis"],
            correct: 3
          },
          {
            question: "Which organ found in the nose is responsible for smell?",
            options: ["Olfactory epithelium", "Nasal conchae", "Septum", "Turbinates"],
            correct: 0
          },
          {
            question: "Which is NOT a common cause of furuncles?",
            options: ["Staphylococcus aureus", "Poor hygiene", "Candida albicans", "Friction or pressure"],
            correct: 2
          },
          {
            question: "Which statement is true about asymmetrical melanoma?",
            options: ["It is always benign", "It has uneven borders and shape", "It is smaller than 6 mm", "It is never itchy or painful"],
            correct: 1
          },
          {
            question: "A scrape and burn are what type of skin laceration?",
            options: ["Abrasion", "Incision", "Puncture", "Avulsion"],
            correct: 0
          },
          {
            question: "What are the three different types of parasitic lice?",
            options: ["Head lice, body lice, pubic lice", "Head lice, scabies, fleas", "Body lice, ticks, mites", "Pubic lice, bedbugs, chiggers"],
            correct: 0
          },
          {
            question: "Immovable joints are called?",
            options: ["Synarthroses", "Diarthroses", "Amphiarthroses", "Synovial joints"],
            correct: 0
          },
          {
            question: "What is the tough membrane covering the bone called?",
            options: ["Periosteum", "Endosteum", "Perichondrium", "Meniscus"],
            correct: 0
          },
          {
            question: "What is the triangular muscle that protects the shoulder?",
            options: ["Trapezius", "Deltoid", "Pectoralis major", "Latissimus dorsi"],
            correct: 1
          },
          {
            question: "Which disease is diagnosed when pain is present in 11 out of 18 points for at least 3 months?",
            options: ["Rheumatoid arthritis", "Fibromyalgia", "Osteoarthritis", "Lupus"],
            correct: 1
          },
          {
            question: "What is the first symptom of chronic laryngitis?",
            options: ["Hoarseness", "Fever", "Chest pain", "Nasal congestion"],
            correct: 0
          },
          {
            question: "Blood flows from the left ventricle to which structure?",
            options: ["Aorta", "Pulmonary artery", "Right atrium", "Left atrium"],
            correct: 0
          },
          {
            question: "A tear in the lining of the anus is called what?",
            options: ["Anal fissure", "Hemorrhoid", "Fistula", "Diverticulitis"],
            correct: 0
          },
          {
            question: "True or False: Vitamin D is used to absorb calcium.",
            options: ["True", "False"],
            correct: 0
          },
          {
            question: "Which enzyme is contained in saliva?",
            options: ["Amylase", "Lipase", "Pepsin", "Trypsin"],
            correct: 0
          },
          {
            question: "In irritable bowel syndrome (IBS), stool typically appears as what?",
            options: ["Loose or watery", "Hard and pellet-like", "Bloody", "Both loose/watery and hard/pellet-like"],
            correct: 3
          },
          {
            question: "Which structures have walls that are one cell thick?",
            options: ["Capillaries", "Arteries", "Veins", "Arterioles"],
            correct: 0
          },
          {
            question: "What is a capillary bed?",
            options: ["A network of capillaries where blood exchanges substances with tissues", "A group of veins returning blood to the heart", "A layer of connective tissue in the skin", "A muscle layer in the arteries"],
            correct: 0
          },
          {
            question: "What is the pathway for both food and air in the body?",
            options: ["Pharynx", "Trachea", "Esophagus", "Larynx"],
            correct: 0
          },
          {
            question: "What is another term for duck waddle gait?",
            options: ["Waddling gait", "Ataxic gait", "Spastic gait", "Steppage gait"],
            correct: 0
          }
        ];
        
        // Return a random selection from the priority questions first
        const shuffled = [...priorityMAQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5);
      }
      
      return [
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
    };
    
    try {
      let systemPrompt;
      
      if (category === 'medical-assistant') {
        systemPrompt = `You are a Medical Assistant (MA) trivia question generator for healthcare students and professionals. Generate exactly 5 multiple choice questions focused on anatomy and physiology at "${difficulty}" difficulty level. Each question should have exactly 4 options and specify which option is correct (0-3 index).

Focus on topics relevant to Medical Assistants, including:
- Human anatomy (body systems, organs, bones, muscles)
- Physiology (how body systems function)
- Basic medical terminology
- Vital signs and measurements
- Medical procedures and patient care basics
- Disease processes and symptoms
- Medical ethics and patient safety

Return your response as a JSON array in this exact format:
[
  {
    "question": "Your medical question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1
  }
]

Guidelines:
- Questions should be appropriate for Medical Assistant certification level
- ${difficulty === 'easy' ? 'Use basic anatomy and physiology concepts that entry-level MAs should know' : ''}
- ${difficulty === 'medium' ? 'Use moderately challenging concepts that require solid MA knowledge' : ''}
- ${difficulty === 'hard' ? 'Use advanced concepts that challenge experienced MAs and healthcare professionals' : ''}
- Include proper medical terminology
- Make sure all medical information is factually accurate
- Focus on practical knowledge that MAs use in clinical settings`;
      } else {
        systemPrompt = `You are a trivia question generator for a family-friendly quiz game. Generate exactly 5 multiple choice questions for the "${category}" category at "${difficulty}" difficulty level. Each question should have exactly 4 options and specify which option is correct (0-3 index).

Return your response as a JSON array in this exact format:
[
  {
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1
  }
]

Guidelines:
- Questions should be appropriate for all ages
- ${difficulty === 'easy' ? 'Use simple, well-known facts that children would know' : ''}
- ${difficulty === 'medium' ? 'Use moderately challenging questions that require some knowledge' : ''}
- ${difficulty === 'hard' ? 'Use more challenging questions that require deeper knowledge' : ''}
- Make sure the correct answer index (0-3) accurately points to the right option
- Ensure all questions are factually accurate`;
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: category === 'medical-assistant' 
          ? `Generate 5 ${difficulty} difficulty Medical Assistant questions about anatomy and physiology.`
          : `Generate 5 ${difficulty} difficulty trivia questions about ${category}.`
        }
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

  // Enhanced error logging for debugging
  console.error('Invalid /api/ask-ai request body - missing required fields');
  return res.status(400).json({
    error: 'Missing or invalid request body. Must include either {history: array}, {board: array, possibleMoves: array}, or {game: "trivia-generator", difficulty, category}.',
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
