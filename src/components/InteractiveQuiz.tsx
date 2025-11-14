import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface InteractiveQuizProps {
  questions: Question[];
  topicId: string;
  userId: string;
}

const InteractiveQuiz = ({ questions, topicId, userId }: InteractiveQuizProps) => {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === questions[currentQuestion].correctIndex;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + 1);
    }

    setShowResult(true);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setQuizCompleted(true);
        saveQuizResult(newAnswers);
      }
    }, 2000);
  };

  const saveQuizResult = async (finalAnswers: number[]) => {
    const finalScore = (score + (selectedAnswer === questions[currentQuestion].correctIndex ? 1 : 0)) / questions.length * 100;
    
    // Identify weak areas
    const weakAreas: string[] = [];
    questions.forEach((q, idx) => {
      if (finalAnswers[idx] !== q.correctIndex) {
        weakAreas.push(q.question.substring(0, 50));
      }
    });

    try {
      await supabase.from("quiz_results").insert({
        user_id: userId,
        topic_id: topicId,
        score: finalScore,
        weak_areas: weakAreas,
        recommendations: weakAreas.length > 0 
          ? "Review the concepts you missed and try the flashcards for reinforcement."
          : "Great job! You've mastered this topic."
      });

      toast({
        title: "Quiz Complete!",
        description: `You scored ${Math.round(finalScore)}%`,
      });
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizCompleted(false);
  };

  if (quizCompleted) {
    const finalScore = (score / questions.length) * 100;
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-4xl font-bold text-primary">{Math.round(finalScore)}%</div>
          <p className="text-lg font-semibold">Quiz Completed!</p>
          <p className="text-muted-foreground">
            You got {score} out of {questions.length} questions correct.
          </p>
          <Button onClick={resetQuiz}>Retake Quiz</Button>
        </CardContent>
      </Card>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Badge variant="secondary">
          Question {currentQuestion + 1} of {questions.length}
        </Badge>
        <div className="text-sm text-muted-foreground">
          Score: {score}/{currentQuestion + (showResult ? 1 : 0)}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-foreground">{question.question}</h3>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? showResult
                      ? index === question.correctIndex
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : "border-primary bg-primary/5"
                    : showResult && index === question.correctIndex
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && index === question.correctIndex && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                  {showResult && selectedAnswer === index && index !== question.correctIndex && (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {showResult && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-semibold mb-2">Explanation:</p>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          )}

          <Button 
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="w-full"
          >
            {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveQuiz;
