-- Create audit log table for book actions
CREATE TABLE public.book_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  book_title TEXT,
  action TEXT NOT NULL CHECK (action IN ('add', 'update', 'remove')),
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_book_audit_log_user_id ON public.book_audit_log(user_id);
CREATE INDEX idx_book_audit_log_created_at ON public.book_audit_log(created_at DESC);
CREATE INDEX idx_book_audit_log_action ON public.book_audit_log(action);

-- Enable RLS
ALTER TABLE public.book_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.book_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.book_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own audit logs
CREATE POLICY "Users can create their own audit logs"
ON public.book_audit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can delete audit logs (for cleanup)
CREATE POLICY "Admins can delete audit logs"
ON public.book_audit_log
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));