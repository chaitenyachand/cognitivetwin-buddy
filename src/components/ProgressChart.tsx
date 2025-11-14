import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";

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
      <Card className="border-none shadow-lg bg-gradient-to-br from-card via-card to-card/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
            <CardTitle className="text-2xl font-bold">Your Progress Journey</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto">
                <TrendingUp className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-lg">Complete quizzes to track your progress!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-card via-card to-card/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
          <CardTitle className="text-2xl font-bold">Your Progress Journey</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/10 hover:border-primary/20 transition-colors">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Average Score</p>
            <p className="text-3xl font-bold text-primary">{averageScore.toFixed(1)}%</p>
          </div>
          <div className={`bg-gradient-to-br ${improvement >= 0 ? 'from-green-500/10 via-green-500/5' : 'from-red-500/10 via-red-500/5'} to-transparent p-5 rounded-2xl border ${improvement >= 0 ? 'border-green-500/10 hover:border-green-500/20' : 'border-red-500/10 hover:border-red-500/20'} transition-colors`}>
            <div className="flex items-center gap-2 mb-2">
              {improvement >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Improvement</p>
            </div>
            <p className={`text-3xl font-bold ${improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '4px' }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fill="url(#scoreGradient)"
              dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
