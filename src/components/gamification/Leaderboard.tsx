import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  rank?: number;
}

interface LeaderboardProps {
  currentUserId?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
    case 2:
      return "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/30";
    case 3:
      return "bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30";
    default:
      return "bg-muted/30 border-border";
  }
};

const Leaderboard = ({ currentUserId }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const { data, error } = await supabase
        .from("leaderboard_cache")
        .select("*")
        .order("total_xp", { ascending: false })
        .limit(10);

      if (!error && data) {
        setEntries(data.map((entry, index) => ({ ...entry, rank: index + 1 })));
      }
      setLoading(false);
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card className="border-none shadow-xl">
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <CardTitle className="text-xl">Leaderboard</CardTitle>
            <p className="text-sm text-muted-foreground">Top learners this week</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No entries yet. Be the first!</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-xl border ${getRankBg(entry.rank || index + 1)} ${
                entry.user_id === currentUserId ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank || index + 1)}
              </div>
              
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-bold">
                  {entry.display_name?.slice(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {entry.display_name}
                  {entry.user_id === currentUserId && (
                    <span className="ml-2 text-xs text-primary">(You)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Level {entry.current_level}</p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-primary">{entry.total_xp.toLocaleString()} XP</p>
                {entry.current_streak > 0 && (
                  <div className="flex items-center gap-1 justify-end text-xs text-orange-500">
                    <Flame className="w-3 h-3" />
                    <span>{entry.current_streak}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
