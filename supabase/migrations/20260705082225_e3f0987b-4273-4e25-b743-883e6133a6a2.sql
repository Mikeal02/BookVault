
-- 1) Reading sessions: allow users to update their own sessions
CREATE POLICY "Users can update their own reading sessions"
ON public.reading_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) Update handle_new_user to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);
  RETURN new;
END;
$function$;

-- 3) Drop the email column from profiles (email lives in auth.users)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
