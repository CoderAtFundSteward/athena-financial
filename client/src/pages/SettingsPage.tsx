export function SettingsPage() {
  return (
    <div className="page-inner">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-lede">
          Workspace preferences, integrations, and access. Keep sensitive controls scoped to this
          section.
        </p>
      </header>
      <div className="card card--stretch">
        <p className="muted">Environment variables and API keys stay on the server; surface safe toggles here.</p>
      </div>
    </div>
  );
}
