import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getOrCreateDevUserId } from '../lib/athenaDevUser';

type ConnectorKind = 'plaid' | 'oauth' | 'file';

type Connector = {
  id: string;
  name: string;
  description: string;
  kind: ConnectorKind;
};

type ConnectorGroup = {
  id: string;
  title: string;
  body: string;
  connectors: Connector[];
};

type QBOConnectionListItem = {
  id: string;
  realmId: string;
  companyName: string | null;
  environment: string;
  createdAt: string;
};

const GROUPS: ConnectorGroup[] = [
  {
    id: 'banks',
    title: 'Bank & card accounts (Plaid)',
    body: 'Depository and credit accounts at banks and credit unions are linked through Plaid. That is the supported path for reading balances and transactions from traditional financial institutions—not for systems like QuickBooks or spreadsheets, which use the connectors below.',
    connectors: [
      {
        id: 'plaid-institutions',
        name: 'Banks & credit unions',
        description:
          'Connect checking, savings, and credit card accounts. Plaid handles institution authentication and secure access tokens.',
        kind: 'plaid',
      },
    ],
  },
  {
    id: 'platforms',
    title: 'Accounting, spend & operations',
    body: 'These platforms hold their own ledgers and APIs. Integrations typically use each vendor’s OAuth or partner APIs (implemented next on the server)—not Plaid.',
    connectors: [
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        description: 'Sync chart of accounts, bank feeds, and categorized transactions from Intuit.',
        kind: 'oauth',
      },
      {
        id: 'ramp',
        name: 'Ramp',
        description: 'Corporate cards and spend policies—pull card transactions and reimbursements.',
        kind: 'oauth',
      },
      {
        id: 'tithely',
        name: 'Tithely',
        description: 'Giving and church management data that impacts deposits and recognition.',
        kind: 'oauth',
      },
      {
        id: 'benevity',
        name: 'Benevity',
        description: 'Workplace giving and grant disbursements tied to your nonprofit.',
        kind: 'oauth',
      },
    ],
  },
  {
    id: 'files',
    title: 'Spreadsheets & files',
    body: 'Upload or link static exports when a live API is not available yet. Files are parsed server-side with validation and audit trails (to be implemented).',
    connectors: [
      {
        id: 'google-sheets',
        name: 'Google Sheets',
        description: 'Read-only access to named ranges or worksheets you authorize.',
        kind: 'oauth',
      },
      {
        id: 'excel',
        name: 'Microsoft Excel',
        description: 'Upload .xlsx workbooks or connect via Microsoft Graph where enabled.',
        kind: 'file',
      },
      {
        id: 'csv',
        name: 'CSV files',
        description: 'Column-mapped imports for transactions, budgets, or donor activity.',
        kind: 'file',
      },
      {
        id: 'text',
        name: 'Text files',
        description: 'Delimited or fixed-width extracts from legacy systems.',
        kind: 'file',
      },
    ],
  },
];

function kindLabel(kind: ConnectorKind) {
  switch (kind) {
    case 'plaid':
      return 'Plaid';
    case 'oauth':
      return 'OAuth / API';
    case 'file':
      return 'Upload / file';
    default:
      return '';
  }
}

function QuickBooksConnectorCard({ userId, reloadSignal }: { userId: string; reloadSignal: number }) {
  const [connections, setConnections] = useState<QBOConnectionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const [accountsById, setAccountsById] = useState<Record<string, { name: string; type?: string }[]>>({});
  const [accountsLoading, setAccountsLoading] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/integrations/quickbooks/connections?userId=${encodeURIComponent(userId)}`);
      const data = (await r.json()) as { connections?: QBOConnectionListItem[]; error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setConnections(data.connections ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load connections');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections, reloadSignal]);

  async function startConnect() {
    setConnectBusy(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/integrations/quickbooks/authorize?userId=${encodeURIComponent(userId)}`,
      );
      const data = (await r.json()) as { authUri?: string; error?: string; hint?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      if (data.authUri) window.location.href = data.authUri;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start QuickBooks');
    } finally {
      setConnectBusy(false);
    }
  }

  async function disconnect(id: string) {
    setError(null);
    try {
      const r = await fetch(
        `/api/integrations/quickbooks/connections/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`,
        { method: 'DELETE' },
      );
      if (!r.ok) {
        const data = (await r.json()) as { error?: string };
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      await loadConnections();
      setAccountsById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Disconnect failed');
    }
  }

  async function loadSampleAccounts(connectionId: string) {
    setAccountsLoading(connectionId);
    setError(null);
    try {
      const r = await fetch(
        `/api/integrations/quickbooks/connections/${encodeURIComponent(connectionId)}/accounts?userId=${encodeURIComponent(userId)}`,
      );
      const data = (await r.json()) as {
        accounts?: { id: string; name: string; type?: string }[];
        error?: string;
        detail?: string;
      };
      if (!r.ok) throw new Error(data.detail || data.error || `HTTP ${r.status}`);
      setAccountsById((prev) => ({
        ...prev,
        [connectionId]: data.accounts ?? [],
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read accounts');
    } finally {
      setAccountsLoading(null);
    }
  }

  return (
    <article className="connector-card connector-card--qb">
      <div className="connector-card-top">
        <div>
          <h3 className="connector-name">QuickBooks</h3>
          <span className="connector-badge connector-badge--oauth">OAuth / API</span>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={connectBusy}
          onClick={() => void startConnect()}
        >
          {connectBusy ? 'Redirecting…' : 'Add company'}
        </button>
      </div>
      <p className="muted connector-desc">
        Each linked company is its own connection profile (separate OAuth tokens). Sign in with Intuit
        when prompted—passwords are never stored here.
      </p>
      {error && <p className="muted error connector-inline-msg">{error}</p>}
      {loading ? (
        <p className="muted connector-footnote">Loading connections…</p>
      ) : connections.length === 0 ? (
        <p className="muted connector-footnote">No QuickBooks companies linked yet.</p>
      ) : (
        <ul className="qb-connection-list">
          {connections.map((c) => (
            <li key={c.id} className="qb-connection-row">
              <div className="qb-connection-meta">
                <strong>{c.companyName || 'QuickBooks company'}</strong>
                <span className="muted qb-realm">Realm {c.realmId}</span>
                <span className="muted qb-env">{c.environment}</span>
              </div>
              <div className="qb-connection-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  disabled={accountsLoading === c.id}
                  onClick={() => void loadSampleAccounts(c.id)}
                >
                  {accountsLoading === c.id ? 'Loading…' : 'Load sample accounts'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => void disconnect(c.id)}
                >
                  Disconnect
                </button>
              </div>
              {accountsById[c.id] && accountsById[c.id]!.length > 0 && (
                <ul className="qb-account-preview muted">
                  {accountsById[c.id]!.slice(0, 8).map((a) => (
                    <li key={a.name + (a.type || '')}>
                      {a.name}
                      {a.type ? ` · ${a.type}` : ''}
                    </li>
                  ))}
                  {accountsById[c.id]!.length > 8 && (
                    <li>…and {accountsById[c.id]!.length - 8} more</li>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ConnectorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userId] = useState(() => getOrCreateDevUserId());
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [qbReloadSignal, setQbReloadSignal] = useState(0);

  useEffect(() => {
    const qb = searchParams.get('qb_connected');
    const qbErr = searchParams.get('qb_error');
    if (qb === '1') setQbReloadSignal((n) => n + 1);
    if (qb || qbErr) {
      const next = new URLSearchParams(searchParams);
      next.delete('qb_connected');
      next.delete('qb_error');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  function toggle(id: string) {
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="page-inner">
      <header className="page-header page-header--wide">
        <h1 className="page-title">Connectors</h1>
        <p className="page-lede">
          Choose where Athena Financial should read transactions from. Bank and card accounts connect
          through <strong>Plaid</strong>. Other systems use their own sign-in flows or file imports—see
          each card below.
        </p>
        <p className="muted connector-dev-user">
          Dev mode: your browser id is <span className="mono">{userId}</span> (used for QuickBooks
          profiles until login ships).
        </p>
      </header>

      <div className="connectors-stack">
        {GROUPS.map((group) => (
          <section key={group.id} className="connector-group">
            <h2 className="connector-group-title">{group.title}</h2>
            <p className="connector-group-body muted">{group.body}</p>
            <div className="connector-grid">
              {group.connectors.map((c) => {
                if (c.id === 'quickbooks') {
                  return (
                    <QuickBooksConnectorCard
                      key={c.id}
                      userId={userId}
                      reloadSignal={qbReloadSignal}
                    />
                  );
                }
                const isOn = Boolean(connected[c.id]);
                return (
                  <article key={c.id} className="connector-card">
                    <div className="connector-card-top">
                      <div>
                        <h3 className="connector-name">{c.name}</h3>
                        <span className={`connector-badge connector-badge--${c.kind}`}>
                          {kindLabel(c.kind)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm ${isOn ? 'btn-outline' : 'btn-primary'}`}
                        onClick={() => toggle(c.id)}
                      >
                        {isOn ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                    <p className="muted connector-desc">{c.description}</p>
                    <p className="muted connector-footnote">
                      {c.kind === 'plaid'
                        ? 'Plaid Link and token exchange will run on the server when wired up.'
                        : 'OAuth redirect or upload flow placeholder—hook to your backend routes next.'}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
