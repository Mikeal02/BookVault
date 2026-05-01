import { useState, useCallback } from 'react';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createLogger, emitEvent, measure } from '@/lib/system';
import { logBookAction, diffBooks } from '@/lib/system/auditLog';

const log = createLogger('bookshelf');

/**
 * Custom hook encapsulating all bookshelf CRUD with optimistic updates.
 */
export const useBookshelf = (userId: string | undefined) => {
  const [bookshelf, setBookshelf] = useState<Book[]>([]);

  const loadBooks = useCallback(async (authUserId: string) => {
    const { data: userBooks, error } = await measure('loadBooks', () =>
      supabase.from('user_books').select('*').eq('user_id', authUserId)
    );

    if (error) {
      log.error('loadBooks failed', error);
      return [];
    }

    const books: Book[] = (userBooks || []).map(ub => ({
      id: ub.book_id,
      title: ub.title,
      authors: ub.authors || [],
      description: ub.description || undefined,
      publishedDate: ub.published_date || undefined,
      publisher: ub.publisher || undefined,
      pageCount: ub.page_count || undefined,
      categories: ub.categories || undefined,
      imageLinks: ub.thumbnail_url ? { thumbnail: ub.thumbnail_url } : undefined,
      averageRating: ub.average_rating ? Number(ub.average_rating) : undefined,
      ratingsCount: ub.ratings_count || undefined,
      language: ub.language || undefined,
      previewLink: ub.preview_link || undefined,
      infoLink: ub.info_link || undefined,
      readingStatus: (ub.reading_status as 'not-read' | 'reading' | 'finished') || 'not-read',
      personalRating: ub.personal_rating || undefined,
      readingProgress: ub.reading_progress || 0,
      currentPage: ub.current_page || 0,
      timeSpentReading: ub.time_spent_reading || 0,
      notes: ub.notes || undefined,
      myThoughts: ub.my_thoughts || undefined,
      tags: ub.tags || [],
      dateAdded: ub.date_added || undefined,
      dateStarted: ub.date_started || undefined,
      dateFinished: ub.date_finished || undefined,
      vaultId: (ub as any).vault_id || undefined,
    }));

    setBookshelf(books);
    return books;
  }, []);

  const addBook = useCallback(async (book: Book) => {
    if (!userId) return;

    // Optimistic update
    const bookWithDefaults: Book = {
      ...book,
      dateAdded: new Date().toISOString(),
      readingStatus: 'not-read',
      tags: [],
      notes: '',
      myThoughts: '',
      personalRating: 0,
      readingProgress: 0,
      timeSpentReading: 0,
      currentPage: 0,
    };
    setBookshelf(prev => [...prev, bookWithDefaults]);

    const { error } = await supabase.from('user_books').insert({
      user_id: userId,
      book_id: book.id,
      title: book.title,
      authors: book.authors,
      description: book.description,
      published_date: book.publishedDate,
      publisher: book.publisher,
      page_count: book.pageCount,
      categories: book.categories,
      thumbnail_url: book.imageLinks?.thumbnail,
      average_rating: book.averageRating,
      ratings_count: book.ratingsCount,
      language: book.language,
      preview_link: book.previewLink,
      info_link: book.infoLink,
      reading_status: 'not-read',
      personal_rating: 0,
      reading_progress: 0,
      current_page: 0,
      time_spent_reading: 0,
      notes: '',
      my_thoughts: '',
      tags: [],
      date_added: new Date().toISOString(),
    });

    if (error) {
      // Rollback optimistic update
      setBookshelf(prev => prev.filter(b => b.id !== book.id));
      if (error.code === '23505') {
        toast.error('This book is already in your library');
      } else {
        log.error('addBook failed', error);
        toast.error('Failed to add book');
      }
      return;
    }

    emitEvent('book:added', { bookId: book.id });
    void logBookAction({
      userId,
      bookId: book.id,
      bookTitle: book.title,
      action: 'add',
      metadata: { authors: book.authors, source: 'addBook' },
    });
    toast.success('Book added to your library!');
  }, [userId]);

  const updateBook = useCallback(async (updatedBook: Book) => {
    if (!userId) return;

    // Capture rollback snapshot inside the setter to avoid stale-closure races
    // when many updates fire in quick succession.
    let snapshot: Book[] = [];
    let previous: Book | undefined;
    setBookshelf(prev => {
      snapshot = prev;
      previous = prev.find(b => b.id === updatedBook.id);
      return prev.map(b => b.id === updatedBook.id ? updatedBook : b);
    });

    const { error } = await supabase
      .from('user_books')
      .update({
        reading_status: updatedBook.readingStatus,
        personal_rating: updatedBook.personalRating,
        reading_progress: updatedBook.readingProgress,
        current_page: updatedBook.currentPage,
        time_spent_reading: updatedBook.timeSpentReading,
        notes: updatedBook.notes,
        my_thoughts: updatedBook.myThoughts,
        tags: updatedBook.tags,
        date_started: updatedBook.dateStarted,
        date_finished: updatedBook.dateFinished,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('book_id', updatedBook.id);

    if (error) {
      // Rollback to the snapshot taken at mutation time.
      setBookshelf(snapshot);
      log.error('updateBook failed', error);
      toast.error('Failed to update book');
      return;
    }

    emitEvent('book:updated', { bookId: updatedBook.id });
    const trackedKeys = [
      'readingStatus', 'personalRating', 'readingProgress', 'currentPage',
      'timeSpentReading', 'notes', 'myThoughts', 'tags', 'dateStarted', 'dateFinished',
    ];
    const changes = previous
      ? diffBooks(previous as unknown as Record<string, unknown>, updatedBook as unknown as Record<string, unknown>, trackedKeys)
      : {};
    void logBookAction({
      userId,
      bookId: updatedBook.id,
      bookTitle: updatedBook.title,
      action: 'update',
      changes,
    });
    toast.success('Book updated!');
  }, [userId]);

  const removeBook = useCallback(async (bookId: string) => {
    if (!userId) return;

    let snapshot: Book[] = [];
    let removed: Book | undefined;
    setBookshelf(prev => {
      snapshot = prev;
      removed = prev.find(b => b.id === bookId);
      return prev.filter(b => b.id !== bookId);
    });

    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (error) {
      setBookshelf(snapshot);
      log.error('removeBook failed', error);
      toast.error('Failed to remove book');
      return;
    }

    emitEvent('book:removed', { bookId });
    void logBookAction({
      userId,
      bookId,
      bookTitle: removed?.title,
      action: 'remove',
      metadata: { authors: removed?.authors },
    });
    toast.success('Book removed from library');
  }, [userId]);

  const isInBookshelf = useCallback((bookId: string) => {
    return bookshelf.some(b => b.id === bookId);
  }, [bookshelf]);

  return { bookshelf, setBookshelf, loadBooks, addBook, updateBook, removeBook, isInBookshelf };
};
