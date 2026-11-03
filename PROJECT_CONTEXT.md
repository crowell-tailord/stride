# Stride Project Context

## Overview
Stride is a modern, fast, private Kanban project workspace and Trello replacement.

## Architecture
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide Icons + Canvas Confetti
- **Drag & Drop**: @dnd-kit (Core & Sortable)
- **Database**: Monorepo JSON File Store (`data/stride-db.json`) with atomic writes & Supabase-ready repository adapter
- **Storage**: Vercel Blob (`@vercel/blob`) with zero-config local storage fallback
- **Authentication**: Private session cookies via `jose` and edge middleware access lock

## Health & Quality Audit (White Mage)
- **Linting (`npm run lint`)**: PASS (0 errors, 0 warnings)
- **Type Checking & Production Build (`npm run build`)**: PASS (compiled in < 1s, zero TypeScript errors)
- **Unit & Integration Tests (`npm test`)**: PASS (4/4 tests passing in ~100ms)
- **A11y Audit**: PASS (all image tags have descriptive alt text; all form fields have labels and focus indicators)
- **Hydration & Mounting**: PASS (standardized via `useSyncExternalStore` hook and `suppressHydrationWarning` on timezone-sensitive badges)
- **Mobile Responsiveness**: PASS (touch-friendly targets, responsive Kanban canvas, mobile-adapted modals)
