
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
  // === Enhanced metadata ===
  // Series & related works
  seriesName?: string;
  seriesPosition?: number;
  editionCount?: number;
  relatedWorkIds?: string[];
  // Availability & pricing
  isEbook?: boolean;
  hasEpub?: boolean;
  hasPdf?: boolean;
  listPrice?: { amount: number; currencyCode: string };
  retailPrice?: { amount: number; currencyCode: string };
  saleability?: 'FOR_SALE' | 'FREE' | 'NOT_FOR_SALE' | 'FOR_PREORDER';
  freeReading?: boolean; // Open Library borrow
  // Content previews
  textSnippet?: string;
  firstSentence?: string;
  maturityRating?: 'NOT_MATURE' | 'MATURE';
  readingDifficulty?: 'easy' | 'moderate' | 'advanced';
  isbn10?: string;
  isbn13?: string;
  // Subjects / rich categories
  subjects?: string[];
  subjectPlaces?: string[];
  subjectPeople?: string[];
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
  vaultId?: string;
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
    maturityRating?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    seriesInfo?: {
      bookDisplayNumber?: string;
      shortSeriesBookTitle?: string;
    };
  };
  saleInfo?: {
    buyLink?: string;
    saleability?: string;
    isEbook?: boolean;
    listPrice?: { amount: number; currencyCode: string };
    retailPrice?: { amount: number; currencyCode: string };
    epub?: { isAvailable: boolean };
    pdf?: { isAvailable: boolean };
  };
  searchInfo?: {
    textSnippet?: string;
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
