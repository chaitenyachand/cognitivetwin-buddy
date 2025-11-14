import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LearningActivityCalendarProps {
  activityData: Array<{ activity_date: string }>;
}

const LearningActivityCalendar = ({ activityData }: LearningActivityCalendarProps) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Create a map of dates with activity counts
  const activityMap = new Map<string, number>();
  activityData.forEach((activity) => {
    const date = activity.activity_date;
    activityMap.set(date, (activityMap.get(date) || 0) + 1);
  });

  // Generate calendar for the past year
  const generateCalendar = () => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const calendar: number[][] = [[], [], [], [], [], [], []]; // 7 rows for days of week
    const startDate = new Date(oneYearAgo);
    
    // Find the first Monday
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() + 1);
    }
    
    // Fill 52 weeks
    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        // Format date as YYYY-MM-DD
        const dateStr = currentDate.toISOString().split('T')[0];
        const activityCount = activityMap.get(dateStr) || 0;
        
        calendar[day].push(activityCount);
      }
    }
    
    return calendar;
  };

  const calendarData = generateCalendar();
  
  // Calculate max activity for scaling
  const maxActivity = Math.max(...Array.from(activityMap.values()), 1);

  const getActivityLevel = (count: number): string => {
    if (count === 0) return "bg-muted hover:bg-muted";
    const ratio = count / maxActivity;
    if (ratio <= 0.33) return "bg-primary/30 hover:bg-primary/40";
    if (ratio <= 0.66) return "bg-primary/60 hover:bg-primary/70";
    return "bg-primary hover:bg-primary/90";
  };

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-card via-card to-card/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
          <CardTitle className="text-2xl font-bold text-foreground">Your Learning Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Month labels */}
          <div className="flex justify-between text-xs text-muted-foreground font-medium mb-2">
            {months.map((month) => (
              <span key={month} className="w-8">{month}</span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-2">
            <div className="flex flex-col justify-between text-xs text-muted-foreground font-medium pr-3">
              {days.map((day) => (
                <span key={day} className="w-8">{day}</span>
              ))}
            </div>
            <div className="flex-1 space-y-1.5">
              {calendarData.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1.5">
                  {row.map((activityCount, colIndex) => (
                    <div
                      key={colIndex}
                      className={`w-full aspect-square rounded-md transition-all duration-200 cursor-pointer ${getActivityLevel(activityCount)}`}
                      title={`${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground font-medium">Less</span>
            <div className="flex gap-1.5">
              <div className="w-4 h-4 rounded-md bg-muted" />
              <div className="w-4 h-4 rounded-md bg-primary/30" />
              <div className="w-4 h-4 rounded-md bg-primary/60" />
              <div className="w-4 h-4 rounded-md bg-primary" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">More</span>
          </div>

          <div className="text-right text-xs text-muted-foreground font-medium">Past 12 months</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningActivityCalendar;
