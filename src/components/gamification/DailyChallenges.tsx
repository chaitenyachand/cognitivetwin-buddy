import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Target, Zap } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

interface DailyChallengesProps {
  userId: string;
}

const DailyChallenges = ({ userId }: DailyChallengesProps) => {
  const { dailyChallenges: challenges, loading } = useGamification(userId);

  if (loading) {
    return (
      <Card className="border-none shadow-xl animate-pulse">
        <CardContent className="pt-6 h-48" />
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card className="border-none shadow-xl">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No challenges available today</p>
          <p className="text-sm mt-2">Check back tomorrow for new challenges!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-xl">Daily Challenges</CardTitle>
            <p className="text-sm text-muted-foreground">
              {challenges.filter(c => c.completed).length} / {challenges.length} completed
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge, index) => {
          const progressPercentage = Math.min(
            100,
            ((challenge.progress || 0) / challenge.requirement_value) * 100
          );

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${
                challenge.completed
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  {challenge.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${challenge.completed ? "line-through text-muted-foreground" : ""}`}>
                      {challenge.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">{challenge.xp_reward}</span>
                </div>
              </div>
              
              {!challenge.completed && (
                <div className="mt-3 pl-8">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{challenge.progress || 0} / {challenge.requirement_value}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DailyChallenges;