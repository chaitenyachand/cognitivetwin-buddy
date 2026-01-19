import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, goalDescription, targetDate, dailyStudyMinutes, topicsToCover } = await req.json();

    if (!userId || !goalDescription) {
      throw new Error('userId and goalDescription are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's performance data
    const [statsResult, quizResultsResult, weakTopicsResult, topicsResult] = await Promise.all([
      supabase.from('user_stats').select('*').eq('user_id', userId).single(),
      supabase.from('quiz_results').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('weak_topics').select('*').eq('user_id', userId).eq('addressed', false),
      supabase.from('topics').select('id, name, progress, best_score').eq('user_id', userId)
    ]);

    const userStats = statsResult.data;
    const recentQuizzes = quizResultsResult.data || [];
    const weakTopics = weakTopicsResult.data || [];
    const existingTopics = topicsResult.data || [];

    // Calculate average quiz score
    const avgScore = recentQuizzes.length > 0 
      ? recentQuizzes.reduce((sum: number, q: any) => sum + Number(q.score), 0) / recentQuizzes.length 
      : 0;

    // Build context for AI
    const performanceContext = {
      currentLevel: userStats?.current_level || 1,
      totalXP: userStats?.total_xp || 0,
      currentStreak: userStats?.current_streak || 0,
      averageQuizScore: Math.round(avgScore),
      weakAreas: weakTopics.map((w: any) => w.weak_area),
      existingTopics: existingTopics.map((t: any) => ({ name: t.name, progress: t.progress, bestScore: t.best_score })),
      totalStudyTimeMinutes: userStats?.total_study_time_minutes || 0
    };

    console.log('Generating study plan for user:', userId);
    console.log('Performance context:', performanceContext);

    const systemPrompt = `You are an expert AI study planner. Create a personalized, detailed study plan based on the user's goals and performance data.

Generate a study plan in this exact JSON format:
{
  "weeklySchedule": [
    {
      "day": "Monday",
      "sessions": [
        {
          "time": "9:00 AM",
          "duration": 30,
          "activity": "Review flashcards",
          "topic": "Topic name",
          "priority": "high"
        }
      ]
    }
  ],
  "dailyTasks": [
    {
      "task": "Complete 10 flashcard reviews",
      "category": "Review",
      "estimatedMinutes": 15,
      "xpReward": 50
    }
  ],
  "focusAreas": [
    {
      "topic": "Weak area name",
      "reason": "Why this needs focus",
      "suggestedApproach": "How to improve"
    }
  ],
  "milestones": [
    {
      "week": 1,
      "goal": "Complete basics of topic X",
      "metrics": "Score 80%+ on quiz"
    }
  ],
  "tips": [
    "Personalized study tip based on their learning patterns"
  ],
  "estimatedCompletionDays": 14,
  "recommendedDailyMinutes": 45
}

IMPORTANT:
- Tailor the plan to the user's available time (${dailyStudyMinutes || 30} minutes/day)
- Prioritize weak areas for improvement
- Include a mix of learning, review, and testing activities
- Make the schedule realistic and achievable
- Consider the target date if provided: ${targetDate || 'No specific deadline'}
- Include spaced repetition for retention
- Add variety to prevent burnout`;

    const userMessage = `Create a personalized study plan for this goal: "${goalDescription}"

Topics to cover: ${topicsToCover?.join(', ') || 'General learning'}

User Performance Data:
- Current Level: ${performanceContext.currentLevel}
- Total XP: ${performanceContext.totalXP}
- Current Streak: ${performanceContext.currentStreak} days
- Average Quiz Score: ${performanceContext.averageQuizScore}%
- Weak Areas: ${performanceContext.weakAreas.join(', ') || 'None identified yet'}
- Existing Topics: ${performanceContext.existingTopics.map((t: any) => `${t.name} (${t.progress}% complete, best: ${t.bestScore}%)`).join(', ') || 'None yet'}
- Total Study Time: ${Math.round(performanceContext.totalStudyTimeMinutes / 60)} hours`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', error);
      throw new Error('Study plan generation failed');
    }

    const aiData = await response.json();
    let content = aiData.choices[0].message.content;
    
    // Strip markdown code blocks if present
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    const planData = JSON.parse(content);

    // Save study plan to database
    const { data: savedPlan, error: saveError } = await supabase
      .from('study_plans')
      .insert({
        user_id: userId,
        goal_description: goalDescription,
        target_date: targetDate || null,
        daily_study_minutes: dailyStudyMinutes || 30,
        topics_to_cover: topicsToCover || [],
        ai_recommendations: planData,
        status: 'active'
      })
      .select()
      .single();

    if (saveError) throw saveError;

    console.log('Study plan generated and saved:', savedPlan.id);

    return new Response(
      JSON.stringify({
        planId: savedPlan.id,
        ...planData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating study plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
