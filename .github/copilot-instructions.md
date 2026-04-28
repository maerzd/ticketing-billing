# Copilot Instructions — ticketing-billing

Purpose: concise operational guidance for Copilot sessions in this repository.

## Build, test & lint (how to run)
- Install: yarn install (repo root, Yarn 4).
- Dev (local Next.js app): yarn dev — runs workspace @ticketing-billing/web (localhost:3000).
- Build: yarn build (runs types build then web build).
- Start (production): yarn start (web).
- Lint: yarn lint (runs Biome check in apps/web).
- Format: yarn format (runs Biome formatter across workspaces).

Testing:
- This repo uses Vitest in apps/web (devDependency).
- Run all tests for the web app: npx vitest run --dir apps/web
- Run a single test file (example):
  npx vitest apps/web/src/lib/notion/notion-types.test.ts

CDK (infra/cdk):
- Synth: yarn cdk:synth
- Diff: yarn cdk:diff
- Bootstrap: yarn cdk:bootstrap
- Deploy: yarn cdk:deploy

## High-level architecture
- Monorepo (Yarn workspaces): packages/*, apps/*, infra/*.
- apps/web — Next.js (App Router, Server Components, Server Actions). Contains UI, server actions that call external services and DynamoDB directly.
- packages/types — shared TypeScript types used across workspace.
- infra/cdk — AWS CDK stack provisioning DynamoDB tables and optional Vercel OIDC resources.
- Runtime: deployed to Vercel. Server-side code (Next.js server actions) is the backend: it calls Vivenu, Qonto, Resend, WorkOS, and DynamoDB.

## Key conventions & patterns
- Zod validation used for server-action input/response schemas — prefer validating at the boundary of server actions.
- Money is stored as integer cents everywhere (no floats). Fee calculation uses pct_rate, per_ticket (cents), and flat (cents).
- DynamoDB table names are explicit: `Organizers` and `BillingRecords`. Use env vars DYNAMODB_ORGANIZERS_TABLE and DYNAMODB_BILLING_RECORDS_TABLE.
- BillingRecords PK/SK: PK = organizerid, SK = event_id. Two GSIs: StatusIndex (status, triggered_at) and EventIndex (event_id).
- Idempotency: creating a BillingRecord uses conditional PutItem attribute_not_exists(event_id).
- Biome is the formatter/linter configured via biome.json at repo and app levels. Use `yarn lint` and `yarn format` from repo root.
- Package names use the @ticketing-billing/* scope (e.g., @ticketing-billing/web, @ticketing-billing/types).
- Server-side secrets and client secrets must never be committed; use .env.local locally and Vercel env vars in production.
- Server actions live under src/actions/ and app/api routes; prefer server actions for mutations that must run server-side.

---
## MCP servers
- Config file: `.github/mcp-servers.yml` defines MCP servers usable by Copilot/devtools.
- Next.js devtools: `next-devtools-mcp@latest` is configured to run against `apps/web` (start: `yarn workspace @ticketing-billing/web dev`, port 3000).
