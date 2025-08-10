# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Good Vibe Live is a creative platform combining AI services with cryptocurrency token economy. The application integrates AI tools (chat, image, video, music generation) with TAC blockchain and Telegram authentication.

## Development Commands

```bash
# Install dependencies
yarn install

# Development server with Turbopack
yarn dev

# Production build
yarn build

# Start production server
yarn start

# Run linting
yarn lint
```

## High-Level Architecture

### Tech Stack
- **Framework**: Next.js 15.4.6 with App Router and Turbopack
- **Language**: TypeScript with strict mode
- **UI Library**: Radix UI Themes + Radix UI Primitives
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand with persistence
- **Theme**: next-themes for dark/light mode
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (planned)
- **Authentication**: Telegram OAuth via Web App API

### Project Structure

```
src/
├── app/                   # Next.js App Router pages and API routes
│   ├── api/              # Backend API endpoints
│   │   ├── chat/         # AI chat integration
│   │   ├── suno/         # Music generation (Suno API)
│   │   ├── t2i/          # Text-to-image generation
│   │   ├── tts/          # Text-to-speech
│   │   └── telegram/     # Telegram auth callbacks
│   └── [pages]/          # Frontend pages (dashboard, profile, etc.)
├── components/           # React components
├── lib/                  # Utility functions and helpers
└── store/               # Zustand state management
```

### Key Architectural Patterns

1. **Client-Server Separation**: Clear boundary between client components (marked with "use client") and server components
2. **API Routes**: All external API integrations handled through Next.js API routes in `src/app/api/`
3. **State Persistence**: User data and chat threads persisted to localStorage via Zustand
4. **Telegram Integration**: Telegram Web App SDK loaded globally, authentication flow through API routes

### AI Service Integrations

The platform integrates multiple AI services:
- **Chat**: OpenAI GPT models via `/api/chat`
- **Images**: Flux, Midjourney via `/api/t2i`
- **Music**: Suno API via `/api/suno/*`
- **Videos**: Veo3, RunWay, Sora (planned)

### Token Economy (Planned)

- Internal token system for AI service payments
- 8-level referral system with specific reward percentages
- Premium subscription tiers (FREE, SMART, PRO, DREAM)
- TAC blockchain integration for crypto payments

### Important Configuration Files

- `next.config.ts`: Image domains for AI service results
- `turbo.json`: Monorepo task configuration
- `tsconfig.json`: TypeScript with `@/*` alias for `src/*`

## Code Conventions

- Use `"use client"` directive for client-side components
- Prefer Radix UI components over custom implementations
- Follow existing Tailwind CSS patterns
- Maintain TypeScript strict mode compliance
- Store types in component files or dedicated type files
- Use Zustand for global state, localStorage for persistence

## Security Considerations

- Never expose API keys in client code
- Telegram authentication validated server-side
- Planned: Row-level security in Supabase
- Token transactions require signature validation

## Current Development Status

The project is in early development with:
- Basic UI structure implemented
- Telegram authentication flow ready
- AI service API routes configured
- State management setup complete
- Premium features and crypto integration pending