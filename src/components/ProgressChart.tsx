import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ProgressChart = () => {
  // Mock data - replace with real data
  const data = [
    { date: "Oct 23\n2025", score: 40 },
    { date: "Oct 26", score: 40 },
    { date: "Oct 29", score: 40 },
    { date: "Nov 1", score: 40 },
    { date: "Nov 4", score: 20 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Average Score</p>
              <p className="text-3xl font-bold text-primary">37.1%</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Improvement</p>
              <p className="text-3xl font-bold text-secondary flex items-center justify-center gap-1">
                <span className="text-2xl">↑</span> 2.9%
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
