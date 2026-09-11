# AI Personal Assistant (MERN Stack)

A production-grade AI personal and business executive assistant, built on the **MERN** stack (Node.js + Express + TypeScript, MongoDB Atlas with Mongoose, React + Vite + TypeScript + Tailwind CSS).

Connects seamlessly to **Gmail, Google Calendar, Google Tasks, and Telegram**, with a strict human-in-the-loop approval gate for all critical communications.

---

## 🔒 Core Invariants & Security Principles

1. **Strict Human-in-the-Loop Approval Gate ("YES SEND"):**
   - Outbound emails and critical external communications are **never sent autonomously**.
   - AI drafts are stored in MongoDB as `PendingAction` with status `awaiting_approval`.
   - The user is alerted instantly via Telegram or the Web Dashboard.
   - Delivery is executed **only** upon receiving an explicit **"YES SEND"** command via Telegram or clicking the **Approve** button in the dashboard.
   - Any alternative reply is treated as an iterative edit instruction or rejection.
   - Pending actions auto-expire after 24 hours (configurable TTL).

2. **Encryption at Rest (AES-256-GCM):**
   - Google OAuth2 access and refresh tokens are encrypted at rest using **AES-256-GCM** with a 32-byte secret key before database insertion. Plaintext tokens are never stored.

3. **Multi-Tenant User Isolation:**
   - Every database collection (tokens, actions, logs, settings) is indexed by `userId`.
   - Each authenticated user operates within their own isolated data partition.

4. **Reliable Database Architecture:**
   - Connects directly to **MongoDB Atlas** in production.
   - Automatically provisions an embedded in-memory database fallback during local offline development.

---

## 📁 Architecture & Directory Layout

```
ai-assistant/
├── client/                         # React frontend (Vite, TypeScript, Tailwind CSS)
│   ├── src/
│   │   ├── components/             # Navbar, ApprovalCard, ActivityTable, ChatWidget
│   │   ├── pages/                  # Dashboard, Approvals, Calendar/Tasks, Logs, Settings, Login
│   │   ├── lib/                    # Axios API client & token utilities
│   │   └── styles/                 # Dark depth design system & custom utilities
│   └── vite.config.ts
├── server/                         # Express + TypeScript backend
│   ├── src/
│   │   ├── config/                 # Typed environment validation with Zod
│   │   ├── controllers/            # Auth, Approvals, Webhooks, Logs, Settings, Assistant
│   │   ├── routes/                 # Express REST route handlers
│   │   ├── services/
│   │   │   ├── gmail/              # Gmail service (fetch unread, summarize, draft, send)
│   │   │   ├── calendar/           # Google Calendar service with conflict detection
│   │   │   ├── tasks/              # Google Tasks service (CRUD operations)
│   │   │   ├── approval/           # ApprovalService (strict "YES SEND" enforcement)
│   │   │   ├── telegram/           # Telegram bot service & interactive message dispatcher
│   │   │   ├── llm/                # LLMProvider (Google Gemini Flash with OpenAI fallback)
│   │   │   └── orchestrator/       # AgentOrchestrator (central natural language intent router)
│   │   ├── models/                 # Mongoose models (User, OAuthToken, PendingAction, ActivityLog, Setting)
│   │   ├── middleware/             # Auth (JWT), rate limiting, webhook verification
│   │   ├── jobs/                   # node-cron scheduled morning/evening summaries & reminder jobs
│   │   └── server.ts               # Server bootstrap & MongoDB connection
│   └── tests/                      # Vitest test suite
├── .gitignore                      # Strict secret & build exclusion rules
└── package.json                    # Monorepo management scripts
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v22/v25)
- **MongoDB**: MongoDB Atlas cluster or local MongoDB instance

### 2. Environment Variables (.env)
Create a `.env` file in the project root with the following keys:
```env
# Server
NODE_ENV="development"
PORT="5001"
CLIENT_URL="http://localhost:5173"

# Database
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/assistant_db?retryWrites=true&w=majority"

# Security & Encryption
JWT_SECRET="<random_64_char_hex_key>"
ENCRYPTION_KEY="<32_byte_hex_string_for_aes256>"

# Google Cloud OAuth (Gmail, Calendar, Tasks)
GOOGLE_CLIENT_ID="<your_google_client_id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<your_google_client_secret>"
GOOGLE_REDIRECT_URI="http://localhost:5001/api/auth/google/callback"

# Telegram Bot
TELEGRAM_BOT_TOKEN="<your_telegram_bot_token>"
TELEGRAM_WEBHOOK_SECRET="<your_webhook_secret_key>"

# AI Intelligence
GEMINI_API_KEY="<your_gemini_api_key>"
OPENAI_API_KEY=""   # Optional fallback

# Scheduling & Localization
DEFAULT_TIMEZONE="Asia/Kolkata"
MORNING_SUMMARY_TIME="08:00"
EVENING_SUMMARY_TIME="19:00"
```

### 3. Install Dependencies & Run Locally
```bash
# Install dependencies across server and client
npm install --prefix server
npm install --prefix client

# Run backend server (Port 5001)
npm run dev:server

# In a separate terminal, run frontend client (Port 5173)
npm run dev:client
```
Navigate to **http://localhost:5173** to access the dashboard.

---

## 🌐 Production Deployment Guide

### A. Deploy Backend to Render (Free Web Service)
1. Link your GitHub repository (`Agent_1`) on [Render.com](https://render.com).
2. Configure settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Environment Variables:** Populate all production keys from `.env`.
   - Update `CLIENT_URL` to your live Vercel URL.
   - Update `GOOGLE_REDIRECT_URI` to `https://<render-backend-url>/api/auth/google/callback`.

### B. Deploy Frontend to Vercel (Free Web Hosting)
1. Import the repository on [Vercel.com](https://vercel.com).
2. Select **Root Directory:** `client`.
3. Set Environment Variable:
   - `VITE_API_URL` = `https://<render-backend-url>`
4. Deploy to receive your production URL.

### C. Google Cloud Console Configuration
1. Under **APIs & Services > Credentials > OAuth 2.0 Client IDs**:
   - **Authorized JavaScript Origins:** Add your Vercel URL (e.g., `https://your-assistant.vercel.app`).
   - **Authorized Redirect URIs:** Add `https://<render-backend-url>/api/auth/google/callback`.
2. Under **OAuth Consent Screen**:
   - Set Publishing Status to **"Publish App" (In Production)** so any Google user can authenticate directly without manual onboarding.

---

## 🧪 Testing & Validation

Execute the automated test suite covering token encryption, approval gates, and intent classification:
```bash
npm test --prefix server
```

---

## ⚙️ Automated Schedulers

1. **Daily Digest (node-cron):**
   - **Morning Briefing (08:00):** Calendar agenda, unread urgent emails, and due tasks.
   - **Evening Briefing (19:00):** Day's accomplishments and preview of tomorrow's schedule.
2. **Proactive Reminder Engine (every 1 minute):**
   - Automatically polls upcoming meetings (15-min warning) and tasks reaching their due time.
   - Dispatches actionable notifications directly to the user's linked Telegram chat.
