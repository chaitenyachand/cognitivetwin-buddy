import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const StartTopic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [topicInput, setTopicInput] = useState("");
  const [inputMethod, setInputMethod] = useState("type");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVoiceSession, setShowVoiceSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleGenerateModule = async () => {
    if (!topicInput.trim()) {
      toast({
        title: "Please enter a topic",
        description: "You need to provide a topic to learn about",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Step 1: Create topic in database
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .insert({
          user_id: user?.id,
          name: topicInput,
          progress: 0,
          best_score: 0,
        })
        .select()
        .single();

      if (topicError) throw topicError;

      toast({
        title: "Generating materials...",
        description: "Creating summary, mindmap, flashcards, quiz, and formula sheet",
      });

      // Step 2: Generate all materials using edge function
      const { data: materialsData, error: materialsError } = await supabase.functions.invoke(
        'generate_materials',
        {
          body: {
            topicName: topicInput,
            topicId: topicData.id,
            userId: user?.id
          }
        }
      );

      if (materialsError) {
        console.error('Materials generation error:', materialsError);
        throw materialsError;
      }

      // Step 3: Log activity
      await supabase.from("activity_log").insert({
        user_id: user?.id,
        topic_id: topicData.id,
        activity_type: "topic_created",
      });

      toast({
        title: "Success!",
        description: "All learning materials have been generated for your topic.",
      });

      // Step 4: Navigate to dashboard Topics tab
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Error creating topic:', error);
      toast({
        title: "Error creating topic",
        description: error.message || "Failed to generate materials",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} />
      
      <div className="flex-1 ml-64">
        <div className="px-8 py-12 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Start a New Learning Journey 🔗
          </h1>
          
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Step 1: Choose Your Topic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">How do you want to provide the topic?</Label>
                <RadioGroup value={inputMethod} onValueChange={setInputMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="type" id="type" />
                    <Label htmlFor="type" className="cursor-pointer">Type a topic name</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="cursor-pointer">Upload a PDF</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="voice" id="voice" />
                    <Label htmlFor="voice" className="cursor-pointer">Use Voice Session</Label>
                  </div>
                </RadioGroup>
              </div>

              {inputMethod === "type" && (
                <div className="space-y-2">
                  <Label htmlFor="topic-input">What do you want to learn about?</Label>
                  <Input
                    id="topic-input"
                    placeholder="e.g., Photosynthesis, World War II, Calculus..."
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="text-lg py-6"
                  />
                </div>
              )}

              {inputMethod === "pdf" && (
                <div className="p-8 border-2 border-dashed border-border rounded-lg text-center text-muted-foreground">
                  <p>PDF upload feature coming soon!</p>
                </div>
              )}

              {inputMethod === "voice" && (
                <div className="p-8 border-2 border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Start a voice session with the AI tutor to learn about your topic through conversation.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="voice-topic-input">Enter topic name first:</Label>
                    <Input
                      id="voice-topic-input"
                      placeholder="e.g., Photosynthesis, World War II..."
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      className="mb-4"
                    />
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => {
                        if (!topicInput.trim()) {
                          toast({
                            title: "Please enter a topic",
                            description: "Enter a topic name before starting a voice session",
                            variant: "destructive",
                          });
                          return;
                        }
                        navigate("/voice-tutor", { state: { topic: topicInput } });
                      }}
                    >
                      Start Voice Session
                    </Button>
                  </div>
                </div>
              )}

              {inputMethod === "type" && (
                <Button 
                  size="lg" 
                  className="w-full md:w-auto"
                  onClick={handleGenerateModule}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating Learning Module..." : "Generate Learning Module"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StartTopic;
