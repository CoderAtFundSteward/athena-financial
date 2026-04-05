import { NavLink, Outlet } from 'react-router-dom';

const nav: { to: string; label: string; end?: boolean }[] = [
  { to: '/app/overview', label: 'Overview', end: true },
  { to: '/app/connectors', label: 'Connectors' },
  { to: '/app/balances', label: 'Balances' },
  { to: '/app/cash-flow', label: 'Cash flow' },
  { to: '/app/reports', label: 'Reports' },
  { to: '/app/settings', label: 'Settings' },
];

export function AppShell() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand-row">
            <NavLink to="/app/overview" className="brand">
              <span className="brand-mark" aria-hidden />
              Athena Financial
            </NavLink>
            <NavLink to="/" className="topbar-site-link">
              About the product
            </NavLink>
          </div>
          <nav className="nav" aria-label="Primary">
            {nav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={Boolean(end)}
                className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
