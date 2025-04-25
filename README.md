# SalesFlow CRM (Next.js)

This is a Next.js CRM application bootstrapped for Firebase Studio, designed for managing clients, quotations, and reminders.

## Features

-   **Client Management**: Add, view, edit, delete client details and requirements.
-   **Quotation Management**: Create, view, edit, delete quotations linked to clients.
-   **Reminder System**: Schedule reminders for client follow-ups and meetings (Note: Actual notification sending via email/WhatsApp requires additional setup and external services).
-   **Client Prioritization**: Filter clients based on priority timelines (1 month, 2 months, 3 months).
-   **Dashboard**: Overview of key metrics and recent activities.

## Tech Stack

-   **Framework**: Next.js (App Router)
-   **UI**: React, TypeScript
-   **Styling**: Tailwind CSS, shadcn/ui
-   **State Management**: React Query (`@tanstack/react-query`) for server state
-   **Database**: Vercel KV (Serverless Redis)
-   **Deployment**: Vercel

## Getting Started

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm, yarn, or pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  Set up Environment Variables:
    *   Copy the example environment file: `cp .env.example .env.local`
    *   You'll need to set up Vercel KV for database storage. Follow the steps below.
    *   Fill in the required Vercel KV variables in `.env.local`:
        ```dotenv
        # Vercel KV (Required for Database)
        KV_URL=
        KV_REST_API_URL=
        KV_REST_API_TOKEN=
        KV_REST_API_READ_ONLY_TOKEN=

        # Google AI (Optional - for Genkit features if used)
        # GOOGLE_GENAI_API_KEY=
        ```

### Setting up Vercel KV

1.  **Create a Vercel Account**: If you don't have one, sign up at [vercel.com](https://vercel.com/).
2.  **Create a KV Database**:
    *   Go to your Vercel Dashboard.
    *   Navigate to the "Storage" tab.
    *   Click "Create Database" and choose "KV (Serverless Redis)".
    *   Select a region and give your database a name (e.g., `salesflow-crm-kv`).
    *   Click "Create".
3.  **Connect to Your Project**:
    *   After creation, Vercel will provide options to connect the database to your project. You can connect it directly if you've already linked your Git repository to Vercel, or copy the environment variables manually.
    *   Copy the `.env.local` variables provided by Vercel and paste them into your local `.env.local` file.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:9002](http://localhost:9002) (or the specified port) with your browser to see the result.

## Backend Implementation (API Routes)

The backend logic is implemented using Next.js API Routes, which run Node.js on the server. These routes handle CRUD operations for clients, quotations, and reminders, interacting with the Vercel KV database.

-   `/src/app/api/clients/...`
-   `/src/app/api/quotations/...`
-   `/src/app/api/reminders/...`

Data fetching and mutations on the frontend are handled using `@tanstack/react-query`.

## Deployment on Vercel

This application is optimized for deployment on Vercel.

1.  **Push to Git**: Ensure your code is pushed to a Git repository (GitHub, GitLab, Bitbucket).
2.  **Import Project on Vercel**:
    *   Go to your Vercel Dashboard.
    *   Click "Add New..." -> "Project".
    *   Import the Git repository containing your project.
3.  **Configure Project**:
    *   Vercel should automatically detect it as a Next.js project.
    *   **Environment Variables**: Go to the project settings -> "Environment Variables". Add the same Vercel KV variables (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`) that are in your `.env.local`. Ensure these are set for "Production", "Preview", and "Development" environments as needed. If you connected the KV database directly in the Vercel UI, these might already be configured.
    *   **(Optional) Google AI API Key**: If using Genkit features, add `GOOGLE_GENAI_API_KEY` as well.
4.  **Deploy**: Click "Deploy". Vercel will build and deploy your application.

You'll get a unique URL for your deployed CRM.

## Folder Structure

```
.
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages and API routes
│   │   ├── api/         # Backend API routes
│   │   │   ├── clients/
│   │   │   ├── quotations/
│   │   │   └── reminders/
│   │   ├── (main)/      # Main application routes (using layout groups)
│   │   │   ├── clients/
│   │   │   ├── dashboard/
│   │   │   ├── quotations/
│   │   │   ├── reminders/
│   │   │   └── settings/
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Root page (usually redirects or dashboard)
│   │   └── globals.css  # Global styles
│   ├── components/      # Reusable UI components
│   │   ├── clients/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── quotations/
│   │   ├── reminders/
│   │   └── ui/          # Shadcn UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions, constants, lib setup
│   ├── services/        # Client-side data fetching/mutation functions
│   └── types/           # TypeScript type definitions
├── .env.local           # Local environment variables (ignored by git)
├── .env.example         # Example environment variables
├── next.config.ts       # Next.js configuration
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── tailwind.config.ts   # Tailwind CSS configuration
```

## Key Components & Logic

-   **Data Storage**: Vercel KV is used as a simple key-value store. Data is stored under keys like `clients`, `quotations`, `reminders`. Each key holds an array of the respective objects.
-   **API Routes**: Handle requests from the frontend, perform operations on Vercel KV, and return JSON responses.
-   **Server Actions**: While not heavily used in this iteration (API routes are primary), Next.js Server Actions could be an alternative for form submissions.
-   **React Query**: Manages server state, caching, background updates, and mutations for a smoother UX.
-   **Shadcn UI**: Provides pre-built, accessible UI components styled with Tailwind CSS.
