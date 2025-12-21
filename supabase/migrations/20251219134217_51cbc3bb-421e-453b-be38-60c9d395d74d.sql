-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT,
  email TEXT,
  favorite_genres TEXT[],
  reading_goal INTEGER DEFAULT 12,
  preferred_reading_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user books table to store library
CREATE TABLE public.user_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id TEXT NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[],
  description TEXT,
  published_date TEXT,
  publisher TEXT,
  page_count INTEGER,
  categories TEXT[],
  thumbnail_url TEXT,
  average_rating DECIMAL,
  ratings_count INTEGER,
  language TEXT,
  preview_link TEXT,
  info_link TEXT,
  reading_status TEXT DEFAULT 'not-read',
  personal_rating INTEGER,
  reading_progress INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 0,
  time_spent_reading INTEGER DEFAULT 0,
  notes TEXT,
  my_thoughts TEXT,
  tags TEXT[],
  date_added TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_started TIMESTAMP WITH TIME ZONE,
  date_finished TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Create reading sessions table
CREATE TABLE public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  pages_read INTEGER,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for user_books
CREATE POLICY "Users can view their own books"
ON public.user_books FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own books"
ON public.user_books FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
ON public.user_books FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
ON public.user_books FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for reading_sessions
CREATE POLICY "Users can view their own sessions"
ON public.reading_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.reading_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.reading_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Create function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_books_updated_at
  BEFORE UPDATE ON public.user_books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();