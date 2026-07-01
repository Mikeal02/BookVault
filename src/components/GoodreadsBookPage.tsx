import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star, ChevronDown, Heart, Share2, BookOpen, Bookmark, MessageSquare,
  Flag, ThumbsUp, MoreHorizontal, ChevronRight, Search,
} from 'lucide-react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { BookCoverPlaceholder } from './BookCoverPlaceholder';
import { toast } from 'sonner';

interface Props {
  books: Book[];
  activeBook: Book | null;
  onSelectBook: (b: Book) => void;
  onOpenModal?: (b: Book) => void;
}

// ────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────
const StarRow = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => {
      const filled = rating >= i;
      const half = !filled && rating >= i - 0.5;
      return (
        <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
          <Star className="absolute inset-0 text-amber-400/25" style={{ width: size, height: size }} />
          {(filled || half) && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: half ? size / 2 : size }}>
              <Star className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} />
            </span>
          )}
        </span>
      );
    })}
  </div>
);

const Section = ({ id, title, action, children }: { id?: string; title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <section id={id} className="border-t border-border/40 pt-6 mt-6">
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const hashInt = (s: string, mod: number) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
};

const buildSyntheticHistogram = (avg: number, count: number) => {
  // Bell-ish distribution weighted around avg
  const weights = [1, 2, 3, 4, 5].map((s) => Math.exp(-Math.pow(s - avg, 2) / 0.9));
  const total = weights.reduce((a, b) => a + b, 0);
  return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, ...Object.fromEntries(weights.map((w, i) => [i + 1, Math.round((w / total) * count)])) } as Record<1|2|3|4|5, number>;
};

// ────────────────────────────────────────────────────────────────
// Fake but deterministic community reviews (Goodreads-style card set)
// ────────────────────────────────────────────────────────────────
const REVIEW_TEMPLATES: { name: string; rating: number; text: string }[] = [
  { name: 'Emily Ashcroft', rating: 5, text: 'A layered, patient novel that rewards the reader who lingers. The prose is confident without ever showing off, and the closing chapters landed with real weight.' },
  { name: 'Marcus Reyes', rating: 4, text: 'Slow to start but the middle third is quietly devastating. Character work is exceptional — every relationship earns its emotional payoff.' },
  { name: 'Ines Bauer', rating: 5, text: 'One of the rare books that made me re-read entire paragraphs just to sit with the language. Highly recommend for readers who love interiority.' },
  { name: 'Jonathan Park', rating: 3, text: 'Craft is undeniable but the pacing lost me around the halfway mark. Beautiful sentences in search of a tighter narrative spine.' },
  { name: 'Fatima Yusuf', rating: 4, text: 'A meditation on memory, place, and inheritance. The imagery of the coast is unforgettable — I could taste the salt.' },
  { name: 'David Kwon', rating: 5, text: 'Reads like a long, held breath. Finished it on the train and had to sit for ten minutes before I could move.' },
];

// ────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────
export const GoodreadsBookPage = ({ books, activeBook, onSelectBook, onOpenModal }: Props) => {
  const [search, setSearch] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<number | 'all'>('all');
  const [wantStatus, setWantStatus] = useState<'idle' | 'want' | 'reading' | 'read'>('idle');

  // Pick default book: activeBook → first reading → first
  const book = activeBook || books.find((b) => b.readingStatus === 'reading') || books[0];

  useEffect(() => {
    if (book?.readingStatus === 'reading') setWantStatus('reading');
    else if (book?.readingStatus === 'finished') setWantStatus('read');
    else if (book?.readingStatus === 'not-read') setWantStatus('want');
    else setWantStatus('idle');
  }, [book?.id, book?.readingStatus]);

  const filteredBookList = useMemo(
    () =>
      books
        .filter((b) => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.authors?.some((a) => a.toLowerCase().includes(search.toLowerCase())))
        .slice(0, 12),
    [books, search],
  );

  if (!book) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <h2 className="font-display text-2xl font-bold mb-2">No book selected</h2>
        <p className="text-muted-foreground text-sm">Add a book to your shelf, then open it here for the full literary page view.</p>
      </div>
    );
  }

  const avg = book.averageRating || 4.1;
  const ratingsCount = book.ratingsCount || 1240 + hashInt(book.id, 8000);
  const reviewsCount = Math.floor(ratingsCount * 0.11);
  const histogram: Record<1|2|3|4|5, number> = book.ratingsHistogram || buildSyntheticHistogram(avg, ratingsCount);
  const histoMax = Math.max(histogram[1], histogram[2], histogram[3], histogram[4], histogram[5]);

  const genres = (book.categories || book.subjects || ['Fiction', 'Literature']).slice(0, 8);
  const similar = books.filter((b) => b.id !== book.id && b.authors?.some((a) => book.authors?.includes(a)) || genres.some((g) => (b.categories || []).includes(g))).slice(0, 12);
  const fallbackSimilar = books.filter((b) => b.id !== book.id).slice(0, 12);
  const shelfSuggestions = (similar.length ? similar : fallbackSimilar).slice(0, 12);

  const reviews = REVIEW_TEMPLATES.map((r, i) => ({
    ...r,
    id: `${book.id}-r-${i}`,
    date: new Date(2025, (hashInt(book.id + i, 12)), 1 + hashInt(book.id + 'd' + i, 27)).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
    likes: 12 + hashInt(book.id + i, 340),
    comments: hashInt(book.id + 'c' + i, 42),
  })).filter((r) => reviewFilter === 'all' || r.rating === reviewFilter);

  const editionYear = book.originalPublicationYear || (book.publishedDate ? new Date(book.publishedDate).getFullYear() : undefined);

  return (
    <div className="max-w-[1120px] mx-auto pb-24">
      {/* ── Book switcher (BookVault-native, since Goodreads assumes a URL per book) ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Switch to another book from your shelf…"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border/50 text-sm outline-none focus:border-primary/60"
          />
          {search && filteredBookList.length > 0 && (
            <div className="absolute z-30 top-full mt-1 left-0 right-0 max-h-72 overflow-auto rounded-lg bg-card border border-border/60 shadow-xl">
              {filteredBookList.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { onSelectBook(b); setSearch(''); }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-muted/50 text-left"
                >
                  {b.imageLinks?.thumbnail ? (
                    <img src={b.imageLinks.thumbnail} alt="" className="w-8 h-12 object-cover rounded-sm" />
                  ) : (
                    <div className="w-8 h-12 rounded-sm bg-muted" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{b.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{b.authors?.join(', ')}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Goodreads-style page view · {books.length} books on shelf
        </div>
      </div>

      {/* ═══════════════ HERO ═══════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* Left: Cover + primary CTA */}
        <div className="flex md:block flex-col items-center gap-4">
          {book.imageLinks?.thumbnail ? (
            <img
              src={book.imageLinks.large || book.imageLinks.medium || book.imageLinks.thumbnail}
              alt={book.title}
              className="w-[200px] md:w-full aspect-[2/3] object-cover rounded-md shadow-2xl ring-1 ring-border/40"
            />
          ) : (
            <BookCoverPlaceholder title={book.title} author={book.authors?.[0]} className="w-[200px] md:w-full aspect-[2/3] rounded-md" />
          )}

          {/* Split "Want to Read" button — the iconic Goodreads control */}
          <div className="w-full max-w-[220px] md:max-w-none">
            <div className="flex rounded-md overflow-hidden shadow-lg ring-1 ring-primary/30">
              <button
                onClick={() => { setWantStatus('want'); toast.success('Added to Want to Read'); }}
                className="flex-1 h-11 bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
              >
                {wantStatus === 'want' ? '✓ Want to Read' : wantStatus === 'reading' ? '✓ Currently Reading' : wantStatus === 'read' ? '✓ Read' : 'Want to Read'}
              </button>
              <button className="w-10 h-11 bg-primary/90 text-primary-foreground border-l border-primary-foreground/20 flex items-center justify-center hover:bg-primary transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1 mt-3">
              <span className="text-xs text-muted-foreground mr-2">Rate this book</span>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} className="p-0.5 hover:scale-125 transition-transform">
                  <Star className={`w-5 h-5 ${(book.personalRating || 0) >= i ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Metadata block */}
        <div className="min-w-0">
          {book.seriesName && (
            <p className="text-sm text-primary/80 hover:text-primary cursor-pointer mb-1">
              {book.seriesName}{book.seriesPosition ? ` #${book.seriesPosition}` : ''}
            </p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight mb-2">
            {book.title}
          </h1>
          {book.subtitle && <p className="text-lg text-muted-foreground mb-3 leading-snug">{book.subtitle}</p>}

          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-sm text-muted-foreground">by</span>
            {(book.authors || ['Unknown']).map((a, i) => (
              <span key={a} className="text-base font-semibold text-primary underline decoration-primary/30 underline-offset-2 cursor-pointer hover:decoration-primary">
                {a}{i < (book.authors?.length || 1) - 1 ? ',' : ''}
              </span>
            ))}
          </div>

          {/* Rating summary row */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/40">
            <span className="text-3xl font-bold numeral">{avg.toFixed(2)}</span>
            <div className="flex flex-col">
              <StarRow rating={avg} size={16} />
              <div className="text-xs text-muted-foreground mt-0.5">
                <a href="#reviews" className="underline hover:text-foreground">{ratingsCount.toLocaleString()} ratings</a>
                {' · '}
                <a href="#reviews" className="underline hover:text-foreground">{reviewsCount.toLocaleString()} reviews</a>
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="mb-6">
              <div
                className={`text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line ${
                  descExpanded ? '' : 'line-clamp-6'
                }`}
                dangerouslySetInnerHTML={{ __html: book.description }}
              />
              <button
                onClick={() => setDescExpanded((v) => !v)}
                className="mt-2 text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                {descExpanded ? 'Show less' : 'Show more'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${descExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

          {/* Genre chips */}
          {genres.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground mr-1">Genres</span>
                {genres.map((g) => (
                  <button key={g} className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-[13px] text-foreground/80 transition-colors">
                    {g}
                  </button>
                ))}
                <button className="text-[13px] text-muted-foreground hover:text-foreground">...more</button>
              </div>
            </div>
          )}

          {/* Edition metadata */}
          <div className="text-sm text-muted-foreground space-y-0.5 mb-6">
            <p>
              <span className="text-foreground/90">{book.printType === 'MAGAZINE' ? 'Magazine' : book.physicalFormat || (book.isEbook ? 'ebook' : 'Hardcover')}</span>
              {book.pageCount ? `, ${book.pageCount} pages` : ''}
            </p>
            <p>
              Published <span className="text-foreground/90">{book.publishedDate || 'Unknown'}</span>
              {book.publisher ? ` by ${book.publisher}` : ''}
            </p>
            {editionYear && (
              <p>
                First published <span className="text-foreground/90">{editionYear}</span>
              </p>
            )}
          </div>

          {/* Secondary action bar */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground border-t border-border/40 pt-4">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-muted/60"><Heart className="w-4 h-4" /> Like</button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-muted/60"><Share2 className="w-4 h-4" /> Share</button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-muted/60"><Bookmark className="w-4 h-4" /> Save</button>
            {onOpenModal && (
              <button onClick={() => onOpenModal(book)} className="ml-auto text-primary hover:underline font-medium">
                Open editor →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ RATINGS & REVIEWS ═══════════════ */}
      <Section id="reviews" title="Ratings & Reviews">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          {/* Big rating column */}
          <div className="text-center md:text-left">
            <div className="text-6xl font-bold numeral leading-none">{avg.toFixed(2)}</div>
            <div className="mt-2 flex md:justify-start justify-center"><StarRow rating={avg} size={20} /></div>
            <div className="text-sm text-muted-foreground mt-1">
              {ratingsCount.toLocaleString()} ratings · {reviewsCount.toLocaleString()} reviews
            </div>

            {/* Histogram */}
            <div className="mt-6 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = histogram[stars as 1|2|3|4|5];
                const pct = histoMax ? (count / histoMax) * 100 : 0;
                const active = reviewFilter === stars;
                return (
                  <button
                    key={stars}
                    onClick={() => setReviewFilter(active ? 'all' : (stars as 1|2|3|4|5))}
                    className="w-full flex items-center gap-2 group"
                  >
                    <span className="text-xs w-14 text-left text-muted-foreground group-hover:text-foreground">{stars} stars</span>
                    <div className="flex-1 h-3 rounded-sm bg-muted/60 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full ${active ? 'bg-amber-500' : 'bg-amber-400/70 group-hover:bg-amber-400'}`}
                      />
                    </div>
                    <span className="text-xs w-16 text-right numeral text-muted-foreground">{count.toLocaleString()}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full">Write a Review</Button>
              <div className="flex justify-between text-xs text-muted-foreground">
                <button className="hover:text-foreground">Search review text</button>
                <button className="hover:text-foreground">Filters</button>
              </div>
            </div>
          </div>

          {/* Reviews column */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">
                Displaying {reviews.length} of {reviewsCount.toLocaleString()} reviews
                {reviewFilter !== 'all' && <span className="text-primary"> · {reviewFilter} stars</span>}
              </h3>
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Sort: Default <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-6">
              {reviews.map((r) => (
                <article key={r.id} className="pb-6 border-b border-border/30 last:border-0">
                  <header className="flex items-start gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: `hsl(${hashInt(r.name, 360)} 55% 45%)` }}
                    >
                      {r.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{r.name}</span>
                        <span className="text-xs text-muted-foreground">· {hashInt(r.name, 800) + 12} reviews</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRow rating={r.rating} size={12} />
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </div>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground p-1"><MoreHorizontal className="w-4 h-4" /></button>
                  </header>
                  <p className="text-[15px] leading-relaxed text-foreground/90 pl-13 ml-13">{r.text}</p>
                  <footer className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <button className="flex items-center gap-1.5 hover:text-foreground"><ThumbsUp className="w-3.5 h-3.5" /> {r.likes} likes</button>
                    <button className="flex items-center gap-1.5 hover:text-foreground"><MessageSquare className="w-3.5 h-3.5" /> {r.comments} comments</button>
                    <button className="ml-auto hover:text-foreground"><Flag className="w-3.5 h-3.5" /></button>
                  </footer>
                </article>
              ))}
            </div>

            <button className="w-full mt-6 py-3 rounded-md border border-border/60 text-sm font-semibold hover:bg-muted/40">
              Show more reviews
            </button>
          </div>
        </div>
      </Section>

      {/* ═══════════════ ABOUT THE AUTHOR ═══════════════ */}
      <Section title="About the author">
        <div className="flex items-start gap-5">
          {book.authorPhotoUrl ? (
            <img src={book.authorPhotoUrl} alt="" className="w-24 h-24 rounded-full object-cover ring-1 ring-border/40" />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: `hsl(${hashInt(book.authors?.[0] || 'a', 360)} 55% 45%)` }}
            >
              {(book.authors?.[0] || 'A').split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold font-display">{book.authors?.[0]}</h3>
            <div className="text-xs text-muted-foreground mt-0.5">
              {(book.authorWorkCount || 42).toLocaleString()} books · {(ratingsCount * 3).toLocaleString()} followers
            </div>
            <p className="text-[15px] leading-relaxed mt-3 text-foreground/85">
              {book.authorBio ||
                `${book.authors?.[0]} is the author of ${book.authorTopWork || book.title}. Their work explores themes of memory, place, and the quiet architecture of ordinary lives — writing that critics have praised as "unshowy and utterly precise."`}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Button variant="outline" size="sm">Follow Author</Button>
              {book.authorWikipediaUrl && (
                <a href={book.authorWikipediaUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Wikipedia →</a>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════ READERS ALSO ENJOYED ═══════════════ */}
      {shelfSuggestions.length > 0 && (
        <Section title="Readers also enjoyed" action={<button className="text-xs text-primary hover:underline">See similar books →</button>}>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory">
            {shelfSuggestions.map((b) => (
              <button
                key={b.id}
                onClick={() => onSelectBook(b)}
                className="snap-start flex-shrink-0 w-[140px] text-left group"
              >
                {b.imageLinks?.thumbnail ? (
                  <img
                    src={b.imageLinks.thumbnail}
                    alt={b.title}
                    className="w-full aspect-[2/3] object-cover rounded-md shadow-md ring-1 ring-border/40 group-hover:shadow-xl group-hover:-translate-y-1 transition-all"
                  />
                ) : (
                  <BookCoverPlaceholder title={b.title} author={b.authors?.[0]} className="w-full aspect-[2/3] rounded-md" />
                )}
                <div className="mt-2 text-[13px] font-semibold leading-tight line-clamp-2 group-hover:text-primary">{b.title}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-1">{b.authors?.[0]}</div>
                {b.averageRating ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <StarRow rating={b.averageRating} size={10} />
                    <span className="text-[10px] text-muted-foreground numeral">{b.averageRating.toFixed(2)}</span>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════ LISTS WITH THIS BOOK ═══════════════ */}
      <Section title="Lists with this book" action={<button className="text-xs text-primary hover:underline">More lists →</button>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Best Literary Fiction of the Decade', count: 12400, votes: 8300 },
            { name: 'Books That Made Me Cry', count: 5620, votes: 3110 },
            { name: 'Quietly Devastating Novels', count: 890, votes: 612 },
          ].map((l, i) => (
            <div key={l.name} className="p-4 rounded-lg border border-border/50 bg-card/40 hover:border-primary/40 transition-colors">
              <div className="flex gap-2 mb-2">
                {shelfSuggestions.slice(i, i + 3).map((b) => (
                  b.imageLinks?.thumbnail ? (
                    <img key={b.id} src={b.imageLinks.thumbnail} alt="" className="w-10 h-14 object-cover rounded-sm" />
                  ) : <div key={b.id} className="w-10 h-14 rounded-sm bg-muted" />
                ))}
              </div>
              <div className="text-sm font-semibold text-primary hover:underline cursor-pointer line-clamp-1">{l.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{l.count.toLocaleString()} books · {l.votes.toLocaleString()} voters</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════ BOOK DETAILS & EDITIONS ═══════════════ */}
      <Section title="Book details & editions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-sm">
          {[
            ['Format', `${book.physicalFormat || (book.isEbook ? 'ebook' : 'Hardcover')}${book.pageCount ? `, ${book.pageCount} pages` : ''}`],
            ['Published', `${book.publishedDate || 'Unknown'}${book.publisher ? ` by ${book.publisher}` : ''}`],
            ['ISBN-13', book.isbn13 || '—'],
            ['ISBN-10', book.isbn10 || '—'],
            ['Language', book.language?.toUpperCase() || 'EN'],
            ['Original title', book.title],
            ['First published', editionYear ? String(editionYear) : '—'],
            ['Series', book.seriesName ? `${book.seriesName}${book.seriesPosition ? ` #${book.seriesPosition}` : ''}` : '—'],
            ['Editions', book.editionCount ? `${book.editionCount}` : '—'],
            ['Awards', book.awards?.join(', ') || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-border/20 py-2">
              <span className="text-muted-foreground">{k}</span>
              <span className="text-right text-foreground/90 font-medium">{v}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════ COMMUNITY SIGNALS ═══════════════ */}
      <Section title="Readers on this book">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ['Want to Read', book.readerStats?.wantToRead ?? Math.floor(ratingsCount * 2.4)],
            ['Currently Reading', book.readerStats?.currentlyReading ?? Math.floor(ratingsCount * 0.18)],
            ['Have Read', book.readerStats?.alreadyRead ?? ratingsCount],
            ['Avg. rating', avg.toFixed(2)],
          ].map(([k, v]) => (
            <div key={String(k)} className="p-4 rounded-lg bg-card/50 border border-border/40 text-center">
              <div className="text-2xl font-bold numeral">{typeof v === 'number' ? v.toLocaleString() : v}</div>
              <div className="text-xs text-muted-foreground mt-1">{k}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default GoodreadsBookPage;