# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Good Vibe Platform** - A creative platform for dreamers and content creators that provides AI services through token economics and a referral system. Combines AI content generation tools with TAC cryptocurrency ecosystem.

- **Domain**: goodvibe.live
- **Target Audience**: Creative individuals, designers, content creators (18-45 years)
- **Authentication**: Telegram OAuth only
- **Key Services**: AI ChatBot, AI Images, AI Videos, AI Music
- **Monetization**: Token-based with 8-level referral system (30% to 20% rewards)

## Technology Stack

### Frontend
- **Framework**: React + Next.js (web), Expo (React Native)
- **UI**: Tamagui for cross-platform styling
- **State**: Zustand
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod validation
- **Navigation**: Solito (cross-platform)
- **Intl**: i18next (web), expo-localization (native)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Telegram OAuth
- **API**: REST/GraphQL via Supabase
- **Payments**: Stripe integration (configured via admin panel)
- **Crypto**: TAC wallet integration via Wagmi, TON Connect UI

### DevOps & Tools
- **Monorepo**: Turbo (workspace management)
- **Deployment**: Vercel
- **Workspace Structure**: `apps/` (Next.js/Expo), `packages/` (shared code), `turbo/generators/` (custom generators)

## Architecture Patterns

### Monorepo Structure
```
apps/
├── web/          # Next.js application
├── native/       # Expo React Native
packages/
├── ui/           # Shared UI components (Tamagui)
├── api/          # Shared API logic
└── core/         # Business logic and utilities
```

### Key Features Design
- **Gift System**: Creates referral links between users via promo codes tied to phone numbers
- **Referral System**: 8 levels deep, max 6 direct referrals, auto-upgrade overflow
- **Token Economics**: TAC-based tokens managed via admin panel
- **AI Services**: Integration with Flux, Midjourney, Runway, Veo3, Suno, etc.

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Run development servers
npm run dev          # Both web and native
npm run dev:web      # Next.js only
npm run dev:native   # Expo only

# Build for production
npm run build        # Build all apps
npm run build:web    # Build Next.js
npm run build:native # Build Expo

# Testing
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

### Database & Supabase
```bash
# Generate types from Supabase
npm run db:generate

# Reset database
npm run db:reset

# Run migrations
npm run db:migrate

# Start Supabase locally
npm run supabase:start
```

### Turbo Scripts
```bash
# Run specific app
npm run dev --filter=web
npm run dev --filter=native

# Build specific package
npm run build --filter=@goodvibe/ui

# Custom generators
yarn turbo gen      # Create components/screens/tRPC routers
```

## Project Conventions

### File Structure
- **Components**: Use `./components/[feature]/[ComponentName.tsx]`
- **Screens**: Use `./screens/[ScreenName.tsx]` for mobile, `./pages` for web
- **API Routes**: Use `./pages/api/[route].ts` (web) or Supabase functions
- **Types**: Define shared types in `./types/[category].ts`

### Naming Conventions
- **Files**: lowercase-with-dashes.tsx for directories, PascalCase for components
- **Types**: PascalCase with `I` prefix for interfaces (IUserData)
- **Hooks**: camelCase with `use` prefix (useUserProfile)
- **Constants**: UPPER_SNAKE_CASE

### Code Style
- **Functional Programming**: Prefer pure functions and declarative patterns
- **Error Handling**: Early returns with guard clauses
- **Validation**: Zod schemas for all forms and API contracts
- **Intl**: All user-facing text must use i18next hooks

## Environment Variables

Create `.env.local` for local development:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
TELEGRAM_BOT_TOKEN=
TAC_NETWORK_RPC=
```

## Key Platform Concepts

### Referral System Logic
- 8 levels deep with diminishing rewards (30% → 20% → 10% → 5% patterns)
- Automatic overflow handling for direct referrals > 6
- Payment rewards only when referrer has active subscription

### Gift Creation Flow
1. User creates gift in profile (tokens deducted immediately)
2. Specify recipient phone number + token amount
3. System generates unique promo code
4. Friend activates with matching Telegram phone number
5. Automatic referral link established

### AI Service Integration
- Pricing configured via admin panel
- Rate limiting and caching via Supabase
- Token costs deducted immediately on request
- Discount percentages apply based on subscription tier

## Testing & Quality

### Test Structure
- Unit tests alongside components (`Component.test.tsx`)
- API integration tests in `tests/api/`
- E2E tests for critical user flows

### Key Testing Areas
- Telegram authentication flow
- Referral link creation/activation
- Token balance updates
- AI service billing calculations
- Gift code redemption

## Deployment Notes

### Vercel Configuration
- Uses `turbo.json` for build optimization
- Environment variables configured via Vercel dashboard
- Automatic deployments on `main` branch

### Mobile Release
- EAS Build for App Store/Google Play
- OTA updates via Expo updates
- Crypto wallet integration requires iOS AppStore review additional approval