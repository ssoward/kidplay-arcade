import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './Chess.css';

interface Question {
	question: string;
	options: string[];
	answer: number;
}

const FALLBACK_QUESTIONS: Question[] = [
	{
		question: 'What is the capital of France?',
		options: ['Paris', 'London', 'Berlin', 'Madrid'],
		answer: 0,
	},
	{
		question: 'Which planet is known as the Red Planet?',
		options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
		answer: 1,
	},
	{
		question: 'Who wrote "Romeo and Juliet"?',
		options: [
			'Charles Dickens',
			'William Shakespeare',
			'Mark Twain',
			'Jane Austen',
		],
		answer: 1,
	},
	{
		question: 'What is the largest mammal?',
		options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
		answer: 1,
	},
	{
		question: 'How many continents are there?',
		options: ['5', '6', '7', '8'],
		answer: 2,
	},
];

interface TriviaBlitzProps {
	onExit: () => void;
}

const TriviaBlitz: React.FC<TriviaBlitzProps> = ({ onExit }) => {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [current, setCurrent] = useState(0);
	const [score, setScore] = useState(0);
	const [selected, setSelected] = useState<number | null>(null);
	const [showAnswer, setShowAnswer] = useState(false);
	const [finished, setFinished] = useState(false);
	const [loadingQuestions, setLoadingQuestions] = useState(true);
	const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
	const [category, setCategory] = useState<string>('general');

	const handleOption = (idx: number) => {
		if (showAnswer || questions.length === 0) return;
		setSelected(idx);
		setShowAnswer(true);
		if (idx === questions[current].answer) setScore(score + 1);
	};

	const next = () => {
		if (current + 1 < questions.length) {
			setCurrent(current + 1);
			setSelected(null);
			setShowAnswer(false);
		} else {
			setFinished(true);
		}
	};

	const restart = async () => {
		setCurrent(0);
		setScore(0);
		setSelected(null);
		setShowAnswer(false);
		setFinished(false);
		// Generate new questions
		const newQuestions = await generateAIQuestions(5);
		setQuestions(newQuestions);
	};

	// Generate AI questions
	const generateAIQuestions = async (numQuestions: number = 5): Promise<Question[]> => {
		setLoadingQuestions(true);
		try {
			const categoryDescriptions = {
				general: 'general knowledge covering various topics',
				science: 'science, nature, and technology',
				history: 'historical events and famous people',
				geography: 'countries, capitals, and world geography',
				sports: 'sports, games, and athletics',
				entertainment: 'movies, music, books, and pop culture'
			};

			const difficultyDescriptions = {
				easy: 'simple questions appropriate for elementary school level',
				medium: 'moderately challenging questions for middle/high school level',
				hard: 'difficult questions that would challenge adults'
			};

			const systemPrompt = `You are a trivia question generator. Create ${numQuestions} multiple choice trivia questions about ${categoryDescriptions[category as keyof typeof categoryDescriptions] || 'general knowledge'}.

Requirements:
- ${difficultyDescriptions[difficulty]} 
- Each question should have exactly 4 answer options
- Questions should be family-friendly and educational
- Provide the correct answer index (0-3)
- Questions should be interesting and fun

Format your response as a JSON array of objects with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0
  }
]

Respond with ONLY the JSON array, no additional text or formatting.`;

			const response = await axios.post('/api/ask-ai', {
				game: 'trivia-generator',
				category: category,
				difficulty: difficulty,
				systemPrompt: systemPrompt,
				userMessage: `Generate ${numQuestions} ${difficulty} ${category} trivia questions.`
			});

			let aiQuestions: Question[] = [];
			
			try {
				// Try to parse the AI response as JSON
				const responseText = response.data.response || response.data.message || '';
				const cleanedResponse = responseText.trim().replace(/^```json\n?|```$/g, '');
				aiQuestions = JSON.parse(cleanedResponse);
				
				// Validate the structure
				if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
					// Ensure all questions have the required structure
					aiQuestions = aiQuestions.filter(q => 
						q.question && 
						Array.isArray(q.options) && 
						q.options.length === 4 && 
						typeof q.answer === 'number' && 
						q.answer >= 0 && 
						q.answer < 4
					);
					
					if (aiQuestions.length >= 3) { // Need at least 3 valid questions
						console.log(`Generated ${aiQuestions.length} AI trivia questions`);
						return aiQuestions.slice(0, numQuestions); // Take only the requested number
					}
				}
			} catch (error) {
				console.error('Error parsing AI trivia questions:', error);
			}
			
			// Fallback to predefined questions if AI generation fails
			console.log('Using fallback trivia questions');
			return FALLBACK_QUESTIONS.slice(0, numQuestions);
			
		} catch (error) {
			console.error('Error generating AI trivia questions:', error);
			return FALLBACK_QUESTIONS.slice(0, numQuestions);
		} finally {
			setLoadingQuestions(false);
		}
	};

	// Load questions when game starts or settings change
	useEffect(() => {
		generateAIQuestions(5).then(setQuestions);
	}, [difficulty, category]);

	// Show loading screen while generating questions
	if (loadingQuestions || questions.length === 0) {
		return (
			<div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 p-6">
				<h1 className="text-4xl font-bold mb-8 font-comic drop-shadow-lg">
					Trivia Blitz ❓
				</h1>
				<div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center max-w-lg w-full mb-8">
					<div className="text-xl mb-4">Generating AI Questions...</div>
					<div className="flex justify-center mb-6">
						<div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
					</div>
					<p className="text-gray-600">Please wait while we create personalized trivia questions for you!</p>
				</div>
			</div>
		);
	}

	if (finished) {
		return (
			<div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 p-6">
				<h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">
					Trivia Blitz ❓
				</h1>
				<div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center max-w-lg w-full mb-6">
					<div className="text-2xl font-bold mb-4">
						Final Score: {score} / {questions.length}
					</div>
					<div className="text-lg mb-6">
						{score === questions.length ? "Perfect! 🎉" : 
						 score >= questions.length * 0.8 ? "Excellent! 🌟" : 
						 score >= questions.length * 0.6 ? "Good job! 👍" : 
						 "Keep practicing! 💪"}
					</div>
					<button
						className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transform hover:scale-105 mr-4"
						onClick={restart}
					>
						🔄 New Questions
					</button>
					<button
						className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 transform hover:scale-105"
						onClick={onExit}
					>
						← Back to Games
					</button>
				</div>
				
				{/* Settings for next game */}
				<div className="bg-white/60 rounded-2xl p-6 max-w-md text-center shadow mb-4">
					<h3 className="font-bold text-lg mb-4 text-gray-800">
						Settings for Next Game ⚙️
					</h3>
					<div className="mb-4">
						<label className="block text-sm font-bold mb-2 text-gray-700">Difficulty:</label>
						<select 
							value={difficulty} 
							onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
							className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
						>
							<option value="easy">Easy 🟢</option>
							<option value="medium">Medium 🟡</option>
							<option value="hard">Hard 🔴</option>
						</select>
					</div>
					<div className="mb-4">
						<label className="block text-sm font-bold mb-2 text-gray-700">Category:</label>
						<select 
							value={category} 
							onChange={(e) => setCategory(e.target.value)}
							className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
						>
							<option value="general">General Knowledge 🧠</option>
							<option value="science">Science & Nature 🔬</option>
							<option value="history">History 📚</option>
							<option value="geography">Geography 🌍</option>
							<option value="sports">Sports 🏃</option>
							<option value="entertainment">Entertainment 🎬</option>
						</select>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 p-6">
			<h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">
				Trivia Blitz ❓
			</h1>
			
			{/* Current Settings Display */}
			<div className="bg-white/60 rounded-xl p-3 shadow mb-4 text-center">
				<span className="text-sm font-semibold text-gray-700">
					{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} • {category.charAt(0).toUpperCase() + category.slice(1)}
				</span>
			</div>
			
			<div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center max-w-lg w-full mb-4">
				<div className="text-lg font-bold mb-2">
					Question {current + 1} of {questions.length}
				</div>
				<div className="text-xl mb-4">{questions[current].question}</div>
				<div className="flex flex-col gap-2">
					{questions[current].options.map((opt: string, idx: number) => (
						<button
							key={idx}
							className={`px-4 py-2 rounded-lg font-bold text-lg shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105 ${
								showAnswer
									? idx === questions[current].answer
										? 'bg-green-400 text-white focus:ring-green-300'
										: idx === selected
										? 'bg-red-400 text-white focus:ring-red-300'
										: 'bg-gray-200 text-gray-700 focus:ring-gray-400'
									: 'bg-gray-200 text-gray-700 hover:bg-blue-200 focus:ring-blue-400'
							}`}
							onClick={() => handleOption(idx)}
							disabled={showAnswer}
						>
							{opt}
						</button>
					))}
				</div>
				{showAnswer && (
					<button
						className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transform hover:scale-105 mt-4"
						onClick={next}
					>
						{current + 1 < questions.length ? 'Next' : 'Finish'}
					</button>
				)}
			</div>
			
			{/* Progress bar */}
			<div className="w-full max-w-lg mb-4">
				<div className="bg-gray-200 rounded-full h-2">
					<div 
						className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
						style={{ width: `${((current + (showAnswer ? 1 : 0)) / questions.length) * 100}%` }}
					></div>
				</div>
				<div className="text-center text-sm text-gray-600 mt-1">
					Score: {score}/{questions.length}
				</div>
			</div>
			
			<div className="mt-4 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
				<h3 className="font-bold text-lg mb-2 text-gray-800">
					How to Play ❓
				</h3>
				<ul className="text-gray-700 space-y-1 text-left">
					<li>• Answer AI-generated trivia questions</li>
					<li>• Choose from 4 multiple choice options</li>
					<li>• Try to get the highest score possible!</li>
					<li>• Questions adapt to your chosen difficulty and category</li>
				</ul>
			</div>
		</div>
	);
};

export default TriviaBlitz;
