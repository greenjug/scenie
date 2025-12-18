# Scenie GUI Builder

A modern web application for creating interactive games using the Scenie framework. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Drag & Drop Editor**: Visual game creation without coding
- **Live Preview**: Real-time preview of games as you build
- **Three-Pane Layout**: Scene management, preview, and property editing
- **User Authentication**: Secure login with Clerk.js
- **Cloud Storage**: Image and asset management with Supabase
- **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk.js
- **Database**: Supabase
- **State Management**: Zustand
- **UI Components**: Radix UI
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Clerk account
- Supabase project

### Installation

1. Clone the repository and navigate to the gui-builder directory:
```bash
cd gui-builder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your API keys:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── games/             # Game management pages
│   ├── sign-in/           # Authentication pages
│   └── sign-up/
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── store.ts          # Zustand state management
│   └── supabase.ts       # Supabase client
└── middleware.ts          # Route protection
```

## User Flow

1. **Landing Page** → User sees value proposition and features
2. **Sign Up/Sign In** → Authentication via Clerk
3. **Games Dashboard** → Grid of user's games with actions
4. **Game Editor** → Three-pane editor for creating games
5. **Preview & Publish** → Test and deploy games

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Key Components

- **Three-Pane Layout**: Main editor interface
- **Scene Tree**: Hierarchical scene management
- **Property Inspector**: Dynamic form for element properties
- **Game Preview**: Embedded iframe with live updates
- **Asset Manager**: File upload and organization

## Deployment

Deploy to Vercel for optimal performance:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

## Contributing

1. Follow the existing code style
2. Write TypeScript for all new code
3. Add tests for new features
4. Update documentation

## License

This project is part of the Scenie framework ecosystem.
