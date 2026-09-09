# AI Personal Assistant (MERN Stack)

A production-grade AI personal and business assistant for real-estate firms, built on the **MERN** stack (Node.js + Express + TypeScript, MongoDB with Mongoose, React + Vite + TypeScript + Tailwind CSS).

Connects to **Gmail, Google Calendar, Google Tasks, Telegram, WhatsApp (Meta Business Cloud API / Twilio), and HubSpot CRM**, with a strict human-in-the-loop approval gate.

---

## 🔒 Core Invariants & Security Principles

1. **Strict Human Approval Gate ("YES SEND"):**
   - Outbound emails and critical external actions are **never sent automatically**.
   - Any drafted action is stored in MongoDB as `PendingAction` with status `awaiting_approval`.
   - The user is notified via their configured channel (Telegram, WhatsApp, or Web Dashboard).
   - Only receiving an explicit **"YES SEND"** command (or clicking Approve in the dashboard) flips the status to `approved` and triggers the actual delivery via Gmail API.
   - All other replies are treated as edit instructions or rejection.
   - Pending actions auto-expire after 24 hours (configurable TTL).

2. **Encryption at Rest:**
   - Google OAuth2 access and refresh tokens are encrypted at rest using **AES-256-GCM** with a 32-byte secret key before database insertion. Plaintext tokens are never stored.

3. **Workspace Isolation:**
   - Every email, task, calendar event, and log entry is tagged as either `business` or `personal`.
   - Filterable instantly from the dashboard to keep client workflows cleanly separated from personal items.

4. **Multi-Tenant Ready:**
   - Every database collection is indexed by `userId` from day one, allowing seamless team scaling without schema migrations.

5. **Direct Execution (No Docker):**
   - Run directly with standard Node.js & `npm` commands during development and production.

---

## 📁 Architecture & Directory Layout

```
ai-assistant/
├── client/                         # React frontend (Vite, TypeScript, Tailwind CSS)
│   ├── src/
│   │   ├── components/             # Navbar, ApprovalCard, ActivityTable, ChatWidget
│   │   ├── pages/                  # Dashboard, Approvals, Calendar/Tasks, Logs, Settings
│   │   ├── lib/                    # Axios API client
│   │   └── styles/                 # Tailwind CSS & dark theme
│   └── vite.config.ts
├── server/                         # Express + TypeScript backend
│   ├── src/
│   │   ├── config/                 # Typed environment validation with Zod
│   │   ├── controllers/            # Auth, Approvals, Webhooks, Logs, Settings, Assistant
│   │   ├── routes/                 # Express route handlers
│   │   ├── services/
│   │   │   ├── gmail/              # Gmail service (fetch unread, summarize, draft, send)
│   │   │   ├── calendar/           # Google Calendar service with conflict detection
│   │   │   ├── tasks/              # Google Tasks service
│   │   │   ├── approval/           # ApprovalService (strict "YES SEND" enforcement)
│   │   │   ├── telegram/           # Telegram bot webhook & message dispatcher
│   │   │   ├── whatsapp/           # Meta Cloud API & Twilio sandbox adapter
│   │   │   ├── crm/                # CRMProvider interface & HubSpot implementation
│   │   │   ├── llm/                # LLMProvider interface & Gemini Flash implementation
│   │   │   └── orchestrator/       # AgentOrchestrator (central intent routing)
│   │   ├── models/                 # Mongoose models (User, OAuthToken, PendingAction, ActivityLog, Contact, Setting)
│   │   ├── middleware/             # Auth (JWT), rate limiting, webhook signature verification
│   │   ├── jobs/                   # node-cron morning/evening summaries
│   │   └── server.ts               # Server bootstrap & MongoDB connection
│   └── tests/                      # Vitest unit & integration tests
├── .env.example                    # Reference environment variables
├── .env                            # Protected local configuration (ignored by git)
└── package.json                    # Workspace scripts
```

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- **Node.js**: v18+ (tested with v22/v25)
- **MongoDB**: MongoDB Atlas connection string (or local MongoDB)

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (already generated with secure AES-256 and JWT secrets):
```bash
cp env.example .env
```
Fill in your third-party API credentials:
- `GEMINI_API_KEY`: Free-tier key from Google AI Studio.
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console with Gmail, Calendar, and Tasks APIs enabled.
- `TELEGRAM_BOT_TOKEN`: From @BotFather on Telegram.
- `HUBSPOT_PRIVATE_APP_TOKEN`: From HubSpot Private Apps.

### 3. Install Dependencies & Run
From the root directory:
```bash
# Run backend server (port 5000)
npm run dev:server

# In a separate terminal, run frontend client (port 5173)
npm run dev:client
```
Open **http://localhost:5173** to access the dashboard.

---

## 🧪 Running Automated Tests

Run the test suite covering token encryption, approval gates, and intent classification:
```bash
npm test
```

---

## 📱 Channel Webhook Endpoints

| Channel | Method | Endpoint | Verification |
|---|---|---|---|
| Telegram | `POST` | `/api/webhooks/telegram` | `X-Telegram-Bot-Api-Secret-Token` header |
| WhatsApp (Meta) | `GET` | `/api/webhooks/whatsapp` | Webhook subscription challenge (`hub.verify_token`) |
| WhatsApp (Meta) | `POST` | `/api/webhooks/whatsapp` | `X-Hub-Signature-256` HMAC validation |
| WhatsApp (Twilio) | `POST` | `/api/webhooks/whatsapp` | Direct payload adapter |

---

## ⚙️ Automated Summaries Scheduler

- Configured using `node-cron` in `server/src/jobs/summaryJobs.ts`.
- Defaults to user's timezone (`Asia/Amman`).
- **Morning Summary (default 08:00):** Today's calendar events, unread high-priority emails, pending tasks.
- **Evening Summary (default 19:00):** Daily accomplishments, tomorrow's first meetings, stale HubSpot leads needing follow-up.
- Delivered automatically to Telegram, WhatsApp, or Dashboard based on user preferences.
