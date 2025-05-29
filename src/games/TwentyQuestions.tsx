import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './Chess.css';

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
				const res = await axios.post('/api/ask-ai', { history });
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
			const res = await axios.post('/api/ask-ai', { history });
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
			<div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 via-yellow-100 to-pink-100 p-6">
				<div className="text-center mb-6">
					<h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">
						Twenty Questions ❓
					</h1>
					<p className="text-lg opacity-90">
						Think of an object, and I will try to guess it in 20 questions!
					</p>
				</div>
				<div className="flex flex-col items-center justify-center min-h-[300px]">
					<button
						className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
						onClick={startGame}
					>
						Start Game
					</button>
					<div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center text-2xl text-gray-500">
						I will ask you yes/no questions. Answer honestly, and let's see if I can guess your object!
					</div>
				</div>
				<div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
					<h3 className="font-bold text-lg mb-2 text-gray-800">
						How to Play ❓
					</h3>
					<ul className="text-gray-700 space-y-1 text-left">
						<li>• Think of a common object (animal, food, item, etc.)</li>
						<li>• I will ask up to 20 yes/no questions</li>
						<li>• Answer honestly to help me guess</li>
						<li>• I will make a guess when I think I know!</li>
					</ul>
				</div>
			</div>
		);
	}

	return (
		<div className="game-container">
			<div className="game-header">
				<button onClick={onExit} className="exit-btn">
					← Back
				</button>
				<h1 className="game-title">20 Questions</h1>
				<button onClick={resetGame} className="reset-btn">
					New Game
				</button>
			</div>

			<div className="game-content">
				<div className="score-board">
					<div className="score-item">
						<span className="player-name">You</span>
						<span className="score">{playerWins} wins</span>
					</div>
					<div className="score-item">
						<span className="player-name">AI</span>
						<span className="score">{aiWins} wins</span>
					</div>
				</div>

				<div className="questions-left">
					<h3>Questions Left: {questionsLeft}</h3>
				</div>

				{!gameOver && !aiGuess && currentQuestion && (
					<div className="question-section">
						<div className="ai-avatar">🤖</div>
						<div className="question-bubble">
							<h2>{currentQuestion}</h2>
							<div className="answer-buttons">
								<button
									onClick={() => answerQuestion('yes')}
									className="chess-btn bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold px-4 py-2 rounded-lg shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
								>
									Yes
								</button>
								<button
									onClick={() => answerQuestion('no')}
									className="chess-btn bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-bold px-4 py-2 rounded-lg shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
								>
									No
								</button>
							</div>
						</div>
					</div>
				)}

				{aiGuess && !gameOver && (
					<div className="guess-section">
						<div className="ai-avatar">🤖</div>
						<div className="guess-bubble">
							<h2>Is it {aiGuess}?</h2>
							<div className="answer-buttons">
								<button
									onClick={() => handleGuessResult(true)}
									className="chess-btn bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold px-4 py-2 rounded-lg shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
								>
									Yes! You got it!
								</button>
								<button
									onClick={() => handleGuessResult(false)}
									className="chess-btn bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-bold px-4 py-2 rounded-lg shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
								>
									No, that's wrong
								</button>
							</div>
						</div>
					</div>
				)}

				{gameOver && (
					<div className="game-over">
						<h2>{aiWins > playerWins ? 'AI Wins!' : 'You Win!'}</h2>
						<p>
							{aiGuess && aiWins > playerWins
								? `I correctly guessed "${aiGuess}"!`
								: "I couldn't guess what you were thinking!"}
						</p>
						<button onClick={resetGame} className="play-again-btn">
							Play Again
						</button>
					</div>
				)}

				<div className="questions-history">
					<h3>Questions Asked:</h3>
					<div className="questions-list">
						{questions.map((q, index) => (
							<div key={index} className="question-item">
								<span className="question-text">{q.text}</span>
								<span className={`answer ${q.answer}`}>
									{q.answer === 'yes' ? '✓ Yes' : '✗ No'}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="game-rules">
					<h3>Tips:</h3>
					<ul>
						<li>Think of common objects for the best experience</li>
						<li>Answer honestly - that's how I learn!</li>
						<li>Animals, foods, and everyday items work great</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default TwentyQuestions;
