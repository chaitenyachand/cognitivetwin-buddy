import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import XPProgressBar from "@/components/gamification/XPProgressBar";
import BadgeShowcase from "@/components/gamification/BadgeShowcase";
import DailyChallenges from "@/components/gamification/DailyChallenges";
import Leaderboard from "@/components/gamification/Leaderboard";
import StreakCalendar from "@/components/gamification/StreakCalendar";
import { useGamification } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";

const Achievements = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activityDates, setActivityDates] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadActivityDates(session.user.id);
      }
    });
  }, [navigate]);

  const loadActivityDates = async (userId: string) => {
    const { data } = await supabase
      .from("activity_log")
      .select("activity_date")
      .eq("user_id", userId);
    
    if (data) {
      setActivityDates([...new Set(data.map(d => d.activity_date))]);
    }
  };

  const { stats, badges, earnedBadges, dailyChallenges, loading, getProgressToNextLevel } = useGamification(user?.id);

  const progress = getProgressToNextLevel();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
        <Sidebar user={user} />
        <div className="flex-1 ml-64 p-8">
          <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      <Sidebar user={user} />

      <div className="flex-1 ml-64">
        <div className="border-b border-border bg-gradient-to-r from-card/50 via-card/80 to-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-8">
            <h1 className="text-4xl font-bold gradient-text">Achievements</h1>
            <p className="text-muted-foreground mt-2">Track your progress and earn rewards</p>
          </div>
        </div>

        <div className="px-8 py-8 space-y-6">
          {/* XP Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <XPProgressBar
              level={stats?.current_level || 1}
              currentXp={progress.current}
              requiredXp={progress.required}
              percentage={progress.percentage}
              streak={stats?.current_streak || 0}
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <StreakCalendar
                  currentStreak={stats?.current_streak || 0}
                  longestStreak={stats?.longest_streak || 0}
                  activityDates={activityDates}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DailyChallenges challenges={dailyChallenges} />
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <BadgeShowcase
                  allBadges={badges}
                  earnedBadgeIds={earnedBadges.map(eb => eb.badge_id)}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Leaderboard currentUserId={user?.id} />
              </motion.div>
            </div>
          </div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-3xl font-bold text-primary">{stats?.total_xp?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">Total XP</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-3xl font-bold text-secondary">{stats?.total_quizzes_completed || 0}</p>
              <p className="text-sm text-muted-foreground">Quizzes Completed</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-3xl font-bold text-accent-foreground">{stats?.total_flashcards_reviewed || 0}</p>
              <p className="text-sm text-muted-foreground">Cards Reviewed</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-3xl font-bold text-orange-500">{Math.round((stats?.total_study_time_minutes || 0) / 60)}</p>
              <p className="text-sm text-muted-foreground">Hours Studied</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
