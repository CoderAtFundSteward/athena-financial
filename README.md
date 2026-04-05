# Athena Financial

Nonprofit-focused cash flow product: organizations create a **profile**, choose **connectors** (banks, accounting tools, giving platforms, spreadsheets, and files), and view **holistic cash flow** from normalized transactions. The public marketing experience is modeled after the clarity of tools like [Rocket Money](https://www.rocketmoney.com/) while serving mission-driven finance teams.

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

**Steps**

1. Push this project to GitHub and **Import** it in the Vercel dashboard (root directory = repository root).
2. Vercel will run `installCommand` → `buildCommand` from `vercel.json` (`install:all`, then `vercel-build`).
3. When you buy a domain, add it under **Project → Settings → Domains** and turn on the recommended DNS. Set **`CLIENT_URL`** in **Settings → Environment Variables** to your canonical HTTPS origin (e.g. `https://www.yourdomain.org`) for consistent CORS if you ever call the API from another origin.

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
git remote add origin https://github.com/YOUR_USER/athena-financial.git
git push -u origin main
```
