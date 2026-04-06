# Athena Financial

Nonprofit-focused cash flow product: organizations create a **profile**, choose **connectors** (banks, accounting tools, giving platforms, spreadsheets, and files), and view **holistic cash flow** from normalized transactions.

## Stack

**React (Vite)** + **Express** + **TypeScript**. Run the client and API together from the repo root.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ recommended
- npm

## Setup

```bash
cd athena-financial
npm run install:all
cp .env.example .env
```

## Development

Run dev **from this folder** (`athena-financial`), not from the QuickBooks repo—both apps use Vite, and the QuickBooks project is still wired to **5173 / 3001**. Athena Financial defaults to **5280 / 3002** so you can run either project without a port fight.

```bash
cd c:\aMyCursor\Athena-Financial
npm run dev
```

After `cp .env.example .env`, your `.env` should use `PORT=3002` and `CLIENT_URL=http://localhost:5280` (or delete `.env` to rely on the same defaults in code).

| URL | Purpose |
|-----|---------|
| [http://localhost:5280/](http://localhost:5280/) | Marketing site — value prop, impact stats, how it works |
| [http://localhost:5280/app/overview](http://localhost:5280/app/overview) | App shell + dashboard (auth not wired yet) |
| [http://localhost:5280/app/connectors](http://localhost:5280/app/connectors) | Connector catalog — Plaid for **banks/cards**; OAuth/file flows for other sources |
| [http://localhost:3002/api/public/stats](http://localhost:3002/api/public/stats) | Placeholder JSON for “organizations helped” metrics on the homepage |

### QuickBooks Online (OAuth)

1. Create an app at [developer.intuit.com](https://developer.intuit.com) and add **Redirect URI** exactly matching `QB_REDIRECT_URI` in `.env` (default: `http://localhost:3002/api/integrations/quickbooks/callback`).
2. Copy `.env.example` → `.env` and set `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_ENVIRONMENT` (`sandbox` or `production`), and a strong **`ENCRYPTION_KEY`**.
3. Run `npm run dev`, open **Connectors**, use **Add company** to complete Intuit sign-in.
4. Each browser gets a **dev user id** (localStorage) until real login exists; each linked QBO company is a **separate connection profile** (multiple per user).

API (all under `/api/integrations/quickbooks/`): `GET /authorize?userId=…`, OAuth callback, `GET /connections?userId=…`, `DELETE /connections/:id?userId=…`, `GET /connections/:id/accounts?userId=…` (sample chart of accounts).

**Note:** Connection data is **in-memory** in this scaffold—restart clears it. Persist with Supabase/Postgres before production.

### Plaid vs other connectors

**Plaid** is the right integration for **depository and credit accounts at financial institutions**. QuickBooks, Ramp, Tithely, Benevity, Google Sheets, Excel, CSV, and text files are **not** linked through Plaid; they need each vendor’s OAuth/API, Microsoft/Google consent flows, or secure uploads. The UI and copy in the app reflect that split so stakeholders set expectations correctly.

## Production build

```bash
npm run build
```

Start the API after build:

```bash
cd server && npm start
```

Serve the client `client/dist` with any static host, or use `cd client && npm run preview` to smoke-test the bundle.

## Deploy on Vercel (Node.js + HTTPS)

This repo is wired for **[Vercel](https://vercel.com/)** using the [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) model:

- **`src/index.ts`** (repo root) default-exports the Express app so Vercel runs it as a **Node.js serverless function**.
- **`npm run vercel-build`** builds the Vite client, then copies **`client/dist` → `public/`**, which Vercel serves over the **CDN** (Express `static` is not used on Vercel).
- **`vercel.json`** adds SPA rewrites for `/app` routes and security headers (**HSTS**, **nosniff**, **Referrer-Policy**, **Permissions-Policy**). Traffic uses **TLS in transit** on `*.vercel.app` and on your custom domain once you attach it.

**Option A — Dashboard (recommended)**

1. Open [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. **Import** `CoderAtFundSteward/athena-financial` (or your fork).
3. Leave **Root Directory** as **`./`** (repository root, where `vercel.json` lives).
4. **Build & Output:** Vercel reads `vercel.json` — **Install Command** `npm run install:all`, **Build Command** `npm run vercel-build`. Do not point the framework preset only at `client/`; the Express entry is **`src/index.ts`** at the repo root.
5. Click **Deploy**. When it finishes, copy your production URL (e.g. `https://athena-financial-xxx.vercel.app`).
6. In **Project → Settings → Environment Variables**, add **`CLIENT_URL`** = that exact `https://…` URL for **Production** (and **Preview** if you use preview deployments), then **Redeploy** so CORS matches your live origin.
7. Optional: **Settings → Domains** — add your custom domain when DNS is ready.

**Option B — CLI (after login)**

```bash
cd apps/athena-financial   # or your standalone clone
npx vercel@latest login      # complete the browser / device flow
npx vercel@latest link     # link to a new or existing Vercel project
npx vercel@latest --prod   # production deploy
```

The local `.vercel/` folder is gitignored; GitHub integration can still trigger deploys on push.

**Encryption / security (practical checklist)**

- **In transit:** HTTPS on Vercel; browsers talk to your API over TLS.
- **At rest (data):** When you add **Supabase**, Postgres and file storage are encrypted at rest in Supabase’s cloud; you still define **RLS** and never ship **service role** keys to the client.
- **Secrets:** Store `SUPABASE_SERVICE_ROLE_KEY`, Plaid secrets, etc. only in **Vercel env** (Production / Preview) or Supabase Edge secrets—never in the repo.

**Supabase (when you need a database)**

1. Create a project at [supabase.com](https://supabase.com/).
2. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` for **client-side** usage (with Row Level Security). Use `SUPABASE_SERVICE_ROLE_KEY` only in **server-side** routes (future `server/src` or additional Vercel functions)—see `.env.example` placeholders.
3. Install `@supabase/supabase-js` where you read/write data and migrate schema with Supabase SQL migrations.

## GitHub

```bash
git remote add origin https://github.com/CoderAtFundSteward/athena-financial.git
git push -u origin main
```
