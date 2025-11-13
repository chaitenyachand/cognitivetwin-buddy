import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVoiceSession, type Persona } from "@/hooks/useVoiceSession";

const VoiceTutor = () => {
  const navigate = useNavigate();
  const { 
    voiceState, 
    transcript, 
    sessionId, 
    persona, 
    setPersona, 
    startSession, 
    stopSession 
  } = useVoiceSession();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const getStateColor = () => {
    switch (voiceState) {
      case "listening": return "listening";
      case "thinking": return "thinking";
      case "speaking": return "speaking";
      default: return "muted";
    }
  };

  const getStateText = () => {
    switch (voiceState) {
      case "listening": return "🎙️ Listening...";
      case "thinking": return "💭 Thinking...";
      case "speaking": return "🗣️ Speaking...";
      default: return "Press to start";
    }
  };

  const getStatePulseClass = () => {
    switch (voiceState) {
      case "listening": return "pulse-listening";
      case "thinking": return "pulse-thinking";
      case "speaking": return "pulse-speaking";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 gradient-text">Voice Learning Session</h1>
            <p className="text-muted-foreground text-lg">
              Your personal AI tutor is ready to help you learn
            </p>
          </div>

          <div className="mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">AI Persona</label>
                  <Select value={persona} onValueChange={(value) => setPersona(value as Persona)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empathetic">Empathetic - Understanding and supportive</SelectItem>
                      <SelectItem value="encouraging">Encouraging - Motivating and positive</SelectItem>
                      <SelectItem value="neutral">Neutral - Direct and professional</SelectItem>
                      <SelectItem value="authoritative">Authoritative - Expert and confident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-2 p-12">
            <div className="flex flex-col items-center gap-8">
              <div
                className={`w-48 h-48 rounded-full bg-${getStateColor()} flex items-center justify-center ${getStatePulseClass()} transition-all duration-300`}
                style={{
                  backgroundColor: `hsl(var(--${getStateColor()}))`,
                }}
              >
                {voiceState === "idle" ? (
                  <Mic className="w-24 h-24 text-white" />
                ) : voiceState === "listening" ? (
                  <Mic className="w-24 h-24 text-white" />
                ) : voiceState === "thinking" ? (
                  <Sparkles className="w-24 h-24 text-white" />
                ) : (
                  <Volume2 className="w-24 h-24 text-white" />
                )}
              </div>

              <div className="text-center">
                <p className="text-2xl font-semibold mb-2">{getStateText()}</p>
                <p className="text-muted-foreground">
                  {voiceState === "idle" 
                    ? "Click the button below to start your learning session" 
                    : "The AI is processing your request..."}
                </p>
              </div>

              <div className="flex gap-4">
                {voiceState === "idle" ? (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary text-white px-8"
                    onClick={startSession}
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Session
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopSession}
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    End Session
                  </Button>
                )}
              </div>

              {transcript && (
                <Card className="w-full p-6 mt-8 bg-muted/50">
                  <h3 className="font-semibold mb-4">Live Transcript</h3>
                  <p className="text-sm leading-relaxed">{transcript}</p>
                </Card>
              )}
            </div>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>💡 Tip: Speak clearly and naturally. The AI will guide you through your learning journey.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTutor;
