'use client';

import { useState, useEffect } from 'react';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type Category = 'everyday' | 'animals' | 'food' | 'colors' | 'numbers' | 'verbs' | 'adjectives';

interface AtziriWorldState {
  words: string[];
  current: number;
  flipped: boolean;
  score: number;
  totalScore: number;
  wordsAttempted: number;
  difficulty: Difficulty;
  category: Category;
  loading: boolean;
  usedWords: string[];
  isPlayingEnglish: boolean;
  isPlayingSpanish: boolean;
  audioSupported: boolean;
  incorrectWords: string[];
  showPracticeList: boolean;
  showDefinition: boolean;
  currentDefinition: string;
  loadingDefinition: boolean;
}

export default function AtziriWorld() {
  const [state, setState] = useState<AtziriWorldState>({
    words: [],
    current: 0,
    flipped: false,
    score: 0,
    totalScore: 0,
    wordsAttempted: 0,
    difficulty: 'beginner',
    category: 'everyday',
    loading: false,
    usedWords: [],
    isPlayingEnglish: false,
    isPlayingSpanish: false,
    audioSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    incorrectWords: [],
    showPracticeList: false,
    showDefinition: false,
    currentDefinition: '',
    loadingDefinition: false,
  });

  useEffect(() => {
    const savedScore = localStorage.getItem('atziriworld-total-score');
    const savedUsedWords = localStorage.getItem(`atziriworld-used-words-${state.difficulty}-${state.category}`);
    const savedIncorrectWords = localStorage.getItem(`atziriworld-incorrect-words-${state.difficulty}-${state.category}`);
    
    if (savedScore) {
      setState(prev => ({ ...prev, totalScore: parseInt(savedScore, 10) }));
    }
    
    if (savedUsedWords) {
      try {
        const usedWords = JSON.parse(savedUsedWords);
        setState(prev => ({ ...prev, usedWords }));
      } catch (error) {
        console.error('Failed to parse used words:', error);
      }
    }
    
    if (savedIncorrectWords) {
      try {
        const incorrectWords = JSON.parse(savedIncorrectWords);
        setState(prev => ({ ...prev, incorrectWords }));
      } catch (error) {
        console.error('Failed to parse incorrect words:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Load used words and incorrect words for the current difficulty and category
    const savedUsedWords = localStorage.getItem(`atziriworld-used-words-${state.difficulty}-${state.category}`);
    const savedIncorrectWords = localStorage.getItem(`atziriworld-incorrect-words-${state.difficulty}-${state.category}`);
    let usedWords: string[] = [];
    let incorrectWords: string[] = [];
    
    if (savedUsedWords) {
      try {
        usedWords = JSON.parse(savedUsedWords);
        setState(prev => ({ ...prev, usedWords }));
      } catch (error) {
        console.error('Failed to parse used words:', error);
        setState(prev => ({ ...prev, usedWords: [] }));
      }
    } else {
      setState(prev => ({ ...prev, usedWords: [] }));
    }
    
    if (savedIncorrectWords) {
      try {
        incorrectWords = JSON.parse(savedIncorrectWords);
        setState(prev => ({ ...prev, incorrectWords }));
      } catch (error) {
        console.error('Failed to parse incorrect words:', error);
        setState(prev => ({ ...prev, incorrectWords: [] }));
      }
    } else {
      setState(prev => ({ ...prev, incorrectWords: [] }));
    }
    
    // Fetch words with the loaded used words
    fetchWordsWithUsedList(usedWords);
  }, [state.difficulty, state.category]);

  // Cleanup speech synthesis when component unmounts or word changes
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [state.words, state.current]);

  // Stop speech when moving to next word
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [state.current]);

  const fetchWordsWithUsedList = async (usedWords: string[] = state.usedWords) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const usedWordsText = usedWords.length > 0 
        ? `\n\nPreviously used words to avoid: ${usedWords.join(', ')}`
        : '';

      const categoryPrompt = getCategoryPrompt(state.category);
      const difficultyPrompt = getDifficultyPrompt(state.difficulty);
        
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: [
            {
              role: 'user',
              content: `Generate 20 English vocabulary words for ${state.difficulty} level English learners. Focus on ${categoryPrompt}. ${difficultyPrompt} Return only a JSON array of words.${usedWordsText}`
            }
          ]
        }),
      });

      const data = await response.json();
      let words: string[] = [];
      
      if (Array.isArray(data)) {
        words = data;
      } else if (data.message) {
        try {
          // Remove markdown code blocks if present
          let cleanMessage = data.message.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
          
          // Try to parse as JSON first
          words = JSON.parse(cleanMessage);
        } catch {
          // If JSON parsing fails, try to extract words using regex
          const wordMatches = data.message.match(/"([^"]+)"/g);
          if (wordMatches) {
            words = wordMatches.map((match: string) => match.replace(/"/g, ''));
          } else {
            // Fallback: split by common delimiters
            words = data.message.split(/[,\s\[\]]+/).filter((word: string) => 
              word && !word.match(/^[\[\]{}":,\s]*$/)
            );
          }
        }
      } else if (data.response) {
        try {
          // Remove markdown code blocks if present
          let cleanResponse = data.response.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
          words = JSON.parse(cleanResponse);
        } catch {
          // If JSON parsing fails, try to extract words using regex
          const wordMatches = data.response.match(/"([^"]+)"/g);
          if (wordMatches) {
            words = wordMatches.map((match: string) => match.replace(/"/g, ''));
          } else {
            // Fallback: split by common delimiters
            words = data.response.split(/[,\s\[\]]+/).filter((word: string) => 
              word && !word.match(/^[\[\]{}":,\s]*$/)
            );
          }
        }
      }
      
      // Remove quotes and JSON artifacts from words
      words = words.map(word => 
        word.replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim()
      ).filter(word => word.length > 0);
      
      // Update used words list
      const newUsedWords = [...usedWords, ...words];
      
      // Save used words to localStorage
      localStorage.setItem(`atziriworld-used-words-${state.difficulty}-${state.category}`, JSON.stringify(newUsedWords));
      
      setState(prev => ({
        ...prev,
        words,
        current: 0,
        flipped: false,
        loading: false,
        usedWords: newUsedWords,
      }));
    } catch (error) {
      console.error('Failed to fetch words:', error);
      const fallbackWords = getFallbackWords(state.category, state.difficulty);
      
      setState(prev => ({
        ...prev,
        words: fallbackWords,
        current: 0,
        flipped: false,
        loading: false,
      }));
    }
  };

  const getCategoryPrompt = (category: Category): string => {
    const categoryMap = {
      everyday: 'common everyday words and objects that beginners encounter daily',
      animals: 'animal names from pets to wild animals',
      food: 'food items, cooking terms, and dining vocabulary',
      colors: 'colors and color-related descriptive words',
      numbers: 'numbers, counting, and mathematical terms',
      verbs: 'action words and common verbs',
      adjectives: 'descriptive words and adjectives'
    };
    return categoryMap[category];
  };

  const getDifficultyPrompt = (difficulty: Difficulty): string => {
    const difficultyMap = {
      beginner: 'Use simple, basic words that new English learners would start with.',
      intermediate: 'Use moderately complex words for students with some English experience.',
      advanced: 'Use sophisticated vocabulary for advanced English learners.'
    };
    return difficultyMap[difficulty];
  };

  const getFallbackWords = (category: Category, difficulty: Difficulty): string[] => {
    const fallbackMap = {
      everyday: {
        beginner: ['hello', 'house', 'water', 'book', 'chair', 'door', 'window', 'table', 'phone', 'car', 'tree', 'sun', 'moon', 'day', 'night', 'good', 'bad', 'big', 'small', 'happy'],
        intermediate: ['computer', 'restaurant', 'apartment', 'telephone', 'breakfast', 'afternoon', 'weather', 'beautiful', 'important', 'different', 'probably', 'sometimes', 'everyone', 'something', 'yourself', 'together', 'without', 'through', 'because', 'another'],
        advanced: ['sophisticated', 'extraordinary', 'circumstances', 'acknowledge', 'demonstrate', 'representative', 'characteristic', 'philosophical', 'psychological', 'environmental', 'comprehensive', 'intellectual', 'professional', 'fundamental', 'contemporary', 'responsibility', 'organization', 'appreciation', 'understanding', 'international']
      },
      animals: {
        beginner: ['cat', 'dog', 'bird', 'fish', 'cow', 'pig', 'horse', 'sheep', 'chicken', 'duck', 'mouse', 'bear', 'lion', 'tiger', 'elephant', 'monkey', 'rabbit', 'frog', 'snake', 'butterfly'],
        intermediate: ['dolphin', 'penguin', 'kangaroo', 'crocodile', 'giraffe', 'hippopotamus', 'rhinoceros', 'chimpanzee', 'leopard', 'zebra', 'ostrich', 'peacock', 'flamingo', 'octopus', 'shark', 'whale', 'turtle', 'lizard', 'spider', 'beetle'],
        advanced: ['chameleon', 'orangutan', 'cheetah', 'platypus', 'armadillo', 'porcupine', 'pangolin', 'tapir', 'lemur', 'meerkat', 'wallaby', 'koala', 'sloth', 'anteater', 'iguana', 'salamander', 'stingray', 'barracuda', 'chinchilla', 'mongoose']
      },
      food: {
        beginner: ['apple', 'bread', 'milk', 'egg', 'rice', 'meat', 'fish', 'cake', 'soup', 'tea', 'coffee', 'sugar', 'salt', 'orange', 'banana', 'potato', 'tomato', 'cheese', 'chicken', 'water'],
        intermediate: ['sandwich', 'salad', 'pasta', 'pizza', 'hamburger', 'breakfast', 'lunch', 'dinner', 'restaurant', 'kitchen', 'recipe', 'ingredients', 'vegetables', 'fruits', 'dessert', 'beverage', 'spicy', 'sweet', 'sour', 'delicious'],
        advanced: ['cuisine', 'gourmet', 'appetizer', 'marinade', 'vinaigrette', 'caramelized', 'sautéed', 'braised', 'poached', 'grilled', 'seasoning', 'garnish', 'presentation', 'texture', 'flavor', 'aroma', 'culinary', 'epicurean', 'gastronomic', 'delicacy']
      },
      colors: {
        beginner: ['red', 'blue', 'green', 'yellow', 'black', 'white', 'pink', 'purple', 'orange', 'brown', 'gray', 'dark', 'light', 'bright', 'color', 'paint', 'rainbow', 'gold', 'silver', 'clear'],
        intermediate: ['violet', 'turquoise', 'magenta', 'crimson', 'emerald', 'amber', 'bronze', 'copper', 'ivory', 'beige', 'maroon', 'navy', 'olive', 'coral', 'salmon', 'lavender', 'lime', 'teal', 'indigo', 'scarlet'],
        advanced: ['chartreuse', 'vermillion', 'cerulean', 'ochre', 'sienna', 'umber', 'cobalt', 'cadmium', 'ultramarine', 'viridian', 'mauve', 'fuchsia', 'aquamarine', 'periwinkle', 'celadon', 'taupe', 'ecru', 'sepia', 'burgundy', 'mahogany']
      },
      numbers: {
        beginner: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'zero', 'first', 'second', 'third', 'count', 'number', 'many', 'few', 'more', 'less'],
        intermediate: ['eleven', 'twelve', 'twenty', 'thirty', 'forty', 'fifty', 'hundred', 'thousand', 'million', 'half', 'quarter', 'double', 'triple', 'dozen', 'score', 'percent', 'fraction', 'decimal', 'calculate', 'mathematics'],
        advanced: ['algorithm', 'coefficient', 'denominator', 'exponential', 'factorial', 'geometric', 'hexagonal', 'infinite', 'logarithm', 'polynomial', 'quadratic', 'statistical', 'trigonometry', 'variable', 'equation', 'hypothesis', 'theorem', 'probability', 'derivative', 'integral']
      },
      verbs: {
        beginner: ['go', 'come', 'run', 'walk', 'eat', 'drink', 'sleep', 'work', 'play', 'read', 'write', 'look', 'see', 'hear', 'speak', 'think', 'know', 'want', 'like', 'love'],
        intermediate: ['travel', 'study', 'learn', 'teach', 'explain', 'understand', 'remember', 'forget', 'decide', 'choose', 'prefer', 'suggest', 'recommend', 'organize', 'prepare', 'create', 'develop', 'improve', 'compare', 'analyze'],
        advanced: ['contemplate', 'synthesize', 'hypothesize', 'scrutinize', 'substantiate', 'accommodate', 'consolidate', 'differentiate', 'extrapolate', 'interpolate', 'investigate', 'manipulate', 'necessitate', 'orchestrate', 'perpetuate', 'reciprocate', 'rehabilitate', 'substantiate', 'terminate', 'validate']
      },
      adjectives: {
        beginner: ['big', 'small', 'good', 'bad', 'hot', 'cold', 'fast', 'slow', 'new', 'old', 'young', 'happy', 'sad', 'easy', 'hard', 'long', 'short', 'tall', 'clean', 'dirty'],
        intermediate: ['beautiful', 'interesting', 'important', 'difficult', 'comfortable', 'dangerous', 'expensive', 'popular', 'successful', 'confident', 'generous', 'patient', 'creative', 'flexible', 'responsible', 'reliable', 'efficient', 'effective', 'convenient', 'practical'],
        advanced: ['extraordinary', 'magnificent', 'sophisticated', 'comprehensive', 'fundamental', 'substantial', 'significant', 'considerable', 'remarkable', 'exceptional', 'outstanding', 'phenomenal', 'tremendous', 'spectacular', 'magnificent', 'prestigious', 'distinguished', 'exemplary', 'meticulous', 'immaculate']
      }
    };
    
    return fallbackMap[category][difficulty] || fallbackMap.everyday.beginner;
  };

  const fetchWords = () => {
    fetchWordsWithUsedList();
  };

  const handleNext = () => {
    if (state.current < state.words.length - 1) {
      setState(prev => ({
        ...prev,
        current: prev.current + 1,
        flipped: false,
        showDefinition: false,
      }));
    } else {
      fetchWords();
    }
  };

  const handleAnswer = (correct: boolean) => {
    const newScore = correct ? state.score + 1 : state.score;
    const newTotalScore = correct ? state.totalScore + 1 : state.totalScore;
    const newWordsAttempted = state.wordsAttempted + 1;
    const currentWord = state.words[state.current];

    // If incorrect, add to incorrect words list
    let newIncorrectWords = [...state.incorrectWords];
    if (!correct && currentWord && !newIncorrectWords.includes(currentWord)) {
      newIncorrectWords.push(currentWord);
      localStorage.setItem(`atziriworld-incorrect-words-${state.difficulty}-${state.category}`, JSON.stringify(newIncorrectWords));
    }

    setState(prev => ({
      ...prev,
      score: newScore,
      totalScore: newTotalScore,
      wordsAttempted: newWordsAttempted,
      incorrectWords: newIncorrectWords,
    }));

    localStorage.setItem('atziriworld-total-score', newTotalScore.toString());
    setTimeout(handleNext, 1000);
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setState(prev => ({
      ...prev,
      difficulty,
      score: 0,
      wordsAttempted: 0,
      usedWords: [], // Will be loaded by useEffect
      showPracticeList: false,
      showDefinition: false,
    }));
  };

  const handleCategoryChange = (category: Category) => {
    setState(prev => ({
      ...prev,
      category,
      score: 0,
      wordsAttempted: 0,
      usedWords: [], // Will be loaded by useEffect
      showPracticeList: false,
      showDefinition: false,
    }));
  };

  const resetScore = () => {
    setState(prev => ({ ...prev, totalScore: 0 }));
    localStorage.removeItem('atziriworld-total-score');
  };

  const clearWordHistory = () => {
    setState(prev => ({ ...prev, usedWords: [] }));
    localStorage.removeItem(`atziriworld-used-words-${state.difficulty}-${state.category}`);
  };

  const clearIncorrectWords = () => {
    setState(prev => ({ ...prev, incorrectWords: [] }));
    localStorage.removeItem(`atziriworld-incorrect-words-${state.difficulty}-${state.category}`);
  };

  const fetchWordDefinition = async (word: string) => {
    setState(prev => ({ ...prev, loadingDefinition: true, showDefinition: true }));
    
    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: [
            {
              role: 'user',
              content: `Provide a clear, simple definition of the English word "${word}" that would help someone learning English. Include pronunciation guidance if helpful.`
            }
          ]
        }),
      });

      const data = await response.json();
      let definition = '';
      
      if (data.message) {
        definition = data.message.trim();
      } else if (data.response) {
        definition = data.response.trim();
      } else {
        definition = `"${word}" is an English word that you can practice learning.`;
      }

      setState(prev => ({
        ...prev,
        currentDefinition: definition,
        loadingDefinition: false,
      }));
    } catch (error) {
      console.error('Failed to fetch definition:', error);
      setState(prev => ({
        ...prev,
        currentDefinition: `"${word}" is an English word that you can practice learning.`,
        loadingDefinition: false,
      }));
    }
  };

  const fetchSpanishDefinition = async (word: string) => {
    setState(prev => ({ ...prev, loadingDefinition: true, showDefinition: true }));
    
    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: [
            {
              role: 'user',
              content: `Provide the definition of the English word "${word}" in Spanish. Give a clear, simple explanation in Spanish that would help someone learning English understand what this word means.`
            }
          ]
        }),
      });

      const data = await response.json();
      let definition = '';
      
      if (data.message) {
        definition = data.message.trim();
      } else if (data.response) {
        definition = data.response.trim();
      } else {
        definition = `Definición para "${word}" no está disponible en este momento.`;
      }

      setState(prev => ({
        ...prev,
        currentDefinition: definition,
        loadingDefinition: false,
      }));
    } catch (error) {
      console.error('Failed to fetch Spanish definition:', error);
      setState(prev => ({
        ...prev,
        currentDefinition: `Definición para "${word}" no está disponible en este momento.`,
        loadingDefinition: false,
      }));
    }
  };

  const togglePracticeList = () => {
    setState(prev => ({ 
      ...prev, 
      showPracticeList: !prev.showPracticeList,
      showDefinition: false,
    }));
  };

  const practiceIncorrectWord = (word: string) => {
    const wordIndex = state.words.indexOf(word);
    if (wordIndex !== -1) {
      setState(prev => ({
        ...prev,
        current: wordIndex,
        flipped: false,
        showPracticeList: false,
        showDefinition: false,
      }));
    }
  };

  const playWordAudio = () => {
    const wordToSpeak = state.words[state.current];
    if (!state.audioSupported || !wordToSpeak) return;
    
    setState(prev => ({ ...prev, isPlayingEnglish: true }));
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(wordToSpeak);
    utterance.rate = 0.7; // Slower rate for learners
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 0.8;
    utterance.lang = 'en-US'; // Ensure English pronunciation
    
    utterance.onend = () => {
      setState(prev => ({ ...prev, isPlayingEnglish: false }));
    };
    
    utterance.onerror = () => {
      setState(prev => ({ ...prev, isPlayingEnglish: false }));
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const playSpanishAudio = () => {
    const englishWord = state.words[state.current];
    if (!state.audioSupported || !englishWord) return;
    
    setState(prev => ({ ...prev, isPlayingSpanish: true }));
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Get Spanish translation or fall back to English word
    const spanishWord = translateToSpanish(englishWord);
    
    const utterance = new SpeechSynthesisUtterance(spanishWord);
    utterance.rate = 0.7; // Slower rate for learners
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 0.8;
    utterance.lang = 'es-ES'; // Spanish pronunciation
    
    utterance.onend = () => {
      setState(prev => ({ ...prev, isPlayingSpanish: false }));
    };
    
    utterance.onerror = () => {
      setState(prev => ({ ...prev, isPlayingSpanish: false }));
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Simple English to Spanish translation for common vocabulary words
  const translateToSpanish = (englishWord: string): string => {
    const translations: { [key: string]: string } = {
      // Everyday words
      'hello': 'hola',
      'house': 'casa',
      'water': 'agua',
      'book': 'libro',
      'chair': 'silla',
      'door': 'puerta',
      'window': 'ventana',
      'table': 'mesa',
      'phone': 'teléfono',
      'car': 'coche',
      'tree': 'árbol',
      'sun': 'sol',
      'moon': 'luna',
      'day': 'día',
      'night': 'noche',
      'good': 'bueno',
      'bad': 'malo',
      'big': 'grande',
      'small': 'pequeño',
      'happy': 'feliz',
      
      // Animals
      'cat': 'gato',
      'dog': 'perro',
      'bird': 'pájaro',
      'fish': 'pez',
      'cow': 'vaca',
      'pig': 'cerdo',
      'horse': 'caballo',
      'sheep': 'oveja',
      'chicken': 'pollo',
      'duck': 'pato',
      'mouse': 'ratón',
      'bear': 'oso',
      'lion': 'león',
      'tiger': 'tigre',
      'elephant': 'elefante',
      'monkey': 'mono',
      'rabbit': 'conejo',
      'frog': 'rana',
      'snake': 'serpiente',
      'butterfly': 'mariposa',
      
      // Food
      'apple': 'manzana',
      'bread': 'pan',
      'milk': 'leche',
      'egg': 'huevo',
      'rice': 'arroz',
      'meat': 'carne',
      'cake': 'pastel',
      'soup': 'sopa',
      'tea': 'té',
      'coffee': 'café',
      'sugar': 'azúcar',
      'salt': 'sal',
      'orange': 'naranja',
      'banana': 'plátano',
      'potato': 'patata',
      'tomato': 'tomate',
      'cheese': 'queso',
      
      // Colors
      'red': 'rojo',
      'blue': 'azul',
      'green': 'verde',
      'yellow': 'amarillo',
      'black': 'negro',
      'white': 'blanco',
      'pink': 'rosa',
      'purple': 'morado',
      'brown': 'marrón',
      'gray': 'gris',
      'color': 'color',
      
      // Numbers
      'one': 'uno',
      'two': 'dos',
      'three': 'tres',
      'four': 'cuatro',
      'five': 'cinco',
      'six': 'seis',
      'seven': 'siete',
      'eight': 'ocho',
      'nine': 'nueve',
      'ten': 'diez',
      'zero': 'cero',
      'first': 'primero',
      'second': 'segundo',
      'third': 'tercero',
      
      // Verbs
      'go': 'ir',
      'come': 'venir',
      'run': 'correr',
      'walk': 'caminar',
      'eat': 'comer',
      'drink': 'beber',
      'sleep': 'dormir',
      'work': 'trabajar',
      'play': 'jugar',
      'read': 'leer',
      'write': 'escribir',
      'look': 'mirar',
      'see': 'ver',
      'hear': 'oír',
      'speak': 'hablar',
      'think': 'pensar',
      'know': 'saber',
      'want': 'querer',
      'like': 'gustar',
      'love': 'amar',
      
      // Adjectives
      'old': 'viejo',
      'new': 'nuevo',
      'hot': 'caliente',
      'cold': 'frío',
      'fast': 'rápido',
      'slow': 'lento',
      'sad': 'triste',
      'beautiful': 'hermoso',
      'ugly': 'feo',
      'easy': 'fácil',
      'hard': 'difícil',
      'strong': 'fuerte',
      'weak': 'débil',
      'tall': 'alto',
      'short': 'bajo'
    };
    
    // Return Spanish translation if available, otherwise return the English word
    // (some advanced words might not have translations in our dictionary)
    return translations[englishWord.toLowerCase()] || englishWord;
  };

  const currentWord = state.words[state.current] || '';

  const categoryEmojis = {
    everyday: '🏠',
    animals: '🐾',
    food: '🍎',
    colors: '🌈',
    numbers: '🔢',
    verbs: '🏃',
    adjectives: '✨'
  };

  const difficultyColors = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-red-500'
  };

  return (
    <div className="atziri-world-game p-6 max-w-2xl mx-auto min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
      <div className="header mb-8">
        <h1 className="text-4xl font-bold text-center mb-2 text-purple-800">
          🌍 Atziri's World 🌍
        </h1>
        <p className="text-center text-purple-600 mb-6">Learn English Vocabulary</p>
        
        {/* Category Selector */}
        <div className="category-selector mb-4">
          <p className="text-center text-sm font-semibold mb-2 text-gray-700">Choose a Category:</p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {(['everyday', 'animals', 'food', 'colors', 'numbers', 'verbs', 'adjectives'] as Category[]).map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                  state.category === cat
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-purple-700 hover:bg-purple-100'
                } border-2 border-purple-300 transition-all`}
              >
                {categoryEmojis[cat]} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="difficulty-selector mb-4">
          <p className="text-center text-sm font-semibold mb-2 text-gray-700">Choose Difficulty:</p>
          <div className="flex justify-center gap-2 mb-4">
            {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={`px-4 py-2 rounded-lg capitalize font-medium ${
                  state.difficulty === level
                    ? `${difficultyColors[level]} text-white`
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-all`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="score-display text-center">
          <div className="text-lg">
            Session: {state.score}/{state.wordsAttempted} | Total: {state.totalScore}
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Words used: {state.usedWords.length} | Need practice: {state.incorrectWords.length}
          </div>
          <div className="flex justify-center gap-4 mb-2 flex-wrap">
            <button
              onClick={resetScore}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              Reset Total Score
            </button>
            <button
              onClick={clearWordHistory}
              className="text-sm text-blue-500 hover:text-blue-700 underline"
            >
              Clear Word History
            </button>
            {state.incorrectWords.length > 0 && (
              <>
                <button
                  onClick={togglePracticeList}
                  className="text-sm text-purple-500 hover:text-purple-700 underline"
                >
                  {state.showPracticeList ? 'Hide' : 'Show'} Practice List
                </button>
                <button
                  onClick={clearIncorrectWords}
                  className="text-sm text-orange-500 hover:text-orange-700 underline"
                >
                  Clear Practice List
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Practice List */}
      {state.showPracticeList && state.incorrectWords.length > 0 && (
        <div className="practice-list mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <h2 className="text-xl font-bold text-center mb-3 text-yellow-800">
            Words to Practice ({state.incorrectWords.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {state.incorrectWords.map((word, index) => (
              <button
                key={index}
                onClick={() => practiceIncorrectWord(word)}
                className="p-2 bg-white border border-yellow-300 rounded hover:bg-yellow-100 text-center transition-all"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Definition Display */}
      {state.showDefinition && (
        <div className="definition-display mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-blue-800">
              📖 Definition of "{currentWord}"
            </h3>
            <button
              onClick={() => setState(prev => ({ ...prev, showDefinition: false }))}
              className="text-blue-600 hover:text-blue-800 text-xl font-bold"
            >
              ×
            </button>
          </div>
          {state.loadingDefinition ? (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Loading definition...
            </div>
          ) : (
            <p className="text-blue-700">{state.currentDefinition}</p>
          )}
        </div>
      )}



      {state.loading ? (
        <div className="text-center py-12">
          <div className="text-xl">Loading {state.category} words...</div>
          <div className="text-purple-600 mt-2">Difficulty: {state.difficulty}</div>
        </div>
      ) : (
        <>
          <div className="flip-card-container mb-8 flex justify-center">
            <div 
              className="flip-card w-96 h-64 relative"
              style={{ perspective: '1000px' }}
            >
              <div 
                className={`flip-card-inner absolute w-full h-full transition-transform duration-700 ${state.flipped ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div 
                  className="flip-card-front absolute w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-purple-300 rounded-lg shadow-lg flex items-center justify-center cursor-pointer hover:from-purple-300 hover:to-pink-300 transition-all"
                  style={{ backfaceVisibility: 'hidden' }}
                  onClick={() => setState(prev => ({ ...prev, flipped: true }))}
                  title="Click to test yourself!"
                >
                  <div className="text-center">
                    <div className="text-6xl font-bold text-purple-800 mb-2">
                      {currentWord}
                    </div>
                    <div className="text-sm text-purple-600 capitalize">
                      {categoryEmojis[state.category]} {state.category} • {state.difficulty}
                    </div>
                  </div>
                </div>
                <div 
                  className="flip-card-back absolute w-full h-full bg-gradient-to-br from-green-200 to-blue-200 border-2 border-green-300 rounded-lg shadow-lg flex flex-col items-center justify-center"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className="text-2xl text-green-800 text-center mb-4">
                    Do you know this word?
                  </div>
                  <div className="flex flex-col gap-3 items-center">
                    <div className="flex gap-2">
                      {state.audioSupported && (
                        <>
                          <button
                            onClick={playWordAudio}
                            disabled={state.isPlayingEnglish}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            title="Listen to English pronunciation"
                          >
                            {state.isPlayingEnglish ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Playing...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.914 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.914l3.469-2.816a1 1 0 011.617.816zM16 10a1 1 0 01-.832.986 4.002 4.002 0 010-1.972A1 1 0 0116 10zm-4 3.75a1 1 0 01-.832.986 8.003 8.003 0 010-9.472A1 1 0 0112 6.25v7.5z" clipRule="evenodd" />
                                </svg>
                                🇺🇸 English
                              </>
                            )}
                          </button>
                          <button
                            onClick={playSpanishAudio}
                            disabled={state.isPlayingSpanish}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            title="Listen to Spanish translation"
                          >
                            {state.isPlayingSpanish ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Playing...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.914 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.914l3.469-2.816a1 1 0 011.617.816zM16 10a1 1 0 01-.832.986 4.002 4.002 0 010-1.972A1 1 0 0116 10zm-4 3.75a1 1 0 01-.832.986 8.003 8.003 0 010-9.472A1 1 0 0112 6.25v7.5z" clipRule="evenodd" />
                                </svg>
                                🇪🇸 Español
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchWordDefinition(currentWord)}
                        disabled={state.loadingDefinition}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                        title="Get definition"
                      >
                        {state.loadingDefinition ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            📖 Definition
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => fetchSpanishDefinition(currentWord)}
                        disabled={state.loadingDefinition}
                        className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                        title="Get Spanish definition"
                      >
                        {state.loadingDefinition ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            🌐 Español
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="controls text-center space-y-4">
            {state.flipped && (
              <div className="answer-buttons space-x-4">
                <button
                  onClick={() => handleAnswer(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg hover:bg-green-600 transition-all"
                >
                  ✅ I Know It!
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg text-lg hover:bg-red-600 transition-all"
                >
                  ❌ Need to Learn
                </button>
              </div>
            )}

            <div>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-all"
                disabled={!currentWord}
              >
                ⏭️ Next Word
              </button>
            </div>
          </div>

          <div className="progress text-center mt-6 text-gray-600">
            Word {state.current + 1} of {state.words.length}
          </div>
        </>
      )}
    </div>
  );
}
