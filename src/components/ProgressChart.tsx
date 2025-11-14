import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ProgressChartProps {
  userId: string;
}

const ProgressChart = ({ userId }: ProgressChartProps) => {
  const [data, setData] = useState<{ date: string; score: number }[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [improvement, setImprovement] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [userId]);

  const loadProgressData = async () => {
    try {
      const { data: quizResults, error } = await supabase
        .from('quiz_results')
        .select('score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!quizResults || quizResults.length === 0) {
        setData([]);
        setAverageScore(0);
        setImprovement(0);
        setLoading(false);
        return;
      }

      // Process data for chart
      const chartData = quizResults.map(result => ({
        date: format(new Date(result.created_at), 'MMM dd'),
        score: Number(result.score)
      }));

      // Calculate average score
      const avg = quizResults.reduce((sum, r) => sum + Number(r.score), 0) / quizResults.length;

      // Calculate improvement (first half vs second half)
      let improvementValue = 0;
      if (quizResults.length >= 2) {
        const midpoint = Math.floor(quizResults.length / 2);
        const firstHalf = quizResults.slice(0, midpoint);
        const secondHalf = quizResults.slice(midpoint);
        
        const firstAvg = firstHalf.reduce((sum, r) => sum + Number(r.score), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, r) => sum + Number(r.score), 0) / secondHalf.length;
        
        improvementValue = secondAvg - firstAvg;
      }

      setData(chartData);
      setAverageScore(avg);
      setImprovement(improvementValue);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Loading progress data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No quiz data yet. Complete some quizzes to see your progress!
          </div>
        </CardContent>
      </Card>
    );
  }

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
              <p className="text-3xl font-bold text-primary">{averageScore.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Improvement</p>
              <p className={`text-3xl font-bold flex items-center justify-center gap-1 ${improvement >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                <span className="text-2xl">{improvement >= 0 ? '↑' : '↓'}</span> {Math.abs(improvement).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
