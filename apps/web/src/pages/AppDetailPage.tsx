import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { api } from '../api';
import { AppMetrics } from '../types';

function fmtTime(t: number): string {
  return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AppDetailPage() {
  const { appId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<AppMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dc = params.get('dc') ?? '';
  const range = params.get('range') ?? '24h';

  const load = useCallback(async () => {
    try {
      const d = await api.appMetrics(appId, dc || undefined, range);
      setData(d);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, [appId, dc, range]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, [load]);

  if (error) return <div className="error">Failed to load: {error}</div>;
  if (!data) return <div className="loading">Loading {appId}…</div>;

  const { app, points } = data;

  return (
    <div className="container">
      <div className="controls">
        <Link to="/">← Fleet</Link>
        <h2 style={{ margin: '0 12px 0 0' }}>{app.name}</h2>
        <span className={`badge ${data.band}`}>health {data.score}</span>
        <select
          value={dc || app.dcs[0]}
          onChange={(e) => setParams({ dc: e.target.value, range })}
        >
          {app.dcs.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={range} onChange={(e) => setParams({ dc: dc || app.dcs[0], range: e.target.value })}>
          <option value="1h">1h</option>
          <option value="6h">6h</option>
          <option value="24h">24h</option>
        </select>
        <span className="sub" style={{ color: 'var(--muted)', fontSize: 12 }}>
          index: {app.indexes.join(', ')} · team: {app.team}
        </span>
      </div>

      <div className="charts">
        <div className="panel">
          <h3>Request rate (rpm)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={points}>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={fmtTime} stroke="#8b949e" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8b949e" tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(l) => new Date(Number(l)).toLocaleString()} />
              <Line type="monotone" dataKey="rpm" stroke="#58a6ff" dot={false} name="RPM" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Latency p95 / p99 (ms)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={points}>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={fmtTime} stroke="#8b949e" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8b949e" tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(l) => new Date(Number(l)).toLocaleString()} />
              <Legend />
              <Line type="monotone" dataKey="p95Ms" stroke="#d29922" dot={false} name="p95" />
              <Line type="monotone" dataKey="p99Ms" stroke="#f85149" dot={false} name="p99" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Error rate (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={points}>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={fmtTime} stroke="#8b949e" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8b949e" tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(l) => new Date(Number(l)).toLocaleString()} />
              <Line type="monotone" dataKey="errorRatePct" stroke="#f85149" dot={false} name="error %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Availability (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={points}>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={fmtTime} stroke="#8b949e" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} stroke="#8b949e" tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(l) => new Date(Number(l)).toLocaleString()} />
              <Line type="monotone" dataKey="availabilityPct" stroke="#3fb950" dot={false} name="availability" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="slo">
        SLO targets — error rate ≤ {app.slo.errorRatePct}% · p95 ≤ {app.slo.p95LatencyMs}ms · availability ≥ {app.slo.availabilityPct}%
      </div>
    </div>
  );
}
