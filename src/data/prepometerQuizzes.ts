// Practice quiz data for each class-exam combination

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation?: string;
  chapter: string;
}

export interface ChapterQuiz {
  chapterName: string;
  questions: QuizQuestion[];
}

export interface ClassExamQuizzes {
  chapters: ChapterQuiz[];
}

// Quiz data structure for all class-exam combinations
export const PREPOMETER_QUIZZES: Record<string, Record<string, ClassExamQuizzes>> = {
  '8': {
    'Board Exam': {
      chapters: [
        {
          chapterName: 'Mathematics - Algebra',
          questions: [
            {
              id: '8-board-math-1',
              question: 'What is the value of x in the equation 2x + 5 = 15?',
              options: [
                { id: 'a', text: '5', isCorrect: true },
                { id: 'b', text: '10', isCorrect: false },
                { id: 'c', text: '7', isCorrect: false },
                { id: 'd', text: '8', isCorrect: false },
              ],
              explanation: '2x + 5 = 15, so 2x = 10, therefore x = 5',
              chapter: 'Mathematics - Algebra',
            },
            {
              id: '8-board-math-2',
              question: 'Simplify: 3a + 2a - a',
              options: [
                { id: 'a', text: '4a', isCorrect: true },
                { id: 'b', text: '5a', isCorrect: false },
                { id: 'c', text: '6a', isCorrect: false },
                { id: 'd', text: '3a', isCorrect: false },
              ],
              explanation: '3a + 2a - a = (3 + 2 - 1)a = 4a',
              chapter: 'Mathematics - Algebra',
            },
            {
              id: '8-board-math-3',
              question: 'What is the coefficient of x in 5x + 3?',
              options: [
                { id: 'a', text: '5', isCorrect: true },
                { id: 'b', text: '3', isCorrect: false },
                { id: 'c', text: 'x', isCorrect: false },
                { id: 'd', text: '8', isCorrect: false },
              ],
              explanation: 'The coefficient is the number multiplied by the variable, which is 5',
              chapter: 'Mathematics - Algebra',
            },
            {
              id: '8-board-math-4',
              question: 'Solve: 3(x - 2) = 9',
              options: [
                { id: 'a', text: 'x = 5', isCorrect: true },
                { id: 'b', text: 'x = 3', isCorrect: false },
                { id: 'c', text: 'x = 7', isCorrect: false },
                { id: 'd', text: 'x = 1', isCorrect: false },
              ],
              explanation: '3(x - 2) = 9, so x - 2 = 3, therefore x = 5',
              chapter: 'Mathematics - Algebra',
            },
            {
              id: '8-board-math-5',
              question: 'What is the value of 2³?',
              options: [
                { id: 'a', text: '6', isCorrect: false },
                { id: 'b', text: '8', isCorrect: true },
                { id: 'c', text: '4', isCorrect: false },
                { id: 'd', text: '9', isCorrect: false },
              ],
              explanation: '2³ = 2 × 2 × 2 = 8',
              chapter: 'Mathematics - Algebra',
            },
            {
              id: '8-board-math-6',
              question: 'If y = 3x + 2, what is y when x = 4?',
              options: [
                { id: 'a', text: '14', isCorrect: true },
                { id: 'b', text: '12', isCorrect: false },
                { id: 'c', text: '10', isCorrect: false },
                { id: 'd', text: '16', isCorrect: false },
              ],
              explanation: 'y = 3(4) + 2 = 12 + 2 = 14',
              chapter: 'Mathematics - Algebra',
            },
            {
              id: '8-board-math-7',
              question: 'What is the square root of 64?',
              options: [
                { id: 'a', text: '6', isCorrect: false },
                { id: 'b', text: '7', isCorrect: false },
                { id: 'c', text: '8', isCorrect: true },
                { id: 'd', text: '9', isCorrect: false },
              ],
              explanation: '8 × 8 = 64, so √64 = 8',
              chapter: 'Mathematics - Algebra',
            },
            {
              id: '8-board-math-8',
              question: 'Factorize: x² - 9',
              options: [
                { id: 'a', text: '(x - 3)(x + 3)', isCorrect: true },
                { id: 'b', text: '(x - 9)(x + 1)', isCorrect: false },
                { id: 'c', text: '(x - 3)²', isCorrect: false },
                { id: 'd', text: 'x(x - 9)', isCorrect: false },
              ],
              explanation: 'x² - 9 is a difference of squares: (x - 3)(x + 3)',
              chapter: 'Mathematics - Algebra',
            },
            {
              id: '8-board-math-9',
              question: 'What is the LCM of 4 and 6?',
              options: [
                { id: 'a', text: '10', isCorrect: false },
                { id: 'b', text: '12', isCorrect: true },
                { id: 'c', text: '24', isCorrect: false },
                { id: 'd', text: '18', isCorrect: false },
              ],
              explanation: 'Multiples of 4: 4, 8, 12, 16... Multiples of 6: 6, 12, 18... LCM = 12',
              chapter: 'Mathematics - Algebra',
            },
            {
              id: '8-board-math-10',
              question: 'If a = 5 and b = 3, what is a² - b²?',
              options: [
                { id: 'a', text: '16', isCorrect: true },
                { id: 'b', text: '4', isCorrect: false },
                { id: 'c', text: '25', isCorrect: false },
                { id: 'd', text: '9', isCorrect: false },
              ],
              explanation: 'a² - b² = 5² - 3² = 25 - 9 = 16',
              chapter: 'Mathematics - Algebra',
            },
          ],
        },
        {
          chapterName: 'Science - Force and Pressure',
          questions: [
            {
              id: '8-board-sci-1',
              question: 'What is the SI unit of force?',
              options: [
                { id: 'a', text: 'Newton', isCorrect: true },
                { id: 'b', text: 'Joule', isCorrect: false },
                { id: 'c', text: 'Watt', isCorrect: false },
                { id: 'd', text: 'Pascal', isCorrect: false },
              ],
              explanation: 'Force is measured in Newtons (N)',
              chapter: 'Science - Force and Pressure',
            },
            {
              id: '8-board-sci-2',
              question: 'What is pressure?',
              options: [
                { id: 'a', text: 'Force per unit area', isCorrect: true },
                { id: 'b', text: 'Force times area', isCorrect: false },
                { id: 'c', text: 'Mass per unit volume', isCorrect: false },
                { id: 'd', text: 'Distance per unit time', isCorrect: false },
              ],
              explanation: 'Pressure = Force / Area',
              chapter: 'Science - Force and Pressure',
            },
            {
              id: '8-board-sci-3',
              question: 'Which has more pressure: a sharp knife or a blunt knife?',
              options: [
                { id: 'a', text: 'Sharp knife', isCorrect: true },
                { id: 'b', text: 'Blunt knife', isCorrect: false },
                { id: 'c', text: 'Both have same', isCorrect: false },
                { id: 'd', text: 'Cannot determine', isCorrect: false },
              ],
              explanation: 'Sharp knife has smaller area, so more pressure for same force',
              chapter: 'Science - Force and Pressure',
            },
            {
              id: '8-board-sci-4',
              question: 'What happens to pressure when area increases?',
              options: [
                { id: 'a', text: 'Increases', isCorrect: false },
                { id: 'b', text: 'Decreases', isCorrect: true },
                { id: 'c', text: 'Remains same', isCorrect: false },
                { id: 'd', text: 'Becomes zero', isCorrect: false },
              ],
              explanation: 'Pressure is inversely proportional to area',
              chapter: 'Science - Force and Pressure',
            },
            {
              id: '8-board-sci-5',
              question: 'What is atmospheric pressure at sea level?',
              options: [
                { id: 'a', text: '101.3 kPa', isCorrect: true },
                { id: 'b', text: '50.6 kPa', isCorrect: false },
                { id: 'c', text: '202.6 kPa', isCorrect: false },
                { id: 'd', text: '75.9 kPa', isCorrect: false },
              ],
              explanation: 'Standard atmospheric pressure is approximately 101.3 kilopascals',
              chapter: 'Science - Force and Pressure',
            },
            {
              id: '8-board-sci-6',
              question: 'Which force keeps planets in orbit?',
              options: [
                { id: 'a', text: 'Gravitational force', isCorrect: true },
                { id: 'b', text: 'Magnetic force', isCorrect: false },
                { id: 'c', text: 'Frictional force', isCorrect: false },
                { id: 'd', text: 'Electrostatic force', isCorrect: false },
              ],
              explanation: 'Gravitational force between the Sun and planets keeps them in orbit',
              chapter: 'Science - Force and Pressure',
            },
            {
              id: '8-board-sci-7',
              question: 'What is the formula for pressure?',
              options: [
                { id: 'a', text: 'P = F/A', isCorrect: true },
                { id: 'b', text: 'P = F × A', isCorrect: false },
                { id: 'c', text: 'P = F + A', isCorrect: false },
                { id: 'd', text: 'P = F - A', isCorrect: false },
              ],
              explanation: 'Pressure equals Force divided by Area',
              chapter: 'Science - Force and Pressure',
            },
            {
              id: '8-board-sci-8',
              question: 'Why do we feel more pressure at the bottom of a swimming pool?',
              options: [
                { id: 'a', text: 'Due to weight of water above', isCorrect: true },
                { id: 'b', text: 'Due to temperature', isCorrect: false },
                { id: 'c', text: 'Due to light', isCorrect: false },
                { id: 'd', text: 'Due to sound', isCorrect: false },
              ],
              explanation: 'Water pressure increases with depth due to the weight of water above',
              chapter: 'Science - Force and Pressure',
            },
            {
              id: '8-board-sci-9',
              question: 'What is friction?',
              options: [
                { id: 'a', text: 'Force that opposes motion', isCorrect: true },
                { id: 'b', text: 'Force that causes motion', isCorrect: false },
                { id: 'c', text: 'Type of energy', isCorrect: false },
                { id: 'd', text: 'Unit of force', isCorrect: false },
              ],
              explanation: 'Friction is a force that opposes the relative motion between two surfaces',
              chapter: 'Science - Force and Pressure',
            },
            {
              id: '8-board-sci-10',
              question: 'Which surface has more friction?',
              options: [
                { id: 'a', text: 'Rough surface', isCorrect: true },
                { id: 'b', text: 'Smooth surface', isCorrect: false },
                { id: 'c', text: 'Both have same', isCorrect: false },
                { id: 'd', text: 'Depends on material', isCorrect: false },
              ],
              explanation: 'Rough surfaces have more friction due to more contact points',
              chapter: 'Science - Force and Pressure',
            },
          ],
        },
      ],
    },
  },
  '11': {
    'JEE': {
      chapters: [
        {
          chapterName: 'Physics - Mechanics',
          questions: [
            {
              id: '11-jee-phy-1',
              question: 'A body is moving with constant velocity. What is the net force acting on it?',
              options: [
                { id: 'a', text: 'Zero', isCorrect: true },
                { id: 'b', text: 'Maximum', isCorrect: false },
                { id: 'c', text: 'Equal to weight', isCorrect: false },
                { id: 'd', text: 'Infinite', isCorrect: false },
              ],
              explanation: 'According to Newton\'s first law, constant velocity means zero net force',
              chapter: 'Physics - Mechanics',
            },
            {
              id: '11-jee-phy-2',
              question: 'What is the work done by a force F = 10N moving a body 5m in the direction of force?',
              options: [
                { id: 'a', text: '50 J', isCorrect: true },
                { id: 'b', text: '2 J', isCorrect: false },
                { id: 'c', text: '15 J', isCorrect: false },
                { id: 'd', text: '5 J', isCorrect: false },
              ],
              explanation: 'Work = Force × Displacement = 10N × 5m = 50 J',
              chapter: 'Physics - Mechanics',
            },
            {
              id: '11-jee-phy-3',
              question: 'A ball is thrown upward. At the highest point, what is its velocity?',
              options: [
                { id: 'a', text: 'Zero', isCorrect: true },
                { id: 'b', text: 'Maximum', isCorrect: false },
                { id: 'c', text: 'Equal to initial velocity', isCorrect: false },
                { id: 'd', text: 'Negative', isCorrect: false },
              ],
              explanation: 'At the highest point, vertical velocity becomes zero before the ball starts falling',
              chapter: 'Physics - Mechanics',
            },
            {
              id: '11-jee-phy-4',
              question: 'What is the formula for kinetic energy?',
              options: [
                { id: 'a', text: 'KE = ½mv²', isCorrect: true },
                { id: 'b', text: 'KE = mv²', isCorrect: false },
                { id: 'c', text: 'KE = 2mv²', isCorrect: false },
                { id: 'd', text: 'KE = mgh', isCorrect: false },
              ],
              explanation: 'Kinetic energy is given by KE = ½mv² where m is mass and v is velocity',
              chapter: 'Physics - Mechanics',
            },
            {
              id: '11-jee-phy-5',
              question: 'What is the unit of momentum?',
              options: [
                { id: 'a', text: 'kg m/s', isCorrect: true },
                { id: 'b', text: 'kg m/s²', isCorrect: false },
                { id: 'c', text: 'N m', isCorrect: false },
                { id: 'd', text: 'J/s', isCorrect: false },
              ],
              explanation: 'Momentum = mass × velocity, so unit is kg m/s',
              chapter: 'Physics - Mechanics',
            },
            {
              id: '11-jee-phy-6',
              question: 'According to conservation of momentum, what remains constant in a closed system?',
              options: [
                { id: 'a', text: 'Total momentum', isCorrect: true },
                { id: 'b', text: 'Total energy', isCorrect: false },
                { id: 'c', text: 'Total mass', isCorrect: false },
                { id: 'd', text: 'Total velocity', isCorrect: false },
              ],
              explanation: 'In a closed system with no external forces, total momentum is conserved',
              chapter: 'Physics - Mechanics',
            },
            {
              id: '11-jee-phy-7',
              question: 'What is the acceleration due to gravity on Earth?',
              options: [
                { id: 'a', text: '9.8 m/s²', isCorrect: true },
                { id: 'b', text: '10 m/s²', isCorrect: false },
                { id: 'c', text: '8.9 m/s²', isCorrect: false },
                { id: 'd', text: '11 m/s²', isCorrect: false },
              ],
              explanation: 'Standard acceleration due to gravity on Earth is approximately 9.8 m/s²',
              chapter: 'Physics - Mechanics',
            },
            {
              id: '11-jee-phy-8',
              question: 'What is the relationship between force, mass, and acceleration?',
              options: [
                { id: 'a', text: 'F = ma', isCorrect: true },
                { id: 'b', text: 'F = m/a', isCorrect: false },
                { id: 'c', text: 'F = a/m', isCorrect: false },
                { id: 'd', text: 'F = m + a', isCorrect: false },
              ],
              explanation: 'Newton\'s second law: Force = mass × acceleration',
              chapter: 'Physics - Mechanics',
            },
            {
              id: '11-jee-phy-9',
              question: 'What is power?',
              options: [
                { id: 'a', text: 'Work done per unit time', isCorrect: true },
                { id: 'b', text: 'Force per unit area', isCorrect: false },
                { id: 'c', text: 'Energy per unit mass', isCorrect: false },
                { id: 'd', text: 'Velocity per unit time', isCorrect: false },
              ],
              explanation: 'Power = Work / Time = Energy / Time',
              chapter: 'Physics - Mechanics',
            },
            {
              id: '11-jee-phy-10',
              question: 'A 2 kg object is lifted 10 m. What is the potential energy gained? (g = 10 m/s²)',
              options: [
                { id: 'a', text: '200 J', isCorrect: true },
                { id: 'b', text: '20 J', isCorrect: false },
                { id: 'c', text: '100 J', isCorrect: false },
                { id: 'd', text: '400 J', isCorrect: false },
              ],
              explanation: 'PE = mgh = 2 kg × 10 m/s² × 10 m = 200 J',
              chapter: 'Physics - Mechanics',
            },
          ],
        },
        {
          chapterName: 'Chemistry - Organic Chemistry',
          questions: [
            {
              id: '11-jee-chem-1',
              question: 'What is the general formula for alkanes?',
              options: [
                { id: 'a', text: 'CnH2n+2', isCorrect: true },
                { id: 'b', text: 'CnH2n', isCorrect: false },
                { id: 'c', text: 'CnH2n-2', isCorrect: false },
                { id: 'd', text: 'CnHn', isCorrect: false },
              ],
              explanation: 'Alkanes are saturated hydrocarbons with formula CnH2n+2',
              chapter: 'Chemistry - Organic Chemistry',
            },
            {
              id: '11-jee-chem-2',
              question: 'What is the IUPAC name of CH₃CH₂CH₃?',
              options: [
                { id: 'a', text: 'Propane', isCorrect: true },
                { id: 'b', text: 'Ethane', isCorrect: false },
                { id: 'c', text: 'Butane', isCorrect: false },
                { id: 'd', text: 'Methane', isCorrect: false },
              ],
              explanation: 'Three carbon atoms in a chain makes it propane',
              chapter: 'Chemistry - Organic Chemistry',
            },
            {
              id: '11-jee-chem-3',
              question: 'What type of bond is present in alkenes?',
              options: [
                { id: 'a', text: 'Double bond', isCorrect: true },
                { id: 'b', text: 'Single bond', isCorrect: false },
                { id: 'c', text: 'Triple bond', isCorrect: false },
                { id: 'd', text: 'Ionic bond', isCorrect: false },
              ],
              explanation: 'Alkenes contain at least one carbon-carbon double bond',
              chapter: 'Chemistry - Organic Chemistry',
            },
            {
              id: '11-jee-chem-4',
              question: 'What is the functional group of alcohols?',
              options: [
                { id: 'a', text: '-OH', isCorrect: true },
                { id: 'b', text: '-COOH', isCorrect: false },
                { id: 'c', text: '-CHO', isCorrect: false },
                { id: 'd', text: '-NH₂', isCorrect: false },
              ],
              explanation: 'Alcohols contain the hydroxyl functional group (-OH)',
              chapter: 'Chemistry - Organic Chemistry',
            },
            {
              id: '11-jee-chem-5',
              question: 'What is the product of complete combustion of methane?',
              options: [
                { id: 'a', text: 'CO₂ and H₂O', isCorrect: true },
                { id: 'b', text: 'CO and H₂O', isCorrect: false },
                { id: 'c', text: 'C and H₂O', isCorrect: false },
                { id: 'd', text: 'CO₂ and H₂', isCorrect: false },
              ],
              explanation: 'CH₄ + 2O₂ → CO₂ + 2H₂O (complete combustion)',
              chapter: 'Chemistry - Organic Chemistry',
            },
            {
              id: '11-jee-chem-6',
              question: 'What is the hybridization of carbon in ethane?',
              options: [
                { id: 'a', text: 'sp³', isCorrect: true },
                { id: 'b', text: 'sp²', isCorrect: false },
                { id: 'c', text: 'sp', isCorrect: false },
                { id: 'd', text: 'sp³d', isCorrect: false },
              ],
              explanation: 'Ethane has single bonds, so carbon has sp³ hybridization',
              chapter: 'Chemistry - Organic Chemistry',
            },
            {
              id: '11-jee-chem-7',
              question: 'What is the general formula for alkenes?',
              options: [
                { id: 'a', text: 'CnH2n', isCorrect: true },
                { id: 'b', text: 'CnH2n+2', isCorrect: false },
                { id: 'c', text: 'CnH2n-2', isCorrect: false },
                { id: 'd', text: 'CnHn', isCorrect: false },
              ],
              explanation: 'Alkenes have one double bond, so formula is CnH2n',
              chapter: 'Chemistry - Organic Chemistry',
            },
            {
              id: '11-jee-chem-8',
              question: 'What is Markovnikov\'s rule used for?',
              options: [
                { id: 'a', text: 'Predicting addition products', isCorrect: true },
                { id: 'b', text: 'Naming compounds', isCorrect: false },
                { id: 'c', text: 'Determining bond angles', isCorrect: false },
                { id: 'd', text: 'Calculating pH', isCorrect: false },
              ],
              explanation: 'Markovnikov\'s rule predicts the major product in addition reactions',
              chapter: 'Chemistry - Organic Chemistry',
            },
            {
              id: '11-jee-chem-9',
              question: 'What is the IUPAC name of CH₃CH₂OH?',
              options: [
                { id: 'a', text: 'Ethanol', isCorrect: true },
                { id: 'b', text: 'Methanol', isCorrect: false },
                { id: 'c', text: 'Propanol', isCorrect: false },
                { id: 'd', text: 'Butanol', isCorrect: false },
              ],
              explanation: 'Two carbon chain with -OH group makes it ethanol',
              chapter: 'Chemistry - Organic Chemistry',
            },
            {
              id: '11-jee-chem-10',
              question: 'What type of isomerism is shown by butane and isobutane?',
              options: [
                { id: 'a', text: 'Structural isomerism', isCorrect: true },
                { id: 'b', text: 'Geometric isomerism', isCorrect: false },
                { id: 'c', text: 'Optical isomerism', isCorrect: false },
                { id: 'd', text: 'Functional isomerism', isCorrect: false },
              ],
              explanation: 'They have same molecular formula but different structures (structural isomers)',
              chapter: 'Chemistry - Organic Chemistry',
            },
          ],
        },
      ],
    },
    'NEET': {
      chapters: [
        {
          chapterName: 'Biology - Cell Structure',
          questions: [
            {
              id: '11-neet-bio-1',
              question: 'What is the powerhouse of the cell?',
              options: [
                { id: 'a', text: 'Mitochondria', isCorrect: true },
                { id: 'b', text: 'Nucleus', isCorrect: false },
                { id: 'c', text: 'Ribosome', isCorrect: false },
                { id: 'd', text: 'Golgi apparatus', isCorrect: false },
              ],
              explanation: 'Mitochondria produce ATP, the energy currency of the cell',
              chapter: 'Biology - Cell Structure',
            },
            {
              id: '11-neet-bio-2',
              question: 'Which organelle is responsible for protein synthesis?',
              options: [
                { id: 'a', text: 'Ribosome', isCorrect: true },
                { id: 'b', text: 'Mitochondria', isCorrect: false },
                { id: 'c', text: 'Lysosome', isCorrect: false },
                { id: 'd', text: 'Chloroplast', isCorrect: false },
              ],
              explanation: 'Ribosomes are the sites of protein synthesis',
              chapter: 'Biology - Cell Structure',
            },
            {
              id: '11-neet-bio-3',
              question: 'What is the function of the nucleus?',
              options: [
                { id: 'a', text: 'Control center of the cell', isCorrect: true },
                { id: 'b', text: 'Energy production', isCorrect: false },
                { id: 'c', text: 'Protein synthesis', isCorrect: false },
                { id: 'd', text: 'Waste removal', isCorrect: false },
              ],
              explanation: 'Nucleus contains DNA and controls cell activities',
              chapter: 'Biology - Cell Structure',
            },
            {
              id: '11-neet-bio-4',
              question: 'Which organelle is found only in plant cells?',
              options: [
                { id: 'a', text: 'Chloroplast', isCorrect: true },
                { id: 'b', text: 'Mitochondria', isCorrect: false },
                { id: 'c', text: 'Ribosome', isCorrect: false },
                { id: 'd', text: 'Nucleus', isCorrect: false },
              ],
              explanation: 'Chloroplasts are found only in plant cells for photosynthesis',
              chapter: 'Biology - Cell Structure',
            },
            {
              id: '11-neet-bio-5',
              question: 'What is the function of the cell membrane?',
              options: [
                { id: 'a', text: 'Controls what enters and exits', isCorrect: true },
                { id: 'b', text: 'Produces energy', isCorrect: false },
                { id: 'c', text: 'Synthesizes proteins', isCorrect: false },
                { id: 'd', text: 'Stores genetic material', isCorrect: false },
              ],
              explanation: 'Cell membrane is selectively permeable and controls transport',
              chapter: 'Biology - Cell Structure',
            },
            {
              id: '11-neet-bio-6',
              question: 'What is the liquid part of the cell called?',
              options: [
                { id: 'a', text: 'Cytoplasm', isCorrect: true },
                { id: 'b', text: 'Nucleoplasm', isCorrect: false },
                { id: 'c', text: 'Protoplasm', isCorrect: false },
                { id: 'd', text: 'Plasma', isCorrect: false },
              ],
              explanation: 'Cytoplasm is the gel-like substance filling the cell',
              chapter: 'Biology - Cell Structure',
            },
            {
              id: '11-neet-bio-7',
              question: 'Which organelle contains digestive enzymes?',
              options: [
                { id: 'a', text: 'Lysosome', isCorrect: true },
                { id: 'b', text: 'Ribosome', isCorrect: false },
                { id: 'c', text: 'Mitochondria', isCorrect: false },
                { id: 'd', text: 'Golgi apparatus', isCorrect: false },
              ],
              explanation: 'Lysosomes contain hydrolytic enzymes for digestion',
              chapter: 'Biology - Cell Structure',
            },
            {
              id: '11-neet-bio-8',
              question: 'What is the function of the Golgi apparatus?',
              options: [
                { id: 'a', text: 'Modifies and packages proteins', isCorrect: true },
                { id: 'b', text: 'Produces ATP', isCorrect: false },
                { id: 'c', text: 'Synthesizes DNA', isCorrect: false },
                { id: 'd', text: 'Breaks down waste', isCorrect: false },
              ],
              explanation: 'Golgi apparatus modifies, sorts, and packages proteins',
              chapter: 'Biology - Cell Structure',
            },
            {
              id: '11-neet-bio-9',
              question: 'What is the structure of DNA?',
              options: [
                { id: 'a', text: 'Double helix', isCorrect: true },
                { id: 'b', text: 'Single strand', isCorrect: false },
                { id: 'c', text: 'Triple helix', isCorrect: false },
                { id: 'd', text: 'Circular', isCorrect: false },
              ],
              explanation: 'DNA has a double-helical structure discovered by Watson and Crick',
              chapter: 'Biology - Cell Structure',
            },
            {
              id: '11-neet-bio-10',
              question: 'Which organelle is involved in cell division?',
              options: [
                { id: 'a', text: 'Centriole', isCorrect: true },
                { id: 'b', text: 'Ribosome', isCorrect: false },
                { id: 'c', text: 'Lysosome', isCorrect: false },
                { id: 'd', text: 'Chloroplast', isCorrect: false },
              ],
              explanation: 'Centrioles form spindle fibers during cell division',
              chapter: 'Biology - Cell Structure',
            },
          ],
        },
      ],
    },
  },
  '12': {
    'JEE': {
      chapters: [
        {
          chapterName: 'Mathematics - Calculus',
          questions: [
            {
              id: '12-jee-math-1',
              question: 'What is the derivative of x²?',
              options: [
                { id: 'a', text: '2x', isCorrect: true },
                { id: 'b', text: 'x', isCorrect: false },
                { id: 'c', text: 'x²', isCorrect: false },
                { id: 'd', text: '2x²', isCorrect: false },
              ],
              explanation: 'd/dx(x²) = 2x using power rule',
              chapter: 'Mathematics - Calculus',
            },
            {
              id: '12-jee-math-2',
              question: 'What is the integral of 2x?',
              options: [
                { id: 'a', text: 'x² + C', isCorrect: true },
                { id: 'b', text: '2x + C', isCorrect: false },
                { id: 'c', text: 'x + C', isCorrect: false },
                { id: 'd', text: '2x² + C', isCorrect: false },
              ],
              explanation: '∫2x dx = 2(x²/2) + C = x² + C',
              chapter: 'Mathematics - Calculus',
            },
            {
              id: '12-jee-math-3',
              question: 'What is lim(x→0) sin(x)/x?',
              options: [
                { id: 'a', text: '1', isCorrect: true },
                { id: 'b', text: '0', isCorrect: false },
                { id: 'c', text: '∞', isCorrect: false },
                { id: 'd', text: 'Undefined', isCorrect: false },
              ],
              explanation: 'This is a fundamental limit: lim(x→0) sin(x)/x = 1',
              chapter: 'Mathematics - Calculus',
            },
            {
              id: '12-jee-math-4',
              question: 'What is the derivative of eˣ?',
              options: [
                { id: 'a', text: 'eˣ', isCorrect: true },
                { id: 'b', text: 'xeˣ', isCorrect: false },
                { id: 'c', text: 'eˣ/x', isCorrect: false },
                { id: 'd', text: 'ln(x)', isCorrect: false },
              ],
              explanation: 'd/dx(eˣ) = eˣ (unique property of exponential function)',
              chapter: 'Mathematics - Calculus',
            },
            {
              id: '12-jee-math-5',
              question: 'What is the derivative of ln(x)?',
              options: [
                { id: 'a', text: '1/x', isCorrect: true },
                { id: 'b', text: 'x', isCorrect: false },
                { id: 'c', text: '1/x²', isCorrect: false },
                { id: 'd', text: 'ln(x)', isCorrect: false },
              ],
              explanation: 'd/dx(ln(x)) = 1/x',
              chapter: 'Mathematics - Calculus',
            },
            {
              id: '12-jee-math-6',
              question: 'What is ∫(1/x) dx?',
              options: [
                { id: 'a', text: 'ln|x| + C', isCorrect: true },
                { id: 'b', text: 'x + C', isCorrect: false },
                { id: 'c', text: '1/x + C', isCorrect: false },
                { id: 'd', text: 'x²/2 + C', isCorrect: false },
              ],
              explanation: '∫(1/x) dx = ln|x| + C',
              chapter: 'Mathematics - Calculus',
            },
            {
              id: '12-jee-math-7',
              question: 'What is the chain rule for derivatives?',
              options: [
                { id: 'a', text: 'd/dx[f(g(x))] = f\'(g(x)) × g\'(x)', isCorrect: true },
                { id: 'b', text: 'd/dx[f(g(x))] = f\'(x) × g\'(x)', isCorrect: false },
                { id: 'c', text: 'd/dx[f(g(x))] = f(g\'(x))', isCorrect: false },
                { id: 'd', text: 'd/dx[f(g(x))] = f\'(x) + g\'(x)', isCorrect: false },
              ],
              explanation: 'Chain rule: derivative of composite function is product of derivatives',
              chapter: 'Mathematics - Calculus',
            },
            {
              id: '12-jee-math-8',
              question: 'What is the product rule for derivatives?',
              options: [
                { id: 'a', text: 'd/dx[f(x)g(x)] = f\'(x)g(x) + f(x)g\'(x)', isCorrect: true },
                { id: 'b', text: 'd/dx[f(x)g(x)] = f\'(x)g\'(x)', isCorrect: false },
                { id: 'c', text: 'd/dx[f(x)g(x)] = f(x)g(x)', isCorrect: false },
                { id: 'd', text: 'd/dx[f(x)g(x)] = f\'(x) + g\'(x)', isCorrect: false },
              ],
              explanation: 'Product rule: (fg)\' = f\'g + fg\'',
              chapter: 'Mathematics - Calculus',
            },
            {
              id: '12-jee-math-9',
              question: 'What is the derivative of sin(x)?',
              options: [
                { id: 'a', text: 'cos(x)', isCorrect: true },
                { id: 'b', text: '-cos(x)', isCorrect: false },
                { id: 'c', text: 'sin(x)', isCorrect: false },
                { id: 'd', text: '-sin(x)', isCorrect: false },
              ],
              explanation: 'd/dx(sin(x)) = cos(x)',
              chapter: 'Mathematics - Calculus',
            },
            {
              id: '12-jee-math-10',
              question: 'What is the derivative of cos(x)?',
              options: [
                { id: 'a', text: '-sin(x)', isCorrect: true },
                { id: 'b', text: 'sin(x)', isCorrect: false },
                { id: 'c', text: 'cos(x)', isCorrect: false },
                { id: 'd', text: '-cos(x)', isCorrect: false },
              ],
              explanation: 'd/dx(cos(x)) = -sin(x)',
              chapter: 'Mathematics - Calculus',
            },
          ],
        },
      ],
    },
  },
};

// Helper function to get quizzes for a class-exam combination
export function getQuizzesForClassExam(selectedClass: string, selectedExam: string): ClassExamQuizzes | null {
  const classQuizzes = PREPOMETER_QUIZZES[selectedClass];
  if (!classQuizzes) return null;
  
  const examQuizzes = classQuizzes[selectedExam];
  return examQuizzes || null;
}

