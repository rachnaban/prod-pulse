import { Routes, Route, Link } from 'react-router-dom';
import FleetPage from './pages/FleetPage';
import AppDetailPage from './pages/AppDetailPage';
import OnboardPage from './pages/OnboardPage';

export default function App() {
  return (
    <>
      <header className="header">
        <Link to="/">
          <h1>ProdPulse</h1>
        </Link>
        <span className="sub">Fleet health · 8 data centers · Splunk Cloud</span>
        <nav className="header-nav">
          <Link to="/onboard">+ Register app</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<FleetPage />} />
        <Route path="/apps/:appId" element={<AppDetailPage />} />
        <Route path="/onboard" element={<OnboardPage />} />
      </Routes>
    </>
  );
}
