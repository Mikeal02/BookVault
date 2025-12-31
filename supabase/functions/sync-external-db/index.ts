import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to validate PostgreSQL connection URL format
function isValidPostgresUrl(url: string): boolean {
  try {
    // Check if it starts with postgres:// or postgresql://
    if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
      return false;
    }
    // Try to parse as URL
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper to mask sensitive parts of URL for logging
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return '[invalid-url]';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let externalDb: any = null;

  try {
    const body = await req.json();
    const { action, direction, userId } = body;
    
    console.log('Request received:', { action, direction, userId: userId ? 'present' : 'missing' });

    // Get and validate external DB URL
    const externalDbUrl = Deno.env.get('EXTERNAL_DB_URL');
    
    console.log('EXTERNAL_DB_URL present:', !!externalDbUrl);
    console.log('EXTERNAL_DB_URL length:', externalDbUrl?.length || 0);
    
    if (!externalDbUrl) {
      console.error('EXTERNAL_DB_URL is not configured in secrets');
      return new Response(JSON.stringify({
        success: false,
        connected: false,
        error: 'External database URL is not configured. Please add the EXTERNAL_DB_URL secret.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format
    if (!isValidPostgresUrl(externalDbUrl)) {
      console.error('Invalid PostgreSQL URL format. URL starts with:', externalDbUrl.substring(0, 15));
      return new Response(JSON.stringify({
        success: false,
        connected: false,
        error: 'Invalid database URL format. URL must start with postgresql:// or postgres://',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Connecting to external DB:', maskUrl(externalDbUrl));

    // Handle connection test
    if (action === 'test') {
      try {
        const testDb = postgres(externalDbUrl, { 
          ssl: 'require', 
          connect_timeout: 10,
          max: 1 
        });
        await testDb`SELECT 1 as test`;
        await testDb.end();
        
        console.log('Connection test successful');
        return new Response(JSON.stringify({
          connected: true,
          message: 'Connection successful',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (testError) {
        console.error('Connection test failed:', testError.message);
        return new Response(JSON.stringify({
          connected: false,
          error: `Connection failed: ${testError.message}`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Validate userId for sync operations
    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID is required for sync operations',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }
    
    // Create Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Connect to external database with connection pool settings
    externalDb = postgres(externalDbUrl, { 
      ssl: 'require',
      max: 5,
      idle_timeout: 20,
      connect_timeout: 30,
    });

    const syncResults = {
      profiles: { exported: 0, imported: 0, errors: 0 },
      user_books: { exported: 0, imported: 0, errors: 0 },
      reading_sessions: { exported: 0, imported: 0, errors: 0 },
    };

    const startTime = Date.now();

    // Ensure tables exist in external database
    console.log('Ensuring external tables exist...');
    await ensureExternalTables(externalDb);
    console.log('Tables verified/created');

    if (direction === 'export' || direction === 'both') {
      console.log('Starting export to external database...');
      
      // Export profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else if (profiles && profiles.length > 0) {
        console.log(`Exporting ${profiles.length} profiles...`);
        for (const profile of profiles) {
          try {
            await externalDb`
              INSERT INTO profiles (id, user_id, username, email, favorite_genres, reading_goal, preferred_reading_time, created_at, updated_at)
              VALUES (${profile.id}, ${profile.user_id}, ${profile.username}, ${profile.email}, ${profile.favorite_genres}, ${profile.reading_goal}, ${profile.preferred_reading_time}, ${profile.created_at}, ${profile.updated_at})
              ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                email = EXCLUDED.email,
                favorite_genres = EXCLUDED.favorite_genres,
                reading_goal = EXCLUDED.reading_goal,
                preferred_reading_time = EXCLUDED.preferred_reading_time,
                updated_at = EXCLUDED.updated_at
            `;
            syncResults.profiles.exported++;
          } catch (e) {
            console.error('Error exporting profile:', e.message);
            syncResults.profiles.errors++;
          }
        }
      }

      // Export user_books
      const { data: books, error: booksError } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', userId);
      
      if (booksError) {
        console.error('Error fetching books:', booksError);
      } else if (books && books.length > 0) {
        console.log(`Exporting ${books.length} books...`);
        for (const book of books) {
          try {
            await externalDb`
              INSERT INTO user_books (
                id, user_id, book_id, title, authors, description, published_date, publisher,
                categories, thumbnail_url, page_count, average_rating, ratings_count,
                personal_rating, reading_status, reading_progress, current_page, time_spent_reading,
                notes, my_thoughts, tags, date_added, date_started, date_finished,
                preview_link, info_link, language, created_at, updated_at
              )
              VALUES (
                ${book.id}, ${book.user_id}, ${book.book_id}, ${book.title}, ${book.authors}, ${book.description},
                ${book.published_date}, ${book.publisher}, ${book.categories}, ${book.thumbnail_url},
                ${book.page_count}, ${book.average_rating}, ${book.ratings_count}, ${book.personal_rating},
                ${book.reading_status}, ${book.reading_progress}, ${book.current_page}, ${book.time_spent_reading},
                ${book.notes}, ${book.my_thoughts}, ${book.tags}, ${book.date_added}, ${book.date_started},
                ${book.date_finished}, ${book.preview_link}, ${book.info_link}, ${book.language},
                ${book.created_at}, ${book.updated_at}
              )
              ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                authors = EXCLUDED.authors,
                description = EXCLUDED.description,
                personal_rating = EXCLUDED.personal_rating,
                reading_status = EXCLUDED.reading_status,
                reading_progress = EXCLUDED.reading_progress,
                current_page = EXCLUDED.current_page,
                time_spent_reading = EXCLUDED.time_spent_reading,
                notes = EXCLUDED.notes,
                my_thoughts = EXCLUDED.my_thoughts,
                tags = EXCLUDED.tags,
                date_started = EXCLUDED.date_started,
                date_finished = EXCLUDED.date_finished,
                updated_at = EXCLUDED.updated_at
            `;
            syncResults.user_books.exported++;
          } catch (e) {
            console.error('Error exporting book:', e.message);
            syncResults.user_books.errors++;
          }
        }
      }

      // Export reading_sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', userId);
      
      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      } else if (sessions && sessions.length > 0) {
        console.log(`Exporting ${sessions.length} reading sessions...`);
        for (const session of sessions) {
          try {
            await externalDb`
              INSERT INTO reading_sessions (id, user_id, book_id, duration_minutes, pages_read, notes, session_date, created_at)
              VALUES (${session.id}, ${session.user_id}, ${session.book_id}, ${session.duration_minutes}, ${session.pages_read}, ${session.notes}, ${session.session_date}, ${session.created_at})
              ON CONFLICT (id) DO UPDATE SET
                duration_minutes = EXCLUDED.duration_minutes,
                pages_read = EXCLUDED.pages_read,
                notes = EXCLUDED.notes
            `;
            syncResults.reading_sessions.exported++;
          } catch (e) {
            console.error('Error exporting session:', e.message);
            syncResults.reading_sessions.errors++;
          }
        }
      }
      
      console.log('Export completed');
    }

    if (direction === 'import' || direction === 'both') {
      console.log('Starting import from external database...');
      
      // Import profiles
      try {
        const externalProfiles = await externalDb`
          SELECT * FROM profiles WHERE user_id = ${userId}::uuid
        `;
        
        console.log(`Importing ${externalProfiles.length} profiles...`);
        for (const profile of externalProfiles) {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: profile.id,
              user_id: profile.user_id,
              username: profile.username,
              email: profile.email,
              favorite_genres: profile.favorite_genres,
              reading_goal: profile.reading_goal,
              preferred_reading_time: profile.preferred_reading_time,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            }, { onConflict: 'id' });
          
          if (error) {
            console.error('Error importing profile:', error.message);
            syncResults.profiles.errors++;
          } else {
            syncResults.profiles.imported++;
          }
        }
      } catch (e) {
        console.error('Error querying external profiles:', e.message);
      }

      // Import user_books
      try {
        const externalBooks = await externalDb`
          SELECT * FROM user_books WHERE user_id = ${userId}::uuid
        `;
        
        console.log(`Importing ${externalBooks.length} books...`);
        for (const book of externalBooks) {
          const { error } = await supabase
            .from('user_books')
            .upsert({
              id: book.id,
              user_id: book.user_id,
              book_id: book.book_id,
              title: book.title,
              authors: book.authors,
              description: book.description,
              published_date: book.published_date,
              publisher: book.publisher,
              categories: book.categories,
              thumbnail_url: book.thumbnail_url,
              page_count: book.page_count,
              average_rating: book.average_rating,
              ratings_count: book.ratings_count,
              personal_rating: book.personal_rating,
              reading_status: book.reading_status,
              reading_progress: book.reading_progress,
              current_page: book.current_page,
              time_spent_reading: book.time_spent_reading,
              notes: book.notes,
              my_thoughts: book.my_thoughts,
              tags: book.tags,
              date_added: book.date_added,
              date_started: book.date_started,
              date_finished: book.date_finished,
              preview_link: book.preview_link,
              info_link: book.info_link,
              language: book.language,
              created_at: book.created_at,
              updated_at: book.updated_at,
            }, { onConflict: 'id' });
          
          if (error) {
            console.error('Error importing book:', error.message);
            syncResults.user_books.errors++;
          } else {
            syncResults.user_books.imported++;
          }
        }
      } catch (e) {
        console.error('Error querying external books:', e.message);
      }

      // Import reading_sessions
      try {
        const externalSessions = await externalDb`
          SELECT * FROM reading_sessions WHERE user_id = ${userId}::uuid
        `;
        
        console.log(`Importing ${externalSessions.length} reading sessions...`);
        for (const session of externalSessions) {
          const { error } = await supabase
            .from('reading_sessions')
            .upsert({
              id: session.id,
              user_id: session.user_id,
              book_id: session.book_id,
              duration_minutes: session.duration_minutes,
              pages_read: session.pages_read,
              notes: session.notes,
              session_date: session.session_date,
              created_at: session.created_at,
            }, { onConflict: 'id' });
          
          if (error) {
            console.error('Error importing session:', error.message);
            syncResults.reading_sessions.errors++;
          } else {
            syncResults.reading_sessions.imported++;
          }
        }
      } catch (e) {
        console.error('Error querying external sessions:', e.message);
      }
      
      console.log('Import completed');
    }

    // Close external database connection
    await externalDb.end();
    externalDb = null;

    const duration = Date.now() - startTime;
    console.log(`Sync completed in ${duration}ms:`, syncResults);

    const totalErrors = syncResults.profiles.errors + syncResults.user_books.errors + syncResults.reading_sessions.errors;

    return new Response(JSON.stringify({
      success: true,
      message: totalErrors > 0 ? 'Sync completed with some errors' : 'Sync completed successfully',
      results: syncResults,
      duration_ms: duration,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Clean up connection on error
    if (externalDb) {
      try {
        await externalDb.end();
      } catch (e) {
        console.error('Error closing connection:', e.message);
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function ensureExternalTables(db: any) {
  // Create profiles table if not exists
  await db`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      username TEXT,
      email TEXT,
      favorite_genres TEXT[],
      reading_goal INTEGER DEFAULT 12,
      preferred_reading_time TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Create index on user_id for faster lookups
  await db`
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)
  `;

  // Create user_books table if not exists
  await db`
    CREATE TABLE IF NOT EXISTS user_books (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      book_id TEXT NOT NULL,
      title TEXT NOT NULL,
      authors TEXT[],
      description TEXT,
      published_date TEXT,
      publisher TEXT,
      categories TEXT[],
      thumbnail_url TEXT,
      page_count INTEGER,
      average_rating NUMERIC,
      ratings_count INTEGER,
      personal_rating INTEGER,
      reading_status TEXT DEFAULT 'not-read',
      reading_progress INTEGER DEFAULT 0,
      current_page INTEGER DEFAULT 0,
      time_spent_reading INTEGER DEFAULT 0,
      notes TEXT,
      my_thoughts TEXT,
      tags TEXT[],
      date_added TIMESTAMPTZ DEFAULT NOW(),
      date_started TIMESTAMPTZ,
      date_finished TIMESTAMPTZ,
      preview_link TEXT,
      info_link TEXT,
      language TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Create index on user_id for faster lookups
  await db`
    CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id)
  `;

  // Create reading_sessions table if not exists
  await db`
    CREATE TABLE IF NOT EXISTS reading_sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      book_id TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      pages_read INTEGER,
      notes TEXT,
      session_date TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Create index on user_id for faster lookups
  await db`
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id)
  `;
}
