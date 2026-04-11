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

**Storage:** With **`SUPABASE_URL`** + **`SUPABASE_SERVICE_ROLE_KEY`** set, connections and OAuth state persist in Postgres (required for **Vercel**, where in-memory storage is not shared across instances). Otherwise the app uses an **in-memory** store (fine for local dev only).

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

**Supabase (QuickBooks on Vercel)**

1. Create a project at [supabase.com](https://supabase.com/).
2. In **SQL → New query**, paste and run [`supabase/migrations/001_quickbooks_oauth.sql`](supabase/migrations/001_quickbooks_oauth.sql).
3. In Vercel **Environment Variables** (Production, and Preview if you test PRs), set **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** only. Do **not** expose the service role to the browser.

**Share the app publicly (external testers)**

1. Deploy on Vercel and copy the **production** URL, e.g. `https://athena-financial-xxxx.vercel.app`.
2. **Vercel → Settings → Environment Variables** (at least **Production**):
   - **`CLIENT_URL`** = `https://athena-financial-xxxx.vercel.app` (no trailing slash)
   - **`QB_REDIRECT_URI`** = `https://athena-financial-xxxx.vercel.app/api/integrations/quickbooks/callback` (must match **exactly** what you add in the Intuit Developer portal)
   - **`QUICKBOOKS_CLIENT_ID`**, **`QUICKBOOKS_CLIENT_SECRET`**, **`QUICKBOOKS_ENVIRONMENT`**
   - **`ENCRYPTION_KEY`** = long random string (same value for every deployment instance)
   - **`SUPABASE_URL`**, **`SUPABASE_SERVICE_ROLE_KEY`** (after running the migration SQL)
3. In [developer.intuit.com](https://developer.intuit.com) → your app → **Redirect URIs**, add the same **`QB_REDIRECT_URI`** value.
4. **Redeploy** the Vercel project so new env vars apply.
5. Send testers the site URL; they open **Connectors**, use **Add company**, and complete Intuit sign-in (sandbox or production per `QUICKBOOKS_ENVIRONMENT`).

**Preview deployments** get a different `*.vercel.app` hostname unless you use a fixed **branch** domain—either test on **Production** or duplicate the env vars + Intuit redirect for each preview URL you use.

## GitHub

```bash
git remote add origin https://github.com/CoderAtFundSteward/athena-financial.git
git push -u origin main
```
