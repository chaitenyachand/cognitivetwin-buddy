import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SpacedRepetitionCard from "@/components/study/SpacedRepetitionCard";
import { useSpacedRepetition } from "@/hooks/useSpacedRepetition";
import { useGamification } from "@/hooks/useGamification";
import { Brain, Download, Trophy, Sparkles, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SpacedReview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadTopics(session.user.id);
      }
    });
  }, [navigate]);

  const loadTopics = async (userId: string) => {
    const { data } = await supabase
      .from("topics")
      .select("id, name")
      .eq("user_id", userId);
    setTopics(data || []);
  };

  const { dueCards, loading, reviewCard, importFlashcardsForTopic } = useSpacedRepetition(user?.id);
  const { addXp, updateChallengeProgress } = useGamification(user?.id);

  const handleImportCards = async () => {
    if (!selectedTopic) return;
    await importFlashcardsForTopic(selectedTopic);
  };

  const handleRateCard = async (quality: number) => {
    if (dueCards.length === 0) return;
    
    const currentCard = dueCards[currentCardIndex];
    await reviewCard(currentCard.id, quality);
    
    // Award XP based on quality
    const xpEarned = quality >= 3 ? 10 : 5;
    setSessionXp(prev => prev + xpEarned);
    
    // Update challenge progress
    await updateChallengeProgress("flashcards", 1);
    
    if (currentCardIndex >= dueCards.length - 1) {
      // Session complete
      setSessionComplete(true);
      await addXp(sessionXp + xpEarned, "Completed spaced repetition session");
    } else {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const resetSession = () => {
    setCurrentCardIndex(0);
    setSessionComplete(false);
    setSessionXp(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      <Sidebar user={user} />

      <div className="flex-1 ml-64">
        <div className="border-b border-border bg-gradient-to-r from-card/50 via-card/80 to-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">Spaced Repetition</h1>
                <p className="text-muted-foreground mt-1">Optimize your long-term memory</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Import Section */}
          <Card className="mb-8 border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Import Flashcards for Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(topic => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleImportCards} disabled={!selectedTopic}>
                  Import Cards
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Review Section */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            </div>
          ) : dueCards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl flex items-center justify-center mb-6">
                <Calendar className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">All Caught Up! 🎉</h2>
              <p className="text-muted-foreground mb-6">No cards due for review right now.</p>
              <p className="text-sm text-muted-foreground">
                Import flashcards from your topics to start building your review queue.
              </p>
            </motion.div>
          ) : sessionComplete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mb-6">
                <Trophy className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
              <div className="flex items-center justify-center gap-2 text-xl text-primary mb-6">
                <Sparkles className="w-5 h-5" />
                <span>+{sessionXp} XP earned</span>
              </div>
              <Button onClick={resetSession} size="lg" className="gap-2">
                <Brain className="w-5 h-5" />
                Start New Session
              </Button>
            </motion.div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">
                  {dueCards.length} card{dueCards.length !== 1 ? "s" : ""} due for review
                </p>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-primary">{sessionXp} XP</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <SpacedRepetitionCard
                  key={dueCards[currentCardIndex]?.id}
                  front={dueCards[currentCardIndex]?.card_front}
                  back={dueCards[currentCardIndex]?.card_back}
                  onRate={handleRateCard}
                  cardNumber={currentCardIndex + 1}
                  totalCards={dueCards.length}
                />
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpacedReview;
