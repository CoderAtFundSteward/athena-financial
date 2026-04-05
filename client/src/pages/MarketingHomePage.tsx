import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type PublicStats = {
  organizationsHelped: number;
  transactionsSyncedDisplay: string;
  partnerConnectors: number;
  tagline: string;
};

const defaultStats: PublicStats = {
  organizationsHelped: 2400,
  transactionsSyncedDisplay: '12M+',
  partnerConnectors: 8,
  tagline: 'Nonprofits use Athena Financial to see cash flow across every account they rely on.',
};

function formatOrgs(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export function MarketingHomePage() {
  const [stats, setStats] = useState<PublicStats>(defaultStats);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PublicStats | null) => {
        if (!cancelled && data && typeof data.organizationsHelped === 'number') {
          setStats({ ...defaultStats, ...data });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="marketing">
      <header className="marketing-nav">
        <div className="marketing-nav-inner">
          <span className="marketing-logo">
            <span className="brand-mark" aria-hidden />
            Athena Financial
          </span>
          <div className="marketing-nav-actions">
            <Link to="/app/overview" className="btn btn-ghost">
              Sign in
            </Link>
            <Link to="/app/connectors" className="btn btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="marketing-hero">
        <div className="marketing-hero-inner">
          <p className="marketing-eyebrow">Built for nonprofit finance teams</p>
          <h1 className="marketing-headline">
            One place to connect every account—and understand cash flow.
          </h1>
          <p className="marketing-subhead">{stats.tagline}</p>
          <div className="marketing-hero-cta">
            <Link to="/app/connectors" className="btn btn-primary btn-lg">
              Connect your sources
            </Link>
            <Link to="/app/overview" className="btn btn-outline btn-lg">
              Open dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="marketing-stats" aria-label="Impact">
        <div className="marketing-stats-inner">
          <article className="stat-card">
            <p className="stat-value">{formatOrgs(stats.organizationsHelped)}+</p>
            <p className="stat-label">Organizations we&apos;ve helped plan with clearer cash visibility</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{stats.transactionsSyncedDisplay}</p>
            <p className="stat-label">Transactions aggregated for analysis across connected sources</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{stats.partnerConnectors}+</p>
            <p className="stat-label">Ways to bring in banks, platforms, spreadsheets, and files</p>
          </article>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-section-inner">
          <h2 className="marketing-section-title">What Athena Financial tracks</h2>
          <p className="marketing-section-lede">
            Pull activity from the places your mission already runs—then roll it into a single view of
            liquidity, runway, and where cash is moving.
          </p>
          <ul className="marketing-list">
            <li>
              <strong>Operating accounts &amp; cards</strong> — balances and transactions from linked
              financial institutions (via Plaid) so daily cash is always current.
            </li>
            <li>
              <strong>Accounting &amp; spend platforms</strong> — QuickBooks, Ramp, and similar systems
              where your books and corporate cards already live.
            </li>
            <li>
              <strong>Giving &amp; grants</strong> — Tithely, Benevity, and other donation or
              workplace-giving flows that affect cash timing.
            </li>
            <li>
              <strong>Spreadsheets &amp; files</strong> — Google Sheets, Microsoft Excel, CSV, or plain
              text exports your team already maintains.
            </li>
          </ul>
        </div>
      </section>

      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section-inner">
          <h2 className="marketing-section-title">How it works</h2>
          <ol className="marketing-steps">
            <li>
              <span className="marketing-step-num">1</span>
              <div>
                <h3 className="marketing-step-title">Create your organization profile</h3>
                <p className="muted">
                  Tell us who you are and which programs or funds you want to monitor—so reporting stays
                  aligned with your mission.
                </p>
              </div>
            </li>
            <li>
              <span className="marketing-step-num">2</span>
              <div>
                <h3 className="marketing-step-title">Choose connectors</h3>
                <p className="muted">
                  Link bank and card accounts through Plaid, plus accounting, giving, and file-based
                  sources—each connection is explicit and revocable.
                </p>
              </div>
            </li>
            <li>
              <span className="marketing-step-num">3</span>
              <div>
                <h3 className="marketing-step-title">See holistic cash flow</h3>
                <p className="muted">
                  We normalize transactions into a timeline you can slice by account, source, and time—so
                  leadership sees one story, not ten tabs.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="marketing-cta-band">
        <div className="marketing-cta-inner">
          <h2 className="marketing-cta-title">Ready to unify nonprofit cash flow?</h2>
          <p className="marketing-cta-copy">
            Start by connecting the accounts and tools you already use—no rip-and-replace required.
          </p>
          <Link to="/app/connectors" className="btn btn-primary btn-lg">
            Set up connectors
          </Link>
        </div>
      </section>

      <footer className="marketing-footer">
        <div className="marketing-footer-inner">
          <p className="marketing-footer-brand">Athena Financial</p>
        </div>
      </footer>
    </div>
  );
}
