import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, Award } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
}

interface BadgeShowcaseProps {
  allBadges: Badge[];
  earnedBadgeIds: string[];
}

const categoryColors: Record<string, string> = {
  milestone: "from-blue-500 to-cyan-500",
  achievement: "from-yellow-500 to-orange-500",
  streak: "from-red-500 to-pink-500",
  activity: "from-green-500 to-emerald-500",
  time: "from-purple-500 to-violet-500",
  voice: "from-indigo-500 to-blue-500",
  social: "from-pink-500 to-rose-500",
  special: "from-amber-500 to-yellow-500",
};

const BadgeShowcase = ({ allBadges, earnedBadgeIds }: BadgeShowcaseProps) => {
  const earnedBadges = allBadges.filter(b => earnedBadgeIds.includes(b.id));
  const lockedBadges = allBadges.filter(b => !earnedBadgeIds.includes(b.id));

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Achievements</CardTitle>
            <p className="text-sm text-muted-foreground">
              {earnedBadgeIds.length} / {allBadges.length} badges earned
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {earnedBadges.map((badge, index) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.05, type: "spring" }}
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[badge.category] || "from-gray-500 to-gray-600"} flex items-center justify-center text-2xl shadow-lg cursor-pointer`}
                  >
                    {badge.icon}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  <p className="text-xs text-primary mt-1">+{badge.xp_reward} XP</p>
                </TooltipContent>
              </Tooltip>
            ))}
            
            {lockedBadges.slice(0, 8).map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center cursor-pointer border-2 border-dashed border-muted-foreground/30"
                  >
                    <Lock className="w-4 h-4 text-muted-foreground/50" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold text-muted-foreground">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Locked</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default BadgeShowcase;
