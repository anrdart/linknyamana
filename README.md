# LinkNyaMana

Domain monitoring and management dashboard for tracking website uptime, registration/expiry dates, and WordPress setup progress across multiple categories and teams.

## Features

- **Uptime Monitoring** — Real-time domain status checking with configurable concurrency
- **Expiry Tracking** — Registration and expiry date management with countdown badges
- **Search & Filter** — Filter by status (online/offline), category, and expiry range (7/14/30/60 days)
- **Archive System** — Mark domains as inactive without deleting them
- **Email Notifications** — Multi-recipient expiry alerts via Resend API
- **User Management** — Role-based access control (staffwebdev = admin) with per-user category assignment
- **WordPress Progress** — Checklist tracking for WordPress site setup tasks
- **Responsive UI** — Mobile-first layout with sidebar navigation
- **Auto-Refresh** — Status checks every 15 minutes

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6 + React 19 |
| Styling | Tailwind CSS 4, Radix UI, Lucide Icons |
| Runtime | Cloudflare Workers (via @astrojs/cloudflare) |
| Database | Neon PostgreSQL (serverless driver) |
| Auth | Cookie-based sessions, bcryptjs |
| Email | Resend API |

## Project Structure

```
src/
├── components/          # React UI components
│   ├── Dashboard.tsx    # Main dashboard orchestrator
│   ├── DomainCard.tsx   # Individual domain card
│   ├── StatusSummary.tsx    # Stats cards, filters, search
│   ├── NotificationSettings.tsx  # Email recipient management
│   └── UserManagement.tsx     # User CRUD + category assignment
├── pages/
│   ├── api/             # Server-side API endpoints
│   │   ├── auth/        # Login, logout, session check
│   │   ├── check/       # Domain status checking
│   │   ├── domains/     # Domain CRUD, meta, archive, status-cache
│   │   ├── users/       # User CRUD, category assignment
│   │   ├── notifications/ # Email sending
│   │   └── settings/    # Notification email CRUD
│   └── index.astro      # Entry point (renders AppShell)
├── data/domains.ts      # Domain types, hardcoded domain data
└── lib/
    ├── db.ts            # Neon DB connection helper
    ├── auth.ts          # Session validation, login, logout
    ├── email.ts         # Resend API wrapper
    └── utils.ts         # Tailwind merge utility
```

## Getting Started

### Prerequisites

- Node.js >= 22.12.0
- [Bun](https://bun.sh/)
- [Neon](https://neon.tech/) PostgreSQL database
- [Resend](https://resend.com/) account with verified sending domain
- [Cloudflare](https://dash.cloudflare.com/) account (for deployment)

### Environment Setup

Create `.dev.vars` in the project root (gitignored):

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
RESEND_API_KEY=re_xxxxxxxxxxxx
NOTIFICATION_EMAIL=noreply@yourdomain.com
```

### Install & Run

```sh
bun install
bun dev          # http://localhost:4321
bun build        # Production build to ./dist/
bun preview      # Preview production build locally
```

### Database

Run the schema from `neon-schema.sql` in the Neon console to create required tables.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `RESEND_API_KEY` | Resend API key for sending emails | Yes |
| `NOTIFICATION_EMAIL` | Sender email (must be verified domain in Resend) | Yes |

## Deployment

- Platform: **Cloudflare Pages** with Functions enabled
- Set environment variables in Cloudflare Dashboard > Pages > Settings > Environment Variables
- Ensure Neon database is accessible from Cloudflare Workers (check IP allowlist)
- Connect GitHub repo to Cloudflare Pages for automatic deployments on push

## Access Control

| Action | staffwebdev | Other users |
|---|---|---|
| View domains, status, dates | Yes | Yes (assigned categories only) |
| Edit domain dates | Yes | No |
| Add/edit/delete domains & categories | Yes | No |
| Archive/unarchive domains | Yes | No |
| Manage notification emails | Yes | No |
| Manage users & category assignments | Yes | No |
| Send expiry notifications | Yes | No |
| Track WordPress progress | Yes | Yes (own assigned) |
