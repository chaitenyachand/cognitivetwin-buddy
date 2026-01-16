import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SpacedRepetitionCard {
  id: string;
  user_id: string;
  topic_id: string;
  card_front: string;
  card_back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string | null;
}

// SM-2 Algorithm Implementation
const calculateSM2 = (
  quality: number, // 0-5 rating
  easeFactor: number,
  interval: number,
  repetitions: number
) => {
  // If quality < 3, reset learning
  if (quality < 3) {
    return {
      interval: 1,
      repetitions: 0,
      easeFactor: Math.max(1.3, easeFactor - 0.2),
    };
  }

  // Calculate new ease factor
  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate new interval
  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * newEaseFactor);
  }

  return {
    interval: newInterval,
    repetitions: repetitions + 1,
    easeFactor: newEaseFactor,
  };
};

export const useSpacedRepetition = (userId: string | undefined) => {
  const { toast } = useToast();
  const [dueCards, setDueCards] = useState<SpacedRepetitionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReviewsToday, setTotalReviewsToday] = useState(0);

  const loadDueCards = useCallback(async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("spaced_repetition_cards")
        .select("*")
        .eq("user_id", userId)
        .lte("next_review_date", today)
        .order("next_review_date", { ascending: true });

      if (error) throw error;
      setDueCards(data || []);
    } catch (error: any) {
      console.error("Error loading SR cards:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  const reviewCard = useCallback(
    async (cardId: string, quality: number) => {
      const card = dueCards.find(c => c.id === cardId);
      if (!card || !userId) return;

      const { interval, repetitions, easeFactor } = calculateSM2(
        quality,
        Number(card.ease_factor),
        card.interval_days,
        card.repetitions
      );

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      const { error } = await supabase
        .from("spaced_repetition_cards")
        .update({
          ease_factor: easeFactor,
          interval_days: interval,
          repetitions,
          next_review_date: nextReviewDate.toISOString().split("T")[0],
          last_reviewed_at: new Date().toISOString(),
        })
        .eq("id", cardId);

      if (error) {
        toast({
          title: "Error updating card",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setTotalReviewsToday(prev => prev + 1);
      setDueCards(prev => prev.filter(c => c.id !== cardId));

    },
    [dueCards, userId, toast]
  );

  const importFlashcardsForTopic = useCallback(
    async (topicId: string) => {
      if (!userId) return;

      try {
        // Get flashcards for the topic
        const { data: flashcardData, error: flashcardError } = await supabase
          .from("flashcards")
          .select("flashcard_json")
          .eq("topic_id", topicId)
          .maybeSingle();

        if (flashcardError) throw flashcardError;
        if (!flashcardData) return;

        const flashcards = flashcardData.flashcard_json as any[];
        
        // Check which cards already exist
        const { data: existingCards } = await supabase
          .from("spaced_repetition_cards")
          .select("card_front")
          .eq("topic_id", topicId)
          .eq("user_id", userId);

        const existingFronts = new Set(existingCards?.map(c => c.card_front) || []);

        // Insert new cards
        const newCards = flashcards
          .filter(fc => !existingFronts.has(fc.front))
          .map(fc => ({
            user_id: userId,
            topic_id: topicId,
            card_front: fc.front,
            card_back: fc.back,
          }));

        if (newCards.length > 0) {
          const { error } = await supabase
            .from("spaced_repetition_cards")
            .insert(newCards);

          if (error) throw error;

          toast({
            title: "Cards imported!",
            description: `Added ${newCards.length} cards to your review queue`,
          });

          await loadDueCards();
        }
      } catch (error: any) {
        toast({
          title: "Error importing flashcards",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [userId, toast, loadDueCards]
  );

  return {
    dueCards,
    loading,
    totalReviewsToday,
    reviewCard,
    importFlashcardsForTopic,
    refreshCards: loadDueCards,
  };
};
