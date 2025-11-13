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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadTopics(session.user.id);
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

  const loadTopics = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setTopics(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading topics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demo - replace with real data from database
  const mockTopics = [
    { name: "Blockchain", progress: 40 },
    { name: "Generative AI", progress: 20 },
    { name: "Artificial Intelligence", progress: 20 },
  ];

  const weakTopics = [
    { name: "Linear Equations", subtopics: ["Applications", "Consensus Mechanisms", "Key Characteristics"] },
    { name: "Generative AI", subtopics: ["GANs", "Transformer Models", "Generative Models", "VAEs", "Learning from Data", "Applications"] },
  ];

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
                  {mockTopics.map((topic, index) => (
                    <TopicProgressCard key={index} topic={topic.name} progress={topic.progress} />
                  ))}
                </div>

                {/* Progress Chart */}
                <ProgressChart />
              </div>
            </TabsContent>

            {/* Topics Tab */}
            <TabsContent value="topics" className="space-y-6 mt-6">
              <h2 className="text-2xl font-bold text-foreground">Your Learning History (Per-Topic Details)</h2>
              
              {mockTopics.map((topic, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{topic.name}</h3>
                        <p className="text-sm text-muted-foreground">Started: 2025-11-06</p>
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
                          <p className="text-2xl font-bold text-primary text-right">{topic.progress}%</p>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${topic.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-right">0% 100%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="secondary" className="w-full">View Summary</Button>
                        <Button variant="secondary" className="w-full">View Mind Map</Button>
                        <Button variant="secondary" className="w-full">View Flashcards</Button>
                        <Button variant="secondary" className="w-full">Formula Sheet</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Next Steps Tab */}
            <TabsContent value="next-steps" className="space-y-6 mt-6">
              <h2 className="text-2xl font-bold text-foreground">Next Steps</h2>
              
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">
                    💡 Focus on reviewing your weak topics below:
                  </p>
                </CardContent>
              </Card>

              {weakTopics.map((topic, index) => (
                <div key={index} className="space-y-4">
                  <h3 className="text-xl font-bold text-foreground">{topic.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {topic.subtopics.map((subtopic, subIndex) => (
                      <Button 
                        key={subIndex} 
                        variant="secondary" 
                        className="w-full"
                      >
                        {subtopic}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
