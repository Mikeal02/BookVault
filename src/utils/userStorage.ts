
export interface UserData {
  username: string;
  bookshelf: any[];
  preferences: any;
  goals: any[];
  onboardingCompleted: boolean;
}

export const UserStorage = {
  // Get all users
  getAllUsers(): string[] {
    const users = localStorage.getItem('bookapp_all_users');
    return users ? JSON.parse(users) : [];
  },

  // Add a new user to the list
  addUser(username: string): void {
    const users = this.getAllUsers();
    if (!users.includes(username)) {
      users.push(username);
      localStorage.setItem('bookapp_all_users', JSON.stringify(users));
    }
  },

  // Get current user
  getCurrentUser(): string | null {
    return localStorage.getItem('bookapp_current_user');
  },

  // Set current user
  setCurrentUser(username: string): void {
    localStorage.setItem('bookapp_current_user', username);
    this.addUser(username);
  },

  // Get user-specific data
  getUserData(username: string, key: string): any {
    const data = localStorage.getItem(`bookapp_${username}_${key}`);
    return data ? JSON.parse(data) : null;
  },

  // Set user-specific data
  setUserData(username: string, key: string, value: any): void {
    localStorage.setItem(`bookapp_${username}_${key}`, JSON.stringify(value));
  },

  // Get bookshelf for user
  getUserBookshelf(username: string): any[] {
    return this.getUserData(username, 'shelf') || [];
  },

  // Set bookshelf for user
  setUserBookshelf(username: string, bookshelf: any[]): void {
    this.setUserData(username, 'shelf', bookshelf);
  },

  // Get user preferences
  getUserPreferences(username: string): any {
    return this.getUserData(username, 'preferences') || {};
  },

  // Set user preferences
  setUserPreferences(username: string, preferences: any): void {
    this.setUserData(username, 'preferences', preferences);
  },

  // Get user goals
  getUserGoals(username: string): any[] {
    return this.getUserData(username, 'goals') || [];
  },

  // Set user goals
  setUserGoals(username: string, goals: any[]): void {
    this.setUserData(username, 'goals', goals);
  },

  // Check if user completed onboarding
  hasCompletedOnboarding(username: string): boolean {
    return this.getUserData(username, 'onboarding_completed') === true;
  },

  // Set onboarding completion
  setOnboardingCompleted(username: string): void {
    this.setUserData(username, 'onboarding_completed', true);
  },

  // Get all user data
  getAllUserData(username: string): UserData {
    return {
      username,
      bookshelf: this.getUserBookshelf(username),
      preferences: this.getUserPreferences(username),
      goals: this.getUserGoals(username),
      onboardingCompleted: this.hasCompletedOnboarding(username)
    };
  },

  // Clear user data
  clearUserData(username: string): void {
    const keys = ['shelf', 'preferences', 'goals', 'onboarding_completed'];
    keys.forEach(key => {
      localStorage.removeItem(`bookapp_${username}_${key}`);
    });
  },

  // Switch user (migrate old data if needed)
  switchUser(newUsername: string): void {
    // Migrate old data format to new format if it exists
    this.migrateOldData(newUsername);
    this.setCurrentUser(newUsername);
  },

  // Migrate old localStorage format to user-specific format
  migrateOldData(username: string): void {
    const oldKeys = [
      { old: 'bookapp_shelf', new: 'shelf' },
      { old: 'bookapp_user_preferences', new: 'preferences' },
      { old: 'bookapp_goals', new: 'goals' },
      { old: 'bookapp_onboarding_completed', new: 'onboarding_completed' }
    ];

    oldKeys.forEach(({ old, new: newKey }) => {
      const oldData = localStorage.getItem(old);
      if (oldData && !this.getUserData(username, newKey)) {
        localStorage.setItem(`bookapp_${username}_${newKey}`, oldData);
      }
    });
  }
};

// Create some sample users with different data
export const createSampleUsers = () => {
  const sampleUsers = [
    {
      username: 'Alice Johnson',
      bookshelf: [
        {
          id: 'alice-1',
          title: 'The Great Gatsby',
          authors: ['F. Scott Fitzgerald'],
          description: 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
          publishedDate: '1925-04-10',
          pageCount: 180,
          categories: ['Fiction', 'Classics'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'finished',
          personalRating: 5,
          dateFinished: '2024-01-15',
          myThoughts: 'A masterpiece of American literature. The symbolism and prose are absolutely beautiful.',
          notes: 'Reread this for book club discussion',
          tags: ['classics', 'american-literature', 'book-club'],
          timeSpentReading: 320
        },
        {
          id: 'alice-2',
          title: 'To Kill a Mockingbird',
          authors: ['Harper Lee'],
          description: 'A gripping tale of racial injustice and childhood in the American South.',
          publishedDate: '1960-07-11',
          pageCount: 376,
          categories: ['Fiction', 'Classics'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'reading',
          readingProgress: 65,
          currentPage: 244,
          personalRating: 4,
          myThoughts: 'Powerful story about justice and morality. Scout is such a compelling narrator.',
          tags: ['classics', 'social-justice'],
          timeSpentReading: 180
        },
        {
          id: 'alice-3',
          title: 'Atomic Habits',
          authors: ['James Clear'],
          description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
          publishedDate: '2018-10-16',
          pageCount: 320,
          categories: ['Self-Help', 'Psychology'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'not-read',
          tags: ['productivity', 'self-improvement'],
          notes: 'Recommended by John from work'
        }
      ],
      goals: [
        {
          id: '1',
          type: 'books',
          target: 24,
          current: 8,
          year: 2024,
          title: 'Read 24 books this year'
        }
      ]
    },
    {
      username: 'Bob Smith',
      bookshelf: [
        {
          id: 'bob-1',
          title: '1984',
          authors: ['George Orwell'],
          description: 'A dystopian social science fiction novel about totalitarian control.',
          publishedDate: '1949-06-08',
          pageCount: 328,
          categories: ['Fiction', 'Dystopian', 'Science Fiction'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'finished',
          personalRating: 5,
          dateFinished: '2024-02-20',
          myThoughts: 'Terrifyingly relevant today. Orwell was a prophet.',
          notes: 'Big Brother is watching - chilling concept',
          tags: ['dystopian', 'political', 'classics'],
          timeSpentReading: 400
        },
        {
          id: 'bob-2',
          title: 'Dune',
          authors: ['Frank Herbert'],
          description: 'A science fiction epic about politics, religion, and ecology on a desert planet.',
          publishedDate: '1965-08-01',
          pageCount: 688,
          categories: ['Science Fiction', 'Fantasy'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'reading',
          readingProgress: 45,
          currentPage: 310,
          personalRating: 4,
          myThoughts: 'Complex world-building, but worth the effort. Paul\'s journey is fascinating.',
          tags: ['sci-fi', 'epic', 'complex'],
          timeSpentReading: 520
        },
        {
          id: 'bob-3',
          title: 'The Martian',
          authors: ['Andy Weir'],
          description: 'A stranded astronaut must survive alone on Mars using science and ingenuity.',
          publishedDate: '2011-02-11',
          pageCount: 369,
          categories: ['Science Fiction', 'Thriller'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'finished',
          personalRating: 5,
          dateFinished: '2024-03-10',
          myThoughts: 'Hilarious and scientifically accurate. Watney is such a great character.',
          tags: ['sci-fi', 'humor', 'space'],
          timeSpentReading: 280
        }
      ],
      goals: [
        {
          id: '2',
          type: 'pages',
          target: 10000,
          current: 3500,
          year: 2024,
          title: 'Read 10,000 pages'
        }
      ]
    },
    {
      username: 'Carol Davis',
      bookshelf: [
        {
          id: 'carol-1',
          title: 'Pride and Prejudice',
          authors: ['Jane Austen'],
          description: 'A romantic novel of manners set in Georgian England.',
          publishedDate: '1813-01-28',
          pageCount: 432,
          categories: ['Fiction', 'Romance', 'Classics'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'finished',
          personalRating: 5,
          dateFinished: '2024-03-10',
          myThoughts: 'Elizabeth Bennet is one of my favorite heroines. Austen\'s wit is unmatched.',
          notes: 'Third time reading this - never gets old',
          tags: ['romance', 'classics', 'austen'],
          timeSpentReading: 380
        },
        {
          id: 'carol-2',
          title: 'The Seven Husbands of Evelyn Hugo',
          authors: ['Taylor Jenkins Reid'],
          description: 'Reclusive Hollywood icon Evelyn Hugo finally tells her life story.',
          publishedDate: '2017-06-13',
          pageCount: 400,
          categories: ['Fiction', 'Contemporary'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'reading',
          readingProgress: 80,
          currentPage: 320,
          personalRating: 5,
          myThoughts: 'Absolutely captivating! The plot twists are incredible.',
          tags: ['contemporary', 'hollywood', 'lgbtq'],
          timeSpentReading: 240
        },
        {
          id: 'carol-3',
          title: 'Where the Crawdads Sing',
          authors: ['Delia Owens'],
          description: 'A mystery and coming-of-age story set in the marshes of North Carolina.',
          publishedDate: '2018-08-14',
          pageCount: 384,
          categories: ['Fiction', 'Mystery'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'finished',
          personalRating: 4,
          dateFinished: '2024-01-28',
          myThoughts: 'Beautiful nature writing, though the ending was controversial.',
          tags: ['mystery', 'nature', 'coming-of-age'],
          timeSpentReading: 350
        }
      ],
      goals: []
    },
    {
      username: 'David Wilson',
      bookshelf: [
        {
          id: 'david-1',
          title: 'The Psychology of Money',
          authors: ['Morgan Housel'],
          description: 'Timeless lessons on wealth, greed, and happiness from the perspective of psychology.',
          publishedDate: '2020-09-08',
          pageCount: 256,
          categories: ['Business', 'Psychology', 'Finance'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'finished',
          personalRating: 5,
          dateFinished: '2024-02-15',
          myThoughts: 'Eye-opening insights about financial behavior. Changed my perspective on money.',
          notes: 'Take notes for investment strategy',
          tags: ['finance', 'psychology', 'investing'],
          timeSpentReading: 200
        },
        {
          id: 'david-2',
          title: 'Sapiens',
          authors: ['Yuval Noah Harari'],
          description: 'A brief history of humankind from the Stone Age to the present.',
          publishedDate: '2011-01-01',
          pageCount: 443,
          categories: ['History', 'Anthropology', 'Science'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'reading',
          readingProgress: 30,
          currentPage: 133,
          personalRating: 4,
          myThoughts: 'Fascinating perspective on human evolution and society.',
          tags: ['history', 'anthropology', 'thought-provoking'],
          timeSpentReading: 150
        }
      ],
      goals: [
        {
          id: '3',
          type: 'books',
          target: 12,
          current: 4,
          year: 2024,
          title: 'Read 1 book per month'
        }
      ]
    },
    {
      username: 'Emma Thompson',
      bookshelf: [
        {
          id: 'emma-1',
          title: 'The Silent Patient',
          authors: ['Alex Michaelides'],
          description: 'A psychological thriller about a woman who refuses to speak after allegedly murdering her husband.',
          publishedDate: '2019-02-05',
          pageCount: 336,
          categories: ['Thriller', 'Mystery', 'Psychology'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'finished',
          personalRating: 5,
          dateFinished: '2024-03-05',
          myThoughts: 'Mind-blowing twist! Didn\'t see it coming at all.',
          tags: ['thriller', 'psychological', 'plot-twist'],
          timeSpentReading: 250
        },
        {
          id: 'emma-2',
          title: 'Gone Girl',
          authors: ['Gillian Flynn'],
          description: 'A psychological thriller about a husband who becomes the prime suspect in his wife\'s disappearance.',
          publishedDate: '2012-06-05',
          pageCount: 419,
          categories: ['Thriller', 'Mystery', 'Fiction'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'reading',
          readingProgress: 55,
          currentPage: 230,
          personalRating: 4,
          myThoughts: 'Disturbing but brilliant. Both characters are so complex.',
          tags: ['thriller', 'psychological', 'dark'],
          timeSpentReading: 180
        },
        {
          id: 'emma-3',
          title: 'The Girl with the Dragon Tattoo',
          authors: ['Stieg Larsson'],
          description: 'A journalist and a hacker investigate a wealthy family\'s dark secrets.',
          publishedDate: '2005-08-01',
          pageCount: 672,
          categories: ['Thriller', 'Mystery', 'Crime'],
          imageLinks: { thumbnail: '/placeholder.svg' },
          readingStatus: 'not-read',
          tags: ['thriller', 'nordic-noir', 'crime'],
          notes: 'Start of the Millennium series'
        }
      ],
      goals: [
        {
          id: '4',
          type: 'books',
          target: 36,
          current: 12,
          year: 2024,
          title: 'Challenge: 36 books this year'
        }
      ]
    }
  ];

  sampleUsers.forEach(user => {
    UserStorage.setUserBookshelf(user.username, user.bookshelf);
    UserStorage.setUserGoals(user.username, user.goals);
    UserStorage.setOnboardingCompleted(user.username);
  });
};
