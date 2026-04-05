export function SettingsPage() {
  return (
    <div className="page-inner">
      <header className="page-header">
        <h1 className="page-title">Organization profile</h1>
        <p className="page-lede">
          Store the legal name, EIN, fiscal year, and program tags for your nonprofit. Profile fields
          will drive permissions, fund mapping, and which connectors each team member can enable.
        </p>
      </header>
      <div className="card card--stretch">
        <p className="muted">
          Profile form and role-based access are not wired yet. When you add authentication, persist
          organization metadata here and tie it to the connector allow-list for each user.
        </p>
      </div>
    </div>
  );
}
