import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import LearningActivityCalendar from "@/components/LearningActivityCalendar";
import TopicProgressCard from "@/components/TopicProgressCard";
import ProgressChart from "@/components/ProgressChart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import MaterialViewer from "@/components/MaterialViewer";

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
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadDashboardData(session.user.id);
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

  const loadDashboardData = async (userId: string) => {
    try {
      // Load topics with progress
      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (topicsError) throw topicsError;
      setTopics(topicsData || []);

      // Load activity log for calendar
      const { data: activityLogData, error: activityError } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", userId)
        .order("activity_date", { ascending: false });

      if (activityError) throw activityError;
      setActivityData(activityLogData || []);
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
        // Get summary from topics table
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
        });
      } else {
        // Get other materials from materials table
        const { data: materialData, error } = await supabase
          .from("materials")
          .select("content")
          .eq("topic_id", topicId)
          .eq("material_type", materialType)
          .single();

        if (error) throw error;

        setSelectedMaterial({
          type: materialType,
          content: materialData.content,
          topicName,
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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} />
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, {user?.user_metadata?.name || "Student"}!
            </h1>
            <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold">
              <Flame className="w-4 h-4 mr-2 text-orange-500" />
              0 Day Streak
            </Badge>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="px-8 py-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="border-b border-border w-full justify-start rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="dashboard"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="topics"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Topics
              </TabsTrigger>
              <TabsTrigger 
                value="next-steps"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Next Steps
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6 mt-6">
              <LearningActivityCalendar />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Topics Covered */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Topics Covered</h2>
                  {loading ? (
                    <p className="text-muted-foreground">Loading topics...</p>
                  ) : topics.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center text-muted-foreground">
                        <p>No topics yet. Start your learning journey by creating a new topic!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    topics.slice(0, 5).map((topic) => (
                      <TopicProgressCard key={topic.id} topic={topic.name} progress={topic.progress} />
                    ))
                  )}
                </div>

                {/* Progress Chart */}
                <ProgressChart />
              </div>
            </TabsContent>

            {/* Topics Tab */}
            <TabsContent value="topics" className="space-y-6 mt-6">
              <h2 className="text-2xl font-bold text-foreground">Your Learning History (Per-Topic Details)</h2>
              
              {loading ? (
                <p className="text-muted-foreground">Loading topics...</p>
              ) : topics.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <p>No topics yet. Start your learning journey by creating a new topic!</p>
                  </CardContent>
                </Card>
              ) : (
                topics.map((topic) => (
                  <Card key={topic.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">{topic.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Started: {new Date(topic.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">Topic-Specific Progress</p>
                            <p className="text-2xl font-bold text-primary">{topic.progress}%</p>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all" 
                                style={{ width: `${topic.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">0% 100%</p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">Best Score</p>
                            <p className="text-2xl font-bold text-primary text-right">{topic.best_score}%</p>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all" 
                                style={{ width: `${topic.best_score}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">0% 100%</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Button 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => handleViewMaterial(topic.id, topic.name, "summary")}
                          >
                            View Summary
                          </Button>
                          <Button 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => handleViewMaterial(topic.id, topic.name, "mindmap")}
                          >
                            View Mind Map
                          </Button>
                          <Button 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => handleViewMaterial(topic.id, topic.name, "flashcards")}
                          >
                            View Flashcards
                          </Button>
                          <Button 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => handleViewMaterial(topic.id, topic.name, "formula_sheet")}
                          >
                            Formula Sheet
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Next Steps Tab */}
            <TabsContent value="next-steps" className="space-y-6 mt-6">
              <h2 className="text-2xl font-bold text-foreground">Next Steps</h2>
              
              {loading ? (
                <p className="text-muted-foreground">Loading recommendations...</p>
              ) : topics.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <p>Complete some topics and quizzes to get personalized recommendations!</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <CardContent className="pt-6">
                      <p className="text-sm text-yellow-900 dark:text-yellow-200">
                        💡 Review topics where you scored below 70% to improve your understanding
                      </p>
                    </CardContent>
                  </Card>

                  {topics
                    .filter(topic => topic.best_score < 70)
                    .map((topic) => (
                      <div key={topic.id} className="space-y-4">
                        <h3 className="text-xl font-bold text-foreground">{topic.name}</h3>
                        <p className="text-sm text-muted-foreground">Best Score: {topic.best_score}%</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <Button variant="secondary" className="w-full">Review Summary</Button>
                          <Button variant="secondary" className="w-full">Practice Quiz</Button>
                          <Button variant="secondary" className="w-full">View Flashcards</Button>
                        </div>
                      </div>
                    ))}
                </>
              )}
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
        />
      )}
    </div>
  );
};

export default Dashboard;
