import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Question {
	question: string;
	options: string[];
	answer: number;
	id?: string; // For tracking used questions
}

interface AIQuestion {
	question: string;
	options: string[];
	correct: number;
}

interface MistakeQuestion extends Question {
	userAnswer: number;
	timesWrong: number;
}

// The 62 priority Medical Assistant questions with scientific names where applicable
const PRIORITY_MA_QUESTIONS: Question[] = [
	{
		id: 'arthroscopy',
		question: 'What test is the visual inspection of a joint?',
		options: ['Arthroscopy (Arthroskopein)', 'MRI (Magnetic Resonance Imaging)', 'X-ray (Radiography)', 'Ultrasound (Ultrasonography)'],
		answer: 0,
	},
	{
		id: 'haversian-canals',
		question: 'What are openings on the long bones where blood vessels and nerves pass through the periosteum called?',
		options: ['Haversian Canals (Canalis Haversii)', 'Volkmann canals (Canalis Volkmann)', 'Lacunae (Lacunae osseae)', 'Canaliculi (Canaliculi ossei)'],
		answer: 0,
	},
	{
		id: 'hemophilia',
		question: 'What genetic disease is carried by females but only affects males?',
		options: ['Huntington Disease (Huntington Chorea)', 'Klinefelter Disease (XXY Syndrome)', 'Hemophilia (Haemophilia)', 'Duchenne Muscular Dystrophy (DMD)'],
		answer: 2,
	},
	{
		id: 'serum-globulin',
		question: 'What is the role of serum globulin in blood plasma?',
		options: ['Transport oxygen (Oxygen transport)', 'Assists in the formation of antibodies (Immunoglobulins)', 'Regulate blood sugar (Glucose homeostasis)', 'Clot blood (Hemostasis)'],
		answer: 1,
	},
	{
		id: 'tendons-ligaments',
		question: 'True or False: Tendons stretch but ligaments don\'t',
		options: ['True (Verum)', 'False (Falsum)'],
		answer: 0,
	},
	{
		id: 'tb-causes',
		question: 'What causes the influx of TB (Tuberculosis - Mycobacterium tuberculosis)?',
		options: ['AIDS, use of drugs, influx of 3rd world immigrants (Multiple risk factors)', 'Poor sanitation only (Sanitation factors)', 'Air pollution (Environmental factors)', 'Genetic factors (Hereditary predisposition)'],
		answer: 0,
	},
	{
		id: 'tricuspid-valve',
		question: 'Where is the tricuspid valve (Valva tricuspidalis)?',
		options: ['Between the left atrium and left ventricle (Mitral valve location)', 'Between the right atrium and right ventricle (Tricuspid valve location)', 'In the aorta (Aortic valve location)', 'In the pulmonary artery (Pulmonary valve location)'],
		answer: 1,
	},
	{
		id: 'snoring-percentage',
		question: 'What percentage of men are habitual snorers?',
		options: ['25% (Quarter prevalence)', '30% (Moderate prevalence)', '40% (High prevalence)', '50% (Half prevalence)'],
		answer: 2,
	},
	{
		id: 'larynx-symptom',
		question: 'What is the earliest symptom of a disease in the larynx?',
		options: ['Cough (Tussis)', 'Hoarseness (Raucitas)', 'Fever (Pyrexia)', 'Difficulty swallowing (Dysphagia)'],
		answer: 1,
	},
	{
		id: 'rds-age',
		question: 'What is the peak age for risk of RDS (Respiratory Distress Syndrome)?',
		options: ['Full-term babies (Term neonates)', 'Babies born before 37-39 weeks (Preterm neonates)', 'Babies over 40 weeks (Post-term neonates)', 'All ages equally (Equal distribution)'],
		answer: 1,
	},
	{
		id: 'tnm-staging',
		question: 'What does T in TNM stand for (Cancer Staging)?',
		options: ['Type (Classification)', 'Tumor (Primary tumor)', 'Tissue (Tissue type)', 'Treatment (Therapeutic approach)'],
		answer: 1,
	},
	{
		id: 'cancer-treatment',
		question: 'What is the oldest most common form of cancer treatment?',
		options: ['Chemotherapy (Systemic therapy)', 'Radiation (Radiotherapy)', 'Surgery (Surgical resection)', 'Immunotherapy (Biological therapy)'],
		answer: 2,
	},
	{
		id: 'surfactant',
		question: 'What is the fatty molecule that keeps the lungs from collapsing?',
		options: ['Mucus (Mucus secretion)', 'Surfactant (Pulmonary surfactant)', 'Albumin (Serum albumin)', 'Cholesterol (Cholesterolum)'],
		answer: 1,
	},
	{
		id: 'centrosome',
		question: 'What organelle within the cell produces spindle fibers that attach to chromosomes during cellular division?',
		options: ['Mitochondria', 'Centrosome (Centrosomal apparatus)', 'Nucleus', 'Ribosome'],
		answer: 1,
	},
	{
		id: 'hypotonic-solution',
		question: 'What happens to a blood cell when placed in a hypotonic solution?',
		options: ['Shrink', 'Swell and burst (Hemolysis)', 'Stay the same', 'Divide'],
		answer: 1,
	},
	{
		id: 'clubfoot',
		question: 'What is the name for clubfoot?',
		options: ['Scoliosis', 'Talipes (Talipes equinovarus)', 'Kyphosis', 'Lordosis'],
		answer: 1,
	},
	{
		id: 'ciliary-body',
		question: 'When the ciliary body contracts, what does it do to the lens?',
		options: ['The lens becomes flatter', 'The lens becomes rounder (Accommodation)', 'No change', 'The lens becomes opaque'],
		answer: 1,
	},
	{
		id: 'resting-potential',
		question: 'What is normal resting potential (Membrane potential)?',
		options: ['Positive inside, negative outside', 'Negative inside, positive outside', 'Neutral both sides', 'Variable'],
		answer: 1,
	},
	{
		id: 'melanoma-age',
		question: 'What is the peak age for malignant melanoma?',
		options: ['30 years (Third decade)', '40 years (Fourth decade)', '50 years (Fifth decade)', '60 years (Sixth decade)'],
		answer: 2,
	},
	{
		id: 'skin-body-weight',
		question: 'What percent of body weight is skin?',
		options: ['10% (One tenth)', '15% (Fifteen percent)', '20% (One fifth)', '25% (One quarter)'],
		answer: 1,
	},
	{
		id: 'tourettes-symptom',
		question: 'What is the first symptom of tourettes?',
		options: ['Vocal tics (Phonic tics)', 'Facial tic (Motor tics)', 'Hand movements (Manual tics)', 'Head jerking (Cephalic tics)'],
		answer: 1,
	},
	{
		id: 'brain-cavities',
		question: 'What are spaces or cavities in the brain called?',
		options: ['Sulci (Brain grooves)', 'Ventricles (Ventricular system)', 'Fissures (Deep grooves)', 'Lobes (Brain regions)'],
		answer: 1,
	},
	{
		id: 'nerve-impulse-speed',
		question: 'How fast do nerve impulses travel?',
		options: ['100 mph (160 km/h)', '200 mph (320 km/h)', '300 mph (480 km/h)', '400 mph (640 km/h)'],
		answer: 1,
	},
	{
		id: 'paralysis-types',
		question: 'What are the two main groups of paralysis?',
		options: ['Paraplegia, hemiplegia (Lower body/Half body paralysis)', 'Quadriplegia, monoplegia (Four limbs/Single limb)', 'Spastic, flaccid (Muscle tone types)', 'Upper, lower (Motor neuron types)'],
		answer: 0,
	},
	{
		id: 'cellulitis',
		question: 'What is cellulitis?',
		options: ['Skin cancer (Malignant neoplasm)', 'Common skin infection caused by bacteria characterized by acute or diffuse or spreading inflammation of the skin and subcutaneous tissue (Bacterial cellulitis)', 'Viral infection (Viral dermatitis)', 'Fungal infection (Mycotic dermatitis)'],
		answer: 1,
	},
	{
		id: 'vitamins-skin',
		question: 'What vitamins can pass through the skin?',
		options: ['All vitamins (Complete vitamin absorption)', 'Not vitamin C (Excluding ascorbic acid)', 'Only fat-soluble vitamins (Lipophilic vitamins)', 'Only water-soluble vitamins (Hydrophilic vitamins)'],
		answer: 1,
	},
	{
		id: 'macular-degeneration',
		question: 'What are the recommended modifications for age related macular degeneration (AMD)?',
		options: ['Exercise more (Physical activity)', 'Quit smoking, take vitamins (Lifestyle modification)', 'Surgery only (Surgical intervention)', 'No treatment available (Palliative care)'],
		answer: 1,
	},
	{
		id: 'lymph-nodes',
		question: 'What are lymph nodes full of?',
		options: ['Red blood cells', 'T and B cells (Lymphocytes)', 'Platelets', 'Plasma'],
		answer: 1,
	},
	{
		id: 'peyers-patch',
		question: 'Where is the peyer\'s patch (Aggregated lymphoid nodules) located?',
		options: ['Large intestine', 'Small intestine, ileum', 'Stomach', 'Liver'],
		answer: 1,
	},
	{
		id: 'kidney-displacement',
		question: 'Which kidney is displaced by the liver?',
		options: ['Left kidney (Ren sinister)', 'Right kidney (Ren dexter)', 'Both kidneys (Bilateral kidneys)', 'Neither kidney (No displacement)'],
		answer: 1,
	},
	{
		id: 'urine-production',
		question: 'Urine is produced by what?',
		options: ['Filtration (Glomerular filtration)', 'Secretion', 'Absorption', 'Diffusion'],
		answer: 1,
	},
	{
		id: 'upper-gi-series',
		question: 'What is true about an upper GI series: It is painful, 2-3 day diet of high residue food, stop oral intake 2 hours prior, need to ingest barium?',
		options: ['It is painful', '2-3 day diet of high residue food', 'Stop oral intake 2 hours prior', 'Barium (Barium sulfate)'],
		answer: 3,
	},
	{
		id: 'thymus',
		question: 'What is the 3 lobed structure under the sternum?',
		options: ['Heart', 'Xiphoid process, thymus (Thymus gland)', 'Lung', 'Liver'],
		answer: 1,
	},
	{
		id: 'thyroxine-gland',
		question: 'What gland produces thyroxine (T4)?',
		options: ['Parathyroid', 'Thyroid (Thyroid gland)', 'Adrenal', 'Pituitary'],
		answer: 1,
	},
	{
		id: 'tot-procedure',
		question: 'What is TOT (Transobturator tape) used for?',
		options: ['Heart disease (Cardiac pathology)', 'Stress urinary incontinence (Urethral dysfunction)', 'Diabetes (Metabolic disorder)', 'Hypertension (High blood pressure)'],
		answer: 1,
	},
	{
		id: 'chronic-renal-failure',
		question: 'Symptoms of chronic renal failure (CKD) include:',
		options: ['Increased energy (Hyperactivity)', 'Tiredness, Vomiting, Hypertension (Uremic syndrome)', 'Weight gain only (Fluid retention)', 'Fever (Pyrexia)'],
		answer: 1,
	},
	{
		id: 'female-development',
		question: 'Without what hormone, a female develops?',
		options: ['Estrogen (Estradiol)', 'Testosterone (Male hormone)', 'Progesterone (Gestational hormone)', 'FSH (Follicle-stimulating hormone)'],
		answer: 1,
	},
	{
		id: 'klinefelter-test',
		question: 'What is the test for klinefelters (Klinefelter syndrome)?',
		options: ['Blood test', 'Chromosome analysis (Karyotyping)', 'Urine test', 'Physical exam'],
		answer: 1,
	},
	{
		id: 'thyroid-location',
		question: 'Where are the thyroid glands located?',
		options: ['Chest (Thoracic cavity)', 'Throat (Neck - Cervical region)', 'Abdomen (Abdominal cavity)', 'Head (Cranial region)'],
		answer: 1,
	},
	{
		id: 'adrenal-hormones',
		question: 'What do the adrenal glands (Suprarenal glands) produce?',
		options: ['Only cortisol (Glucocorticoid only)', 'Androgens, estrogen, aldosterone, cortisol (Multiple hormones)', 'Only adrenaline (Epinephrine only)', 'Insulin (Pancreatic hormone)'],
		answer: 1,
	},
	{
		id: 'testicular-cancer-age',
		question: 'What is the peak age for testicular cancer?',
		options: ['10-19 yrs old (Second decade)', '20-34 yrs old (Third decade)', '35-49 yrs old (Fourth decade)', '50+ yrs old (Fifth decade+)'],
		answer: 1,
	},
	{
		id: 'sperm-hormone',
		question: 'What hormone stimulates the production of sperm (Spermatogenesis)?',
		options: ['LH (Luteinizing hormone)', 'FSH (Follicle-stimulating hormone)', 'Testosterone', 'GH (Growth hormone)'],
		answer: 1,
	},
	{
		id: 'heart-contraction',
		question: 'What is the contraction phase of the heart?',
		options: ['Diastole', 'Systole (Ventricular systole)', 'Relaxation', 'Filling'],
		answer: 1,
	},
	{
		id: 'sarcoma',
		question: 'Sarcoma is a tumor of what tissue?',
		options: ['Epithelial tissue', 'Connective tissue (Mesenchymal tissue)', 'Nervous tissue', 'Muscle tissue only'],
		answer: 1,
	},
	{
		id: 'salivary-amylase',
		question: 'What enzyme in saliva breaks down carbohydrates?',
		options: ['Pepsin', 'Amylase (Salivary amylase)', 'Lipase', 'Trypsin'],
		answer: 1,
	},
	{
		id: 'ivp-allergy',
		question: 'In IVP (Intravenous pyelogram) what can\'t the patient be allergic to?',
		options: ['Shellfish', 'Iodine (Contrast dye)', 'Latex', 'Penicillin'],
		answer: 1,
	},
	{
		id: 'nipd-exchanges',
		question: 'How many overnight exchanges are there on NIPD (Nocturnal intermittent peritoneal dialysis)?',
		options: ['1-2', '3-5', '6-8', '9-10'],
		answer: 1,
	},
	{
		id: 'medulla-pyramid',
		question: 'Is the medulla connected to the renal pyramid?',
		options: ['Yes (Connected)', 'No (Not connected)'],
		answer: 0,
	},
	{
		id: 'myoclonus',
		question: 'Which condition has uncontrollable twitching and spasm of the muscles?',
		options: ['Ataxia (Coordination disorder)', 'Myoclonus (Muscle jerks)', 'Dystonia (Muscle tone disorder)', 'Tremor (Rhythmic shaking)'],
		answer: 1,
	},
	{
		id: 'hyperparathyroidism',
		question: 'What are the symptoms of Hyperparathyroidism?',
		options: ['High energy, weight loss (Hyperthyroid symptoms)', 'Bone pain, muscle weakness, fatigue, depression, and increased urination or thirst (Hypercalcemia symptoms)', 'Fever, chills (Infection symptoms)', 'Rash, itching (Dermatological symptoms)'],
		answer: 1,
	},
	{
		id: 'glycogen-storage',
		question: 'Where is glycogen stored?',
		options: ['Kidney', 'Liver (Hepatic glycogen)', 'Heart', 'Brain'],
		answer: 1,
	},
	{
		id: 'pituitary-attachment',
		question: 'What organ is the pituitary gland (Hypophysis) attached to?',
		options: ['Heart', 'Brain (Hypothalamus)', 'Liver', 'Kidney'],
		answer: 1,
	},
	{
		id: 'prostatic-hypertrophy',
		question: 'Initial symptoms of prostatic hypertrophy (BPH - Benign prostatic hyperplasia) include:',
		options: ['Back pain (Dorsal pain)', 'Frequent urination (Urinary frequency)', 'Chest pain (Thoracic pain)', 'Headache (Cephalgia)'],
		answer: 1,
	},
	{
		id: 'gonorrhea-symptoms',
		question: 'Symptom of gonorrhea (Neisseria gonorrhoeae) in men includes:',
		options: ['Only fever (Pyrexia only)', 'Sore throat, dysuria, discharge from penis (Urethritis symptoms)', 'Only rash (Dermatitis only)', 'Joint pain (Arthralgia only)'],
		answer: 1,
	},
	{
		id: 'adipose-tissue',
		question: 'What type of tissue is adipose tissue?',
		options: ['Epithelial tissue', 'Connective tissue (Fat tissue)', 'Muscle tissue', 'Nervous tissue'],
		answer: 1,
	},
	{
		id: 'cell-membrane',
		question: 'What is the cell membrane (Plasma membrane) made up of?',
		options: ['Only lipids', 'Protein and carbs (Phospholipid bilayer)', 'Only proteins', 'Only carbohydrates'],
		answer: 1,
	},
	{
		id: 'cerebrospinal-fluid',
		question: 'How much cerebrospinal fluid (CSF) is formed within the ventricles of the brain a day?',
		options: ['250 mL (Quarter liter)', '500 mL (Half liter)', '750 mL (Three quarters liter)', '1000 mL (One liter)'],
		answer: 1,
	},
	{
		id: 'menieres-disease',
		question: 'What condition is characterized by severe vertigo and tinnitus?',
		options: ['Otitis media (Middle ear infection)', 'Meniere\'s disease (Endolymphatic hydrops)', 'Acoustic neuroma (Vestibular schwannoma)', 'Presbycusis (Age-related hearing loss)'],
		answer: 1,
	},
	{
		id: 'open-reduction',
		question: 'What is the surgical procedure for involved fractures to repair the skin and surrounding tissue or to put small bone fragments back?',
		options: ['Closed reduction (Non-surgical alignment)', 'Open reduction (ORIF)', 'Internal fixation (Hardware placement)', 'External fixation (External frame)'],
		answer: 1,
	},
	{
		id: 'triglycerides',
		question: 'According to U.S. National Heart, Lung, and Blood Institute, triglycerides should be below what?',
		options: ['150 mg/dL (Normal level)', '200 mg/dL (Borderline high)', '250 mg/dL (High level)', '300 mg/dL (Very high level)'],
		answer: 1,
	},
	{
		id: 'bleeding-time',
		question: 'What is the normal bleeding range for template puncture method?',
		options: ['Up to 5 min (Short duration)', 'Up to 8 min (Normal duration)', 'Up to 10 min (Extended duration)', 'Up to 15 min (Prolonged duration)'],
		answer: 1,
	},
	{
		id: 'pacemaker',
		question: 'Small battery powered pulse generator with electrode catheters inserted into vein and threaded through vena cava describes what?',
		options: ['Defibrillator (Cardioversion device)', 'Artificial pacemaker (Cardiac pacemaker)', 'Stent (Vascular support)', 'Catheter (Tube device)'],
		answer: 1,
	},
	{
		id: 'hordeolum',
		question: 'What is another word for stye?',
		options: ['Chalazion (Meibomian cyst)', 'Hordeolum (Eyelid infection)', 'Pterygium (Eye growth)', 'Pinguecula (Eye deposit)'],
		answer: 1,
	},
	{
		id: 'transverse-process',
		question: 'What is the winglike projection of the vertebral column?',
		options: ['Spinous process (Posterior projection)', 'Transverse process (Lateral projection)', 'Vertebral arch (Posterior arch)', 'Lamina (Arch component)'],
		answer: 1,
	},
];

// Additional fallback MA questions
const FALLBACK_MA_QUESTIONS: Question[] = [
	{
		id: 'heart-lungs-chamber',
		question: 'Which chamber of the heart pumps blood to the lungs?',
		options: ['Left atrium (Atrium sinistrum)', 'Right ventricle (Ventriculus dexter)', 'Left ventricle (Ventriculus sinister)', 'Right atrium (Atrium dextrum)'],
		answer: 1,
	},
	{
		id: 'largest-organ',
		question: 'What is the largest organ in the human body?',
		options: ['Heart (Cor)', 'Liver (Hepar)', 'Skin (Integumentary system)', 'Brain (Cerebrum)'],
		answer: 2,
	},
	{
		id: 'bone-count',
		question: 'How many bones are in the adult human body?',
		options: ['186 bones (Fewer bones)', '206 bones (Standard count)', '226 bones (More bones)', '246 bones (Excessive count)'],
		answer: 1,
	},
	{
		id: 'central-nervous-system',
		question: 'Which part of the nervous system includes the brain and spinal cord?',
		options: ['Peripheral nervous system (PNS)', 'Central nervous system (CNS)', 'Autonomic nervous system (ANS)', 'Sympathetic nervous system (SNS)'],
		answer: 1,
	},
	{
		id: 'body-temperature',
		question: 'What is the normal body temperature in Fahrenheit?',
		options: ['96.8°F (Hypothermic)', '97.6°F (Below normal)', '98.6°F (Normal temperature)', '99.6°F (Febrile)'],
		answer: 2,
	},
	{
		id: 'cardiac-muscle',
		question: 'Which type of muscle is found in the heart?',
		options: ['Skeletal muscle (Striated voluntary)', 'Smooth muscle (Non-striated involuntary)', 'Cardiac muscle (Myocardium)', 'Voluntary muscle (Skeletal type)'],
		answer: 2,
	},
	{
		id: 'hypertension',
		question: 'What is the medical term for high blood pressure?',
		options: ['Hypotension (Low pressure)', 'Hypertension (High pressure)', 'Tachycardia (Fast heart rate)', 'Bradycardia (Slow heart rate)'],
		answer: 1,
	},
	{
		id: 'insulin-organ',
		question: 'Which organ produces insulin?',
		options: ['Liver (Hepar)', 'Kidney (Ren)', 'Pancreas (Islets of Langerhans)', 'Spleen (Lien)'],
		answer: 2,
	},
	{
		id: 'nephron',
		question: 'What is the basic functional unit of the kidney?',
		options: ['Alveoli (Lung units)', 'Nephron (Kidney units)', 'Neuron (Nerve cells)', 'Villus (Intestinal projections)'],
		answer: 1,
	},
	{
		id: 'red-blood-cells',
		question: 'Which blood cells are responsible for carrying oxygen?',
		options: ['White blood cells (Leukocytes)', 'Platelets (Thrombocytes)', 'Red blood cells (Erythrocytes)', 'Plasma cells (Antibody producers)'],
		answer: 2,
	},
];

interface MedicalAssistantProps {
	onExit: () => void;
}

const MedicalAssistant: React.FC<MedicalAssistantProps> = ({ onExit }) => {
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
	// Track used priority questions to ensure we use them first
	const [usedPriorityQuestions, setUsedPriorityQuestions] = useState<Set<number>>(new Set());
	// New states for enhanced features
	const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
	const [mistakes, setMistakes] = useState<MistakeQuestion[]>([]);
	const [showMistakes, setShowMistakes] = useState(false);
	const [isPlayingAudio, setIsPlayingAudio] = useState(false);
	const [practicingMistakes, setPracticingMistakes] = useState(false);
	const [playingOptionIndex, setPlayingOptionIndex] = useState<number | null>(null);

	// Load accumulative score from localStorage
	const loadAccumulativeScore = () => {
		try {
			const savedData = localStorage.getItem('medicalAssistantAccumulative');
			if (savedData) {
				const { totalScore: savedTotalScore, gamesPlayed: savedGamesPlayed } = JSON.parse(savedData);
				setTotalScore(savedTotalScore || 0);
				setGamesPlayed(savedGamesPlayed || 0);
			}
			
			// Load used question IDs
			const savedUsedIds = localStorage.getItem('medicalAssistantUsedIds');
			if (savedUsedIds) {
				setUsedQuestionIds(new Set(JSON.parse(savedUsedIds)));
			}
			
			// Load mistakes
			const savedMistakes = localStorage.getItem('medicalAssistantMistakes');
			if (savedMistakes) {
				setMistakes(JSON.parse(savedMistakes));
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
			localStorage.setItem('medicalAssistantAccumulative', JSON.stringify(dataToSave));
		} catch (error) {
			console.error('Error saving accumulative score:', error);
		}
	};

	// Save used question IDs
	const saveUsedQuestionIds = (ids: Set<string>) => {
		try {
			localStorage.setItem('medicalAssistantUsedIds', JSON.stringify(Array.from(ids)));
		} catch (error) {
			console.error('Error saving used question IDs:', error);
		}
	};

	// Save mistakes
	const saveMistakes = (mistakeList: MistakeQuestion[]) => {
		try {
			localStorage.setItem('medicalAssistantMistakes', JSON.stringify(mistakeList));
		} catch (error) {
			console.error('Error saving mistakes:', error);
		}
	};

	// Text-to-speech function for individual answer options
	const speakOption = (optionText: string, optionIndex: number) => {
		if (isPlayingAudio || questions.length === 0) return;
		
		setIsPlayingAudio(true);
		setPlayingOptionIndex(optionIndex);
		
		// Include scientific names in speech by converting parentheses to spoken format
		const textToSpeak = optionText.replace(/\(([^)]*)\)/g, ', also known as $1,');
		
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(textToSpeak);
			utterance.rate = 0.8;
			utterance.pitch = 1;
			utterance.volume = 0.8;
			utterance.onend = () => {
				setIsPlayingAudio(false);
				setPlayingOptionIndex(null);
			};
			utterance.onerror = () => {
				setIsPlayingAudio(false);
				setPlayingOptionIndex(null);
			};
			speechSynthesis.speak(utterance);
		} else {
			setIsPlayingAudio(false);
			setPlayingOptionIndex(null);
			alert('Text-to-speech is not supported in your browser.');
		}
	};

	// Helper function to format text for display (replace parentheses with dashes)
	const formatDisplayText = (text: string) => {
		return text.replace(/\(([^)]*)\)/g, ' - $1');
	};

	// Reset accumulative score
	const resetAccumulativeScore = () => {
		setTotalScore(0);
		setGamesPlayed(0);
		setUsedPriorityQuestions(new Set());
		setUsedQuestionIds(new Set());
		setMistakes([]);
		localStorage.removeItem('medicalAssistantAccumulative');
		localStorage.removeItem('medicalAssistantUsedIds');
		localStorage.removeItem('medicalAssistantMistakes');
	};

	// Add mistake to tracking
	const addMistake = (question: Question, userAnswer: number) => {
		const existingMistakeIndex = mistakes.findIndex(m => m.id === question.id);
		let newMistakes: MistakeQuestion[];
		
		if (existingMistakeIndex >= 0) {
			// Increment times wrong for existing mistake
			newMistakes = [...mistakes];
			newMistakes[existingMistakeIndex].timesWrong += 1;
		} else {
			// Add new mistake
			const newMistake: MistakeQuestion = {
				...question,
				userAnswer,
				timesWrong: 1
			};
			newMistakes = [...mistakes, newMistake];
		}
		
		setMistakes(newMistakes);
		saveMistakes(newMistakes);
	};

	// Start practicing mistakes
	const startMistakePractice = () => {
		if (mistakes.length === 0) return;
		
		setPracticingMistakes(true);
		setQuestions(mistakes);
		setCurrent(0);
		setScore(0);
		setSelected(null);
		setShowAnswer(false);
		setFinished(false);
		setLoadingQuestions(false);
	};

	const handleOption = (idx: number) => {
		if (showAnswer || questions.length === 0) return;
		setSelected(idx);
		setShowAnswer(true);
		
		if (idx === questions[current].answer) {
			setScore(score + 1);
		} else {
			// Track mistake if not practicing mistakes and question has ID
			if (!practicingMistakes && questions[current].id) {
				addMistake(questions[current], idx);
			}
		}
	};

	const next = () => {
		if (current + 1 < questions.length) {
			setCurrent(current + 1);
			setSelected(null);
			setShowAnswer(false);
		} else {
			// Game finished - update accumulative score
			if (!practicingMistakes) {
				const newTotalScore = totalScore + score;
				const newGamesPlayed = gamesPlayed + 1;
				setTotalScore(newTotalScore);
				setGamesPlayed(newGamesPlayed);
				saveAccumulativeScore(newTotalScore, newGamesPlayed);
				
				// Mark questions as used
				const newUsedIds = new Set(usedQuestionIds);
				questions.forEach(q => {
					if (q.id) newUsedIds.add(q.id);
				});
				setUsedQuestionIds(newUsedIds);
				saveUsedQuestionIds(newUsedIds);
			}
			setFinished(true);
		}
	};

	const restart = async () => {
		setCurrent(0);
		setScore(0);
		setSelected(null);
		setShowAnswer(false);
		setFinished(false);
		setPracticingMistakes(false);
		// Generate new questions
		const newQuestions = await generateQuestions(5);
		setQuestions(newQuestions);
	};

	// Generate questions with priority for the specific questions first, avoiding repeats
	const generateQuestions = async (numQuestions: number = 5): Promise<Question[]> => {
		setLoadingQuestions(true);
		try {
			console.log(`Generating ${numQuestions} ${difficulty} Medical Assistant questions...`);

			// Filter out questions that have been used (by ID)
			const availablePriorityQuestions = PRIORITY_MA_QUESTIONS.filter(q => 
				q.id && !usedQuestionIds.has(q.id)
			);

			const selectedQuestions: Question[] = [];

			if (availablePriorityQuestions.length > 0) {
				// Use priority questions first (randomly selected from available ones)
				const questionsToUse = Math.min(numQuestions, availablePriorityQuestions.length);
				
				// Randomly select from available priority questions
				const shuffledQuestions = [...availablePriorityQuestions].sort(() => Math.random() - 0.5);
				selectedQuestions.push(...shuffledQuestions.slice(0, questionsToUse));

				console.log(`Using ${questionsToUse} unused priority MA questions`);
			}

			// If we need more questions, try AI generation
			if (selectedQuestions.length < numQuestions) {
				try {
					const response = await axios.post('/api/ask-ai', {
						game: 'trivia-generator',
						category: 'medical-assistant',
						difficulty: difficulty
					});

					const rawQuestions: AIQuestion[] = response.data.questions || [];
					if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
						const aiQuestions = rawQuestions
							.filter(q => 
								q.question && 
								Array.isArray(q.options) && 
								q.options.length === 4 && 
								typeof q.correct === 'number' && 
								q.correct >= 0 && 
								q.correct < 4
							)
							.map((q, index) => ({
								id: `ai-${Date.now()}-${index}`,
								question: q.question,
								options: q.options,
								answer: q.correct
							}));
						
						const remainingNeeded = numQuestions - selectedQuestions.length;
						selectedQuestions.push(...aiQuestions.slice(0, remainingNeeded));
						console.log(`Added ${Math.min(aiQuestions.length, remainingNeeded)} AI-generated MA questions`);
					}
				} catch (aiError) {
					console.error('Error generating AI MA questions:', aiError);
				}
			}

			// If we still need more questions, use fallback questions (avoiding used ones)
			if (selectedQuestions.length < numQuestions) {
				const availableFallback = FALLBACK_MA_QUESTIONS.filter(q => 
					!q.id || !usedQuestionIds.has(q.id)
				);
				const remainingNeeded = numQuestions - selectedQuestions.length;
				const shuffledFallback = [...availableFallback].sort(() => Math.random() - 0.5);
				selectedQuestions.push(...shuffledFallback.slice(0, remainingNeeded));
				console.log(`Added ${Math.min(remainingNeeded, shuffledFallback.length)} fallback MA questions`);
			}

			// If we still can't get enough questions, reset used questions and try again
			if (selectedQuestions.length < numQuestions && usedQuestionIds.size > 0) {
				console.log('Ran out of unused questions, resetting question pool...');
				setUsedQuestionIds(new Set());
				saveUsedQuestionIds(new Set());
				// Recursively try again with reset pool
				return generateQuestions(numQuestions);
			}

			return selectedQuestions;

		} catch (error) {
			console.error('Error generating Medical Assistant questions:', error);
			// Final fallback to priority questions
			return PRIORITY_MA_QUESTIONS.slice(0, numQuestions);
		} finally {
			setLoadingQuestions(false);
		}
	};

	// Load questions when game starts or difficulty changes
	useEffect(() => {
		generateQuestions(5).then(setQuestions);
	}, [difficulty]);

	// Load accumulative score when component mounts
	useEffect(() => {
		loadAccumulativeScore();
	}, []);

	// Show loading screen while generating questions
	if (loadingQuestions || questions.length === 0) {
		return (
			<div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-6">
				<h1 className="text-4xl font-bold mb-8 font-comic drop-shadow-lg">
					Medical Assistant 🏥
				</h1>
				<div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center max-w-lg w-full mb-8">
					<div className="text-xl mb-4">Preparing MA Questions...</div>
					<div className="flex justify-center mb-6">
						<div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
					</div>
					<p className="text-gray-600">Loading anatomy & physiology questions for Medical Assistant practice!</p>
				</div>
			</div>
		);
	}

	if (finished) {
		return (
			<div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-6">
				<h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">
					Medical Assistant 🏥
				</h1>
				<div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center max-w-lg w-full mb-6">
					<div className="text-2xl font-bold mb-4">
						Final Score: {score} / {questions.length}
					</div>
					<div className="text-lg mb-4">
						{score === questions.length ? "Perfect! Future MA! 🎉" : 
						 score >= questions.length * 0.8 ? "Excellent knowledge! 🌟" : 
						 score >= questions.length * 0.6 ? "Good foundation! 👍" : 
						 "Keep studying! 💪"}
					</div>
					
					{/* Accumulative Score Section */}
					<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6 border-2 border-green-200">
						<h3 className="text-lg font-bold text-gray-800 mb-3">📊 MA Study Progress</h3>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="bg-white/70 rounded-lg p-3">
								<div className="text-2xl font-bold text-green-600">{totalScore}</div>
								<div className="text-gray-600">Total Score</div>
							</div>
							<div className="bg-white/70 rounded-lg p-3">
								<div className="text-2xl font-bold text-blue-600">{gamesPlayed}</div>
								<div className="text-gray-600">Practice Sessions</div>
							</div>
							<div className="bg-white/70 rounded-lg p-3">
								<div className="text-2xl font-bold text-purple-600">
									{gamesPlayed > 0 ? (totalScore / gamesPlayed).toFixed(1) : '0.0'}
								</div>
								<div className="text-gray-600">Average Score</div>
							</div>
							<div className="bg-white/70 rounded-lg p-3">
								<div className="text-2xl font-bold text-orange-600">
									{usedQuestionIds.size} / {PRIORITY_MA_QUESTIONS.length}
								</div>
								<div className="text-gray-600">Questions Covered</div>
							</div>
						</div>
						<button
							onClick={resetAccumulativeScore}
							className="mt-3 text-xs text-gray-500 hover:text-red-500 underline transition-colors"
						>
							Reset All Progress
						</button>
					</div>

					{/* Mistakes Section */}
					{mistakes.length > 0 && (
						<div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-6 border-2 border-red-200">
							<h3 className="text-lg font-bold text-gray-800 mb-3">❌ Practice Your Mistakes</h3>
							<div className="text-sm text-gray-600 mb-3">
								You have {mistakes.length} questions that need more practice
							</div>
							<button
								onClick={startMistakePractice}
								className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transform hover:scale-105"
							>
								📚 Practice {mistakes.length} Mistake{mistakes.length > 1 ? 's' : ''}
							</button>
						</div>
					)}
					
					<div className="flex flex-wrap gap-3 justify-center">
						<button
							className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transform hover:scale-105"
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
				</div>
				
				{/* Settings for next game */}
				<div className="bg-white/60 rounded-2xl p-6 max-w-md text-center shadow mb-4">
					<h3 className="font-bold text-lg mb-4 text-gray-800">
						Study Settings ⚙️
					</h3>
					<div className="mb-4">
						<label className="block text-sm font-bold mb-2 text-gray-700">Difficulty:</label>
						<select 
							value={difficulty} 
							onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
							className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
						>
							<option value="easy">Basic Knowledge 🟢</option>
							<option value="medium">Intermediate 🟡</option>
							<option value="hard">Advanced 🔴</option>
						</select>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-6">
			<h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">
				Medical Assistant 🏥
			</h1>
			
			{/* Current Settings Display */}
			<div className="bg-white/60 rounded-xl p-3 shadow mb-4 text-center">
				<span className="text-sm font-semibold text-gray-700">
					{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level • Anatomy & Physiology
				</span>
			</div>
			
			<div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center max-w-lg w-full mb-4">
				<div className="text-lg font-bold mb-2">
					Question {current + 1} of {questions.length}
				</div>
				<div className="text-xl mb-6">{questions[current].question}</div>
				
				<div className="flex flex-col gap-3">
					{questions[current].options.map((opt: string, idx: number) => (
						<div key={idx} className="flex items-center gap-2">
							<button
								className={`flex-1 px-4 py-3 rounded-lg font-bold text-lg shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105 ${
									showAnswer
										? idx === questions[current].answer
											? 'bg-green-400 text-white focus:ring-green-300'
											: idx === selected
											? 'bg-red-400 text-white focus:ring-red-300'
											: 'bg-gray-200 text-gray-700 focus:ring-gray-400'
										: 'bg-gray-200 text-gray-700 hover:bg-green-200 focus:ring-green-400'
								}`}
								onClick={() => handleOption(idx)}
								disabled={showAnswer}
							>
								{formatDisplayText(opt)}
							</button>
							<button
								onClick={() => speakOption(opt, idx)}
								disabled={isPlayingAudio}
								className={`px-3 py-3 rounded-lg font-bold text-sm shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105 min-w-[50px] ${
									isPlayingAudio && playingOptionIndex === idx
										? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
										: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400'
								}`}
								title="Listen to this option"
							>
								{isPlayingAudio && playingOptionIndex === idx ? '🔊' : '🔊'}
							</button>
						</div>
					))}
				</div>
				{showAnswer && (
					<button
						className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transform hover:scale-105 mt-4"
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
						className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-300"
						style={{ width: `${((current + (showAnswer ? 1 : 0)) / questions.length) * 100}%` }}
					></div>
				</div>
				<div className="flex justify-between text-sm text-gray-600 mt-1">
					<span>Current: {score}/{questions.length}</span>
					<span>Total: {totalScore} ({gamesPlayed} sessions)</span>
				</div>
			</div>
			
			<div className="mt-4 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
				<h3 className="font-bold text-lg mb-2 text-gray-800">
					About This Game 🏥
				</h3>
				<ul className="text-gray-700 space-y-1 text-left">
					<li>• Practice anatomy & physiology questions</li>
					<li>• 26 priority questions from your study materials</li>
					<li>• AI-generated additional questions when needed</li>
					<li>• Perfect for Medical Assistant exam prep!</li>
				</ul>
			</div>
		</div>
	);
};

export default MedicalAssistant;
