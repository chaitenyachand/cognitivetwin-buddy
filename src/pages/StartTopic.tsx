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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleGenerateModule = () => {
    if (!topicInput.trim()) {
      toast({
        title: "Please enter a topic",
        description: "You need to provide a topic to learn about",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating learning module",
      description: `Creating materials for ${topicInput}...`,
    });
    
    // Here you would call your backend to generate the learning module
    // For now, just show success
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
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
                    <RadioGroupItem value="notes" id="notes" />
                    <Label htmlFor="notes" className="cursor-pointer">Upload Handwritten Notes (PDF)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="list" id="list" />
                    <Label htmlFor="list" className="cursor-pointer">Choose from a list</Label>
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

              {inputMethod !== "type" && (
                <div className="p-8 border-2 border-dashed border-border rounded-lg text-center text-muted-foreground">
                  <p>This feature is coming soon!</p>
                </div>
              )}

              <Button 
                size="lg" 
                className="w-full md:w-auto"
                onClick={handleGenerateModule}
              >
                Generate Learning Module
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StartTopic;
