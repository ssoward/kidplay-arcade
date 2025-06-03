import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AnalyticsService from '../services/AnalyticsService';
// import './Chess.css';

interface Question {
	question: string;
	options: string[];
	answer: number;
}

interface AIQuestion {
	question: string;
	options: string[];
	correct: number;
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
	const [totalScore, setTotalScore] = useState(0);
	const [gamesPlayed, setGamesPlayed] = useState(0);
	const [selected, setSelected] = useState<number | null>(null);
	const [showAnswer, setShowAnswer] = useState(false);
	const [finished, setFinished] = useState(false);
	const [loadingQuestions, setLoadingQuestions] = useState(true);
	const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
	const [category, setCategory] = useState<string>('general');
	const sessionStartTime = useRef<number>(Date.now());
	const questionStartTimes = useRef<number[]>([]);

	// Load accumulative score from localStorage
	const loadAccumulativeScore = () => {
		try {
			const savedData = localStorage.getItem('triviaBlitzAccumulative');
			if (savedData) {
				const { totalScore: savedTotalScore, gamesPlayed: savedGamesPlayed } = JSON.parse(savedData);
				setTotalScore(savedTotalScore || 0);
				setGamesPlayed(savedGamesPlayed || 0);
			}
		} catch (error) {
			console.error('Error loading accumulative score:', error);
		}
	};

	// Save accumulative score to localStorage
	const saveAccumulativeScore = (newTotalScore: number, newGamesPlayed: number) => {
		try {
			const dataToSave = {
				totalScore: newTotalScore,
				gamesPlayed: newGamesPlayed,
				lastPlayed: new Date().toISOString()
			};
			localStorage.setItem('triviaBlitzAccumulative', JSON.stringify(dataToSave));
		} catch (error) {
			console.error('Error saving accumulative score:', error);
		}
	};

	// Reset accumulative score
	const resetAccumulativeScore = () => {
		setTotalScore(0);
		setGamesPlayed(0);
		localStorage.removeItem('triviaBlitzAccumulative');
	};

	const handleOption = (idx: number) => {
		if (showAnswer || questions.length === 0) return;
		setSelected(idx);
		setShowAnswer(true);
		
		// Calculate answer time if we have a start time for this question
		let answerTime = 0;
		if (questionStartTimes.current[current]) {
			answerTime = Date.now() - questionStartTimes.current[current];
		}
		
		const isCorrect = idx === questions[current].answer;
		if (isCorrect) setScore(score + 1);
		
		// Track question answer with analytics
		const analytics = AnalyticsService.getInstance();
		analytics.recordGameSession({
			gameType: 'TriviaBlitz',
			completed: false,
			metadata: {
				questionIndex: current,
				question: questions[current].question,
				answerSelected: questions[current].options[idx],
				correctAnswer: questions[current].options[questions[current].answer],
				isCorrect,
				answerTimeMs: answerTime,
				difficulty,
				category
			}
		});
	};

	const next = () => {
		if (current + 1 < questions.length) {
			setCurrent(current + 1);
			setSelected(null);
			setShowAnswer(false);
			// Record start time for next question
			questionStartTimes.current[current + 1] = Date.now();
		} else {
			// Game finished - update accumulative score
			const newTotalScore = totalScore + score;
			const newGamesPlayed = gamesPlayed + 1;
			setTotalScore(newTotalScore);
			setGamesPlayed(newGamesPlayed);
			saveAccumulativeScore(newTotalScore, newGamesPlayed);
			setFinished(true);
			
			// Record complete game session
			const analytics = AnalyticsService.getInstance();
			const sessionDuration = Date.now() - sessionStartTime.current;
			analytics.recordGameSession({
				gameType: 'TriviaBlitz',
				duration: sessionDuration,
				score,
				completed: true,
				metadata: {
					totalQuestions: questions.length,
					correctAnswers: score,
					accuracy: Math.round((score / questions.length) * 100) + '%',
					difficulty,
					category,
					totalGamesPlayed: newGamesPlayed,
					accumulativeScore: newTotalScore
				}
			});
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
			console.log(`Generating ${numQuestions} ${difficulty} ${category} trivia questions...`);

			// Use AI generation for all categories
			const response = await axios.post('/api/ask-ai', {
				game: 'trivia-generator',
				category: category,
				difficulty: difficulty
			});

			let aiQuestions: Question[] = [];
			
			try {
				// The backend returns questions with "correct" property, we need "answer"
				const rawQuestions: AIQuestion[] = response.data.questions || [];
				console.log('Raw AI questions from backend:', rawQuestions);
				
				if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
					// Convert AI questions to our format
					aiQuestions = rawQuestions
						.filter(q => 
							q.question && 
							Array.isArray(q.options) && 
							q.options.length === 4 && 
							typeof q.correct === 'number' && 
							q.correct >= 0 && 
							q.correct < 4
						)
						.map(q => ({
							question: q.question,
							options: q.options,
							answer: q.correct // Convert "correct" to "answer"
						}));
					
					console.log('Converted questions:', aiQuestions);
					
					if (aiQuestions.length >= 3) { // Need at least 3 valid questions
						console.log(`Successfully generated ${aiQuestions.length} AI trivia questions`);
						return aiQuestions.slice(0, numQuestions); // Take only the requested number
					}
				}
			} catch (error) {
				console.error('Error parsing AI trivia questions:', error);
			}
			
			// Final fallback to general questions
			console.log('Using general fallback trivia questions');
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
		generateAIQuestions(5).then((newQuestions) => {
			setQuestions(newQuestions);
			// Record start time for first question
			questionStartTimes.current[0] = Date.now();
		});
	}, [difficulty, category]);

	// Load accumulative score when component mounts
	useEffect(() => {
		loadAccumulativeScore();
	}, []);

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
					<div className="text-lg mb-4">
						{score === questions.length ? "Perfect! 🎉" : 
						 score >= questions.length * 0.8 ? "Excellent! 🌟" : 
						 score >= questions.length * 0.6 ? "Good job! 👍" : 
						 "Keep practicing! 💪"}
					</div>
					
					{/* Accumulative Score Section */}
					<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border-2 border-blue-200">
						<h3 className="text-lg font-bold text-gray-800 mb-3">📊 Your Stats</h3>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="bg-white/70 rounded-lg p-3">
								<div className="text-2xl font-bold text-blue-600">{totalScore}</div>
								<div className="text-gray-600">Total Score</div>
							</div>
							<div className="bg-white/70 rounded-lg p-3">
								<div className="text-2xl font-bold text-green-600">{gamesPlayed}</div>
								<div className="text-gray-600">Games Played</div>
							</div>
							<div className="bg-white/70 rounded-lg p-3">
								<div className="text-2xl font-bold text-purple-600">
									{gamesPlayed > 0 ? (totalScore / gamesPlayed).toFixed(1) : '0.0'}
								</div>
								<div className="text-gray-600">Average Score</div>
							</div>
							<div className="bg-white/70 rounded-lg p-3">
								<div className="text-2xl font-bold text-orange-600">
									{gamesPlayed > 0 ? Math.round((totalScore / (gamesPlayed * questions.length)) * 100) : 0}%
								</div>
								<div className="text-gray-600">Success Rate</div>
							</div>
						</div>
						<button
							onClick={resetAccumulativeScore}
							className="mt-3 text-xs text-gray-500 hover:text-red-500 underline transition-colors"
						>
							Reset All Stats
						</button>
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
			
			{/* Progress bar and score display */}
			<div className="w-full max-w-lg mb-4">
				<div className="bg-gray-200 rounded-full h-2">
					<div 
						className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
						style={{ width: `${((current + (showAnswer ? 1 : 0)) / questions.length) * 100}%` }}
					></div>
				</div>
				<div className="flex justify-between text-sm text-gray-600 mt-1">
					<span>Current: {score}/{questions.length}</span>
					<span>Total: {totalScore} ({gamesPlayed} games)</span>
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
