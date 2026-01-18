import { motion } from "framer-motion";
import { Zap, Star, TrendingUp } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

interface XPProgressBarProps {
  userId: string;
  className?: string;
}

const XPProgressBar = ({ userId, className }: XPProgressBarProps) => {
  const { stats, getProgressToNextLevel, loading } = useGamification(userId);
  const progress = getProgressToNextLevel();

  if (loading || !stats) {
    return (
      <div className={cn("bg-card rounded-2xl p-4 border border-border animate-pulse h-24", className)} />
    );
  }

  const { current_level: level, current_streak: streak, total_xp } = stats;
  const { current: currentXp, required: requiredXp, percentage } = progress;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-r from-card via-card to-card/80 rounded-2xl p-4 border border-border shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg"
          >
            <Star className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Level</p>
            <p className="text-2xl font-bold text-foreground">{level}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full"
            >
              <span className="text-lg">🔥</span>
              <span className="font-bold text-orange-500">{streak} day{streak !== 1 ? "s" : ""}</span>
            </motion.div>
          )}
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary">{total_xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full relative"
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </motion.div>
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>{currentXp} XP this level</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {requiredXp} XP to Level {level + 1}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default XPProgressBar;