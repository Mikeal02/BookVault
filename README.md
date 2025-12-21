
# BookVault - Your Personal Reading Companion

## Project Overview

BookVault is a comprehensive web application designed to help users track their reading journey, discover new books, organize their personal library, and gain insights into their reading habits. It provides tools for managing books, setting reading goals, receiving personalized recommendations, and interacting with an AI assistant.

*   **Project Type**: Web Application
*   **Live Demo**: [https://bookvault2.netlify.app](https://bookvault2.netlify.app)

## Features

*   **User Authentication**: Secure login and sign-up powered by Supabase.
*   **Book Search & Discovery**: Search for books by title, author, or ISBN using the Google Books API.
*   **Personalized Bookshelf**: Add books to your personal library, track reading status (`To Read`, `Reading`, `Finished`), set personal ratings, and write notes or thoughts.
*   **Reading Session Tracker**: Log reading time and pages read for ongoing books to monitor progress.
*   **AI Book Assistant**: Engage with an AI assistant for book summaries, personalized recommendations, reading pattern analysis, and general literary discussions, leveraging your personal library data.
*   **Reading Statistics & Analytics**: Visualize your reading habits with dashboards, including monthly progress, genre distribution, reading streaks, and achievements.
*   **Notes Export**: Export personal notes and insights in various formats (Plain Text, Markdown, JSON).
*   **Customization**: Dark and light theme toggle for a tailored viewing experience.
*   **Onboarding Flow**: Guided setup for new users to configure reading preferences and goals.

## Tech Stack

*   **Frontend Language**: TypeScript
*   **Frontend Framework**: React
*   **Build Tool**: Vite
*   **UI Library**: shadcn/ui (built on Radix UI)
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM
*   **State Management/Data Fetching**: `@tanstack/react-query`
*   **Charting Library**: Recharts
*   **Forms**: React Hook Form with Zod for validation
*   **Notifications**: Sonner (Toasts)
*   **Backend/Database/Auth**: Supabase (used for authentication and likely for storing user book data)
*   **AI Integration**: Supabase Edge Functions (implied, as `ai-book-chat` is invoked) to an external AI model (Gemini is mentioned).

## Entry Point

The application's entry point is defined in `index.html`, which loads the main TypeScript React application from `src/main.tsx`.

## Main Responsibilities and Core Functionality

1.  **User Authentication & Authorization**: Handle user registration, login, and session management using Supabase Auth.
2.  **Book Data Management**: Allow users to perform CRUD (Create, Read, Update, Delete) operations on their personal book entries, including detailed metadata, personal notes, ratings, and reading status.
3.  **External API Integration**: Fetch book information and details from the Google Books API.
4.  **Personalized Content Generation**: Provide AI-powered book recommendations, summaries, and analytical insights tailored to the user's reading history and preferences.
5.  **Reading Progress Tracking**: Record and display user reading activities, including time spent reading and pages completed, to track progress and calculate streaks.
6.  **Data Visualization**: Present complex reading statistics and patterns through interactive charts and dashboards, helping users understand their habits.
7.  **User Interface & Experience**: Deliver a responsive, intuitive, and aesthetically pleasing user interface using modern React practices, Tailwind CSS, and shadcn/ui components.

## Setup and Running Locally

To get the project running on your local machine, ensure you have Node.js & npm installed. Using `nvm` is recommended for managing Node.js versions.

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME> # Replace <YOUR_PROJECT_NAME> with the actual directory name

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
Deployment
The project is configured for easy deployment to Netlify. Simply open Netlify and deploy your website.

Custom Domain
Yes, you can connect a custom domain. Navigate to Project > Settings > Domains in your Netlify dashboard and click "Connect Domain".

