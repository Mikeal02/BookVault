import { useState } from 'react';
import { FileText, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { toast } from 'sonner';

interface NotesExportProps {
  books: Book[];
  onClose: () => void;
}

export const NotesExport = ({ books, onClose }: NotesExportProps) => {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'txt' | 'markdown' | 'json'>('txt');

  const booksWithNotes = books.filter(book => book.notes || book.myThoughts);

  const generateExport = () => {
    if (booksWithNotes.length === 0) {
      toast.error('No notes to export');
      return;
    }

    setExporting(true);

    try {
      let content = '';
      let filename = '';
      let mimeType = '';

      if (format === 'txt') {
        content = generateTextExport();
        filename = 'bookvault-notes.txt';
        mimeType = 'text/plain';
      } else if (format === 'markdown') {
        content = generateMarkdownExport();
        filename = 'bookvault-notes.md';
        mimeType = 'text/markdown';
      } else {
        content = generateJsonExport();
        filename = 'bookvault-notes.json';
        mimeType = 'application/json';
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Notes exported successfully!');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export notes');
    } finally {
      setExporting(false);
    }
  };

  const generateTextExport = () => {
    let content = '═══════════════════════════════════════════\n';
    content += '           BOOKVAULT READING NOTES\n';
    content += `           Exported: ${new Date().toLocaleDateString()}\n`;
    content += '═══════════════════════════════════════════\n\n';

    booksWithNotes.forEach((book, index) => {
      content += `───────────────────────────────────────────\n`;
      content += `📚 ${book.title}\n`;
      content += `   by ${book.authors.join(', ')}\n`;
      content += `───────────────────────────────────────────\n\n`;

      if (book.readingStatus) {
        content += `Status: ${book.readingStatus.replace('-', ' ').toUpperCase()}\n`;
      }
      if (book.personalRating) {
        content += `My Rating: ${'★'.repeat(book.personalRating)}${'☆'.repeat(5 - book.personalRating)}\n`;
      }
      content += '\n';

      if (book.notes) {
        content += `NOTES:\n${book.notes}\n\n`;
      }

      if (book.myThoughts) {
        content += `MY THOUGHTS:\n${book.myThoughts}\n\n`;
      }

      if (book.tags && book.tags.length > 0) {
        content += `Tags: ${book.tags.join(', ')}\n`;
      }

      content += '\n';
    });

    return content;
  };

  const generateMarkdownExport = () => {
    let content = `# BookVault Reading Notes\n\n`;
    content += `> Exported on ${new Date().toLocaleDateString()}\n\n`;
    content += `---\n\n`;

    booksWithNotes.forEach(book => {
      content += `## ${book.title}\n\n`;
      content += `*by ${book.authors.join(', ')}*\n\n`;

      if (book.readingStatus || book.personalRating) {
        content += `| Property | Value |\n`;
        content += `|----------|-------|\n`;
        if (book.readingStatus) {
          content += `| Status | ${book.readingStatus.replace('-', ' ')} |\n`;
        }
        if (book.personalRating) {
          content += `| Rating | ${'⭐'.repeat(book.personalRating)} |\n`;
        }
        content += '\n';
      }

      if (book.notes) {
        content += `### Notes\n\n${book.notes}\n\n`;
      }

      if (book.myThoughts) {
        content += `### My Thoughts\n\n${book.myThoughts}\n\n`;
      }

      if (book.tags && book.tags.length > 0) {
        content += `**Tags:** ${book.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
      }

      content += `---\n\n`;
    });

    return content;
  };

  const generateJsonExport = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalBooks: booksWithNotes.length,
      notes: booksWithNotes.map(book => ({
        title: book.title,
        authors: book.authors,
        readingStatus: book.readingStatus,
        personalRating: book.personalRating,
        notes: book.notes,
        myThoughts: book.myThoughts,
        tags: book.tags,
        dateStarted: book.dateStarted,
        dateFinished: book.dateFinished
      }))
    };
    return JSON.stringify(exportData, null, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Export Notes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {booksWithNotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No notes to export. Add notes to your books first!
              </p>
            </div>
          ) : (
            <>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  📝 Found <span className="font-bold">{booksWithNotes.length}</span> books with notes
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'txt', label: 'Plain Text', icon: '📄' },
                    { value: 'markdown', label: 'Markdown', icon: '📝' },
                    { value: 'json', label: 'JSON', icon: '📊' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormat(option.value as any)}
                      className={`p-3 rounded-xl text-center transition-all duration-200 ${
                        format === option.value
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className="text-xl mb-1 block">{option.icon}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateExport}
                disabled={exporting}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Notes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
