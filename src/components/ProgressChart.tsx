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

      const chartData = quizResults.map(result => ({
        date: format(new Date(result.created_at), 'MMM dd'),
        score: Number(result.score)
      }));

      const avg = quizResults.reduce((sum, r) => sum + Number(r.score), 0) / quizResults.length;

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
      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full" />
            <CardTitle className="text-xl font-bold">Your Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full" />
            <CardTitle className="text-xl font-bold">Your Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-center">
            <div>
              <span className="text-4xl mb-4 block">📈</span>
              <p className="text-muted-foreground">Complete quizzes to track progress!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full" />
          <CardTitle className="text-xl font-bold">Your Progress</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-xl">
            <p className="text-xs font-medium text-muted-foreground mb-1">Average</p>
            <p className="text-2xl font-bold text-primary">{averageScore.toFixed(1)}%</p>
          </div>
          <div className="bg-gradient-to-br from-secondary/10 to-transparent p-4 rounded-xl">
            <p className="text-xs font-medium text-muted-foreground mb-1">Improvement</p>
            <p className={`text-2xl font-bold ${improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
