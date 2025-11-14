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
import WeakTopicsSection from "@/components/WeakTopicsSection";

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
          topicId,
        });
      } else if (materialType === "mindmap") {
        // Get mindmap from mindmaps table
        const { data: mindmapData, error } = await supabase
          .from("mindmaps")
          .select("nodes_json, edges_json")
          .eq("topic_id", topicId)
          .maybeSingle();

        if (error) throw error;
        if (!mindmapData) {
          throw new Error("Mindmap not found");
        }

        setSelectedMaterial({
          type: "mindmap",
          content: {
            nodes: mindmapData.nodes_json,
            edges: mindmapData.edges_json
          },
          topicName,
          topicId,
        });
      } else if (materialType === "flashcards") {
        // Get flashcards from flashcards table
        const { data: flashcardsData, error } = await supabase
          .from("flashcards")
          .select("flashcard_json")
          .eq("topic_id", topicId)
          .maybeSingle();

        if (error) throw error;
        if (!flashcardsData) {
          throw new Error("Flashcards not found");
        }

        setSelectedMaterial({
          type: "flashcards",
          content: flashcardsData.flashcard_json,
          topicName,
          topicId,
        });
      } else {
        // Get quiz and formula_sheet from materials table
        const { data: materialData, error } = await supabase
          .from("materials")
          .select("content")
          .eq("topic_id", topicId)
          .eq("material_type", materialType)
          .maybeSingle();

        if (error) throw error;
        if (!materialData) {
          throw new Error("Material not found");
        }

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
                {user && <ProgressChart userId={user.id} />}
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
              <h2 className="text-2xl font-bold text-foreground">Areas to Focus On</h2>
              <p className="text-muted-foreground">Identified weak areas and recommended next steps based on your performance</p>
              
              <WeakTopicsSection userId={user?.id || ''} onViewMaterial={handleViewMaterial} />
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
