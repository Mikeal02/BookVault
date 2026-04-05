import { useState } from 'react';
import { GraduationCap, Download, X, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { toast } from 'sonner';

interface CitationExportProps {
  books: Book[];
  onClose: () => void;
}

type CitationStyle = 'apa' | 'mla' | 'chicago';

const formatAuthorAPA = (authors: string[]): string => {
  if (!authors.length) return 'Unknown Author.';
  if (authors.length === 1) {
    const parts = authors[0].split(' ');
    if (parts.length === 1) return `${parts[0]}.`;
    const last = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(n => `${n[0]}.`).join(' ');
    return `${last}, ${initials}`;
  }
  const formatted = authors.map(a => {
    const parts = a.split(' ');
    if (parts.length === 1) return parts[0];
    const last = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(n => `${n[0]}.`).join(' ');
    return `${last}, ${initials}`;
  });
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
};

const formatAuthorMLA = (authors: string[]): string => {
  if (!authors.length) return 'Unknown Author.';
  if (authors.length === 1) {
    const parts = authors[0].split(' ');
    if (parts.length === 1) return `${parts[0]}.`;
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(' ');
    return `${last}, ${first}`;
  }
  const parts0 = authors[0].split(' ');
  const first = parts0.length > 1
    ? `${parts0[parts0.length - 1]}, ${parts0.slice(0, -1).join(' ')}`
    : parts0[0];
  if (authors.length === 2) return `${first}, and ${authors[1]}`;
  return `${first}, et al.`;
};

const formatAuthorChicago = (authors: string[]): string => {
  if (!authors.length) return 'Unknown Author.';
  if (authors.length === 1) {
    const parts = authors[0].split(' ');
    if (parts.length === 1) return `${parts[0]}.`;
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(' ');
    return `${last}, ${first}`;
  }
  const parts0 = authors[0].split(' ');
  const firstAuthor = parts0.length > 1
    ? `${parts0[parts0.length - 1]}, ${parts0.slice(0, -1).join(' ')}`
    : parts0[0];
  if (authors.length === 2) return `${firstAuthor}, and ${authors[1]}`;
  return `${firstAuthor}, ${authors.slice(1, -1).join(', ')}, and ${authors[authors.length - 1]}`;
};

const getYear = (book: Book): string => {
  if (book.publishedDate) {
    const match = book.publishedDate.match(/\d{4}/);
    if (match) return match[0];
  }
  return 'n.d.';
};

const generateCitation = (book: Book, style: CitationStyle): string => {
  const year = getYear(book);
  const authors = book.authors || [];
  const title = book.title || 'Untitled';
  const publisher = book.publisher || '';

  switch (style) {
    case 'apa':
      return `${formatAuthorAPA(authors)} (${year}). *${title}*.${publisher ? ` ${publisher}.` : ''}`;
    case 'mla':
      return `${formatAuthorMLA(authors)}. *${title}*.${publisher ? ` ${publisher},` : ''} ${year === 'n.d.' ? '' : year}.`.replace(/\.\./g, '.').trim();
    case 'chicago':
      return `${formatAuthorChicago(authors)}. *${title}*.${publisher ? ` ${publisher},` : ''} ${year === 'n.d.' ? '' : year}.`.replace(/\.\./g, '.').trim();
  }
};

const generatePlainCitation = (book: Book, style: CitationStyle): string => {
  return generateCitation(book, style).replace(/\*/g, '');
};

export const CitationExport = ({ books, onClose }: CitationExportProps) => {
  const [style, setStyle] = useState<CitationStyle>('apa');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const eligibleBooks = books.filter(b => b.title && b.authors?.length);

  const copyToClipboard = () => {
    const text = eligibleBooks.map(b => generatePlainCitation(b, style)).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Citations copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const exportFile = () => {
    if (!eligibleBooks.length) {
      toast.error('No books with author data to cite');
      return;
    }
    setExporting(true);
    try {
      const header = `Bibliography — ${style.toUpperCase()} Format\nGenerated ${new Date().toLocaleDateString()}\n${'─'.repeat(50)}\n\n`;
      const sorted = [...eligibleBooks].sort((a, b) => {
        const aAuth = (a.authors?.[0] || '').split(' ').pop() || '';
        const bAuth = (b.authors?.[0] || '').split(' ').pop() || '';
        return aAuth.localeCompare(bAuth);
      });
      const citations = sorted.map(b => generatePlainCitation(b, style)).join('\n\n');
      const content = header + citations;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bibliography-${style}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Bibliography exported!');
      onClose();
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const styles: { value: CitationStyle; label: string; desc: string }[] = [
    { value: 'apa', label: 'APA 7th', desc: 'Sciences & Social Sciences' },
    { value: 'mla', label: 'MLA 9th', desc: 'Humanities & Literature' },
    { value: 'chicago', label: 'Chicago', desc: 'History & Fine Arts' },
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in border border-border max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-border flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Citation Export</h2>
              <p className="text-xs text-muted-foreground">{eligibleBooks.length} citable books</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {eligibleBooks.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-14 h-14 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No books with author information to generate citations.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Citation Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {styles.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`p-3 rounded-xl text-center transition-all duration-200 ${
                        style === s.value
                          ? 'gradient-primary text-primary-foreground shadow-lg'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="text-sm font-semibold block">{s.label}</span>
                      <span className="text-[10px] opacity-80 block mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Preview</label>
                <div className="bg-muted/30 rounded-xl p-4 space-y-3 max-h-52 overflow-y-auto border border-border/50">
                  {eligibleBooks.slice(0, 5).map(book => (
                    <p key={book.id} className="text-xs text-foreground/80 leading-relaxed font-mono"
                       dangerouslySetInnerHTML={{
                         __html: generateCitation(book, style)
                           .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                       }}
                    />
                  ))}
                  {eligibleBooks.length > 5 && (
                    <p className="text-xs text-muted-foreground italic">
                      ...and {eligibleBooks.length - 5} more
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" className="flex-1 text-xs">
                  {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                  {copied ? 'Copied!' : 'Copy All'}
                </Button>
                <Button onClick={exportFile} disabled={exporting} className="flex-1 gradient-primary text-primary-foreground text-xs">
                  {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                  Export .txt
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
