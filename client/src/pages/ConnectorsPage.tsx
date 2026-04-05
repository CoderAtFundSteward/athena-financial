import { useState } from 'react';

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

export function ConnectorsPage() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});

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
      </header>

      <div className="connectors-stack">
        {GROUPS.map((group) => (
          <section key={group.id} className="connector-group">
            <h2 className="connector-group-title">{group.title}</h2>
            <p className="connector-group-body muted">{group.body}</p>
            <div className="connector-grid">
              {group.connectors.map((c) => {
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
                    <p className="connector-footnote muted">
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
