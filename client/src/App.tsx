import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { MarketingHomePage } from './pages/MarketingHomePage';
import { OverviewPage } from './pages/OverviewPage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { BalancesPage } from './pages/BalancesPage';
import { CashFlowPage } from './pages/CashFlowPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketingHomePage />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="connectors" element={<ConnectorsPage />} />
          <Route path="balances" element={<BalancesPage />} />
          <Route path="cash-flow" element={<CashFlowPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
