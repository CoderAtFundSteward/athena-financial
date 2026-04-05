# Athena Financial

Web app starter: **React (Vite)** + **Express** + **TypeScript**, aligned with the same stack pattern as the QuickBooks cashflow project.

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

Run API and UI together:

```bash
npm run dev
```

- Client: [http://localhost:5173](http://localhost:5173) — multi-page UI (React Router): Overview, Balances, Cash flow, Reports, Settings
- API: [http://localhost:3001/api/health](http://localhost:3001/api/health)

Or run each side separately: `npm run dev:server` / `npm run dev:client`.

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

Create a repository (e.g. `athena-financial`), then:

```bash
git remote add origin https://github.com/YOUR_USER/athena-financial.git
git push -u origin main
```
