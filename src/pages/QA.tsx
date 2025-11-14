import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const QA = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    const userMessage = question;
    setQuestion("");
    
    // Add user message to conversation
    const updatedConversation = [...conversation, { role: "user", content: userMessage }];
    setConversation(updatedConversation);
    setIsLoading(true);

    // Add empty assistant message that we'll update with streaming content
    setConversation([...updatedConversation, { role: "assistant", content: "" }]);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: updatedConversation }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantResponse += content;
              // Update the last message (assistant) with new content
              setConversation((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantResponse };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, will retry with more data
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI",
        variant: "destructive",
      });
      
      // Remove the empty assistant message on error
      setConversation((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        handleAskQuestion();
      }
    }
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
          <div className="space-y-4 mb-6 max-h-[calc(100vh-400px)] overflow-y-auto">
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
              <>
                {conversation.map((msg, index) => (
                  <Card key={index} className={msg.role === "user" ? "ml-12" : "mr-12"}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === "user"
                              ? "bg-gradient-to-br from-primary to-secondary"
                              : "bg-gradient-to-br from-accent to-accent/70"
                          }`}
                        >
                          <span className="text-white font-bold text-sm">
                            {msg.role === "user" ? "You" : "AI"}
                          </span>
                        </div>
                        <div className="flex-1 text-foreground prose prose-sm max-w-none">
                          {msg.role === "assistant" ? (
                            <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <Card className="sticky bottom-0">
            <CardContent className="pt-6">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your question here... (Press Enter to send, Shift+Enter for new line)"
                className="mb-4 min-h-[100px]"
                disabled={isLoading}
              />
              <Button
                onClick={handleAskQuestion}
                disabled={isLoading || !question.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Answer...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask Question
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QA;
