import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import LearningActivityCalendar from "@/components/LearningActivityCalendar";
import TopicProgressCard from "@/components/TopicProgressCard";
import ProgressChart from "@/components/ProgressChart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MaterialViewer from "@/components/MaterialViewer";
import WeakTopicsSection from "@/components/WeakTopicsSection";
import XPProgressBar from "@/components/gamification/XPProgressBar";
import DailyChallenges from "@/components/gamification/DailyChallenges";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { BookOpen, FileText, Map, Layers, Brain, Trophy, Flame } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<{
    type: "summary" | "mindmap" | "flashcards" | "formula_sheet" | "quiz";
    content: any;
    topicName: string;
    topicId: string;
  } | null>(null);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  
  const { stats, loading: statsLoading, refreshData } = useGamification(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadDashboardData(session.user.id);
        checkOnboardingStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkOnboardingStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_onboarding")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Show onboarding if no record exists or not completed
      if (!data || !data.onboarding_completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refreshData();
  };

  const loadDashboardData = async (userId: string) => {
    try {
      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (topicsError) throw topicsError;
      setTopics(topicsData || []);

      const { data: activityLogData, error: activityError } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", userId)
        .order("activity_date", { ascending: false });

      if (activityError) throw activityError;
      setActivityData(activityLogData || []);

      // Check if user has completed any quizzes
      const { data: quizData } = await supabase
        .from("quiz_results")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      
      setHasCompletedQuiz((quizData?.length || 0) > 0);
    } catch (error: any) {
      toast({
        title: "Error loading dashboard data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewMaterial = async (topicId: string, topicName: string, materialType: "summary" | "mindmap" | "flashcards" | "formula_sheet" | "quiz") => {
    try {
      if (materialType === "summary") {
        const { data: topicData, error } = await supabase
          .from("topics")
          .select("summary")
          .eq("id", topicId)
          .single();

        if (error) throw error;
        
        setSelectedMaterial({
          type: "summary",
          content: topicData.summary,
          topicName,
          topicId,
        });
      } else if (materialType === "mindmap") {
        const { data: mindmapData, error } = await supabase
          .from("mindmaps")
          .select("nodes_json, edges_json")
          .eq("topic_id", topicId)
          .maybeSingle();

        if (error) throw error;
        if (!mindmapData) throw new Error("Mindmap not found");

        setSelectedMaterial({
          type: "mindmap",
          content: { nodes: mindmapData.nodes_json, edges: mindmapData.edges_json },
          topicName,
          topicId,
        });
      } else if (materialType === "flashcards") {
        const { data: flashcardsData, error } = await supabase
          .from("flashcards")
          .select("flashcard_json")
          .eq("topic_id", topicId)
          .maybeSingle();

        if (error) throw error;
        if (!flashcardsData) throw new Error("Flashcards not found");

        setSelectedMaterial({
          type: "flashcards",
          content: flashcardsData.flashcard_json,
          topicName,
          topicId,
        });
      } else {
        const { data: materialData, error } = await supabase
          .from("materials")
          .select("content")
          .eq("topic_id", topicId)
          .eq("material_type", materialType)
          .maybeSingle();

        if (error) throw error;
        if (!materialData) throw new Error("Material not found");

        setSelectedMaterial({
          type: materialType,
          content: materialData.content,
          topicName,
          topicId,
        });
      }

      setViewerOpen(true);
    } catch (error: any) {
      toast({
        title: "Error loading material",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (showOnboarding && user) {
    return <OnboardingFlow userId={user.id} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      <Sidebar user={user} />
      
      <div className="flex-1 ml-64">
        <div className="border-b border-border bg-gradient-to-r from-card/50 via-card/80 to-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {hasCompletedQuiz ? `Welcome back, ${user?.user_metadata?.name || "Student"}! 👋` : `Welcome, ${user?.user_metadata?.name || "Student"}! 👋`}
                </h1>
                <p className="text-muted-foreground mt-2">{hasCompletedQuiz ? "Continue your learning journey" : "Start your learning journey"}</p>
              </div>
              {/* Quick Stats */}
              {stats && (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-full">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-bold">{stats.current_streak}</span>
                    <span className="text-sm text-muted-foreground">day streak</span>
                  </div>
                  <Button variant="outline" onClick={() => navigate("/achievements")} className="gap-2">
                    <Trophy className="w-4 h-4" />
                    Achievements
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* XP Progress Bar */}
          {user && <XPProgressBar userId={user.id} className="mb-8" />}
          
          <Tabs defaultValue="dashboard" className="space-y-8">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Dashboard</TabsTrigger>
              <TabsTrigger value="topics" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Topics</TabsTrigger>
              <TabsTrigger value="challenges" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Challenges</TabsTrigger>
              <TabsTrigger value="next-steps" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Next Steps</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8 mt-8 animate-fade-in">
              <LearningActivityCalendar activityData={activityData} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
                    <h2 className="text-2xl font-bold text-foreground">Topics Covered</h2>
                  </div>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : topics.length === 0 ? (
                    <Card className="border-dashed border-2">
                      <CardContent className="pt-12 pb-12 text-center">
                        <p className="text-muted-foreground">No topics yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {topics.slice(0, 5).map((topic) => (
                        <TopicProgressCard key={topic.id} topic={topic.name} progress={topic.progress} />
                      ))}
                    </div>
                  )}
                </div>
                {user && <ProgressChart userId={user.id} />}
              </div>
            </TabsContent>

            <TabsContent value="challenges" className="mt-8 animate-fade-in">
              {user && <DailyChallenges userId={user.id} />}
            </TabsContent>

            <TabsContent value="topics" className="space-y-6 mt-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
                <h2 className="text-3xl font-bold text-foreground">Your Learning History</h2>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : topics.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="pt-16 pb-16 text-center">
                    <p className="text-muted-foreground text-xl">No topics yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {topics.map((topic) => (
                    <Card key={topic.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                      <CardContent className="pt-8">
                        <div className="space-y-8">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-7 h-7 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-2xl text-foreground mb-2">{topic.name}</h3>
                              <p className="text-sm text-muted-foreground">Started: {new Date(topic.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-primary/5 to-transparent p-5 rounded-xl space-y-3">
                              <p className="text-sm font-semibold">Progress</p>
                              <p className="text-3xl font-bold text-primary">{topic.progress}%</p>
                              <div className="w-full bg-muted rounded-full h-3">
                                <div className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all" style={{ width: `${topic.progress}%` }} />
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-secondary/5 to-transparent p-5 rounded-xl space-y-3">
                              <p className="text-sm font-semibold">Best Score</p>
                              <p className="text-3xl font-bold text-secondary text-right">{topic.best_score}%</p>
                              <div className="w-full bg-muted rounded-full h-3">
                                <div className="bg-gradient-to-r from-secondary to-accent h-3 rounded-full transition-all" style={{ width: `${topic.best_score}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Button variant="outline" className="hover:bg-primary/10 hover:border-primary" onClick={() => handleViewMaterial(topic.id, topic.name, "summary")}>
                              <FileText className="w-4 h-4 mr-2" />Summary
                            </Button>
                            <Button variant="outline" className="hover:bg-secondary/10 hover:border-secondary" onClick={() => handleViewMaterial(topic.id, topic.name, "mindmap")}>
                              <Map className="w-4 h-4 mr-2" />Mind Map
                            </Button>
                            <Button variant="outline" className="hover:bg-accent/10 hover:border-accent" onClick={() => handleViewMaterial(topic.id, topic.name, "flashcards")}>
                              <Layers className="w-4 h-4 mr-2" />Flashcards
                            </Button>
                            <Button variant="outline" className="hover:bg-primary/10 hover:border-primary" onClick={() => handleViewMaterial(topic.id, topic.name, "formula_sheet")}>
                              Formula
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="next-steps" className="mt-8 animate-fade-in">
              {user && <WeakTopicsSection userId={user.id} onViewMaterial={handleViewMaterial} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {selectedMaterial && (
        <MaterialViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          type={selectedMaterial.type}
          content={selectedMaterial.content}
          topicName={selectedMaterial.topicName}
          topicId={selectedMaterial.topicId}
          userId={user?.id}
        />
      )}
    </div>
  );
};

export default Dashboard;
