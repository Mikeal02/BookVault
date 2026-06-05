
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  description?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  printedPageCount?: number;
  categories?: string[];
  mainCategory?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  averageRating?: number;
  ratingsCount?: number;
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
  webReaderLink?: string;
  // Purchase links
  buyLinks?: {
    googlePlay?: string;
    amazon?: string;
    barnes?: string;
  };
  buyLink?: string;
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
  country?: string;
  // Access permissions (Google accessInfo)
  viewability?: 'PARTIAL' | 'ALL_PAGES' | 'NO_PAGES' | 'UNKNOWN';
  embeddable?: boolean;
  publicDomain?: boolean;
  textToSpeechAllowed?: boolean;
  quoteSharingAllowed?: boolean;
  readingModes?: { text?: boolean; image?: boolean };
  printType?: 'BOOK' | 'MAGAZINE';
  contentVersion?: string;
  panelizationSummary?: { containsEpubBubbles?: boolean; containsImageBubbles?: boolean };
  // Content previews
  textSnippet?: string;
  firstSentence?: string;
  maturityRating?: 'NOT_MATURE' | 'MATURE';
  readingDifficulty?: 'easy' | 'moderate' | 'advanced';
  isbn10?: string;
  isbn13?: string;
  otherIdentifiers?: Array<{ type: string; identifier: string }>;
  // Subjects / rich categories
  subjects?: string[];
  subjectPlaces?: string[];
  subjectPeople?: string[];
  subjectTimes?: string[];
  // Physical edition data (Open Library editions)
  physicalFormat?: string;
  physicalDimensions?: string;
  weight?: string;
  pagination?: string;
  publishPlaces?: string[];
  contributors?: Array<{ name: string; role?: string }>;
  byStatement?: string;
  copyrightDate?: string;
  firstPublishDate?: string;
  // Classifications
  deweyDecimal?: string[];
  lcClassifications?: string[];
  // Long-form content
  tableOfContents?: Array<{ title: string; level?: number; pagenum?: string; label?: string }>;
  excerpts?: Array<{ text: string; comment?: string; author?: string }>;
  externalLinks?: Array<{ title: string; url: string }>;
  coverIds?: number[];
  latestRevision?: number;
  revisionCount?: number;
  // Detailed ratings
  ratingsHistogram?: { 1: number; 2: number; 3: number; 4: number; 5: number };
  // Open Library reading log stats
  readerStats?: { wantToRead: number; currentlyReading: number; alreadyRead: number };
  // Author enrichment
  authorBio?: string;
  authorBirthDate?: string;
  authorWikipediaUrl?: string;
  authorDeathDate?: string;
  authorPhotoUrl?: string;
  authorAlternateNames?: string[];
  authorPersonalName?: string;
  authorTopWork?: string;
  authorWorkCount?: number;
  authorLinks?: Array<{ title: string; url: string }>;
  // Provenance & accuracy
  originalPublicationYear?: number;
  wordCountEstimate?: number;
  translationCount?: number;
  awards?: string[];
  wikipediaUrl?: string;
  /** Confidence of the enriched record (0..1). */
  dataConfidence?: number;
  /** Sources we successfully merged data from. */
  dataSources?: Array<'google' | 'openlibrary' | 'wikipedia'>;
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
