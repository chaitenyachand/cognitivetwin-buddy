import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LearningActivityCalendar = () => {
  // Mock data for activity - you can replace this with real data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Mon", "Wed", "Fri"];
  
  // Generate mock activity data
  const generateActivity = () => {
    const activity = [];
    for (let i = 0; i < 3; i++) {
      const row = [];
      for (let j = 0; j < 52; j++) {
        row.push(Math.random() > 0.8 ? Math.floor(Math.random() * 4) : 0);
      }
      activity.push(row);
    }
    return activity;
  };

  const activityData = generateActivity();

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
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="flex-1 space-y-1">
              {activityData.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {row.map((activity, colIndex) => (
                    <div
                      key={colIndex}
                      className={`w-full aspect-square rounded-sm ${
                        activity === 0
                          ? "bg-muted"
                          : activity === 1
                          ? "bg-primary/30"
                          : activity === 2
                          ? "bg-primary/60"
                          : "bg-primary"
                      }`}
                      title={`Activity level: ${activity}`}
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

          <div className="text-right text-xs text-muted-foreground">2025</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningActivityCalendar;
