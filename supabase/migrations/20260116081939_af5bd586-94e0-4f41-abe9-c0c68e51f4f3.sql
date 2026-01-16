-- =============================================
-- GAMIFICATION & ADVANCED FEATURES SCHEMA
-- =============================================

-- User Gamification Stats Table
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 30,
  daily_goal_progress INTEGER NOT NULL DEFAULT 0,
  total_study_time_minutes INTEGER NOT NULL DEFAULT 0,
  total_quizzes_completed INTEGER NOT NULL DEFAULT 0,
  total_flashcards_reviewed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Badges Table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Badges (earned)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Study Sessions (for tracking study time)
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL DEFAULT 'general',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Spaced Repetition Cards (SM-2 algorithm)
CREATE TABLE public.spaced_repetition_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  card_front TEXT NOT NULL,
  card_back TEXT NOT NULL,
  ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study Groups (Collaborative Learning)
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 10,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study Group Members
CREATE TABLE public.study_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Shared Notes
CREATE TABLE public.shared_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Study Plans
CREATE TABLE public.study_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_description TEXT NOT NULL,
  target_date DATE,
  topics_to_cover TEXT[] NOT NULL DEFAULT '{}',
  daily_study_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active',
  ai_recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily Challenges
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  challenge_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1
);

-- User Daily Challenge Progress
CREATE TABLE public.user_daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, challenge_id)
);

-- Leaderboard cache
CREATE TABLE public.leaderboard_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Onboarding Status
CREATE TABLE public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  learning_style TEXT,
  preferred_study_time TEXT,
  daily_goal_minutes INTEGER DEFAULT 30,
  interests TEXT[],
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  step_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaced_repetition_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for badges (public read)
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can earn badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for study_sessions
CREATE POLICY "Users can view their own study sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create study sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their study sessions" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for spaced_repetition_cards
CREATE POLICY "Users can view their own SR cards" ON public.spaced_repetition_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create SR cards" ON public.spaced_repetition_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their SR cards" ON public.spaced_repetition_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their SR cards" ON public.spaced_repetition_cards FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_groups
CREATE POLICY "Anyone can view public groups" ON public.study_groups FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Users can create groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update groups" ON public.study_groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete groups" ON public.study_groups FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for study_group_members
CREATE POLICY "Members can view group members" ON public.study_group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.study_group_members m WHERE m.group_id = study_group_members.group_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can join groups" ON public.study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.study_group_members FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shared_notes
CREATE POLICY "Group members can view notes" ON public.shared_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.study_group_members m WHERE m.group_id = shared_notes.group_id AND m.user_id = auth.uid())
);
CREATE POLICY "Group members can create notes" ON public.shared_notes FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.study_group_members m WHERE m.group_id = shared_notes.group_id AND m.user_id = auth.uid())
);
CREATE POLICY "Note owners can update notes" ON public.shared_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Note owners can delete notes" ON public.shared_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_plans
CREATE POLICY "Users can view their own study plans" ON public.study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create study plans" ON public.study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their study plans" ON public.study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their study plans" ON public.study_plans FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for daily_challenges (public read)
CREATE POLICY "Anyone can view daily challenges" ON public.daily_challenges FOR SELECT USING (true);

-- RLS Policies for user_daily_challenges
CREATE POLICY "Users can view their challenge progress" ON public.user_daily_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can track challenge progress" ON public.user_daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update challenge progress" ON public.user_daily_challenges FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for leaderboard_cache (public read)
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_cache FOR SELECT USING (true);
CREATE POLICY "Users can insert their leaderboard entry" ON public.leaderboard_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can upsert their leaderboard entry" ON public.leaderboard_cache FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_onboarding
CREATE POLICY "Users can view their onboarding" ON public.user_onboarding FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their onboarding" ON public.user_onboarding FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their onboarding" ON public.user_onboarding FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shared_notes_updated_at BEFORE UPDATE ON public.shared_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON public.study_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_onboarding_updated_at BEFORE UPDATE ON public.user_onboarding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, xp_reward, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first topic', '🎯', 'milestone', 50, 'topics_completed', 1),
('Quick Learner', 'Complete 5 topics', '📚', 'milestone', 100, 'topics_completed', 5),
('Knowledge Seeker', 'Complete 10 topics', '🔍', 'milestone', 200, 'topics_completed', 10),
('Master Scholar', 'Complete 25 topics', '🎓', 'milestone', 500, 'topics_completed', 25),
('Quiz Champion', 'Score 100% on any quiz', '🏆', 'achievement', 150, 'perfect_quiz', 1),
('Streak Starter', 'Maintain a 3-day streak', '🔥', 'streak', 75, 'streak_days', 3),
('Week Warrior', 'Maintain a 7-day streak', '⚡', 'streak', 150, 'streak_days', 7),
('Month Master', 'Maintain a 30-day streak', '💪', 'streak', 500, 'streak_days', 30),
('Flashcard Fanatic', 'Review 100 flashcards', '🃏', 'activity', 100, 'flashcards_reviewed', 100),
('Study Marathon', 'Study for 10 hours total', '⏱️', 'time', 200, 'study_minutes', 600),
('Voice Virtuoso', 'Complete 10 voice sessions', '🎤', 'voice', 150, 'voice_sessions', 10),
('Social Butterfly', 'Join a study group', '🦋', 'social', 75, 'groups_joined', 1),
('Helpful Hand', 'Share 5 notes with your group', '🤝', 'social', 100, 'notes_shared', 5),
('Early Bird', 'Study before 8 AM', '🌅', 'special', 50, 'early_study', 1),
('Night Owl', 'Study after 10 PM', '🦉', 'special', 50, 'late_study', 1);

-- Insert sample daily challenges
INSERT INTO public.daily_challenges (challenge_date, title, description, xp_reward, challenge_type, requirement_value) VALUES
(CURRENT_DATE, 'Quick Review', 'Review 10 flashcards today', 50, 'flashcards', 10),
(CURRENT_DATE, 'Quiz Time', 'Complete 1 quiz with 70%+ score', 75, 'quiz_pass', 1),
(CURRENT_DATE, 'Voice Practice', 'Have a 5-minute voice tutoring session', 100, 'voice_minutes', 5);