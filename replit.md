# Sou Rifeiro

## Overview

Brazilian SaaS platform for independent travel vendors ("rifeiros") who sell group bus excursions in installments. Multi-tenant with Clerk auth. All UI in Brazilian Portuguese, no emojis.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Auth**: Clerk (auto-provisioned, proxy middleware)
- **Charts**: Recharts
- **Routing**: Wouter

## Architecture

### Artifacts
- `artifacts/api-server` — Express API server (port from PORT env)
- `artifacts/rifeiro-app` — React Vite frontend at `/`

### Shared Libraries
- `lib/api-spec` — OpenAPI spec + codegen config
- `lib/api-zod` — Generated Zod schemas
- `lib/api-client-react` — Generated React Query hooks
- `lib/db` — Drizzle ORM schema + database connection

### Database Tables
- `viagens` — Trip management (destino, seats, pricing, status)
- `clientes` — Customer CRM (nome, telefone, CPF, etc.)
- `pagamentos` — Payment tracking (parcelas, metodo, status)
- `produtos` — Product catalog
- `categorias` — Product categories
- `configuracoes` — Per-user account settings
- `atividades` — Activity feed log

### Frontend Pages
- `/` — Landing page (signed-out) / redirect to /painel (signed-in)
- `/sign-in`, `/sign-up` — Clerk auth
- `/painel` — Dashboard with KPIs, revenue chart, top customers, activity feed
- `/viagens` — Trip list with CRUD, status filters
- `/viagens/:id` — Trip detail with occupancy stats
- `/clientes` — Customer list with search, status filters
- `/clientes/:id` — Customer detail with payment/trip history
- `/financeiro` — Payment management with filters
- `/catalogo` — Product catalog with categories
- `/configuracoes` — Account settings

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Auth

Clerk is used for authentication. Keys are auto-provisioned. The proxy middleware at `/__clerk` handles Clerk API proxying. `requireAuth` middleware in routes extracts `userId` from Clerk session. All data is tenant-scoped by `userId`.

## Pending Tasks
- Task #3: Public virtual catalog page per rifeiro
- Task #4: WhatsApp AI sales bot (needs user-provided WhatsApp API credentials)
