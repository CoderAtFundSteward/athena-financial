import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  app: string;
  timestamp: string;
};

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<HealthResponse>;
      })
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not reach the API. Start the server (npm run dev:server).');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">Athena Financial</h1>
        <p className="subtitle">TypeScript · React · Express</p>
      </header>
      <main className="card">
        <h2 className="card-title">API status</h2>
        {error && <p className="muted error">{error}</p>}
        {health && (
          <dl className="kv">
            <div>
              <dt>Status</dt>
              <dd>{health.status}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{health.app}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd className="mono">{health.timestamp}</dd>
            </div>
          </dl>
        )}
        {!health && !error && <p className="muted">Checking API…</p>}
      </main>
    </div>
  );
}
