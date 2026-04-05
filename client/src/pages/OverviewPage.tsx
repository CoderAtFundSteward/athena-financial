import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  app: string;
  timestamp: string;
};

export function OverviewPage() {
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
        if (!cancelled) setError('API unreachable — run npm run dev:server from the project root.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-inner">
      <header className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-lede">
          Snapshot of workspace status. Use the top navigation to open each area of the app.
        </p>
      </header>
      <section className="grid-2">
        <div className="card">
          <h2 className="card-title">Today</h2>
          <p className="muted">
            This section is ready for balances, alerts, and upcoming items once you connect data
            sources.
          </p>
        </div>
        <div className="card">
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
        </div>
      </section>
    </div>
  );
}
