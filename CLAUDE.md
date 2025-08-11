# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Good Vibe Live** is a crypto-AI platform that combines AI content generation (chat, images, videos, music) with a token-based economy and 8-level referral system. The platform uses Telegram OAuth for authentication and TAC blockchain for crypto wallet integration.

## Tech Stack

- **Frontend**: Next.js 15.4.6, React 19.1.0, TypeScript
- **UI**: Radix UI + Tailwind CSS (neon theme)
- **State**: Zustand with persistence middleware
- **Auth**: Telegram OAuth + Supabase Auth
- **Backend**: Next.js API routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **AI Services**: OpenAI, Suno API, Flux via CometAPI/Replicate
- **Blockchain**: TAC network, TON Connect
- **DevOps**: Vercel deployment, Turbo monorepo

## Architecture

```
goodvibelive/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── chat/          # OpenAI integration
│   │   │   ├── telegram/      # Telegram webhook handlers
│   │   │   ├── suno/          # Suno API integration
│   │   │   └── t2i/           # Flux/CometAPI integration
│   │   ├── dashboard/         # Admin panel
│   │   ├── profile/           # User profile pages
│   │   └── suno/              # Suno music generation
│   ├── components/            # React components
│   ├── store/                 # Zustand global state
│   └── lib/                   # Utilities
├── docs/                      # Documentation
└── integrations/              # API documentation
```

## Key Features

- **Telegram Auth**: Single sign-on via Telegram OAuth + WebApp integration
- **AI Services**: Multi-provider support (OpenAI, Suno, Flux, Midjourney, Veo3)
- **Token Economy**: Good Vibe tokens as platform currency
- **Referral System**: 8-level system with automated placement
- **Gifting System**: Token gifts linked to phone numbers
- **Admin Panel**: Built-in dashboard for managing subscriptions, promos, and users
- **Crypto Integration**: TAC blockchain wallet + Telegram wallet linking

## Development Commands

```bash
# Start development server
npm run dev                # Next.js with Turbopack

# Build and test
npm run build              # Production build
npm run lint               # ESLint check
npm run test               # Run tests (placeholder)
npm run start              # Start production server

# Environment setup
# Required env vars: OPENAI_API_KEY, TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_TG_BOT
```

## Key API Patterns

### Telegram Auth Flow
1. Users authenticate via Telegram WebApp or Login Widget
2. Verification handled at `/api/telegram/callback`
3. HMAC-SHA256 signature verification with Telegram bot token

### AI Service Integration
- **Chat**: OpenAI via unified interface supporting multiple providers
- **Music**: Suno API (documented in `docs/integrations/suno/`)  
- **Images**: Flux models via CometAPI/Replicate

### State Management
- **Zustand store** at `src/store/useAppStore.ts`
- **Local persistence** with automatic sync to localStorage
- **Type-safe interfaces** for todos, threads, user data

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: OpenAI API access
- `OPENROUTER_API_KEY`: OpenRouter alternative provider
- `TELEGRAM_BOT_TOKEN`: Telegram bot authentication
- `NEXT_PUBLIC_TG_BOT`: Public bot username for widget
- `SITE_URL`: Base URL for OpenRouter headers

### Next.js Config
- **Image sources**: Multiple remote patterns configured for AI service URLs
- **ESLint**: Disabled for builds (`ignoreDuringBuilds: true`)
- **Turbopack**: Enabled for development

## Code Conventions

### TypeScript Patterns
- Strict typing for all API routes and components
- Zod validation for API request bodies
- Interface-first design for state management

### Styling
- Radix UI with Tailwind CSS
- Neon theme with glassmorphism effects
- Dark mode by default
- Responsive design breakpoints

### State Management
- **Zustand**: Global state with persistence
- **LocalStorage**: Client-only data (todos, threads, user)
- **No server state**: Currently designed for PWA/mobile web

## Integration APIs

### Suno API Endpoints (production)
- Base: `https://api.sunoapi.org`
- Features: credit tracking, music generation, lyrics, cover images, WAV conversion
- Authentication: Bearer token in Authorization header

### Flux/CometAPI Integration
- Via Replicate backend
- Models: flux-schnell, flux-pro, flux-kontext variants
- Requires image generation parameters in POST body

## Testing Notes

- **Development login**: Test mode bypass available in UI
- **API testing**: All routes use standard REST patterns
- **Mobile testing**: Optimized for Telegram WebApp viewport
- **Crypto testing**: Requires TAC blockchain setup

## Future Development

Architecture is designed for migration to full Supabase backend with:
- PostgreSQL database for persistent storage
- 8-level referral system implementation
- Token economy with TAC blockchain integration
- Admin panel features as described in prd.md
- Advanced AI service orchestration