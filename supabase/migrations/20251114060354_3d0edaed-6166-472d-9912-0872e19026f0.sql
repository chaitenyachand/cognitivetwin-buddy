-- Create weak_topics table to track areas needing improvement
CREATE TABLE IF NOT EXISTS public.weak_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  weak_area TEXT NOT NULL,
  identified_from TEXT NOT NULL, -- 'viva_test', 'quiz', 'manual'
  score NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  addressed BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.weak_topics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own weak topics"
ON public.weak_topics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weak topics"
ON public.weak_topics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weak topics"
ON public.weak_topics
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weak topics"
ON public.weak_topics
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_weak_topics_user_id ON public.weak_topics(user_id);
CREATE INDEX idx_weak_topics_topic_id ON public.weak_topics(topic_id);
CREATE INDEX idx_weak_topics_addressed ON public.weak_topics(addressed);