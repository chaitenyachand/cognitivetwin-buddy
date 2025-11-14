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
    if (count === 0) return "bg-muted";
    const ratio = count / maxActivity;
    if (ratio <= 0.33) return "bg-primary/30";
    if (ratio <= 0.66) return "bg-primary/60";
    return "bg-primary";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Your Learning Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Month labels */}
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            {months.map((month) => (
              <span key={month} className="w-8">{month}</span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1">
            <div className="flex flex-col justify-between text-xs text-muted-foreground pr-2">
              {days.map((day) => (
                <span key={day} className="w-8">{day}</span>
              ))}
            </div>
            <div className="flex-1 space-y-1">
              {calendarData.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {row.map((activityCount, colIndex) => (
                    <div
                      key={colIndex}
                      className={`w-full aspect-square rounded-sm ${getActivityLevel(activityCount)}`}
                      title={`${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-primary/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/60" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
            </div>
            <span>More</span>
          </div>

          <div className="text-right text-xs text-muted-foreground">Past 12 months</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningActivityCalendar;
