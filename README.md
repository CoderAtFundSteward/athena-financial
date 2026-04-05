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

## GitHub

```bash
git remote add origin https://github.com/YOUR_USER/athena-financial.git
git push -u origin main
```
