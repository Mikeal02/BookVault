
-- Create vaults table
CREATE TABLE public.vaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📚',
  color TEXT DEFAULT '#14b8a6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own vaults"
  ON public.vaults FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vaults"
  ON public.vaults FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vaults"
  ON public.vaults FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vaults"
  ON public.vaults FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_vaults_updated_at
  BEFORE UPDATE ON public.vaults
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add vault_id to user_books (nullable so existing books still work)
ALTER TABLE public.user_books
  ADD COLUMN vault_id UUID REFERENCES public.vaults(id) ON DELETE SET NULL;

-- Index for fast filtering
CREATE INDEX idx_user_books_vault_id ON public.user_books(vault_id);
CREATE INDEX idx_vaults_user_id ON public.vaults(user_id);
