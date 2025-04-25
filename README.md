# SalesFlow CRM (Next.js)

This is a Next.js CRM application bootstrapped for Firebase Studio, designed for managing clients, quotations, and reminders. It includes user authentication.

## Features

-   **Authentication**: User registration and login with JWT (stored in HTTP-only cookies). Protected routes using Next.js Middleware.
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
-   **Authentication**: JWT, bcrypt, Next.js Middleware
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
    *   Copy the example environment file: `cp .env.example .env` (or `.env.local`)
    *   You'll need to set up Vercel KV for database storage. Follow the steps below.
    *   Fill in the required Vercel KV variables in `.env`:
        ```dotenv
        # Vercel KV (Required for Database)
        KV_URL=
        KV_REST_API_URL=
        KV_REST_API_TOKEN=
        KV_REST_API_READ_ONLY_TOKEN=

        # Authentication (Required)
        # Generate a strong, secret key (e.g., using openssl rand -base64 32)
        JWT_SECRET=your-strong-and-secret-jwt-key-change-me

        # Google AI (Optional - for Genkit features if used)
        # GOOGLE_GENAI_API_KEY=
        ```
    *   **Important**: Replace `your-strong-and-secret-jwt-key-change-me` with a secure, randomly generated secret key for JWT signing.

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
    *   Copy the `.env` variables provided by Vercel and paste them into your local `.env` (or `.env.local`) file.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:9002](http://localhost:9002) (or the specified port) with your browser. You will be redirected to the login page if not authenticated.

## Backend Implementation (API Routes)

The backend logic is implemented using Next.js API Routes, which run Node.js on the server. These routes handle:

-   **Authentication**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
-   **CRUD Operations**: `/api/clients/...`, `/api/quotations/...`, `/api/reminders/...`

Interactions with the Vercel KV database occur within these API routes.

## Deployment on Vercel

This application is optimized for deployment on Vercel.

1.  **Push to Git**: Ensure your code is pushed to a Git repository (GitHub, GitLab, Bitbucket).
2.  **Import Project on Vercel**:
    *   Go to your Vercel Dashboard.
    *   Click "Add New..." -> "Project".
    *   Import the Git repository containing your project.
3.  **Configure Project**:
    *   Vercel should automatically detect it as a Next.js project.
    *   **Environment Variables**: Go to the project settings -> "Environment Variables".
        *   Add the same Vercel KV variables (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`) that are in your local `.env` file.
        *   **Crucially, add the `JWT_SECRET` environment variable.** Use the same secure secret key you generated for local development. **Do not commit your actual secret to Git.**
        *   Ensure these are set for "Production", "Preview", and "Development" environments as needed. If you connected the KV database directly in the Vercel UI, those variables might already be configured.
        *   **(Optional) Google AI API Key**: If using Genkit features, add `GOOGLE_GENAI_API_KEY` as well.
4.  **Deploy**: Click "Deploy". Vercel will build and deploy your application.

You'll get a unique URL for your deployed CRM. Accessing it will first take you to the login page.

## Folder Structure

```
.
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages and API routes
│   │   ├── api/         # Backend API routes
│   │   │   ├── auth/    # Authentication routes
│   │   │   ├── clients/
│   │   │   ├── quotations/
│   │   │   └── reminders/
│   │   ├── (main)/      # Main application routes (layout group)
│   │   │   ├── clients/
│   │   │   ├── dashboard/ # Now protected
│   │   │   ├── quotations/
│   │   │   ├── reminders/
│   │   │   └── settings/
│   │   ├── login/       # Login page
│   │   ├── register/    # Register page
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Root page (redirects to dashboard if logged in)
│   │   └── globals.css  # Global styles
│   ├── components/      # Reusable UI components
│   │   ├── auth/        # Auth related components (if needed)
│   │   ├── clients/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── quotations/
│   │   ├── reminders/
│   │   └── ui/          # Shadcn UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions, constants, lib setup
│   ├── middleware.ts    # Authentication middleware
│   ├── services/        # Client-side data fetching/mutation functions
│   └── types/           # TypeScript type definitions
├── .env                 # Local environment variables (ignored by git)
├── .env.example         # Example environment variables
├── next.config.ts       # Next.js configuration
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── tailwind.config.ts   # Tailwind CSS configuration
```

## Key Components & Logic

-   **Authentication**: Uses JWT stored in secure, HTTP-only cookies. `bcrypt` is used for password hashing. Next.js `middleware.ts` protects routes by verifying the JWT.
-   **Data Storage**: Vercel KV stores user data (`users` key) alongside CRM data (`clients`, `quotations`, `reminders`).
-   **API Routes**: Handle requests, interact with KV, manage authentication tokens.
-   **React Query**: Manages server state (clients, quotations, etc.) and provides caching, background updates, and mutation handling.
-   **Shadcn UI**: Provides pre-built, accessible UI components.
