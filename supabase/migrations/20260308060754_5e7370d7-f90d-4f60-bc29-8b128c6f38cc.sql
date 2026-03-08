
-- Reading Lists / Collections
CREATE TABLE public.reading_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  cover_color text DEFAULT '#14b8a6',
  icon text DEFAULT '📚',
  is_public boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lists" ON public.reading_lists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own lists" ON public.reading_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lists" ON public.reading_lists FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lists" ON public.reading_lists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reading List Items (many-to-many)
CREATE TABLE public.reading_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.reading_lists(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  sort_order integer DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(list_id, book_id)
);

ALTER TABLE public.reading_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in their lists" ON public.reading_list_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reading_lists WHERE id = list_id AND user_id = auth.uid()));
CREATE POLICY "Users can add items to their lists" ON public.reading_list_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.reading_lists WHERE id = list_id AND user_id = auth.uid()));
CREATE POLICY "Users can update items in their lists" ON public.reading_list_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reading_lists WHERE id = list_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete items from their lists" ON public.reading_list_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reading_lists WHERE id = list_id AND user_id = auth.uid()));

-- Book Annotations / Highlights
CREATE TABLE public.book_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  content text NOT NULL,
  annotation_type text NOT NULL DEFAULT 'note',
  chapter text,
  page_number integer,
  color text DEFAULT '#14b8a6',
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.book_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own annotations" ON public.book_annotations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own annotations" ON public.book_annotations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own annotations" ON public.book_annotations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own annotations" ON public.book_annotations FOR DELETE TO authenticated USING (auth.uid() = user_id);
