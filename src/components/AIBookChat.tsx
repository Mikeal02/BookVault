import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader2, Sparkles, BookOpen, MessageSquare, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIBookChatProps {
  books: Book[];
  onClose: () => void;
}

type ChatMode = 'chat' | 'summary' | 'recommend' | 'analyze';

// Parse markdown-like formatting to JSX
const formatAIResponse = (content: string) => {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let blockquoteLines: string[] = [];

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      elements.push(
        <ListTag key={elements.length} className={listType === 'ul' ? 'list-disc pl-5 space-y-1 mb-3' : 'list-decimal pl-5 space-y-1 mb-3'}>
          {listItems.map((item, i) => (
            <li key={i} className="text-sm">{formatInlineText(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote key={elements.length} className="border-l-4 border-primary/50 pl-4 py-2 my-3 italic bg-secondary/50 rounded-r-lg">
          {blockquoteLines.map((line, i) => (
            <p key={i} className="text-sm">{formatInlineText(line)}</p>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
    }
  };

  const formatInlineText = (text: string): JSX.Element => {
    // Handle **bold**, *italic*, `code`, and ==highlight==
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Check for bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Check for italic *text*
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
      // Check for code `text`
      const codeMatch = remaining.match(/`([^`]+)`/);
      // Check for highlight ==text==
      const highlightMatch = remaining.match(/==(.+?)==/);

      const matches = [
        { type: 'bold', match: boldMatch },
        { type: 'italic', match: italicMatch },
        { type: 'code', match: codeMatch },
        { type: 'highlight', match: highlightMatch }
      ].filter(m => m.match !== null)
       .sort((a, b) => (a.match!.index || 0) - (b.match!.index || 0));

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      const first = matches[0];
      const match = first.match!;
      const index = match.index || 0;

      if (index > 0) {
        parts.push(remaining.substring(0, index));
      }

      switch (first.type) {
        case 'bold':
          parts.push(<strong key={key++} className="font-semibold text-primary">{match[1]}</strong>);
          break;
        case 'italic':
          parts.push(<em key={key++} className="italic text-muted-foreground">{match[1]}</em>);
          break;
        case 'code':
          parts.push(<code key={key++} className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono">{match[1]}</code>);
          break;
        case 'highlight':
          parts.push(<span key={key++} className="bg-highlight/30 px-1 py-0.5 rounded font-medium">{match[1]}</span>);
          break;
      }

      remaining = remaining.substring(index + match[0].length);
    }

    return <>{parts}</>;
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Handle blockquotes
    if (trimmedLine.startsWith('>')) {
      flushList();
      blockquoteLines.push(trimmedLine.substring(1).trim());
      return;
    } else {
      flushBlockquote();
    }

    // Handle headers
    if (trimmedLine.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={elements.length} className="text-base font-bold mt-4 mb-2 text-foreground flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          {formatInlineText(trimmedLine.substring(4))}
        </h3>
      );
      return;
    }
    if (trimmedLine.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={elements.length} className="text-lg font-bold mt-4 mb-2 text-foreground flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary rounded-full"></span>
          {formatInlineText(trimmedLine.substring(3))}
        </h2>
      );
      return;
    }
    if (trimmedLine.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={elements.length} className="text-xl font-bold mt-4 mb-2 text-foreground flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          {formatInlineText(trimmedLine.substring(2))}
        </h1>
      );
      return;
    }

    // Handle horizontal rule
    if (trimmedLine === '---' || trimmedLine === '***') {
      flushList();
      elements.push(<hr key={elements.length} className="my-4 border-border" />);
      return;
    }

    // Handle unordered lists
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(trimmedLine.substring(2));
      return;
    }

    // Handle ordered lists
    const orderedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(orderedMatch[1]);
      return;
    }

    // Handle regular paragraphs
    flushList();
    if (trimmedLine.length > 0) {
      // Check for special sections
      if (trimmedLine.toLowerCase().includes('tip:') || trimmedLine.toLowerCase().includes('💡')) {
        elements.push(
          <div key={elements.length} className="bg-accent/10 border-l-4 border-accent px-4 py-3 rounded-r-lg mb-3">
            <p className="text-sm">{formatInlineText(trimmedLine)}</p>
          </div>
        );
      } else if (trimmedLine.toLowerCase().includes('note:') || trimmedLine.toLowerCase().includes('📝')) {
        elements.push(
          <div key={elements.length} className="bg-primary/10 border-l-4 border-primary px-4 py-3 rounded-r-lg mb-3">
            <p className="text-sm">{formatInlineText(trimmedLine)}</p>
          </div>
        );
      } else {
        elements.push(
          <p key={elements.length} className="mb-3 text-sm leading-relaxed">
            {formatInlineText(trimmedLine)}
          </p>
        );
      }
    }
  });

  flushList();
  flushBlockquote();

  return elements;
};

export const AIBookChat = ({ books, onClose }: AIBookChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBooksContext = () => {
    return books.map(b => ({
      title: b.title,
      authors: b.authors,
      status: b.readingStatus,
      rating: b.personalRating,
      notes: b.notes,
      myThoughts: b.myThoughts,
      categories: b.categories
    }));
  };

  const getModePrompt = () => {
    const booksContext = JSON.stringify(getBooksContext(), null, 2);
    
    const formattingInstructions = `
Format your responses using markdown:
- Use **bold** for important terms and book titles
- Use bullet points for lists
- Use headers (## or ###) for sections
- Use > for quotes
- Use ==text== to highlight key insights
- Keep responses well-structured and scannable
`;

    switch (mode) {
      case 'summary':
        return `You are a helpful book assistant. Based on the user's library, provide concise summaries and insights about their books. ${formattingInstructions} Library: ${booksContext}`;
      case 'recommend':
        return `You are a book recommendation expert. Based on the user's reading history and preferences, suggest new books they might enjoy. Be specific and explain why each recommendation fits. ${formattingInstructions} Library: ${booksContext}`;
      case 'analyze':
        return `You are a reading analyst. Analyze the user's notes and thoughts about their books to provide insights about their reading patterns, themes they enjoy, and how their reading journey has evolved. ${formattingInstructions} Library: ${booksContext}`;
      default:
        return `You are a friendly book companion. Help users discuss their books, answer questions about literature, and provide insights. Be conversational and helpful. ${formattingInstructions} User's library: ${booksContext}`;
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-book-chat', {
        body: {
          messages: [...messages, userMessage],
          systemPrompt: getModePrompt(),
          mode
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Sorry, I could not generate a response.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { mode: 'summary' as ChatMode, icon: BookOpen, label: 'Summarize a book', prompt: 'Give me a summary of my most recently added book' },
    { mode: 'recommend' as ChatMode, icon: Sparkles, label: 'Get recommendations', prompt: 'Based on my library, what books should I read next?' },
    { mode: 'analyze' as ChatMode, icon: Lightbulb, label: 'Analyze my reading', prompt: 'Analyze my reading patterns and preferences' },
    { mode: 'chat' as ChatMode, icon: MessageSquare, label: 'Just chat', prompt: "What are some interesting things about the books I've read?" }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
      <div className="bg-background rounded-xl sm:rounded-2xl max-w-2xl w-full h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden border border-border">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">AI Book Assistant</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-2 sm:p-3 border-b border-border flex gap-1.5 sm:gap-2 overflow-x-auto bg-muted/30">
          {[
            { value: 'chat', label: 'Chat', icon: MessageSquare },
            { value: 'summary', label: 'Summaries', icon: BookOpen },
            { value: 'recommend', label: 'Recommendations', icon: Sparkles },
            { value: 'analyze', label: 'Analysis', icon: Lightbulb }
          ].map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value as ChatMode)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                mode === m.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <m.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-muted/10">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-secondary rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">
                How can I help you today?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md">
                I can summarize books, give recommendations, analyze your reading patterns, or just chat about literature.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-md">
                {quickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setMode(action.mode);
                      sendMessage(action.prompt);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-card rounded-lg sm:rounded-xl text-left hover:bg-muted transition-colors border border-border hover:border-primary/30 hover:shadow-sm"
                  >
                    <action.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground truncate">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm sm:rounded-br-md'
                      : 'bg-card text-foreground rounded-bl-sm sm:rounded-bl-md border border-border shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="ai-response text-xs sm:text-sm">
                      {formatAIResponse(msg.content)}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-2 sm:gap-3 justify-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-sm">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="bg-card p-3 sm:p-4 rounded-xl sm:rounded-2xl rounded-bl-sm sm:rounded-bl-md border border-border shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t border-border bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your books..."
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-muted border border-border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground text-xs sm:text-sm"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg sm:rounded-xl"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};