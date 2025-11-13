import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, BookOpen, Brain, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2 gradient-text">
              Welcome back, {user?.user_metadata?.name || "Student"}!
            </h1>
            <p className="text-muted-foreground text-lg">
              Ready to continue your learning journey?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover-lift cursor-pointer border-2" onClick={() => navigate("/voice-tutor")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-listening to-listening/70 flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Start Voice Session</CardTitle>
                <CardDescription>
                  Talk with your AI tutor in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-lift border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <CardTitle>{topics.length}</CardTitle>
                <CardDescription>Topics Covered</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-lift border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-accent-foreground" />
                </div>
                <CardTitle>Progress</CardTitle>
                <CardDescription>Track your learning journey</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Recent Topics</CardTitle>
              <CardDescription>Your latest learning sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : topics.length > 0 ? (
                <div className="space-y-4">
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{topic.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(topic.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No topics yet</p>
                  <Button
                    onClick={() => navigate("/voice-tutor")}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    Start Learning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
