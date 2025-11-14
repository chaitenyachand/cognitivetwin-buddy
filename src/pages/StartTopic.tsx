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
import MindmapViewer from "@/components/MindmapViewer";
import FlipCard from "@/components/FlipCard";
import InteractiveQuiz from "@/components/InteractiveQuiz";
import ReactMarkdown from "react-markdown";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
// Use unpkg CDN worker for better reliability
GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs";

const StartTopic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [topicInput, setTopicInput] = useState("");
  const [inputMethod, setInputMethod] = useState("type");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVoiceSession, setShowVoiceSession] = useState(false);
  const [generatedMaterials, setGeneratedMaterials] = useState<any>(null);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setPdfFile(file);
    setIsProcessingPdf(true);

    try {
      // Read PDF file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      toast({
        title: "Converting PDF to images",
        description: `Processing ${numPages} page(s)...`,
      });

      // Convert each page to JPEG data URL
      const imageDataUrls: string[] = [];
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        // Convert canvas to JPEG data URL (smaller than PNG)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        imageDataUrls.push(dataUrl);
      }

      toast({
        title: "Extracting text with AI",
        description: "Processing images for OCR...",
      });

      // Send images to edge function
      const formData = new FormData();
      imageDataUrls.forEach((dataUrl) => {
        formData.append('images', dataUrl);
      });

      const { data, error } = await supabase.functions.invoke('process_pdf', {
        body: formData,
      });

      if (error) throw error;

      setTopicInput(data.extractedText);
      toast({
        title: "PDF processed successfully",
        description: "Text extracted from PDF. You can now generate materials.",
      });
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      toast({
        title: "Error processing PDF",
        description: error.message || "Failed to extract text from PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleGenerateModule = async () => {
    if (!topicInput.trim()) {
      toast({
        title: "Please enter a topic",
        description: "You need to provide a topic or upload a PDF",
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

      // Step 4: Set generated materials to display them
      setGeneratedMaterials(materialsData);
      setCurrentTopicId(topicData.id);
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

  // If materials are generated, show them
  if (generatedMaterials) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar user={user} />
        
        <div className="flex-1 ml-64">
          <div className="px-8 py-12 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-bold text-foreground">
                Learning Materials Generated!
              </h1>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>

            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{generatedMaterials.summary || "No summary available"}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {/* Mind Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Mind Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedMaterials.mindmap?.nodes ? (
                    <MindmapViewer 
                      nodes={generatedMaterials.mindmap.nodes} 
                      edges={generatedMaterials.mindmap.edges} 
                    />
                  ) : (
                    <p className="text-muted-foreground">No mindmap available</p>
                  )}
                </CardContent>
              </Card>

              {/* Flashcards */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Flashcards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedMaterials.flashcards?.map((card: any, index: number) => (
                      <FlipCard key={index} front={card.front} back={card.back} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Formula Sheet */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Formula Sheet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedMaterials.formula_sheet?.formulas?.map((formula: any, index: number) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">{formula.name}</h4>
                        <p className="font-mono text-sm bg-muted p-2 rounded mb-2">{formula.formula}</p>
                        <p className="text-sm text-muted-foreground mb-1">{formula.description}</p>
                        {formula.example && <p className="text-xs text-muted-foreground italic">Example: {formula.example}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quiz */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Quiz
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedMaterials.quiz?.questions && user?.id && currentTopicId ? (
                    <InteractiveQuiz 
                      questions={generatedMaterials.quiz.questions.map((q: any) => ({
                        question: q.question,
                        options: q.options,
                        correctIndex: q.correctIndex,
                        explanation: q.explanation
                      }))}
                      topicId={currentTopicId}
                      userId={user.id}
                    />
                  ) : (
                    <p className="text-muted-foreground">No quiz available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <div className="space-y-4">
                  <Label htmlFor="pdf-input">Upload PDF (supports handwritten notes)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="pdf-input"
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      disabled={isProcessingPdf}
                      className="cursor-pointer"
                    />
                  </div>
                  {isProcessingPdf && (
                    <p className="text-sm text-muted-foreground">Processing PDF and extracting text...</p>
                  )}
                  {pdfFile && !isProcessingPdf && (
                    <p className="text-sm text-green-600">PDF processed: {pdfFile.name}</p>
                  )}
                  {topicInput && !isProcessingPdf && (
                    <div className="mt-4 p-4 border border-border rounded-lg">
                      <Label className="text-sm font-semibold mb-2">Extracted Content:</Label>
                      <div className="mt-2 max-h-60 overflow-y-auto text-sm text-muted-foreground">
                        {topicInput.substring(0, 500)}...
                      </div>
                    </div>
                  )}
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

              {(inputMethod === "type" || (inputMethod === "pdf" && topicInput && !isProcessingPdf)) && (
                <Button 
                  size="lg" 
                  className="w-full md:w-auto"
                  onClick={handleGenerateModule}
                  disabled={isGenerating || isProcessingPdf}
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
