import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import type { ChapterQuiz, QuizQuestion } from "@/data/prepometerQuizzes";

interface PracticeQuizProps {
  chapters: ChapterQuiz[];
  onClose: () => void;
}

export default function PracticeQuiz({ chapters, onClose }: PracticeQuizProps) {
  const [selectedChapter, setSelectedChapter] = useState<ChapterQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { selected: string; isCorrect: boolean }>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleChapterSelect = (chapter: ChapterQuiz) => {
    setSelectedChapter(chapter);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setAnswers({});
    setQuizCompleted(false);
  };

  const handleOptionSelect = (optionId: string) => {
    if (showAnswer) return; // Prevent changing answer after showing result
    
    setSelectedAnswer(optionId);
    const currentQuestion = selectedChapter?.questions[currentQuestionIndex];
    const isCorrect = currentQuestion?.options.find(opt => opt.id === optionId)?.isCorrect || false;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: { selected: optionId, isCorrect }
    }));
    
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < (selectedChapter?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setAnswers({});
    setQuizCompleted(false);
  };

  const calculateScore = () => {
    const total = selectedChapter?.questions.length || 0;
    const correct = Object.values(answers).filter(a => a.isCorrect).length;
    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  };

  if (!selectedChapter) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold mb-4">Select a Chapter</h3>
        <div className="space-y-2">
          {chapters.map((chapter, idx) => (
            <button
              key={idx}
              onClick={() => handleChapterSelect(chapter)}
              className="w-full p-4 rounded-lg border border-border bg-gradient-card hover:shadow-lg transition-all text-left"
            >
              <h4 className="font-semibold">{chapter.chapterName}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {chapter.questions.length} questions
              </p>
            </button>
          ))}
        </div>
        <Button onClick={onClose} variant="outline" className="w-full mt-4">
          Back
        </Button>
      </div>
    );
  }

  if (quizCompleted) {
    const { correct, total, percentage } = calculateScore();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
          <div className="text-4xl font-bold text-primary mb-2">{percentage}%</div>
          <p className="text-muted-foreground">
            You scored {correct} out of {total}
          </p>
        </div>

        {/* Progress Graph */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Graph
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Score</span>
              <span className="font-semibold">{percentage}%</span>
            </div>
            <div className="w-full h-8 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  percentage >= 80 ? 'bg-green-500' :
                  percentage >= 60 ? 'bg-yellow-500' :
                  percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <div className="text-2xl font-bold text-green-600">{correct}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10">
              <div className="text-2xl font-bold text-red-600">{total - correct}</div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">{total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRestart} className="flex-1">
            Retake Quiz
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Back to Prepometer
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = selectedChapter.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === selectedChapter.questions.length - 1;
  const userAnswer = answers[currentQuestionIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">{selectedChapter.chapterName}</h3>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {selectedChapter.questions.length}
          </p>
        </div>
        <div className="text-sm font-semibold text-primary">
          Score: {Object.values(answers).filter(a => a.isCorrect).length}/{currentQuestionIndex + 1}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / selectedChapter.questions.length) * 100}%` }}
        />
      </div>

      <div className="p-6 rounded-lg border border-border bg-gradient-card">
        <h4 className="text-lg font-semibold mb-4">{currentQuestion.question}</h4>
        
        <div className="space-y-2">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.isCorrect;
            const showResult = showAnswer && userAnswer;

            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={showAnswer}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  showResult
                    ? isCorrect
                      ? 'border-green-500 bg-green-500/10'
                      : isSelected
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-border bg-gradient-card'
                    : isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-gradient-card hover:border-primary/50'
                } ${showAnswer ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.text}</span>
                  {showResult && (
                    <>
                      {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {!isCorrect && isSelected && <XCircle className="h-5 w-5 text-red-500" />}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showAnswer && currentQuestion.explanation && (
          <div className={`mt-4 p-4 rounded-lg ${
            userAnswer?.isCorrect ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'
          }`}>
            <p className="text-sm">
              <span className="font-semibold">Explanation: </span>
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {currentQuestionIndex > 0 && (
          <Button
            onClick={() => {
              setCurrentQuestionIndex(prev => prev - 1);
              setSelectedAnswer(answers[currentQuestionIndex - 1]?.selected || null);
              setShowAnswer(!!answers[currentQuestionIndex - 1]);
            }}
            variant="outline"
            className="flex-1"
          >
            Previous
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!showAnswer}
          className="flex-1"
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

