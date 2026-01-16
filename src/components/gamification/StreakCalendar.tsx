import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, CalendarDays } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";

interface StreakCalendarProps {
  currentStreak: number;
  longestStreak: number;
  activityDates: string[];
}

const StreakCalendar = ({ currentStreak, longestStreak, activityDates }: StreakCalendarProps) => {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  const hasActivity = (date: Date) => {
    return activityDates.some(d => isSameDay(new Date(d), date));
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Streak</CardTitle>
              <p className="text-sm text-muted-foreground">Keep the fire burning!</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              <span className="text-4xl font-bold text-orange-500">{currentStreak}</span>
            </div>
            <p className="text-xs text-muted-foreground">Best: {longestStreak} days</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 mt-2">
          {weekDays.map((day, index) => {
            const active = hasActivity(day);
            const isTodayDate = isToday(day);
            
            return (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05, type: "spring" }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-xs text-muted-foreground">
                  {format(day, "EEE")}
                </span>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    active
                      ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg"
                      : isTodayDate
                      ? "border-2 border-dashed border-orange-500/50 bg-orange-500/10"
                      : "bg-muted/50"
                  }`}
                >
                  {active ? "🔥" : format(day, "d")}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
        
        {currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl text-center"
          >
            <p className="text-sm text-orange-600 dark:text-orange-400">
              {currentStreak >= 7
                ? "🏆 Incredible! You're on fire!"
                : currentStreak >= 3
                ? "💪 Great momentum! Keep it up!"
                : "🌟 Nice start! Study today to continue!"}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreakCalendar;
