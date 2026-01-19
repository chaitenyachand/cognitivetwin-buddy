import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Target, 
  Clock, 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  TrendingUp,
  Lightbulb
} from "lucide-react";

interface StudyPlan {
  planId: string;
  weeklySchedule: Array<{
    day: string;
    sessions: Array<{
      time: string;
      duration: number;
      activity: string;
      topic: string;
      priority: string;
    }>;
  }>;
  dailyTasks: Array<{
    task: string;
    category: string;
    estimatedMinutes: number;
    xpReward: number;
  }>;
  focusAreas: Array<{
    topic: string;
    reason: string;
    suggestedApproach: string;
  }>;
  milestones: Array<{
    week: number;
    goal: string;
    metrics: string;
  }>;
  tips: string[];
  estimatedCompletionDays: number;
  recommendedDailyMinutes: number;
}

const StudyPlanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [existingPlans, setExistingPlans] = useState<any[]>([]);
  
  // Form state
  const [goalDescription, setGoalDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [topics, setTopics] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadExistingPlans(session.user.id);
      }
    });
  }, [navigate]);

  const loadExistingPlans = async (userId: string) => {
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setExistingPlans(data);
      // Load the most recent active plan
      const activePlan = data.find(p => p.status === 'active');
      if (activePlan && activePlan.ai_recommendations) {
        setStudyPlan({
          planId: activePlan.id,
          ...activePlan.ai_recommendations as any
        });
      }
    }
  };

  const handleGeneratePlan = async () => {
    if (!goalDescription.trim()) {
      toast({
        title: "Please enter your goal",
        description: "Describe what you want to achieve",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const topicsArray = topics.split(',').map(t => t.trim()).filter(Boolean);
      
      const { data, error } = await supabase.functions.invoke('generate_study_plan', {
        body: {
          userId: user?.id,
          goalDescription,
          targetDate: targetDate || null,
          dailyStudyMinutes: dailyMinutes,
          topicsToCover: topicsArray.length > 0 ? topicsArray : null
        }
      });

      if (error) throw error;

      setStudyPlan(data);
      toast({
        title: "Study plan created!",
        description: "Your personalized study plan is ready",
      });
    } catch (error: any) {
      console.error('Error generating plan:', error);
      toast({
        title: "Error generating plan",
        description: error.message || "Failed to create study plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} />
      
      <div className="flex-1 ml-64">
        <div className="px-8 py-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Brain className="w-10 h-10 text-primary" />
              AI Study Planner
            </h1>
            <p className="text-muted-foreground mt-2">
              Get a personalized study schedule based on your goals and performance
            </p>
          </motion.div>

          {!studyPlan ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Create Your Study Plan
                  </CardTitle>
                  <CardDescription>
                    Tell us about your learning goals and we'll create a personalized schedule
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="goal" className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      What's your learning goal?
                    </Label>
                    <Textarea
                      id="goal"
                      placeholder="e.g., Master calculus for my upcoming exam, Learn machine learning basics, Prepare for GMAT..."
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target-date" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Target completion date (optional)
                      </Label>
                      <Input
                        id="target-date"
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="daily-minutes" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Daily study time (minutes)
                      </Label>
                      <Input
                        id="daily-minutes"
                        type="number"
                        min={15}
                        max={480}
                        value={dailyMinutes}
                        onChange={(e) => setDailyMinutes(parseInt(e.target.value) || 30)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topics" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Topics to cover (comma-separated, optional)
                    </Label>
                    <Input
                      id="topics"
                      placeholder="e.g., Derivatives, Integrals, Differential Equations"
                      value={topics}
                      onChange={(e) => setTopics(e.target.value)}
                    />
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                        Generating Your Plan...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5 mr-2" />
                        Generate Personalized Study Plan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated Duration</p>
                          <p className="text-2xl font-bold">{studyPlan.estimatedCompletionDays} days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Daily Commitment</p>
                          <p className="text-2xl font-bold">{studyPlan.recommendedDailyMinutes} min</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Target className="w-8 h-8 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Focus Areas</p>
                          <p className="text-2xl font-bold">{studyPlan.focusAreas?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Daily Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Today's Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studyPlan.dailyTasks?.map((task, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{task.task}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.category} • {task.estimatedMinutes} min
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                            +{task.xpReward} XP
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Weekly Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {studyPlan.weeklySchedule?.map((day, dayIndex) => (
                        <motion.div
                          key={day.day}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: dayIndex * 0.05 }}
                          className="p-4 rounded-lg border bg-card"
                        >
                          <h4 className="font-bold text-lg mb-3">{day.day}</h4>
                          <div className="space-y-2">
                            {day.sessions?.map((session, sessionIndex) => (
                              <div 
                                key={sessionIndex}
                                className="p-2 rounded bg-muted/50"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{session.time}</span>
                                  <Badge className={getPriorityColor(session.priority)} variant="outline">
                                    {session.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm">{session.activity}</p>
                                <p className="text-xs text-muted-foreground">{session.topic} • {session.duration} min</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Focus Areas */}
                {studyPlan.focusAreas && studyPlan.focusAreas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        Priority Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studyPlan.focusAreas.map((area, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-lg border-l-4 border-l-yellow-500 bg-yellow-500/5"
                          >
                            <h4 className="font-bold">{area.topic}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{area.reason}</p>
                            <p className="text-sm text-primary mt-2">{area.suggestedApproach}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                      <div className="space-y-6">
                        {studyPlan.milestones?.map((milestone, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.15 }}
                            className="relative pl-10"
                          >
                            <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-sm font-bold text-primary-foreground">{milestone.week}</span>
                            </div>
                            <div className="p-4 rounded-lg border bg-card">
                              <p className="font-medium">Week {milestone.week}: {milestone.goal}</p>
                              <p className="text-sm text-muted-foreground mt-1">{milestone.metrics}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                {studyPlan.tips && studyPlan.tips.length > 0 && (
                  <Card className="bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        Personalized Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {studyPlan.tips.map((tip, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-2"
                          >
                            <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                            <span className="text-sm">{tip}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* New Plan Button */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setStudyPlan(null)}
                  >
                    Create New Study Plan
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlanner;
