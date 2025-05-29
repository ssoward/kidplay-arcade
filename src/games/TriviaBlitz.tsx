import React, { useState } from 'react';
// import './Chess.css';

const QUESTIONS = [
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
	const [current, setCurrent] = useState(0);
	const [score, setScore] = useState(0);
	const [selected, setSelected] = useState<number | null>(null);
	const [showAnswer, setShowAnswer] = useState(false);
	const [finished, setFinished] = useState(false);

	const handleOption = (idx: number) => {
		if (showAnswer) return;
		setSelected(idx);
		setShowAnswer(true);
		if (idx === QUESTIONS[current].answer) setScore(score + 1);
	};

	const next = () => {
		if (current + 1 < QUESTIONS.length) {
			setCurrent(current + 1);
			setSelected(null);
			setShowAnswer(false);
		} else {
			setFinished(true);
		}
	};

	const restart = () => {
		setCurrent(0);
		setScore(0);
		setSelected(null);
		setShowAnswer(false);
		setFinished(false);
	};

	if (finished) {
		return (
			<div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 p-6">
				<h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">
					Trivia Blitz ❓
				</h1>
				<div className="text-2xl font-bold mb-4">
					Final Score: {score} / {QUESTIONS.length}
				</div>
				<button
					className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow mt-2"
					onClick={restart}
				>
					Play Again
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 p-6">
			<h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">
				Trivia Blitz ❓
			</h1>
			<div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center max-w-lg w-full mb-4">
				<div className="text-lg font-bold mb-2">
					Question {current + 1} of {QUESTIONS.length}
				</div>
				<div className="text-xl mb-4">{QUESTIONS[current].question}</div>
				<div className="flex flex-col gap-2">
					{QUESTIONS[current].options.map((opt, idx) => (
						<button
							key={idx}
							className={`chess-btn px-4 py-2 rounded-lg font-bold text-lg shadow transition duration-150 ${
								showAnswer
									? idx === QUESTIONS[current].answer
										? 'bg-green-400 text-white'
										: idx === selected
										? 'bg-red-400 text-white'
										: 'bg-gray-200 text-gray-700'
									: 'bg-gray-200 text-gray-700 hover:bg-blue-200'
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
						className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-4 py-2 rounded-xl shadow mt-4"
						onClick={next}
					>
						{current + 1 < QUESTIONS.length ? 'Next' : 'Finish'}
					</button>
				)}
			</div>
			<div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
				<h3 className="font-bold text-lg mb-2 text-gray-800">
					How to Play ❓
				</h3>
				<ul className="text-gray-700 space-y-1 text-left">
					<li>• Answer fun trivia questions</li>
					<li>• Try to get the highest score!</li>
				</ul>
			</div>
		</div>
	);
};

export default TriviaBlitz;
