import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Sparkles, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import aiAvatar from "@/assets/ai-avatar.avif";

type CallState = 'idle' | 'generating_visual' | 'explaining_visual' | 'listening_to_user' | 'processing_audio' | 'conducting_viva';
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Persona = 'empathetic' | 'encouraging' | 'neutral' | 'authoritative';

const VoiceTutor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [userName, setUserName] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>('empathetic');
  const [callState, setCallState] = useState<CallState>('idle');
  const [visualUrl, setVisualUrl] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<any>(null);
  const [isVivaMode, setIsVivaMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        const name = session.user.user_metadata?.name || "Student";
        setUserName(name);
      }
    });

    // Get topic from navigation state
    const state = location.state as { topic?: string; topicId?: string };
    if (state?.topic) {
      setTopic(state.topic);
    }
    if (state?.topicId) {
      setTopicId(state.topicId);
    }

    // Load voices for speech synthesis
    const loadVoices = () => {
      speechSynthesis.getVoices();
    };
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, [navigate, location]);

  const startVoiceSession = async () => {
    try {
      setCallState('generating_visual');

      // Create session in database
      const { data: { user } } = await supabase.auth.getUser();
      const { data: session, error: sessionError } = await supabase
        .from('voice_sessions')
        .insert({
          user_id: user?.id,
          topic: topic,
          persona: persona
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Load materials if topic ID is available
      if (topicId) {
        await loadMaterials();
      }

      // Generate visual
      const { data: visualData, error: visualError } = await supabase.functions.invoke(
        'generate_visual',
        { body: { topic } }
      );

      if (visualError) throw visualError;
      setVisualUrl(visualData.imageUrl);

      // Move to explaining state
      setCallState('explaining_visual');

      // Get initial explanation
      const { data: explainData, error: explainError } = await supabase.functions.invoke(
        'explain_visual',
        {
          body: {
            imageUrl: visualData.imageUrl,
            chatHistory: [],
            question: null,
            materials: materials
          }
        }
      );

      if (explainError) throw explainError;

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: explainData.explanation
      };
      setChatHistory([aiMessage]);

      // Speak the explanation
      await speakText(explainData.explanation);

      // Ready for user input
      setCallState('listening_to_user');

    } catch (error: any) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start voice session",
        variant: "destructive"
      });
      setCallState('idle');
    }
  };

  const loadMaterials = async () => {
    try {
      // Load summary from topics table
      const { data: topicData } = await supabase
        .from('topics')
        .select('summary')
        .eq('id', topicId)
        .single();

      // Load other materials
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*')
        .eq('topic_id', topicId);

      const loadedMaterials: any = {
        summary: topicData?.summary || null,
        flashcards: null,
        mindmap: null,
        quiz: null
      };

      if (materialsData) {
        materialsData.forEach((mat: any) => {
          if (mat.material_type === 'flashcards') {
            loadedMaterials.flashcards = mat.content;
          } else if (mat.material_type === 'mindmap') {
            loadedMaterials.mindmap = mat.content;
          } else if (mat.material_type === 'quiz') {
            loadedMaterials.quiz = mat.content;
          }
        });
      }

      setMaterials(loadedMaterials);

    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select female voice
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Victoria') ||
        voice.name.includes('Karen') ||
        (voice.lang.includes('en') && voice.name.includes('Google US English'))
      ) || voices.find(voice => voice.lang.includes('en'));
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 1.0; // Natural speaking rate
      utterance.pitch = 1.1; // Slightly higher for more natural female voice
      utterance.volume = 1.0;
      
      currentUtteranceRef.current = utterance;
      setIsSpeaking(true);
      
      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        resolve();
      };
      
      speechSynthesis.speak(utterance);
    });
  };

  const stopSpeaking = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      // Stop current speech when user starts speaking
      stopSpeaking();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      setCallState('processing_audio');

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // Transcribe
        const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke(
          'transcribe_audio',
          { body: { audio: base64Audio } }
        );

        if (transcriptError) throw transcriptError;

        const userMessage: ChatMessage = {
          role: 'user',
          content: transcriptData.text
        };
        setChatHistory(prev => [...prev, userMessage]);

        const userText = transcriptData.text.toLowerCase();

        // Check for viva test request
        if (userText.includes('test') || userText.includes('quiz') || userText.includes('viva') || userText.includes('examine')) {
          await handleVivaRequest();
          return;
        }

        // Handle viva mode
        if (isVivaMode) {
          await handleVivaAnswer(transcriptData.text);
          return;
        }

        // Check for material explanation requests
        if (userText.includes('summary') || userText.includes('flashcard') || userText.includes('mindmap') || userText.includes('explain from')) {
          await handleMaterialExplanation(transcriptData.text);
          return;
        }

        // Normal explanation flow
        setCallState('explaining_visual');

        const { data: explainData, error: explainError } = await supabase.functions.invoke(
          'explain_visual',
          {
            body: {
              imageUrl: visualUrl,
              chatHistory: [...chatHistory, userMessage],
              question: transcriptData.text,
              materials: materials
            }
          }
        );

        if (explainError) throw explainError;

        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: explainData.explanation
        };
        setChatHistory(prev => [...prev, aiMessage]);

        await speakText(explainData.explanation);
        setCallState('listening_to_user');
      };

    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: "Failed to process audio",
        variant: "destructive"
      });
      setCallState('listening_to_user');
    }
  };

  const handleMaterialExplanation = async (userText: string) => {
    setCallState('explaining_visual');

    const { data: explainData, error } = await supabase.functions.invoke(
      'explain_visual',
      {
        body: {
          imageUrl: visualUrl,
          chatHistory: chatHistory,
          question: userText,
          materials: materials
        }
      }
    );

    if (error) throw error;

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: explainData.explanation
    };
    setChatHistory(prev => [...prev, aiMessage]);

    await speakText(explainData.explanation);
    setCallState('listening_to_user');
  };

  const handleVivaRequest = async () => {
    try {
      setIsVivaMode(true);
      setCallState('conducting_viva');

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('conduct_viva', {
        body: {
          action: 'start',
          topicId: topicId,
          topicName: topic,
          materials: materials,
          userId: user?.id
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: data.question
      };
      setChatHistory(prev => [...prev, aiMessage]);

      await speakText(data.question);
      setCallState('listening_to_user');

    } catch (error: any) {
      console.error('Error starting viva:', error);
      toast({
        title: "Error",
        description: "Failed to start viva test",
        variant: "destructive"
      });
      setIsVivaMode(false);
      setCallState('listening_to_user');
    }
  };

  const handleVivaAnswer = async (userResponse: string) => {
    try {
      setCallState('conducting_viva');

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('conduct_viva', {
        body: {
          action: 'answer',
          topicId: topicId,
          topicName: topic,
          materials: materials,
          conversationHistory: chatHistory,
          userResponse: userResponse,
          userId: user?.id
        }
      });

      if (error) throw error;

      if (data.vivaComplete) {
        // End viva and get assessment
        await endViva();
      } else {
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: data.question
        };
        setChatHistory(prev => [...prev, aiMessage]);

        await speakText(data.question);
        setCallState('listening_to_user');
      }

    } catch (error: any) {
      console.error('Error processing viva answer:', error);
      toast({
        title: "Error",
        description: "Failed to process answer",
        variant: "destructive"
      });
      setCallState('listening_to_user');
    }
  };

  const endViva = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('conduct_viva', {
        body: {
          action: 'end',
          topicId: topicId,
          topicName: topic,
          materials: materials,
          conversationHistory: chatHistory,
          userId: user?.id
        }
      });

      if (error) throw error;

      const assessment = data.assessment;
      
      const feedbackMessage = `Your viva is complete! You scored ${assessment.score} out of 100. ${assessment.feedback}`;
      
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: feedbackMessage
      };
      setChatHistory(prev => [...prev, aiMessage]);

      await speakText(feedbackMessage);

      // Speak weak areas
      if (assessment.weakAreas && assessment.weakAreas.length > 0) {
        const weakAreasText = `Areas to focus on: ${assessment.weakAreas.join(', ')}. These have been added to your next steps for review.`;
        await speakText(weakAreasText);
      }

      toast({
        title: "Viva Complete",
        description: `Score: ${assessment.score}/100. Check Next Steps tab for weak areas.`,
      });

      setIsVivaMode(false);
      setCallState('listening_to_user');

    } catch (error: any) {
      console.error('Error ending viva:', error);
      toast({
        title: "Error",
        description: "Failed to complete viva assessment",
        variant: "destructive"
      });
      setIsVivaMode(false);
      setCallState('listening_to_user');
    }
  };

  const endSession = async () => {
    try {
      if (sessionId) {
        await supabase
          .from('voice_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionId);
      }

      setCallState('idle');
      setVisualUrl(null);
      setChatHistory([]);
      setSessionId(null);

      toast({
        title: "Session Ended",
        description: "Voice learning session has been saved"
      });

    } catch (error: any) {
      console.error('Error ending session:', error);
    }
  };

  const getStateText = () => {
    switch (callState) {
      case "generating_visual": return "🎨 Generating visual...";
      case "explaining_visual": return "🗣️ AI is explaining...";
      case "conducting_viva": return isVivaMode ? "📝 Viva examination in progress" : "🗣️ AI is explaining...";
      case "listening_to_user": return isVivaMode ? "🎙️ Answer the question" : "🎙️ Your turn to speak";
      case "processing_audio": return "💭 Processing...";
      default: return "Press to start";
    }
  };

  const getStateColor = () => {
    switch (callState) {
      case "generating_visual": return "ring-blue-500 shadow-blue-500/50";
      case "explaining_visual": return "ring-purple-500 shadow-purple-500/50";
      case "conducting_viva": return "ring-orange-500 shadow-orange-500/50";
      case "listening_to_user": return isVivaMode ? "ring-yellow-500 shadow-yellow-500/50" : "ring-green-500 shadow-green-500/50";
      case "processing_audio": return "ring-amber-500 shadow-amber-500/50";
      default: return "ring-gray-300";
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
              {topic ? `Learning about: ${topic}` : "Your personal AI tutor is ready to help you learn"}
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
              {/* Visual Area */}
              {visualUrl && (
                <div className="w-full max-w-2xl mb-6">
                  <img 
                    src={visualUrl} 
                    alt="Educational Visual" 
                    className="w-full rounded-lg shadow-2xl"
                  />
                </div>
              )}

              {/* Avatar */}
              <div className="relative">
                <img 
                  src={aiAvatar} 
                  alt="AI Avatar" 
                  className={`w-48 h-48 rounded-full object-cover ring-4 transition-all duration-300 shadow-2xl ${getStateColor()}`}
                />
                <div className="absolute -bottom-2 -right-2">
                  {callState === "idle" ? (
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <MicOff className="w-6 h-6 text-muted-foreground" />
                    </div>
                  ) : callState === "generating_visual" ? (
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  ) : callState === "listening_to_user" ? (
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                  ) : callState === "processing_audio" ? (
                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center animate-spin">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <Volume2 className="w-6 h-6 text-white animate-pulse" />
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <p className="text-2xl font-semibold mb-2">{getStateText()}</p>
                <p className="text-muted-foreground">
                  {callState === "idle" 
                    ? "Click the button below to start your AI-guided visual learning session" 
                    : callState === "listening_to_user"
                    ? "Ask questions about the visual or request clarification"
                    : "The AI is working on your request..."}
                </p>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-4">
                {callState === "idle" ? (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary text-white px-8"
                    onClick={startVoiceSession}
                    disabled={!topic}
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Session
                  </Button>
                ) : callState === "listening_to_user" ? (
                  <>
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          Ask Question
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={endSession}
                    >
                      End Session
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={endSession}
                  >
                    End Session
                  </Button>
                )}
              </div>

              {/* Chat History */}
              {chatHistory.length > 0 && (
                <Card className="w-full p-6 mt-8 bg-muted/50 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold mb-4">Conversation</h3>
                  <div className="space-y-4">
                    {chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary/10 ml-8'
                            : 'bg-secondary/10 mr-8'
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">
                          {msg.role === 'user' ? 'You' : 'AI Tutor'}
                        </p>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>💡 Tip: Ask for summaries, mindmaps, flashcards, quizzes, or formula sheets on any topic!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTutor;
