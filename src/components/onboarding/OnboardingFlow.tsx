import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Headphones, 
  Eye, 
  Pen, 
  Sun, 
  Moon, 
  Coffee, 
  Target, 
  BookOpen, 
  Code, 
  Microscope, 
  PenTool,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

const learningStyles = [
  { id: "visual", label: "Visual", icon: Eye, description: "I learn best with diagrams & videos" },
  { id: "auditory", label: "Auditory", icon: Headphones, description: "I learn best by listening" },
  { id: "reading", label: "Reading/Writing", icon: BookOpen, description: "I prefer reading & notes" },
  { id: "kinesthetic", label: "Hands-on", icon: Pen, description: "I learn by doing" },
];

const studyTimes = [
  { id: "morning", label: "Morning Person", icon: Sun, description: "6 AM - 12 PM" },
  { id: "afternoon", label: "Afternoon Focus", icon: Coffee, description: "12 PM - 6 PM" },
  { id: "night", label: "Night Owl", icon: Moon, description: "6 PM - 12 AM" },
];

const interests = [
  { id: "science", label: "Science", icon: Microscope },
  { id: "technology", label: "Technology", icon: Code },
  { id: "arts", label: "Arts & Design", icon: PenTool },
  { id: "math", label: "Mathematics", icon: Brain },
  { id: "languages", label: "Languages", icon: BookOpen },
  { id: "business", label: "Business", icon: Target },
];

const dailyGoals = [15, 30, 45, 60];

const OnboardingFlow = ({ userId, onComplete }: OnboardingFlowProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [learningStyle, setLearningStyle] = useState<string>("");
  const [studyTime, setStudyTime] = useState<string>("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(30);
  const [saving, setSaving] = useState(false);

  const totalSteps = 4;

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("user_onboarding").upsert({
        user_id: userId,
        learning_style: learningStyle,
        preferred_study_time: studyTime,
        interests: selectedInterests,
        daily_goal_minutes: dailyGoal,
        onboarding_completed: true,
        step_completed: totalSteps,
      }, { onConflict: "user_id" });

      if (error) throw error;

      // Update user stats with daily goal
      await supabase.from("user_stats").upsert({
        user_id: userId,
        daily_goal_minutes: dailyGoal,
      }, { onConflict: "user_id" });

      toast({
        title: "Welcome aboard! 🎉",
        description: "Your learning journey begins now!",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error saving preferences",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return true; // Welcome screen
      case 1:
        return learningStyle !== "";
      case 2:
        return studyTime !== "";
      case 3:
        return selectedInterests.length > 0;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold gradient-text">Welcome to CognitiveTwin!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Let's personalize your learning experience. This will only take a minute!
            </p>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold">How do you learn best?</h2>
              <p className="text-muted-foreground">This helps us tailor your materials</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {learningStyles.map(style => (
                <motion.div
                  key={style.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLearningStyle(style.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    learningStyle === style.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <style.icon className={`w-8 h-8 mb-2 ${learningStyle === style.id ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-semibold">{style.label}</p>
                  <p className="text-xs text-muted-foreground">{style.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold">When do you study best?</h2>
              <p className="text-muted-foreground">We'll optimize reminders for you</p>
            </div>
            <div className="space-y-3">
              {studyTimes.map(time => (
                <motion.div
                  key={time.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setStudyTime(time.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    studyTime === time.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <time.icon className={`w-8 h-8 ${studyTime === time.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className="font-semibold">{time.label}</p>
                    <p className="text-xs text-muted-foreground">{time.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold">What are you interested in?</h2>
              <p className="text-muted-foreground">Select all that apply</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {interests.map(interest => (
                <motion.div
                  key={interest.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleInterest(interest.id)}
                  className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                    selectedInterests.includes(interest.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <interest.icon className={`w-6 h-6 mx-auto mb-1 ${selectedInterests.includes(interest.id) ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm font-medium">{interest.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="pt-4">
              <Label className="text-center block mb-3">Daily study goal (minutes)</Label>
              <div className="flex justify-center gap-3">
                {dailyGoals.map(goal => (
                  <motion.button
                    key={goal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDailyGoal(goal)}
                    className={`w-14 h-14 rounded-xl font-bold transition-all ${
                      dailyGoal === goal
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {goal}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="border-none shadow-2xl">
          <CardContent className="pt-8 pb-6 px-6">
            {/* Progress bar */}
            <div className="flex gap-2 mb-8">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i <= step ? 1 : 0.3 }}
                  className={`h-1.5 flex-1 rounded-full origin-left ${
                    i <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
                  Back
                </Button>
              ) : (
                <div />
              )}
              
              {step < totalSteps - 1 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed() || saving}
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  {saving ? "Saving..." : "Get Started"}
                  <Sparkles className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OnboardingFlow;
