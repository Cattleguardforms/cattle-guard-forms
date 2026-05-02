# Cattle Guard Forms

Foundation repository for a form-driven SaaS app.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ESLint
- Supabase client helper
- Stripe client/server helpers

## Project structure
```txt
.
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ about/page.tsx
│  │  └─ forms/page.tsx
│  └─ lib/
│     ├─ supabase/client.ts
│     └─ stripe/{client,server}.ts
├─ .env.example
└─ GOVERNANCE.md
```

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
3. Start local development server:
   ```bash
   npm run dev
   ```

## Lint
```bash
npm run lint
```

Deploy trigger for Echo BOL button - 2026-05-02
