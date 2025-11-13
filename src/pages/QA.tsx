import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QA = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setConversation([...conversation, { role: "user", content: question }]);
    setIsLoading(true);
    
    // Simulate AI response - replace with actual AI call
    setTimeout(() => {
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "This is a placeholder response. Connect to your AI backend to get real answers!",
        },
      ]);
      setIsLoading(false);
      setQuestion("");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} />
      
      <div className="flex-1 ml-64">
        <div className="px-8 py-12 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <MessageSquare className="w-10 h-10 text-primary" />
              General Q&A
            </h1>
            <p className="text-muted-foreground text-lg">
              Ask me anything about your studies!
            </p>
          </div>

          {/* Conversation */}
          <div className="space-y-4 mb-6">
            {conversation.length === 0 ? (
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="pt-12 pb-12 text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    Ask your first question to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              conversation.map((msg, index) => (
                <Card key={index} className={msg.role === "user" ? "ml-12" : "mr-12"}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-primary to-secondary"
                            : "bg-gradient-to-br from-accent to-accent/70"
                        }`}
                      >
                        <span className="text-white font-bold text-sm">
                          {msg.role === "user" ? "You" : "AI"}
                        </span>
                      </div>
                      <p className="flex-1 text-foreground">{msg.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Input */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-24 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                />
                <div className="flex justify-end">
                  <Button onClick={handleAskQuestion} disabled={isLoading}>
                    <Send className="w-4 h-4 mr-2" />
                    {isLoading ? "Thinking..." : "Ask Question"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QA;
