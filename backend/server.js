require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

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
    console.error('AI ERROR:', err.response?.data || err.message);
    return fallbackFn();
  }
}

app.post('/api/ask-ai', async (req, res) => {
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
    console.log('Using systemPrompt from checkers:', systemPrompt);
    console.log('Board:', JSON.stringify(board));
    console.log('Possible Moves:', JSON.stringify(possibleMoves));
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
      console.log('AI move response:', aiMove);
      // Remove Markdown code block formatting if present
      aiMove = aiMove.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '').replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/, '$1').trim();
      // Try to parse the move as JSON
      try {
        aiMove = JSON.parse(aiMove);
      } catch (e) {
        // fallback: pick a random move
        aiMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        console.log('AI response not valid JSON, using random move:', aiMove);
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
    console.log('Using systemPrompt from chess:', systemPrompt);
    console.log('FEN:', board);
    console.log('Possible Moves:', JSON.stringify(possibleMoves));
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
      console.log('AI move response:', aiMove);
      aiMove = aiMove.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '').replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/, '$1').trim();
      // Only return a move that is in possibleMoves
      if (!possibleMoves.includes(aiMove)) {
        aiMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        console.log('AI response not valid move, using random move:', aiMove);
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
      console.log('System Prompt:', systemPromptObj ? systemPromptObj.content : '[none]');
      console.log('User Prompt:', userPrompt.content);

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
      console.log('Parsed AI move:', aiMove); // Log the parsed AI move
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
    console.log('System prompt:', systemPrompt);
    console.log('User message:', userMessage);
    
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage || `Generate a ${difficulty} difficulty word.` }
      ];
      
      const response = await axios.post(
        AZURE_ENDPOINT,
        {
          messages,
          max_tokens: 20,
          temperature: 0.8,
          top_p: 0.95,
          frequency_penalty: 0.5,
          presence_penalty: 0.5,
        },
        {
          headers: {
            'api-key': AZURE_API_KEY,
            'Ocp-Apim-Subscription-Key': AZURE_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const word = response.data.choices?.[0]?.message?.content || '';
      console.log('AI word response:', word);
      return res.json({ response: word, word: word });
    } catch (err) {
      console.error('Word Generator AI ERROR:', err.response?.data || err.message);
      // Fallback words
      const fallbackWords = {
        easy: ['HAPPY', 'SMILE', 'MUSIC', 'PEACE', 'LIGHT'],
        medium: ['PUZZLE', 'CASTLE', 'GARDEN', 'BRIDGE', 'GOLDEN'],
        hard: ['MYSTERY', 'QUANTUM', 'CRYSTAL', 'HARMONY', 'PHOENIX']
      };
      const fallbackWord = fallbackWords[difficulty][Math.floor(Math.random() * fallbackWords[difficulty].length)];
      return res.json({ response: fallbackWord, word: fallbackWord, error: 'AI call failed, used fallback word.' });
    }
  }

  // Word Guess AI request
  if (req.body.game === 'word-guess' && req.body.state && req.body.systemPrompt) {
    console.log('--- WORD GUESS AI REQUEST ---');
    const { state, systemPrompt, userMessage } = req.body;
    console.log('Game state:', JSON.stringify(state));
    console.log('System prompt:', systemPrompt);
    console.log('User message:', userMessage);
    
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage || `Please provide a hint for the word "${state.targetWord}".` }
      ];
      
      const response = await axios.post(
        AZURE_ENDPOINT,
        {
          messages,
          max_tokens: 100,
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
      
      const hint = response.data.choices?.[0]?.message?.content || '';
      console.log('AI hint response:', hint);
      return res.json({ response: hint, hint: hint });
    } catch (err) {
      console.error('Word Guess AI ERROR:', err.response?.data || err.message);
      // Fallback hints
      const fallbackHints = [
        `This word has ${state.targetWord.split('').filter(letter => 'AEIOU'.includes(letter)).length} vowel(s).`,
        `The word starts with the letter "${state.targetWord[0]}".`,
        `The word ends with the letter "${state.targetWord[state.targetWord.length - 1]}".`
      ];
      const fallbackHint = fallbackHints[state.hintsUsed] || 'Keep trying! You can do this!';
      return res.json({ response: fallbackHint, hint: fallbackHint, error: 'AI call failed, used fallback hint.' });
    }
  }

  // Trivia Generator AI request
  if (req.body.game === 'trivia-generator' && req.body.difficulty && req.body.category) {
    console.log('--- TRIVIA GENERATOR AI REQUEST ---');
    const { difficulty, category } = req.body;
    console.log('Difficulty:', difficulty);
    console.log('Category:', category);
    
    const fallbackQuestions = () => {
      const fallbacks = [
        {
          question: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correct: 2
        },
        {
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correct: 1
        },
        {
          question: "Which planet is closest to the Sun?",
          options: ["Venus", "Mercury", "Earth", "Mars"],
          correct: 1
        },
        {
          question: "What color do you get when you mix red and blue?",
          options: ["Green", "Yellow", "Purple", "Orange"],
          correct: 2
        },
        {
          question: "How many legs does a spider have?",
          options: ["6", "8", "10", "12"],
          correct: 1
        }
      ];
      return fallbacks.slice(0, 5);
    };
    
    try {
      const systemPrompt = `You are a trivia question generator. Generate exactly 5 trivia questions for the category "${category}" at "${difficulty}" difficulty level. 

Rules:
- Each question must have exactly 4 multiple choice options
- Only one option should be correct
- Questions should be appropriate for all ages
- Return ONLY a valid JSON array with no additional text
- Each question object must have: question, options (array of 4 strings), correct (number 0-3 indicating correct option index)

Example format:
[
  {
    "question": "What is the largest planet?",
    "options": ["Earth", "Jupiter", "Saturn", "Mars"],
    "correct": 1
  }
]`;

      const userPrompt = `Generate 5 ${difficulty} difficulty trivia questions about ${category}.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      const response = await callAI(messages, 1000, 0.8, fallbackQuestions);
      
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
      
      console.log('Generated trivia questions:', JSON.stringify(questions, null, 2));
      return res.json({ questions });
      
    } catch (err) {
      console.error('Trivia Generator AI ERROR:', err.response?.data || err.message);
      return res.json({ questions: fallbackQuestions(), error: 'AI call failed, used fallback questions.' });
    }
  }

  // Chat-based AI request (default)
  if (Array.isArray(history)) {
    console.log('--- AI REQUEST ---');
    console.log('History sent to AI:', JSON.stringify(history, null, 2));
    try {
      const response = await axios.post(
        AZURE_ENDPOINT,
        {
          messages: history,
          max_tokens: 64,
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
      console.log('AI response:', aiMessage);
      res.json({ message: aiMessage });
    } catch (err) {
      console.error('AI ERROR:', err.response?.data || err.message);
      res.status(500).json({ error: 'AI call failed' });
    }
    return;
  }

  // Enhanced error logging for debugging
  console.error('Invalid /api/ask-ai request body:', JSON.stringify(req.body));
  return res.status(400).json({
    error: 'Missing or invalid request body. Must include either {history: array} or {board: array, possibleMoves: array} (flat or under checkers).',
    received: req.body
  });
});

// Serve static files from the React app build folder (after API routes)
app.use(express.static(path.join(__dirname, '../build')));

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI backend listening on port ${PORT}`);
});
