import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Check, AlertCircle, BookOpen, X, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { toast } from 'sonner';

interface GoodreadsImportProps {
  onImportBooks: (books: Book[]) => Promise<void>;
  existingBookIds: Set<string>;
}

interface ParsedRow {
  title: string;
  author: string;
  isbn?: string;
  isbn13?: string;
  rating?: number;
  dateRead?: string;
  dateAdded?: string;
  shelves?: string;
  pageCount?: number;
  myReview?: string;
}

const parseCSV = (text: string): ParsedRow[] => {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());

  const titleIdx = headers.findIndex(h => h === 'title');
  const authorIdx = headers.findIndex(h => h === 'author' || h === 'author l-f');
  const isbnIdx = headers.findIndex(h => h === 'isbn');
  const isbn13Idx = headers.findIndex(h => h === 'isbn13');
  const ratingIdx = headers.findIndex(h => h === 'my rating');
  const dateReadIdx = headers.findIndex(h => h === 'date read');
  const dateAddedIdx = headers.findIndex(h => h === 'date added');
  const shelvesIdx = headers.findIndex(h => h === 'exclusive shelf' || h === 'bookshelves');
  const pagesIdx = headers.findIndex(h => h === 'number of pages');
  const reviewIdx = headers.findIndex(h => h === 'my review');

  if (titleIdx === -1) {
    throw new Error('Could not find "Title" column in CSV. Make sure you exported from Goodreads.');
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const title = cols[titleIdx]?.trim();
    if (!title) continue;

    rows.push({
      title,
      author: cols[authorIdx]?.trim() || 'Unknown',
      isbn: cleanIsbn(cols[isbnIdx]),
      isbn13: cleanIsbn(cols[isbn13Idx]),
      rating: ratingIdx >= 0 ? parseInt(cols[ratingIdx]) || undefined : undefined,
      dateRead: cols[dateReadIdx]?.trim() || undefined,
      dateAdded: cols[dateAddedIdx]?.trim() || undefined,
      shelves: cols[shelvesIdx]?.trim() || undefined,
      pageCount: pagesIdx >= 0 ? parseInt(cols[pagesIdx]) || undefined : undefined,
      myReview: cols[reviewIdx]?.trim() || undefined,
    });
  }
  return rows;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const cleanIsbn = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[=""\s]/g, '');
  return cleaned.length >= 10 ? cleaned : undefined;
};

const mapShelfToStatus = (shelf?: string): 'not-read' | 'reading' | 'finished' => {
  if (!shelf) return 'not-read';
  const s = shelf.toLowerCase();
  if (s.includes('read') && !s.includes('to-read') && !s.includes('currently')) return 'finished';
  if (s.includes('currently') || s.includes('reading')) return 'reading';
  return 'not-read';
};

const rowToBook = (row: ParsedRow, index: number): Book => ({
  id: `import-${row.isbn13 || row.isbn || row.title.replace(/\s/g, '-').toLowerCase()}-${index}`,
  title: row.title,
  authors: [row.author],
  pageCount: row.pageCount,
  isbn13: row.isbn13,
  personalRating: row.rating && row.rating > 0 ? row.rating : undefined,
  readingStatus: mapShelfToStatus(row.shelves),
  dateAdded: row.dateAdded || new Date().toISOString(),
  dateFinished: row.dateRead || undefined,
  myThoughts: row.myReview || undefined,
  readingProgress: mapShelfToStatus(row.shelves) === 'finished' ? 100 : 0,
});

export const GoodreadsImport = ({ onImportBooks, existingBookIds }: GoodreadsImportProps) => {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target?.result as string);
        setParsedRows(rows);
        toast.success(`Found ${rows.length} books in your export`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to parse CSV');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const books = parsedRows.map((r, i) => rowToBook(r, i)).filter(b => !existingBookIds.has(b.id));
      await onImportBooks(books);
      setImported(true);
      toast.success(`Successfully imported ${books.length} books!`);
    } catch (err) {
      toast.error('Failed to import books');
    } finally {
      setImporting(false);
    }
  };

  const newCount = parsedRows.filter((r, i) => !existingBookIds.has(rowToBook(r, i).id)).length;
  const dupCount = parsedRows.length - newCount;
  const statusCounts = {
    finished: parsedRows.filter(r => mapShelfToStatus(r.shelves) === 'finished').length,
    reading: parsedRows.filter(r => mapShelfToStatus(r.shelves) === 'reading').length,
    toRead: parsedRows.filter(r => mapShelfToStatus(r.shelves) === 'not-read').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Import Library</h2>
          <p className="text-sm text-muted-foreground mt-1">Import from Goodreads or any CSV export</p>
        </div>
      </div>

      {!parsedRows.length && !imported && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* How to export */}
          <div className="elite-card rounded-2xl p-5 mb-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
              <Download className="w-4 h-4 text-primary" />
              How to export from Goodreads
            </h3>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Go to <span className="font-medium text-foreground">goodreads.com/review/import</span></li>
              <li>Click <span className="font-medium text-foreground">"Export Library"</span></li>
              <li>Wait for the export to complete, then download the CSV</li>
              <li>Upload it below!</li>
            </ol>
          </div>

          {/* Upload area */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
              dragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border/50 hover:border-primary/30 hover:bg-muted/20'
            }`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload className={`w-10 h-10 mx-auto mb-4 transition-colors ${dragOver ? 'text-primary' : 'text-muted-foreground/40'}`} />
            <p className="text-sm font-medium text-foreground mb-1">Drop your CSV here or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports Goodreads, StoryGraph, and standard CSV formats</p>
          </div>
        </motion.div>
      )}

      {parsedRows.length > 0 && !imported && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Summary */}
          <div className="elite-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">{parsedRows.length} books found</p>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => { setParsedRows([]); setFileName(''); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-success/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-success">{newCount}</p>
                <p className="text-[10px] text-muted-foreground">New books</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-muted-foreground">{dupCount}</p>
                <p className="text-[10px] text-muted-foreground">Already in library</p>
              </div>
              <div className="bg-primary/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-primary">{statusCounts.finished}</p>
                <p className="text-[10px] text-muted-foreground">Finished</p>
              </div>
              <div className="bg-warning/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-warning">{statusCounts.reading}</p>
                <p className="text-[10px] text-muted-foreground">Reading</p>
              </div>
            </div>

            {/* Preview */}
            <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 sticky top-0">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Title</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Author</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-t border-border/30">
                      <td className="px-3 py-2 font-medium truncate max-w-[200px]">{row.title}</td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">{row.author}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          mapShelfToStatus(row.shelves) === 'finished' ? 'bg-success/10 text-success' :
                          mapShelfToStatus(row.shelves) === 'reading' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {mapShelfToStatus(row.shelves)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{row.rating && row.rating > 0 ? `${row.rating}★` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 20 && (
                <p className="text-center text-[10px] text-muted-foreground py-2">
                  ...and {parsedRows.length - 20} more
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleImport}
            disabled={importing || newCount === 0}
            className="w-full py-3 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl press-depth"
          >
            {importing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing {newCount} books...</>
            ) : newCount === 0 ? (
              'All books already in your library'
            ) : (
              <><BookOpen className="w-4 h-4 mr-2" /> Import {newCount} New Books</>
            )}
          </Button>
        </motion.div>
      )}

      {imported && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">Import Complete! 🎉</h3>
          <p className="text-sm text-muted-foreground">Your books have been added to your library.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setParsedRows([]); setImported(false); setFileName(''); }}>
            Import More
          </Button>
        </motion.div>
      )}
    </div>
  );
};
