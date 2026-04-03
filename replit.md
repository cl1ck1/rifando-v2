# Sou Rifeiro

## Overview

Brazilian SaaS platform for ambulant door-to-door salespeople and commercial representatives ("rifeiros") who buy products from distributors (linens, kitchenware, electronics) and sell them in other cities with installment payment plans. Main customers are women and resellers. Multi-tenant with Clerk auth. All UI in Brazilian Portuguese, no emojis.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
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
- `vendas` — Sales transactions (clienteId, valorTotal, desconto, valorFinal, formaPagamento, numeroParcelas, status)
- `venda_itens` — Sale line items (vendaId, produtoId, quantidade, precoUnitario, subtotal)
- `parcelas` — Installment tracking (vendaId, clienteId, numero, valor, dataVencimento, status, metodoPagamento)
- `clientes` — Customer CRM (nome, telefone, cpf, endereco, bairro, cidade, estado, referencia)
- `produtos` — Product catalog (precoCusto, precoVenda, estoque, categoriaId)
- `categorias` — Product categories
- `configuracoes` — Per-user account settings (nomeNegocio, telefoneWhatsapp, catalogoSlug, chavePix)
- `atividades` — Activity feed log

### Frontend Pages
- `/` — Landing page (signed-out) / redirect to /painel (signed-in)
- `/sign-in`, `/sign-up` — Clerk auth
- `/painel` — Dashboard with KPIs (totalVendas, totalRecebido, totalPendente, parcelasAtrasadas), revenue chart, top customers, overdue parcels, activity feed
- `/vendas` — Sales list with status filters, create sale with cart (add products, set installments)
- `/vendas/:id` — Sale detail with items, parcels, mark-as-paid functionality
- `/clientes` — Customer list with search, create with full address fields
- `/clientes/:id` — Customer detail with purchase history, parcels, financial summary
- `/parcelas` — Installment management with status filters, receive payment by method (pix/dinheiro/cartao/promissoria)
- `/catalogo` — Product catalog with categories, cost/sale price, stock, margin calculation
- `/configuracoes` — Account settings (business name, whatsapp, pix key, catalog)
- `/catalogo/:slug` — Public virtual catalog (no auth required), shows products with search, category filters, WhatsApp deep links, auto-refreshes every 60s

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Auth

Clerk is used for authentication. Keys are auto-provisioned. The proxy middleware at `/__clerk` handles Clerk API proxying. `requireAuth` middleware in routes extracts `userId` from Clerk session. All data is tenant-scoped by `userId`.

## Domain Model

Rifeiros are ambulant salespeople who:
1. Buy products wholesale from distributors (enxovais, utensilios, eletronicos)
2. Travel to other cities to sell door-to-door
3. Sell with extended installment payment plans (carne/promissoria)
4. Main customers: women and resellers who buy for personal use or resale
5. Deliver products to customer's home address

### Public API (no auth)
- `GET /api/catalogo/:slug` — Returns store info, categories, and active products for a given catalog slug. Returns 404 if slug not found or catalog disabled.

## Pending Tasks
- Task #4: WhatsApp AI sales bot (needs user-provided WhatsApp API credentials)
