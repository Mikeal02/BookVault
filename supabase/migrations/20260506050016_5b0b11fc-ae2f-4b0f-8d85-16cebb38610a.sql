
ALTER TABLE public.book_annotations
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sentiment text;

CREATE INDEX IF NOT EXISTS idx_book_annotations_tags ON public.book_annotations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_book_annotations_user_book ON public.book_annotations(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_book_annotations_created ON public.book_annotations(created_at DESC);
