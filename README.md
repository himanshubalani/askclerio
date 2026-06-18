# AskClerio

> A keyboard-first command center for Gmail and Google Calendar, powered by [Corsair](https://corsair.dev).

Built for the **Corsair LiveCommand Inbox Hackathon** (12 Jun – 18 Jun 2026).

---

## The problem

Gmail and Google Calendar are great at handling everything, which is exactly why they don't feel great at handling the things _you_ do most. A simple "send a calendar invite and an email confirming it" takes six clicks and three context switches. Searching is fine but writing is slow. Triage is mouse-driven. Keyboard shortcuts exist but stop short of replacing the UI.

Most attempts to fix this (Superhuman, Hey, Shortwave) bake in their own opinion of what the workflow should be. That works until your workflow is different.

## The solution

**AskClerio** is a thin, opinion-free command center that wires Gmail and Google Calendar to:

1. A **keyboard-first list UI** that reads/writes through Corsair's local cache so the inbox feels instant, even on cold start.
2. An **AI sidebar (Clerio)** that uses the **Corsair MCP** to send emails, draft replies, and create calendar invites from natural language. The agent discovers operations at runtime through MCP — adding a new Corsair plugin extends the agent automatically.

The result: pressing `r` on a focused thread opens a pre-filled chat to Clerio. Saying _"send Sarah a calendar invite for Thursday at 9 and email her the agenda"_ produces both, with explicit approval cards before anything irreversible runs.

---

## Key features

### Gmail

- Multi-label inbox views (Inbox, Sent, Important, Spam, custom user labels)
- Full thread view with sanitized HTML bodies
- Archive, trash, mark read/unread (with auto-mark-read on open)
- Per-thread notes stored locally in Postgres
- Local search across subject, sender, and snippet (filters the cache, no API call)
- One-click **Sync** that walks the live API so Corsair caches every message

### Google Calendar

- Today's agenda + grouped upcoming events
- Stats (today's count, hours blocked, next meeting)
- Create / delete meetings with attendees
- Per-event notes
- Sync with stale-event cleanup (removes events deleted in Google but still cached)

### Clerio AI sidebar

- Slide-out panel (resizable 320–520 px, overlay on mobile, rail collapse)
- Streaming chat over **GPT-4o** via Vercel AI SDK
- **MCP tool calling** through Corsair — agent discovers `gmail.api.*` and `googlecalendar.api.*` operations at runtime
- Approve / reject / edit / retry tool calls in dedicated cards
- Rate limiting (5 write tools per minute), parameter validation, structured audit logging
- Server-side **signed approval secrets** for irreversible operations
- Conversation persistence (Postgres)

### Keyboard-first UX

| Key | Action |
| --- | --- |
| `j` / `k` | Navigate thread list |
| `Enter` / `o` | Open focused thread |
| `e` | Archive |
| `#` | Trash |
| `r` | Reply (opens Clerio with prefilled prompt) |
| `f` | Forward (opens Clerio) |
| `u` / `Esc` | Back to inbox (from a thread) |
| `Cmd` / `Ctrl` + `.` | Toggle Clerio sidebar |
| `?` | Show full shortcut reference |

---

## Tech stack

- **Framework**: Next.js 15 (App Router, Turbopack), React 19, TypeScript 5.8
- **Auth**: Clerk
- **Integrations**: Corsair (Gmail + Google Calendar plugins) + Corsair MCP
- **AI**: Vercel AI SDK 6, `@ai-sdk/openai`, OpenAI GPT-4o
- **API layer**: tRPC 11, TanStack Query
- **Database**: Postgres + Drizzle ORM, `pgvector` for future embeddings
- **MCP server**: Express on port 3001, scoped per-tenant by `x-tenant-id` header
- **UI**: Tailwind CSS 4, Hugeicons
- **Observability**: Sentry

---

## Corsair features used

- ✅ **Gmail plugin** (`@corsair-dev/gmail`) — `permissive` mode with explicit `deny` for `gmail.api.messages.delete`
- ✅ **Google Calendar plugin** (`@corsair-dev/googlecalendar`) — `permissive` mode
- ✅ **Multi-tenancy** — every user has a Corsair tenant scoped to their Clerk ID
- ✅ **Database caching** — `tenant.gmail.db.messages.search` and `tenant.googlecalendar.db.events.search` for instant reads
- ✅ **Live API passthrough** — `tenant.gmail.api.*` calls auto-cache results
- ✅ **OAuth helpers** — `generateOAuthUrl` + `processOAuthCallback` with combined Gmail+Calendar consent
- ✅ **MCP server** — `createBaseMcpServer` + `createMcpRouter` with per-request tenant scoping
- ✅ **MCP client** — `createVercelAiMcpClient` to expose Corsair operations as AI tools
- ✅ **Webhooks** — `processWebhook` endpoint at `/api/webhooks` with auto-tenant resolution

## Bonus tasks attempted

- ✅ **Corsair MCP agent chat** — full tool calling for sending emails and creating calendar invites
- ✅ **Realtime webhooks endpoint** — `/api/webhooks` wired through `processWebhook`
- ✅ **Keyboard shortcuts** — Superhuman-style list navigation and thread actions
- ⚠️ **Priority filtering** — Drizzle schema (`emailAiMeta.priority`, `priorityReason`) is in place; LLM classification pipeline pending
- ⚠️ **Vector search** — `pgvector` columns (1536-dim) seeded in `emailAiMeta` and `calendarAiMeta`; embedding write-path pending
- ❌ **Corsair search API UI** — out of scope for the hackathon window

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url> askclerio
cd askclerio
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/askclerio

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Corsair
CORSAIR_KEK=<32-char encryption key>

# 64-char hex string used to encrypt tenant MCP secrets at rest
TENANT_KEY_ENCRYPTION_KEY=<openssl rand -hex 32>

# Internal token shared between Next.js chat route and the MCP Express server
MCP_INTERNAL_TOKEN=<openssl rand -base64 32>

# Server-side secret for signing tool approval tokens
TOOL_APPROVAL_SECRET=<openssl rand -base64 32>

# OpenAI
OPENAI_API_KEY=...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database

```bash
# Start a local Postgres (script provided)
./start-database.sh

# Push the Drizzle schema
pnpm db:push
```

### 4. Run

```bash
pnpm dev
```

`pnpm dev` starts both the Next.js app on `:3000` and the Corsair MCP Express server on `:3001` via `concurrently`.

### 5. Connect Gmail + Calendar

Sign in, then click **Connect Workspace** in the inbox empty state. The OAuth flow will request both Gmail and Google Calendar scopes in a single consent.

### 6. (Optional) Webhooks

For realtime email and calendar events, expose `/api/webhooks` via ngrok and configure the URL on your Corsair plugin webhook subscription. The endpoint validates Pub/Sub `validationtoken` challenges and delegates to `processWebhook`.

---

## Project structure

```
src/
├── app/
│   ├── (app)/                  # Authenticated app shell
│   │   ├── layout.tsx          # Sidebar + AI panel + KeyboardHelp
│   │   ├── thread/[id]/        # Thread detail
│   │   └── u/                  # Inbox views + calendar dashboard
│   ├── api/
│   │   ├── chat/route.ts       # AI streaming endpoint (MCP tool calling)
│   │   ├── connect/route.ts    # OAuth initiation
│   │   ├── auth/corsair/       # OAuth callback (CSRF + cookies)
│   │   └── webhooks/route.ts   # Corsair webhook receiver
│   ├── _components/
│   │   ├── ai-sidebar/         # 12-component AI panel
│   │   ├── keyboard-help.tsx   # `?` overlay
│   │   ├── mailbox-view.tsx    # Thread list with j/k/e/r/# shortcuts
│   │   └── oauth-connections.tsx
│   └── _hooks/
│       └── use-mailbox-keyboard.ts
└── server/
    ├── corsair.ts              # Corsair config (Gmail + Calendar plugins)
    ├── server.ts               # MCP Express server (port 3001)
    ├── ai/
    │   ├── system-prompt.ts
    │   └── tools/
    │       ├── policy.ts       # read vs write classification
    │       └── security.ts     # rate limit + validation + audit log
    ├── api/                    # tRPC routers (auth, gmail, calendar, chat)
    └── db/schema.ts            # Drizzle schema (14 tables, pgvector)
```

---

## Deployment

The app is deployable to Vercel for the Next.js front end. The MCP Express server can run on Vercel as a separate Node service, on Render, Railway, or co-located on a small VM. Set `CORSAIR_MCP_URL` in the Next.js environment to point at the deployed MCP server.

`next.config.js` includes `serverExternalPackages` for `@corsair-dev/mcp`, `express`, `import-in-the-middle`, and `require-in-the-middle` so the Next build doesn't try to bundle them.

---

## License

MIT
