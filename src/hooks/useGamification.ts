import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserStats {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  daily_goal_minutes: number;
  daily_goal_progress: number;
  total_study_time_minutes: number;
  total_quizzes_completed: number;
  total_flashcards_reviewed: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  challenge_type: string;
  requirement_value: number;
  progress?: number;
  completed?: boolean;
}

// XP required per level (exponential growth)
const getXpForLevel = (level: number): number => Math.floor(100 * Math.pow(1.5, level - 1));

export const useGamification = (userId: string | undefined) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGamificationData = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Load or create user stats
      let { data: statsData, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!statsData) {
        const { data: newStats, error: insertError } = await supabase
          .from("user_stats")
          .insert({ user_id: userId })
          .select()
          .single();
        
        if (insertError) throw insertError;
        statsData = newStats;
      }

      if (statsError) throw statsError;
      setStats(statsData);

      // Load all badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("badges")
        .select("*")
        .order("xp_reward", { ascending: true });

      if (badgesError) throw badgesError;
      setBadges(badgesData || []);

      // Load earned badges
      const { data: earnedData, error: earnedError } = await supabase
        .from("user_badges")
        .select("*, badge:badges(*)")
        .eq("user_id", userId);

      if (earnedError) throw earnedError;
      setEarnedBadges(earnedData as unknown as UserBadge[] || []);

      // Load daily challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("challenge_date", new Date().toISOString().split("T")[0]);

      if (challengesError) throw challengesError;

      // Load user's progress on challenges
      const { data: progressData } = await supabase
        .from("user_daily_challenges")
        .select("*")
        .eq("user_id", userId);

      const challengesWithProgress = (challengesData || []).map(challenge => {
        const userProgress = progressData?.find(p => p.challenge_id === challenge.id);
        return {
          ...challenge,
          progress: userProgress?.progress || 0,
          completed: userProgress?.completed || false,
        };
      });

      setDailyChallenges(challengesWithProgress);
    } catch (error: any) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  const addXp = useCallback(async (amount: number, reason: string) => {
    if (!userId || !stats) return;

    const newTotalXp = stats.total_xp + amount;
    let newLevel = stats.current_level;
    
    // Check for level up
    while (newTotalXp >= getXpForLevel(newLevel + 1)) {
      newLevel++;
    }

    const today = new Date().toISOString().split("T")[0];
    const lastActivityDate = stats.last_activity_date;
    let newStreak = stats.current_streak;

    // Update streak
    if (lastActivityDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      
      if (lastActivityDate === yesterdayStr) {
        newStreak += 1;
      } else if (lastActivityDate !== today) {
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(stats.longest_streak, newStreak);

    const { error } = await supabase
      .from("user_stats")
      .update({
        total_xp: newTotalXp,
        current_level: newLevel,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating XP:", error);
      return;
    }

    // Show XP toast
    toast({
      title: `+${amount} XP`,
      description: reason,
    });

    // Level up notification
    if (newLevel > stats.current_level) {
      toast({
        title: "🎉 Level Up!",
        description: `You've reached Level ${newLevel}!`,
      });
    }

    // Update leaderboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single();

    await supabase
      .from("leaderboard_cache")
      .upsert({
        user_id: userId,
        display_name: profile?.name || "Student",
        total_xp: newTotalXp,
        current_level: newLevel,
        current_streak: newStreak,
      }, { onConflict: "user_id" });

    await loadGamificationData();
    await checkBadges();
  }, [userId, stats, toast, loadGamificationData]);

  const checkBadges = useCallback(async () => {
    if (!userId || !stats) return;

    const earnedBadgeIds = earnedBadges.map(eb => eb.badge_id);
    const unearnedBadges = badges.filter(b => !earnedBadgeIds.includes(b.id));

    for (const badge of unearnedBadges) {
      let earned = false;

      switch (badge.requirement_type) {
        case "streak_days":
          earned = stats.current_streak >= badge.requirement_value;
          break;
        case "study_minutes":
          earned = stats.total_study_time_minutes >= badge.requirement_value;
          break;
        case "flashcards_reviewed":
          earned = stats.total_flashcards_reviewed >= badge.requirement_value;
          break;
        // Add more badge types as needed
      }

      if (earned) {
        const { error } = await supabase
          .from("user_badges")
          .insert({ user_id: userId, badge_id: badge.id });

        if (!error) {
          toast({
            title: `🏆 Badge Earned: ${badge.name}`,
            description: badge.description,
          });
          
          // Add XP for earning badge
          await addXp(badge.xp_reward, `Earned "${badge.name}" badge`);
        }
      }
    }
  }, [userId, stats, badges, earnedBadges, toast, addXp]);

  const updateChallengeProgress = useCallback(async (challengeType: string, progressIncrement: number) => {
    if (!userId) return;

    const challenge = dailyChallenges.find(c => c.challenge_type === challengeType && !c.completed);
    if (!challenge) return;

    const newProgress = (challenge.progress || 0) + progressIncrement;
    const completed = newProgress >= challenge.requirement_value;

    const { error } = await supabase
      .from("user_daily_challenges")
      .upsert({
        user_id: userId,
        challenge_id: challenge.id,
        progress: newProgress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }, { onConflict: "user_id,challenge_id" });

    if (!error && completed) {
      toast({
        title: "🎯 Challenge Complete!",
        description: `You completed "${challenge.title}" and earned ${challenge.xp_reward} XP!`,
      });
      await addXp(challenge.xp_reward, `Completed daily challenge: ${challenge.title}`);
    }

    await loadGamificationData();
  }, [userId, dailyChallenges, toast, addXp, loadGamificationData]);

  const getProgressToNextLevel = useCallback(() => {
    if (!stats) return { current: 0, required: 100, percentage: 0 };
    
    const currentLevelXp = getXpForLevel(stats.current_level);
    const nextLevelXp = getXpForLevel(stats.current_level + 1);
    const xpInCurrentLevel = stats.total_xp - currentLevelXp;
    const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
    
    return {
      current: xpInCurrentLevel,
      required: xpNeededForNextLevel,
      percentage: Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100),
    };
  }, [stats]);

  return {
    stats,
    badges,
    earnedBadges,
    dailyChallenges,
    loading,
    addXp,
    updateChallengeProgress,
    getProgressToNextLevel,
    refreshData: loadGamificationData,
  };
};
