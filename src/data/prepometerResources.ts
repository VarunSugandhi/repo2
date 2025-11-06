// Comprehensive learning resources for each class-exam combination

export interface Resource {
  id: string;
  title: string;
  type: 'note' | 'pyq' | 'video';
  description: string;
  url?: string;
  content?: string;
  year?: number;
  subject?: string;
}

export interface ClassExamResources {
  notes: Resource[];
  previousYearPapers: Resource[];
  videos?: Resource[];
  subjects?: {
    [subject: string]: {
      chapters: Resource[];
    };
  };
}

// Resources data structure for all class-exam combinations
export const PREPOMETER_RESOURCES: Record<string, Record<string, ClassExamResources>> = {
  '8': {
    'Board Exam': {
      notes: [
        { id: '8-board-note-1', title: 'Mathematics - Algebra Basics', type: 'note', description: 'Complete notes on algebraic expressions and equations', subject: 'Mathematics' },
        { id: '8-board-note-2', title: 'Science - Force and Pressure', type: 'note', description: 'Detailed notes on force, pressure, and their applications', subject: 'Science' },
        { id: '8-board-note-3', title: 'Social Studies - Indian Constitution', type: 'note', description: 'Comprehensive notes on the Indian Constitution', subject: 'Social Studies' },
      ],
      previousYearPapers: [
        { 
          id: '8-board-pyq-1', 
          title: 'CBSE Class 8 - 2023 Question Paper', 
          type: 'pyq', 
          description: 'Complete question paper with solutions', 
          year: 2023,
          content: `CBSE Class 8 Mathematics Question Paper 2023

SECTION A (Multiple Choice Questions - 1 mark each)

1. What is the value of x in the equation 2x + 5 = 15?
   a) 5
   b) 10
   c) 7
   d) 8

2. Simplify: 3a + 2a - a
   a) 4a
   b) 5a
   c) 6a
   d) 3a

3. What is the coefficient of x in 5x + 3?
   a) 5
   b) 3
   c) x
   d) 8

SECTION B (Short Answer Questions - 2 marks each)

4. Solve the equation: 3(x - 2) = 9

5. If y = 3x + 2, find the value of y when x = 4.

6. What is the square root of 64?

SECTION C (Long Answer Questions - 4 marks each)

7. Factorize: x² - 9

8. Find the LCM of 4 and 6.

9. If a = 5 and b = 3, calculate a² - b².

10. A rectangle has length 8 cm and width 5 cm. Find its area and perimeter.`
        },
        { 
          id: '8-board-pyq-2', 
          title: 'CBSE Class 8 - 2022 Question Paper', 
          type: 'pyq', 
          description: 'Complete question paper with solutions', 
          year: 2022,
          content: `CBSE Class 8 Mathematics Question Paper 2022

SECTION A

1. What is the value of 2³?
   a) 6
   b) 8
   c) 4
   d) 9

2. Solve: x + 7 = 15

3. What is the area of a square with side 6 cm?

SECTION B

4. Expand: (x + 3)(x + 2)

5. Find the HCF of 12 and 18.

6. Simplify: (2x + 3) + (x - 1)`
        },
        { 
          id: '8-board-pyq-3', 
          title: 'CBSE Class 8 - 2021 Question Paper', 
          type: 'pyq', 
          description: 'Complete question paper with solutions', 
          year: 2021,
          content: `CBSE Class 8 Mathematics Question Paper 2021

SECTION A

1. What is 15% of 200?
   a) 30
   b) 25
   c) 35
   d) 40

2. Solve: 4x = 20

3. What is the perimeter of a rectangle with length 10 cm and width 6 cm?

SECTION B

4. Factorize: x² - 4

5. Find the value of 3² × 2³

6. If the cost of 5 pens is ₹25, find the cost of 8 pens.`
        },
      ],
    },
  },
  '9': {
    'Board Exam': {
      notes: [
        { id: '9-board-note-1', title: 'Mathematics - Number Systems', type: 'note', description: 'Complete notes on real numbers and number systems', subject: 'Mathematics' },
        { id: '9-board-note-2', title: 'Science - Matter in Our Surroundings', type: 'note', description: 'Detailed notes on states of matter and properties', subject: 'Science' },
        { id: '9-board-note-3', title: 'English - Literature Analysis', type: 'note', description: 'Comprehensive notes on prose and poetry', subject: 'English' },
      ],
      previousYearPapers: [
        { id: '9-board-pyq-1', title: 'CBSE Class 9 - 2023 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2023 },
        { id: '9-board-pyq-2', title: 'CBSE Class 9 - 2022 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2022 },
      ],
    },
  },
  '10': {
    'Board Exam': {
      notes: [
        { id: '10-board-note-1', title: 'Mathematics - Quadratic Equations', type: 'note', description: 'Complete notes on quadratic equations and solutions', subject: 'Mathematics' },
        { id: '10-board-note-2', title: 'Science - Chemical Reactions', type: 'note', description: 'Detailed notes on types of chemical reactions', subject: 'Science' },
        { id: '10-board-note-3', title: 'Social Science - Nationalism in India', type: 'note', description: 'Comprehensive notes on Indian nationalism', subject: 'Social Science' },
      ],
      previousYearPapers: [
        { id: '10-board-pyq-1', title: 'CBSE Class 10 - 2023 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2023 },
        { id: '10-board-pyq-2', title: 'CBSE Class 10 - 2022 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2022 },
        { id: '10-board-pyq-3', title: 'CBSE Class 10 - 2021 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2021 },
      ],
    },
  },
  '11': {
    'Board Exam': {
      notes: [
        { id: '11-board-note-1', title: 'Mathematics - Sets and Relations', type: 'note', description: 'Complete notes on sets, relations, and functions', subject: 'Mathematics' },
        { id: '11-board-note-2', title: 'Physics - Units and Measurements', type: 'note', description: 'Detailed notes on physical quantities and units', subject: 'Physics' },
        { id: '11-board-note-3', title: 'Chemistry - Atomic Structure', type: 'note', description: 'Comprehensive notes on atomic models and structure', subject: 'Chemistry' },
        { id: '11-board-note-4', title: 'Biology - Cell Structure', type: 'note', description: 'Detailed notes on cell organelles and functions', subject: 'Biology' },
      ],
      previousYearPapers: [
        { id: '11-board-pyq-1', title: 'CBSE Class 11 - 2023 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2023 },
        { id: '11-board-pyq-2', title: 'CBSE Class 11 - 2022 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2022 },
      ],
    },
    'JEE': {
      notes: [
        { id: '11-jee-note-1', title: 'Physics - Mechanics Fundamentals', type: 'note', description: 'Complete notes on kinematics, dynamics, and rotational motion', subject: 'Physics', content: 'Chapter: Mechanics Fundamentals' },
        { id: '11-jee-note-2', title: 'Chemistry - Organic Chemistry Basics', type: 'note', description: 'Detailed notes on hydrocarbons and functional groups', subject: 'Chemistry', content: 'Chapter: Organic Chemistry Basics' },
        { id: '11-jee-note-3', title: 'Mathematics - Calculus Introduction', type: 'note', description: 'Comprehensive notes on limits, derivatives, and integrals', subject: 'Mathematics', content: 'Chapter: Calculus Introduction' },
      ],
      subjects: {
        'Physics': {
          chapters: [
            { id: '11-jee-phy-ch1', title: 'Chapter 1: Kinematics', type: 'note', description: 'Complete notes on motion, velocity, and acceleration', subject: 'Physics', content: 'Chapter: Kinematics' },
            { id: '11-jee-phy-ch2', title: 'Chapter 2: Laws of Motion', type: 'note', description: 'Detailed notes on Newton\'s laws and applications', subject: 'Physics', content: 'Chapter: Laws of Motion' },
            { id: '11-jee-phy-ch3', title: 'Chapter 3: Work, Energy and Power', type: 'note', description: 'Comprehensive notes on energy concepts', subject: 'Physics', content: 'Chapter: Work, Energy and Power' },
          ],
        },
        'Chemistry': {
          chapters: [
            { id: '11-jee-chem-ch1', title: 'Chapter 1: Atomic Structure', type: 'note', description: 'Complete notes on atomic models and electron configuration', subject: 'Chemistry', content: 'Chapter: Atomic Structure' },
            { id: '11-jee-chem-ch2', title: 'Chapter 2: Chemical Bonding', type: 'note', description: 'Detailed notes on ionic, covalent, and coordinate bonding', subject: 'Chemistry', content: 'Chapter: Chemical Bonding' },
            { id: '11-jee-chem-ch3', title: 'Chapter 3: Organic Chemistry Basics', type: 'note', description: 'Comprehensive notes on hydrocarbons and functional groups', subject: 'Chemistry', content: 'Chapter: Organic Chemistry Basics' },
          ],
        },
        'Mathematics': {
          chapters: [
            { id: '11-jee-math-ch1', title: 'Chapter 1: Sets and Relations', type: 'note', description: 'Complete notes on sets, relations, and functions', subject: 'Mathematics', content: 'Chapter: Sets and Relations' },
            { id: '11-jee-math-ch2', title: 'Chapter 2: Limits and Continuity', type: 'note', description: 'Detailed notes on limits and continuity concepts', subject: 'Mathematics', content: 'Chapter: Limits and Continuity' },
            { id: '11-jee-math-ch3', title: 'Chapter 3: Differentiation', type: 'note', description: 'Comprehensive notes on derivatives and applications', subject: 'Mathematics', content: 'Chapter: Differentiation' },
          ],
        },
      },
      previousYearPapers: [
        { 
          id: '11-jee-pyq-1', 
          title: 'JEE Main 2023 - Paper 1', 
          type: 'pyq', 
          description: 'Complete JEE Main question paper with solutions', 
          year: 2023,
          content: `JEE Main 2023 - Physics, Chemistry, Mathematics Paper 1

PHYSICS SECTION

1. A body is moving with constant velocity. What is the net force acting on it?
   a) Zero
   b) Maximum
   c) Equal to weight
   d) Infinite

2. What is the work done by a force F = 10N moving a body 5m in the direction of force?
   a) 50 J
   b) 2 J
   c) 15 J
   d) 5 J

3. A ball is thrown upward. At the highest point, what is its velocity?
   a) Zero
   b) Maximum
   c) Equal to initial velocity
   d) Negative

4. What is the formula for kinetic energy?
   a) KE = ½mv²
   b) KE = mv²
   c) KE = 2mv²
   d) KE = mgh

5. What is the unit of momentum?
   a) kg m/s
   b) kg m/s²
   c) N m
   d) J/s

CHEMISTRY SECTION

6. What is the general formula for alkanes?
   a) CnH2n+2
   b) CnH2n
   c) CnH2n-2
   d) CnHn

7. What is the IUPAC name of CH₃CH₂CH₃?
   a) Propane
   b) Ethane
   c) Butane
   d) Methane

8. What type of bond is present in alkenes?
   a) Double bond
   b) Single bond
   c) Triple bond
   d) Ionic bond

MATHEMATICS SECTION

9. What is the derivative of x²?
   a) 2x
   b) x
   c) x²
   d) 2x²

10. What is the integral of 2x?
    a) x² + C
    b) 2x + C
    c) x + C
    d) 2x² + C`
        },
        { 
          id: '11-jee-pyq-2', 
          title: 'JEE Main 2022 - Paper 1', 
          type: 'pyq', 
          description: 'Complete JEE Main question paper with solutions', 
          year: 2022,
          content: `JEE Main 2022 - Physics, Chemistry, Mathematics Paper 1

PHYSICS SECTION

1. What is the acceleration due to gravity on Earth?
   a) 9.8 m/s²
   b) 10 m/s²
   c) 8.9 m/s²
   d) 11 m/s²

2. What is the relationship between force, mass, and acceleration?
   a) F = ma
   b) F = m/a
   c) F = a/m
   d) F = m + a

3. What is power?
   a) Work done per unit time
   b) Force per unit area
   c) Energy per unit mass
   d) Velocity per unit time

CHEMISTRY SECTION

4. What is the functional group of alcohols?
   a) -OH
   b) -COOH
   c) -CHO
   d) -NH₂

5. What is the product of complete combustion of methane?
   a) CO₂ and H₂O
   b) CO and H₂O
   c) C and H₂O
   d) CO₂ and H₂

MATHEMATICS SECTION

6. What is lim(x→0) sin(x)/x?
   a) 1
   b) 0
   c) ∞
   d) Undefined

7. What is the derivative of eˣ?
   a) eˣ
   b) xeˣ
   c) eˣ/x
   d) ln(x)`
        },
        { 
          id: '11-jee-pyq-3', 
          title: 'JEE Advanced 2023 - Paper 1', 
          type: 'pyq', 
          description: 'Complete JEE Advanced question paper', 
          year: 2023,
          content: `JEE Advanced 2023 - Paper 1

PHYSICS SECTION

1. A 2 kg object is lifted 10 m. What is the potential energy gained? (g = 10 m/s²)
   a) 200 J
   b) 20 J
   c) 100 J
   d) 400 J

2. According to conservation of momentum, what remains constant in a closed system?
   a) Total momentum
   b) Total energy
   c) Total mass
   d) Total velocity

CHEMISTRY SECTION

3. What is the hybridization of carbon in ethane?
   a) sp³
   b) sp²
   c) sp
   d) sp³d

4. What is the IUPAC name of CH₃CH₂OH?
   a) Ethanol
   b) Methanol
   c) Propanol
   d) Butanol

MATHEMATICS SECTION

5. What is the derivative of ln(x)?
   a) 1/x
   b) x
   c) 1/x²
   d) ln(x)

6. What is ∫(1/x) dx?
   a) ln|x| + C
   b) x + C
   c) 1/x + C
   d) x²/2 + C`
        },
      ],
    },
    'NEET': {
      notes: [
        { id: '11-neet-note-1', title: 'Biology - Plant Kingdom', type: 'note', description: 'Complete notes on plant classification and characteristics', subject: 'Biology' },
        { id: '11-neet-note-2', title: 'Chemistry - Chemical Bonding', type: 'note', description: 'Detailed notes on ionic, covalent, and coordinate bonding', subject: 'Chemistry' },
        { id: '11-neet-note-3', title: 'Physics - Thermodynamics', type: 'note', description: 'Comprehensive notes on laws of thermodynamics', subject: 'Physics' },
      ],
      previousYearPapers: [
        { id: '11-neet-pyq-1', title: 'NEET 2023 - Question Paper', type: 'pyq', description: 'Complete NEET question paper with solutions', year: 2023 },
        { id: '11-neet-pyq-2', title: 'NEET 2022 - Question Paper', type: 'pyq', description: 'Complete NEET question paper with solutions', year: 2022 },
        { id: '11-neet-pyq-3', title: 'NEET 2021 - Question Paper', type: 'pyq', description: 'Complete NEET question paper with solutions', year: 2021 },
      ],
    },
  },
  '12': {
    'Board Exam': {
      notes: [
        { id: '12-board-note-1', title: 'Mathematics - Differential Equations', type: 'note', description: 'Complete notes on solving differential equations', subject: 'Mathematics' },
        { id: '12-board-note-2', title: 'Physics - Electromagnetic Induction', type: 'note', description: 'Detailed notes on Faraday\'s law and Lenz\'s law', subject: 'Physics' },
        { id: '12-board-note-3', title: 'Chemistry - Coordination Compounds', type: 'note', description: 'Comprehensive notes on coordination chemistry', subject: 'Chemistry' },
        { id: '12-board-note-4', title: 'Biology - Genetics and Evolution', type: 'note', description: 'Detailed notes on Mendelian genetics and evolution', subject: 'Biology' },
      ],
      previousYearPapers: [
        { id: '12-board-pyq-1', title: 'CBSE Class 12 - 2023 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2023 },
        { id: '12-board-pyq-2', title: 'CBSE Class 12 - 2022 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2022 },
        { id: '12-board-pyq-3', title: 'CBSE Class 12 - 2021 Question Paper', type: 'pyq', description: 'Complete question paper with solutions', year: 2021 },
      ],
    },
    'JEE': {
      notes: [
        { id: '12-jee-note-1', title: 'Physics - Modern Physics', type: 'note', description: 'Complete notes on quantum mechanics and nuclear physics', subject: 'Physics' },
        { id: '12-jee-note-2', title: 'Chemistry - Organic Reactions', type: 'note', description: 'Detailed notes on named reactions and mechanisms', subject: 'Chemistry' },
        { id: '12-jee-note-3', title: 'Mathematics - 3D Geometry', type: 'note', description: 'Comprehensive notes on vectors and 3D coordinate geometry', subject: 'Mathematics' },
      ],
      previousYearPapers: [
        { id: '12-jee-pyq-1', title: 'JEE Main 2023 - Paper 1', type: 'pyq', description: 'Complete JEE Main question paper with solutions', year: 2023 },
        { id: '12-jee-pyq-2', title: 'JEE Main 2022 - Paper 1', type: 'pyq', description: 'Complete JEE Main question paper with solutions', year: 2022 },
        { id: '12-jee-pyq-3', title: 'JEE Advanced 2023 - Paper 1', type: 'pyq', description: 'Complete JEE Advanced question paper', year: 2023 },
        { id: '12-jee-pyq-4', title: 'JEE Advanced 2022 - Paper 1', type: 'pyq', description: 'Complete JEE Advanced question paper', year: 2022 },
      ],
    },
    'NEET': {
      notes: [
        { id: '12-neet-note-1', title: 'Biology - Human Physiology', type: 'note', description: 'Complete notes on digestive, respiratory, and circulatory systems', subject: 'Biology' },
        { id: '12-neet-note-2', title: 'Chemistry - Biomolecules', type: 'note', description: 'Detailed notes on carbohydrates, proteins, and nucleic acids', subject: 'Chemistry' },
        { id: '12-neet-note-3', title: 'Physics - Optics', type: 'note', description: 'Comprehensive notes on ray optics and wave optics', subject: 'Physics' },
      ],
      previousYearPapers: [
        { id: '12-neet-pyq-1', title: 'NEET 2023 - Question Paper', type: 'pyq', description: 'Complete NEET question paper with solutions', year: 2023 },
        { id: '12-neet-pyq-2', title: 'NEET 2022 - Question Paper', type: 'pyq', description: 'Complete NEET question paper with solutions', year: 2022 },
        { id: '12-neet-pyq-3', title: 'NEET 2021 - Question Paper', type: 'pyq', description: 'Complete NEET question paper with solutions', year: 2021 },
      ],
    },
    'UPSC': {
      notes: [
        { id: '12-upsc-note-1', title: 'History - Modern India', type: 'note', description: 'Complete notes on Indian freedom struggle and independence', subject: 'History' },
        { id: '12-upsc-note-2', title: 'Geography - Indian Geography', type: 'note', description: 'Detailed notes on physical and human geography of India', subject: 'Geography' },
        { id: '12-upsc-note-3', title: 'Polity - Indian Constitution', type: 'note', description: 'Comprehensive notes on constitutional provisions and amendments', subject: 'Polity' },
      ],
      previousYearPapers: [
        { id: '12-upsc-pyq-1', title: 'UPSC Prelims 2023', type: 'pyq', description: 'Complete UPSC Prelims question paper', year: 2023 },
        { id: '12-upsc-pyq-2', title: 'UPSC Prelims 2022', type: 'pyq', description: 'Complete UPSC Prelims question paper', year: 2022 },
      ],
    },
    'SSC': {
      notes: [
        { id: '12-ssc-note-1', title: 'General Knowledge - Current Affairs', type: 'note', description: 'Complete notes on recent events and current affairs', subject: 'General Knowledge' },
        { id: '12-ssc-note-2', title: 'Mathematics - Quantitative Aptitude', type: 'note', description: 'Detailed notes on arithmetic and algebra', subject: 'Mathematics' },
        { id: '12-ssc-note-3', title: 'English - Grammar and Comprehension', type: 'note', description: 'Comprehensive notes on English grammar rules', subject: 'English' },
      ],
      previousYearPapers: [
        { id: '12-ssc-pyq-1', title: 'SSC CGL 2023 - Tier 1', type: 'pyq', description: 'Complete SSC CGL question paper', year: 2023 },
        { id: '12-ssc-pyq-2', title: 'SSC CGL 2022 - Tier 1', type: 'pyq', description: 'Complete SSC CGL question paper', year: 2022 },
      ],
    },
    'CAT': {
      notes: [
        { id: '12-cat-note-1', title: 'Quantitative Aptitude - Algebra', type: 'note', description: 'Complete notes on algebra and number systems', subject: 'Quantitative Aptitude' },
        { id: '12-cat-note-2', title: 'Verbal Ability - Reading Comprehension', type: 'note', description: 'Detailed notes on RC strategies and practice', subject: 'Verbal Ability' },
        { id: '12-cat-note-3', title: 'Data Interpretation - Charts and Graphs', type: 'note', description: 'Comprehensive notes on DI problem-solving', subject: 'Data Interpretation' },
      ],
      previousYearPapers: [
        { id: '12-cat-pyq-1', title: 'CAT 2023 - Question Paper', type: 'pyq', description: 'Complete CAT question paper with solutions', year: 2023 },
        { id: '12-cat-pyq-2', title: 'CAT 2022 - Question Paper', type: 'pyq', description: 'Complete CAT question paper with solutions', year: 2022 },
      ],
    },
    'CLAT': {
      notes: [
        { id: '12-clat-note-1', title: 'Legal Reasoning - Constitutional Law', type: 'note', description: 'Complete notes on constitutional provisions and cases', subject: 'Legal Reasoning' },
        { id: '12-clat-note-2', title: 'English - Legal Vocabulary', type: 'note', description: 'Detailed notes on legal terms and phrases', subject: 'English' },
        { id: '12-clat-note-3', title: 'Logical Reasoning - Syllogisms', type: 'note', description: 'Comprehensive notes on logical reasoning patterns', subject: 'Logical Reasoning' },
      ],
      previousYearPapers: [
        { id: '12-clat-pyq-1', title: 'CLAT 2023 - Question Paper', type: 'pyq', description: 'Complete CLAT question paper with solutions', year: 2023 },
        { id: '12-clat-pyq-2', title: 'CLAT 2022 - Question Paper', type: 'pyq', description: 'Complete CLAT question paper with solutions', year: 2022 },
      ],
    },
  },
};

// Helper function to get resources for a class-exam combination
export function getResourcesForClassExam(selectedClass: string, selectedExam: string): ClassExamResources | null {
  const classResources = PREPOMETER_RESOURCES[selectedClass];
  if (!classResources) return null;
  
  const examResources = classResources[selectedExam];
  return examResources || null;
}

