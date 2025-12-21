
export interface Book {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  averageRating?: number;
  ratingsCount?: number;
  language?: string;
  previewLink?: string;
  infoLink?: string;
  // Purchase links
  buyLinks?: {
    googlePlay?: string;
    amazon?: string;
    barnes?: string;
  };
  // Personal bookshelf fields
  tags?: string[];
  notes?: string;
  readingStatus?: 'not-read' | 'reading' | 'finished';
  personalRating?: number;
  dateAdded?: string;
  dateFinished?: string;
  dateStarted?: string;
  myThoughts?: string;
  readingProgress?: number; // percentage 0-100
  timeSpentReading?: number; // minutes
  currentPage?: number;
}

export interface GoogleBookResponse {
  kind: string;
  totalItems: number;
  items: GoogleBookItem[];
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    publisher?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    averageRating?: number;
    ratingsCount?: number;
    language?: string;
    previewLink?: string;
    infoLink?: string;
  };
  saleInfo?: {
    buyLink?: string;
  };
}

export interface ReadingGoal {
  id: string;
  type: 'books' | 'pages' | 'minutes';
  target: number;
  current: number;
  year: number;
  title: string;
  deadline?: string;
}

export interface ReadingStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string;
}

export interface ReadingStats {
  totalBooks: number;
  totalPages: number;
  totalMinutes: number;
  averageRating: number;
  favoriteGenre: string;
  readingVelocity: number; // pages per day
  booksThisYear: number;
  pagesThisYear: number;
  streak: ReadingStreak;
}
