# AI Personal Assistant — Build Specification

## Role

You are a senior full-stack engineer building a **production-grade AI personal
assistant** for a real business client (small real-estate company, 2-9 people).
This is not a toy/demo project — it will handle real emails, real calendars,
and real customer data. Treat security, error handling, and data isolation as
first-class requirements, not afterthoughts.

Before writing any code, read this entire file, then ask the human operator
any clarifying questions listed in the "Open questions" section at the bottom.
Do not guess on items marked `[MUST ASK]`.

---

## 1. Objective

Build a multi-channel AI assistant that:
1. Connects to Gmail, Google Calendar, and Google Tasks
2. Summarizes emails and drafts replies (never auto-sends)
3. Sends emails only after an explicit human "YES SEND" approval
4. Manages meetings, reminders, and tasks
5. Sends automated morning and evening summaries
6. Is reachable via Telegram, WhatsApp, and a web dashboard
7. Connects to a CRM and automates customer follow-ups
8. Logs all activity, and keeps "business" and "personal" workflows
   logically separated per user

---

## 2. Tech stack (MERN, as requested)

- **Frontend:** React (Vite), TypeScript, Tailwind CSS — must be fully
  responsive (mobile, tablet, laptop, desktop breakpoints: 375px, 768px,
  1024px, 1440px+). No fixed-pixel layouts.
- **Backend:** Node.js + Express, TypeScript
- **Database:** MongoDB (Atlas free tier is fine to start)
- **Queue/Scheduler:** node-cron for scheduled jobs (morning/evening summary);
  BullMQ + Redis if job volume grows beyond simple cron
- **Auth:** JWT for dashboard sessions, OAuth2 for Google, per-platform
  webhook verification for Telegram/WhatsApp
- **LLM layer:** provider-agnostic wrapper (see section 5) so the model
  can be swapped without touching business logic
- **Hosting suggestion:** Render/Railway (backend), Vercel (frontend),
  MongoDB Atlas (DB) — all have usable free tiers for MVP. **No Docker for
  this build** — run and deploy directly with `npm`, no containerization.

---

## 3. Folder structure

```
ai-assistant/
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/                   # api client, auth helpers
│   │   └── styles/
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── config/                 # env loading, constants
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── gmail/
│   │   │   ├── calendar/
│   │   │   ├── tasks/
│   │   │   ├── telegram/
│   │   │   ├── whatsapp/
│   │   │   ├── crm/
│   │   │   └── llm/                # provider-agnostic LLM wrapper
│   │   ├── models/                  # Mongoose schemas
│   │   ├── middleware/               # auth, rateLimiter, errorHandler, validation
│   │   ├── jobs/                     # cron: morning/evening summary
│   │   ├── utils/
│   │   └── app.ts
│   └── tests/
├── docs/
├── .env.example
└── README.md
```

**Note: no Docker for this build.** Run backend and frontend directly via
`npm run dev` in `server/` and `client/` during development, and deploy to
Render/Vercel without a container. Do not add `docker-compose.yml` or a
`Dockerfile` unless explicitly requested later.

Rules:
- No business logic in route files — routes call controllers, controllers
  call services.
- Every external integration (Gmail, WhatsApp, CRM, LLM) lives behind its
  own service module with a narrow interface, so it can be mocked in tests
  and swapped later.
- No secrets, tokens, or credentials in code or in git history — `.env`
  only, and `.env` must be in `.gitignore` from commit one.

---

## 4. Feature breakdown

### 4.1 Google integration (Gmail, Calendar, Tasks)
- OAuth2 flow, store refresh tokens encrypted at rest (see Security)
- Gmail: list/read recent emails, generate summaries, generate draft replies
- Calendar: create/read/update/delete events
- Tasks: create/read/update/delete tasks
- Respect Gmail/Calendar API rate limits — use exponential backoff

### 4.2 Approval flow ("YES SEND")
- Any outbound email is first stored as a `pending_action` with status
  `awaiting_approval`
- The draft is sent to the user via their configured channel (Telegram/
  WhatsApp/dashboard)
- Only an explicit "YES SEND" (or dashboard button click) flips status to
  `approved` and triggers the actual send
- All other replies are treated as edits/rejection, not silent approval
- Every pending action expires after a configurable timeout (default 24h)

### 4.3 Multi-channel access
- Telegram: bot via Telegram Bot API (free, simplest — build and test this
  first, it validates the whole approval-flow pipeline before WhatsApp adds
  complexity)
- WhatsApp: via Meta's WhatsApp Business Cloud API — **setup is from
  scratch (confirmed), start Meta Business verification in parallel with
  week 1 development, since verification can take days and is outside the
  developer's control.** Build the WhatsApp service module behind the same
  generic channel interface as Telegram so it's a drop-in once verification
  clears, rather than a blocking dependency for the rest of the build.
- Web dashboard: shows activity log, pending approvals, calendar view,
  settings

### 4.4 Scheduler
- Morning summary: today's calendar + unread important emails + pending
  tasks
- Evening summary: what got done, what's pending, tomorrow's first
  meeting
- Times configurable per user, stored in user settings, run via cron in
  user's timezone

### 4.5 CRM integration — HubSpot (confirmed)
- Build against a generic `CRMProvider` interface
  (`getContact`, `createFollowUp`, `logInteraction`, `listStaleLeads`) so a
  second CRM can be added later without touching business logic
- Implement `HubSpotProvider` as the concrete implementation:
  - Use HubSpot's private app access token (simpler than full OAuth for a
    single-client build) — scopes needed: `crm.objects.contacts.read`,
    `crm.objects.contacts.write`, `crm.objects.deals.read` (only if deals
    are used for follow-ups)
  - HubSpot free/Starter tier has API rate limits (100 req/10s on free) —
    respect this, batch reads where possible
- Automate follow-ups: e.g., "no contact in N days" (query HubSpot's
  `lastActivityDate` on the contact) triggers a suggested (not auto-sent)
  follow-up message through the same approval flow as emails

### 4.6 Logging & workspace separation
- Every action writes to an `ActivityLog` collection: actor, action type,
  channel, timestamp, workspace (`business` | `personal`), status
- Workspace is a tag on the user's connected accounts/contacts, not a
  separate database — filter by it everywhere in queries and UI

---

## 5. LLM / model strategy — Gemini default (confirmed)

Build an `LLMProvider` interface with methods like `summarize()`,
`draftReply()`, `classifyIntent()`, and implement `GeminiProvider` as the
default (use `gemini-1.5-flash` or newer flash-tier model for cost/speed —
don't default to a Pro-tier model for routine summarization).

Keep the interface provider-agnostic anyway — free-tier Gemini has real
rate limits (RPM/RPD caps) and if usage grows, you'll want to add Groq or
a paid provider as a fallback without rewriting service code. Add basic
retry/backoff and a clear error surfaced to the user (not a silent
failure) when the rate limit is hit.

---

## 6. Security requirements (non-negotiable)

- All OAuth tokens and API keys encrypted at rest (e.g. `crypto` AES-256-GCM
  with a key from env, never in the DB in plaintext)
- HTTPS only in production
- Rate limiting on all public webhook endpoints (Telegram/WhatsApp webhooks
  are public URLs — must validate signatures/secrets on every request)
- Input validation on every endpoint (e.g. `zod`)
- No email is ever sent without the approval flow — this is a safety
  requirement, not just a feature
- Principle of least privilege on Google OAuth scopes — only request the
  scopes actually used
- Audit log entries are append-only (no update/delete from the API)

---

## 7. What the human operator must do (not the coding agent)

- Create Google Cloud project, enable Gmail/Calendar/Tasks APIs, generate
  OAuth client ID/secret
- Create the Telegram bot via @BotFather and provide the bot token
- Set up WhatsApp Business API access (Meta Business verification takes
  time — start this early, in parallel with development)
- Confirm which CRM is in use and provide its API key
- Choose and provide an LLM API key (Gemini/Groq/OpenAI/Anthropic)
- Provide a MongoDB Atlas connection string (or approve local Docker Mongo
  for dev)
- Decide hosting provider accounts (Render/Vercel/Railway) if deploying

---

## 8. Decisions confirmed

- **CRM:** HubSpot — build `HubSpotProvider` as the concrete implementation
- **LLM:** Google Gemini (free tier), flash-tier model by default
- **WhatsApp:** Business API setup is from scratch — treat as a parallel
  track, not a blocker for Telegram/dashboard/Gmail/Calendar work
- **Tenancy:** Single user for now (the client only). Still add `userId`
  on every collection from day one — this costs nothing extra now and
  avoids a schema migration if a second user is added later. Do not build
  team-invite/multi-account UI yet; that's out of scope until requested.
- **Timezone:** Configurable per user in Settings (not hardcoded). Default
  the initial value to `Asia/Amman` (client's location) but store it as a
  user-editable setting so it can be changed from the dashboard without a
  code change.

## 9. Remaining note (not a build blocker)

- $500 was quoted for what reads as the full scope (3 channels + HubSpot +
  approval flow + scheduler). Recommend pricing Phase 1 (Telegram + Gmail
  + Calendar/Tasks + approval flow + dashboard) as the $500 deliverable,
  and Phase 4/5 (WhatsApp + HubSpot automation) as a separately scoped
  add-on once Meta verification clears. This is a client-communication
  item, not something the coding agent needs to solve.
- **No Docker** for this build — run via `npm run dev`, deploy without
  containers.
- Phasing confirmed: build Phase 1 as the working core loop first.
  WhatsApp and HubSpot are built behind their provider interfaces in
  parallel/later phases — not blockers for Phase 1 delivery.

## 10. Nothing left open — proceed to implementation

All items above are resolved. The coding agent should proceed directly to
Phase 1 as defined in the implementation plan, without pausing to re-ask
these questions.
