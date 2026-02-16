# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start frontend dev server (http://localhost:5173)
npm run dev

# Start Jira proxy server (http://localhost:3001) — required for Jira integration
cd jira-proxy && npm start

# Build (runs tsc + vite build)
npm run build

# Lint
npm run lint
```

There are no tests configured in this project.

## Architecture

This is a real-time collaborative QA test management dashboard (Kanban board) built with React + Vite + TypeScript. UI text is in Catalan.

**Two external data sources feed the app:**
- **Jira** (read-only): Issues in test statuses fetched via `jira-proxy/` Express server to bypass CORS. Polls every 30s.
- **Supabase** (CRUD): Test cards stored in `test_cards` table with real-time sync via Supabase Realtime channels + 5s polling fallback.

**Data flow:** `App.tsx` is the orchestrator — it calls `useJiraIssues()` and `useAllCards(issueKeys)`, then passes data down to `JiraIssue → KanbanColumn → TestCard`. Card mutations go through `useAllCards` which calls Supabase directly.

### Key patterns

- **Smart refresh blocking** (`useAllCards`): Auto-refresh is suppressed when a modal is open or an input has focus, preventing UI disruption during user interaction. A double-check mechanism discards fetched data if a modal opened during the fetch.
- **Drag-and-drop**: Uses native HTML5 Drag API on `TestCard`/`KanbanColumn`. Dropping a card onto a column updates its `status` field in Supabase.
- **Card statuses** map to Kanban columns: `pendent`, `errors`, `tancat`, `descartat`.
- **Card types**: `error`, `dubte`, `proposta`, `ux`.
- **Export to Jira** (`src/lib/jiraExport.ts`): Generates a formatted ADF comment grouping cards by status and POSTs it via the proxy.
- **User identity**: No auth — username is stored in localStorage and used to tag cards with tester name.

### jira-proxy

Separate Node.js Express server in `jira-proxy/`. Authenticates to Jira Cloud with Basic auth (email + API token). Endpoints: `GET /issues`, `GET /issues/:key`, `POST /issues/:key/comment`.

## Environment Variables

Frontend (`.env.local`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_JIRA_PROXY_URL`, `VITE_CURRENT_USER`

Jira proxy (`jira-proxy/.env`): `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`
