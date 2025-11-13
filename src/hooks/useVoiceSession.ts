import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgoraVoiceClient } from '@/utils/agoraClient';
import { useToast } from '@/hooks/use-toast';

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";
export type Persona = "empathetic" | "encouraging" | "neutral" | "authoritative";

export const useVoiceSession = () => {
  const { toast } = useToast();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>("empathetic");
  
  const agoraClient = useRef<AgoraVoiceClient | null>(null);
  const recognitionRef = useRef<any>(null);

  const startSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to start a session",
          variant: "destructive",
        });
        return;
      }

      // Create voice session in database
      const { data: voiceSession, error: sessionError } = await supabase
        .from("voice_sessions")
        .insert({
          user_id: session.user.id,
          topic: "General Learning",
          persona,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(voiceSession.id);

      // Use provided temporary token for testing
      const tokenData = {
        appId: "917bf619376e4cffa7d95a430717bc86",
        token: "007eJxTYGgNaMxpP5Sces/eVvHl9E+50pb3bs07+2Bumn/suq7rzVMUGCwNzZPSzAwtjc3NUk2S09ISzVMsTRNNjA3MgRLJFmYflMQyGwIZGToi/jMyMkAgiM/LkJyfV5aYGe+UX5ZV4sfAAAAIpCSX",
        channelName: `session-${voiceSession.id}`,
        uid: 0
      };

      // Initialize Agora client
      agoraClient.current = new AgoraVoiceClient();
      console.log('Using test token with appId:', tokenData.appId);
      await agoraClient.current.join({
        appId: tokenData.appId,
        token: tokenData.token,
        channelName: tokenData.channelName,
        uid: tokenData.uid,
      });

      // Setup Web Speech API for STT
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = async (event: any) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          
          setTranscript(transcriptText);
          setVoiceState("listening");

          // If final result, process with AI
          if (event.results[current].isFinal) {
            setVoiceState("thinking");

            // Log partial transcript
            await supabase.functions.invoke('log_partial', {
              body: {
                sessionId: voiceSession.id,
                text: transcriptText,
                speaker: 'user'
              }
            });

            // Process with AI
            const { data: aiResponse, error: aiError } = await supabase.functions.invoke('process_transcript', {
              body: {
                transcript: transcriptText,
                sessionId: voiceSession.id,
                persona
              }
            });

            if (aiError) throw aiError;

            // Log AI response
            await supabase.functions.invoke('log_partial', {
              body: {
                sessionId: voiceSession.id,
                text: aiResponse.ai_reply,
                speaker: 'ai'
              }
            });

            // Speak AI response
            setVoiceState("speaking");
            await speakText(aiResponse.ai_reply);
            setVoiceState("listening");
          }
        };

        recognitionRef.current.start();
      } else {
        toast({
          title: "Browser Not Supported",
          description: "Your browser doesn't support speech recognition",
          variant: "destructive",
        });
        return;
      }

      setVoiceState("listening");
      toast({
        title: "Session Started",
        description: "I'm listening! What would you like to learn today?",
      });
    } catch (error: any) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start session",
        variant: "destructive",
      });
      setVoiceState("idle");
    }
  }, [persona, toast]);

  const stopSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      // Leave Agora channel
      if (agoraClient.current) {
        await agoraClient.current.leave();
        agoraClient.current = null;
      }

      // Update session end time
      await supabase
        .from("voice_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", sessionId);

      setVoiceState("idle");
      setSessionId(null);
      setTranscript("");
      
      toast({
        title: "Session Ended",
        description: "Great learning session!",
      });
    } catch (error: any) {
      console.error('Error stopping session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to stop session",
        variant: "destructive",
      });
    }
  }, [sessionId, toast]);

  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  return {
    voiceState,
    transcript,
    sessionId,
    persona,
    setPersona,
    startSession,
    stopSession,
  };
};
