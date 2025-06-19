import React, { useState, useCallback } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';

// --- Knowledge base: objects and their properties ---
const knowledgeBase = [
	{
		name: 'cat',
		properties: {
			alive: true,
			biggerThanCar: false,
			canHold: true,
			foundIndoors: true,
			madeByHumans: false,
			hasWheels: false,
			canEat: false,
			electronic: false,
			flies: false,
			transportation: false,
			soft: true,
			makesSound: true,
			colorful: false,
			usedEveryDay: true,
			foundInNature: true,
			movesOnOwn: true,
			round: false,
			usedForFun: true,
			needsElectricity: false,
			foundInSchool: false,
		},
	},
	{
		name: 'car',
		properties: {
			alive: false,
			biggerThanCar: true,
			canHold: false,
			foundIndoors: false,
			madeByHumans: true,
			hasWheels: true,
			canEat: false,
			electronic: true,
			flies: false,
			transportation: true,
			soft: false,
			makesSound: true,
			colorful: false,
			usedEveryDay: true,
			foundInNature: false,
			movesOnOwn: true,
			round: false,
			usedForFun: true,
			needsElectricity: true,
			foundInSchool: false,
		},
	},
	{
		name: 'apple',
		properties: {
			alive: false,
			biggerThanCar: false,
			canHold: true,
			foundIndoors: true,
			madeByHumans: false,
			hasWheels: false,
			canEat: true,
			electronic: false,
			flies: false,
			transportation: false,
			soft: true,
			makesSound: false,
			colorful: true,
			usedEveryDay: false,
			foundInNature: true,
			movesOnOwn: false,
			round: true,
			usedForFun: false,
			needsElectricity: false,
			foundInSchool: true,
		},
	},
	// ...add more objects for a richer game...
];

// Map question text to property key
const questionToProperty: Record<string, keyof typeof knowledgeBase[0]['properties']> = {
	'Is it alive?': 'alive',
	'Is it bigger than a car?': 'biggerThanCar',
	'Can you hold it in your hand?': 'canHold',
	'Is it found indoors?': 'foundIndoors',
	'Is it made by humans?': 'madeByHumans',
	'Does it have wheels?': 'hasWheels',
	'Can you eat it?': 'canEat',
	'Is it electronic?': 'electronic',
	'Does it fly?': 'flies',
	'Is it used for transportation?': 'transportation',
	'Is it soft?': 'soft',
	'Does it make sound?': 'makesSound',
	'Is it colorful?': 'colorful',
	'Do you use it every day?': 'usedEveryDay',
	'Is it found in nature?': 'foundInNature',
	'Does it move on its own?': 'movesOnOwn',
	'Is it round?': 'round',
	'Is it used for fun?': 'usedForFun',
	'Does it need electricity?': 'needsElectricity',
	'Is it found in a school?': 'foundInSchool',
};

interface TwentyQuestionsProps {
	onExit: () => void;
}

interface Question {
	text: string;
	answered: boolean;
	answer: 'yes' | 'no' | null;
}

const TwentyQuestions: React.FC<TwentyQuestionsProps> = ({ onExit }) => {
	const [gameStarted, setGameStarted] = useState(false);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [currentQuestion, setCurrentQuestion] = useState('');
	const [gameOver, setGameOver] = useState(false);
	const [aiGuess, setAiGuess] = useState('');
	const [questionsLeft, setQuestionsLeft] = useState(20);
	const [playerWins, setPlayerWins] = useState(0);
	const [aiWins, setAiWins] = useState(0);
	const [possibleObjects, setPossibleObjects] = useState(knowledgeBase);

	const startGame = () => {
		setGameStarted(true);
		setQuestions([]);
		setGameOver(false);
		setQuestionsLeft(20);
		setPossibleObjects(knowledgeBase);
		setCurrentQuestion('');
		setAiGuess('');
		// Immediately ask the AI for the first question
		setTimeout(() => askNextQuestion(knowledgeBase, []), 0);
	};

	// Helper: Check if AI is certain (simple heuristic)
	function isAICertain(guess: string) {
		const certainPhrases = [
			"I'm certain",
			"I'm sure",
			"I am confident",
			"It must be",
			"I'm positive",
			"definitely",
			"without a doubt",
			"It is",
			"It has to be",
			"I'm almost sure",
			"I'm 100% sure",
			"I'm confident",
			"I believe it is",
			"I think it is",
			"I guess",
			"My guess is",
		];
		// If the guess is a question, it's not certain
		if (guess.trim().endsWith('?')) return false;
		// If the guess contains a certain phrase, treat as certain
		return certainPhrases.some((phrase) =>
			guess.toLowerCase().includes(phrase.toLowerCase())
		);
	}

	// Replace askNextQuestion and makeGuess with AI backend call
	const askNextQuestion = useCallback(
		async (objects = possibleObjects, prevQuestions = questions) => {
			if (questionsLeft <= 0) {
				await makeGuess(objects, true); // force guess
				return;
			}
			try {
				const history = [
					{
						role: 'system',
						content:
							'You are playing 20 Questions. Your job is to guess the object the user is thinking of. Ask only one new yes/no question at a time that will best help you narrow down the object. Do not repeat any previous questions. Here is a list of all questions you have already asked: ' +
							prevQuestions.map((q) => q.text).join('; ') +
							'. Only make a guess if you are certain. Respond with only your next question or your guess.',
					},
					// Only add the most recent question/answer pairs
					...prevQuestions.map((q, i) => [
						{ role: 'assistant', content: q.text },
						{ role: 'user', content: q.answer === 'yes' ? 'Yes' : 'No' },
					]).flat(),
				];
				const res = await axios.post(`${API_CONFIG.BASE_URL}/api/ask-ai`, { history });
				// If the AI tries to guess, check certainty
				if (isAICertain(res.data.message)) {
					setAiGuess(res.data.message);
					setCurrentQuestion('');
				} else {
					setCurrentQuestion(res.data.message);
				}
			} catch {
				setCurrentQuestion(
					'Sorry, I had trouble thinking of a question. Try again!'
				);
			}
		},
		[questionsLeft]
	);

	const makeGuess = async (objects = possibleObjects, force = false) => {
		try {
			const history = [
				{
					role: 'system',
					content: force
						? 'You are playing 20 Questions. You must make your best guess now.'
						: 'You are playing 20 Questions. Make your best guess only if you are certain.',
				},
				...questions.map((q) => ({ role: 'assistant', content: q.text })),
				...questions.map((q) => ({
					role: 'user',
					content: q.answer === 'yes' ? 'Yes' : 'No',
				})),
			];
			const res = await axios.post(`${API_CONFIG.BASE_URL}/api/ask-ai`, { history });
			setAiGuess(res.data.message);
			setCurrentQuestion('');
		} catch {
			setAiGuess('Sorry, I could not make a guess.');
			setCurrentQuestion('');
		}
	};

	const answerQuestion = (answer: 'yes' | 'no') => {
		const newQuestion: Question = {
			text: currentQuestion,
			answered: true,
			answer,
		};
		const updatedQuestions = [...questions, newQuestion];
		setQuestions(updatedQuestions);
		setQuestionsLeft((prev) => prev - 1);
		// Filter possible objects
		const property = questionToProperty[currentQuestion];
		const filtered = possibleObjects.filter(
			(obj) => obj.properties[property] === (answer === 'yes')
		);
		setPossibleObjects(filtered);
		// Always send the full updatedQuestions array to askNextQuestion
		// This ensures the first question and answer are sent to the AI for the second question
		if (questionsLeft - 1 <= 0) {
			setTimeout(() => makeGuess(filtered, true), 800); // force guess
		} else {
			setTimeout(() => askNextQuestion(filtered, updatedQuestions), 800);
		}
	};

	const handleGuessResult = (correct: boolean) => {
		if (correct) {
			setAiWins((prev) => prev + 1);
		} else {
			setPlayerWins((prev) => prev + 1);
		}
		setGameOver(true);
	};

	const resetGame = () => {
		setGameStarted(false);
		setQuestions([]);
		setCurrentQuestion('');
		setGameOver(false);
		setAiGuess('');
		setQuestionsLeft(20);
		setPossibleObjects(knowledgeBase);
	};

	if (!gameStarted) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 p-4">
				<div className="max-w-4xl mx-auto">
					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
							🤖 Twenty Questions
						</h1>
						<p className="text-xl text-gray-700 mb-8">
							Think of an object, and I'll try to guess it in 20 questions!
						</p>
					</div>

					{/* Main Card */}
					<div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8">
						<div className="text-center mb-8">
							<div className="text-8xl mb-4">🎯</div>
							<h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Challenge the AI?</h2>
							<p className="text-lg text-gray-600 mb-8">
								I'll ask you yes/no questions to figure out what you're thinking of. 
								Let's see if I can guess it!
							</p>
							<button
								onClick={startGame}
								className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
							>
								🚀 Start Game
							</button>
						</div>
					</div>

					{/* How to Play */}
					<div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
						<h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
							📋 How to Play
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-start space-x-3">
								<div className="bg-purple-100 rounded-full p-2">
									<span className="text-2xl">💭</span>
								</div>
								<div>
									<h4 className="font-semibold text-gray-800">Think of Something</h4>
									<p className="text-gray-600">Choose any common object, animal, food, or item</p>
								</div>
							</div>
							<div className="flex items-start space-x-3">
								<div className="bg-blue-100 rounded-full p-2">
									<span className="text-2xl">❓</span>
								</div>
								<div>
									<h4 className="font-semibold text-gray-800">Answer Questions</h4>
									<p className="text-gray-600">I'll ask up to 20 yes/no questions</p>
								</div>
							</div>
							<div className="flex items-start space-x-3">
								<div className="bg-green-100 rounded-full p-2">
									<span className="text-2xl">✅</span>
								</div>
								<div>
									<h4 className="font-semibold text-gray-800">Be Honest</h4>
									<p className="text-gray-600">Answer truthfully so I can learn and guess</p>
								</div>
							</div>
							<div className="flex items-start space-x-3">
								<div className="bg-yellow-100 rounded-full p-2">
									<span className="text-2xl">🎯</span>
								</div>
								<div>
									<h4 className="font-semibold text-gray-800">See If I Win</h4>
									<p className="text-gray-600">I'll make my best guess when ready</p>
								</div>
							</div>
						</div>
					</div>

					{/* Score Display */}
					{(playerWins > 0 || aiWins > 0) && (
						<div className="mt-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-xl p-6">
							<h3 className="text-xl font-bold text-white text-center mb-4">🏆 Score</h3>
							<div className="flex justify-center space-x-8">
								<div className="text-center">
									<div className="text-3xl font-bold text-white">{playerWins}</div>
									<div className="text-purple-100">You</div>
								</div>
								<div className="text-center text-white text-2xl">VS</div>
								<div className="text-center">
									<div className="text-3xl font-bold text-white">{aiWins}</div>
									<div className="text-purple-100">AI</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 p-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<button
						onClick={onExit}
						className="bg-white/80 hover:bg-white text-gray-700 font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
					>
						← Back
					</button>
					<h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
						🤖 Twenty Questions
					</h1>
					<button
						onClick={resetGame}
						className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
					>
						New Game
					</button>
				</div>

				{/* Score Board */}
				<div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-xl p-6 mb-6">
					<div className="flex justify-between items-center">
						<div className="text-center">
							<div className="text-3xl font-bold text-white">{playerWins}</div>
							<div className="text-purple-100">You</div>
						</div>
						<div className="text-center">
							<div className="text-white text-lg font-semibold mb-2">Questions Left</div>
							<div className="bg-white/20 rounded-xl px-4 py-2">
								<span className="text-3xl font-bold text-white">{questionsLeft}</span>
							</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-bold text-white">{aiWins}</div>
							<div className="text-purple-100">AI</div>
						</div>
					</div>
				</div>

				{/* Current Question */}
				{!gameOver && !aiGuess && currentQuestion && (
					<div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-6">
						<div className="flex items-start space-x-4">
							<div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-3 shadow-lg">
								<span className="text-3xl">🤖</span>
							</div>
							<div className="flex-1">
								<div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-6">
									<h2 className="text-2xl font-bold text-gray-800 mb-4">{currentQuestion}</h2>
								</div>
								<div className="flex space-x-4 justify-center">
									<button
										onClick={() => answerQuestion('yes')}
										className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
									>
										✅ Yes
									</button>
									<button
										onClick={() => answerQuestion('no')}
										className="bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
									>
										❌ No
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* AI Guess */}
				{aiGuess && !gameOver && (
					<div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-6">
						<div className="flex items-start space-x-4">
							<div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg">
								<span className="text-3xl">🎯</span>
							</div>
							<div className="flex-1">
								<div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6">
									<h2 className="text-2xl font-bold text-gray-800 mb-2">My Guess:</h2>
									<p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
										{aiGuess}
									</p>
								</div>
								<div className="flex space-x-4 justify-center">
									<button
										onClick={() => handleGuessResult(true)}
										className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
									>
										🎉 Correct!
									</button>
									<button
										onClick={() => handleGuessResult(false)}
										className="bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
									>
										❌ Wrong
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Game Over */}
				{gameOver && (
					<div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-6 text-center">
						<div className="text-6xl mb-4">
							{aiWins > playerWins ? '🤖' : '🎉'}
						</div>
						<h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
							{aiWins > playerWins ? 'AI Wins!' : 'You Win!'}
						</h2>
						<p className="text-xl text-gray-700 mb-6">
							{aiGuess && aiWins > playerWins
								? `I correctly guessed "${aiGuess}"!`
								: "I couldn't guess what you were thinking!"}
						</p>
						<button
							onClick={resetGame}
							className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
						>
							🔄 Play Again
						</button>
					</div>
				)}

				{/* Questions History */}
				{questions.length > 0 && (
					<div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
						<h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
							📝 Questions Asked ({questions.length})
						</h3>
						<div className="space-y-3 max-h-60 overflow-y-auto">
							{questions.map((q, index) => (
								<div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
									<span className="text-gray-700 font-medium flex-1">{q.text}</span>
									<span className={`font-bold px-3 py-1 rounded-full text-white ${
										q.answer === 'yes' 
											? 'bg-gradient-to-r from-green-400 to-emerald-500' 
											: 'bg-gradient-to-r from-red-400 to-rose-500'
									}`}>
										{q.answer === 'yes' ? '✅ Yes' : '❌ No'}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Tips */}
				<div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6">
					<h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
						💡 Tips for Better Gameplay
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div className="text-center">
							<div className="text-2xl mb-2">🎯</div>
							<p className="text-gray-700">Think of common objects for the best experience</p>
						</div>
						<div className="text-center">
							<div className="text-2xl mb-2">💯</div>
							<p className="text-gray-700">Answer honestly - that's how I learn!</p>
						</div>
						<div className="text-center">
							<div className="text-2xl mb-2">🌟</div>
							<p className="text-gray-700">Animals, foods, and everyday items work great</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TwentyQuestions;
