import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
          Holistic cash flow for your nonprofit starts with connected sources. Link banks through Plaid,
          then add accounting, giving, and file-based feeds so every inflow and outflow rolls into one
          timeline.
        </p>
        <p className="page-inline-cta">
          <Link to="/app/connectors" className="btn btn-primary btn-sm">
            Manage connectors
          </Link>
        </p>
      </header>
      <section className="grid-2">
        <div className="card">
          <h2 className="card-title">Cash visibility</h2>
          <p className="muted">
            This panel will summarize liquidity, upcoming obligations, and giving-driven deposits once
            transactions are flowing from your connectors.
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
