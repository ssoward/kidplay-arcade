// Vercel serverless function for Trivia Blitz AI API
const axios = require('axios');

const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Trivia Generator AI request
    if (req.body.game === 'trivia-generator') {
      console.log('--- TRIVIA GENERATOR AI REQUEST ---');
      const { difficulty = 'medium', category = 'general' } = req.body;
      
      const fallbackQuestions = [
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
      
      // If no Azure credentials, use fallback
      if (!AZURE_API_KEY || !AZURE_ENDPOINT) {
        console.log('Using fallback questions - no Azure credentials');
        return res.json({ questions: fallbackQuestions });
      }
      
      try {
        const systemPrompt = `You are a trivia question generator for a family-friendly quiz game. Generate exactly 5 multiple choice questions for the "${category}" category at "${difficulty}" difficulty level. Each question should have exactly 4 options and specify which option is correct (0-3 index).

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

        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate 5 ${difficulty} difficulty trivia questions about ${category}.` }
        ];
        
        const response = await axios.post(
          AZURE_ENDPOINT,
          {
            messages,
            max_tokens: 512,
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
        
        let questions;
        const aiResponse = response.data.choices?.[0]?.message?.content || '';
        
        try {
          // Clean up the response - remove any markdown formatting
          let cleanResponse = aiResponse.trim();
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
          questions = fallbackQuestions;
        }
        
        console.log('Trivia questions generated successfully');
        return res.json({ questions });
        
      } catch (err) {
        console.error('Trivia Generator AI ERROR:', err.response?.data || err.message);
        return res.json({ questions: fallbackQuestions, error: 'AI call failed, used fallback questions.' });
      }
    }

    // Default response for unsupported requests
    return res.status(400).json({
      error: 'Unsupported request. This endpoint only supports trivia-generator.',
      received: Object.keys(req.body)
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
