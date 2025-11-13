-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Alter existing topics table to add missing columns
ALTER TABLE public.topics 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add constraints after columns are created
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_progress_check'
  ) THEN
    ALTER TABLE public.topics ADD CONSTRAINT topics_progress_check CHECK (progress >= 0 AND progress <= 100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_best_score_check'
  ) THEN
    ALTER TABLE public.topics ADD CONSTRAINT topics_best_score_check CHECK (best_score >= 0 AND best_score <= 100);
  END IF;
END $$;

-- Create materials table for generated learning materials
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL CHECK (material_type IN ('summary', 'mindmap', 'flashcards', 'quiz', 'formula_sheet')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create learning_sessions table to track user sessions
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('voice', 'manual', 'pdf')),
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create activity_log table for calendar tracking
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for materials
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view materials for their topics'
  ) THEN
    CREATE POLICY "Users can view materials for their topics"
      ON public.materials FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.topics
        WHERE topics.id = materials.topic_id
        AND topics.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can create materials for their topics'
  ) THEN
    CREATE POLICY "Users can create materials for their topics"
      ON public.materials FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.topics
        WHERE topics.id = materials.topic_id
        AND topics.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete materials for their topics'
  ) THEN
    CREATE POLICY "Users can delete materials for their topics"
      ON public.materials FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM public.topics
        WHERE topics.id = materials.topic_id
        AND topics.user_id = auth.uid()
      ));
  END IF;
END $$;

-- RLS Policies for learning_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own sessions' AND tablename = 'learning_sessions'
  ) THEN
    CREATE POLICY "Users can view their own sessions"
      ON public.learning_sessions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own sessions' AND tablename = 'learning_sessions'
  ) THEN
    CREATE POLICY "Users can create their own sessions"
      ON public.learning_sessions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own sessions' AND tablename = 'learning_sessions'
  ) THEN
    CREATE POLICY "Users can update their own sessions"
      ON public.learning_sessions FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for activity_log
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own activity'
  ) THEN
    CREATE POLICY "Users can view their own activity"
      ON public.activity_log FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own activity'
  ) THEN
    CREATE POLICY "Users can create their own activity"
      ON public.activity_log FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_materials_topic_id ON public.materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON public.learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON public.activity_log(user_id, activity_date);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_topics_updated_at ON public.topics;
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_sessions_updated_at ON public.learning_sessions;
CREATE TRIGGER update_learning_sessions_updated_at
  BEFORE UPDATE ON public.learning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();