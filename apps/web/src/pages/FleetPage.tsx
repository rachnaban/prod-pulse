import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { FleetApp, DcRollup } from '../types';

export default function FleetPage() {
  const [apps, setApps] = useState<FleetApp[]>([]);
  const [dcs, setDcs] = useState<DcRollup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [f, d] = await Promise.all([api.fleet(), api.dcs()]);
        if (!alive) return;
        setApps(f);
        setDcs(d);
        setError(null);
      } catch (e) {
        if (alive) setError(String(e));
      } finally {
        if (alive) setLoaded(true);
      }
    };
    void load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (error) return <div className="error">API unreachable: {error}</div>;
  if (!loaded) return <div className="loading">Loading fleet…</div>;

  const dcNames = apps[0]?.dcs.map((d) => d.dc) ?? [];

  return (
    <div className="container">
      <div className="dc-cards">
        {dcs.map((d) => (
          <div className="dc-card" key={d.dc}>
            <div className="name">{d.dc}</div>
            <div className={`badge ${d.avgScore >= 90 ? 'green' : d.avgScore >= 70 ? 'amber' : 'red'}`}>
              {d.avgScore}
            </div>
            <div className="meta">
              {d.apps} apps · {d.totalRpm.toLocaleString()} rpm · {d.avgErrorRatePct}% err
            </div>
          </div>
        ))}
      </div>

      <div className="legend">
        <span><span className="dot" style={{ background: 'var(--green)' }} />≥ 90</span>
        <span><span className="dot" style={{ background: 'var(--amber)' }} />70–89</span>
        <span><span className="dot" style={{ background: 'var(--red)' }} />{'< 70'}</span>
        <span>· auto-refresh 30s</span>
      </div>

      <table className="grid">
        <thead>
          <tr>
            <th>Application</th>
            <th>Team</th>
            <th>Worst</th>
            {dcNames.map((dc) => (
              <th key={dc}>{dc.replace('dc-', '')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id}>
              <td>
                <Link to={`/apps/${app.id}`}>{app.name}</Link>
              </td>
              <td>{app.team}</td>
              <td>
                <span className={`cell ${app.worstScore >= 90 ? 'green' : app.worstScore >= 70 ? 'amber' : 'red'}`}>
                  {app.worstScore}
                </span>
              </td>
              {app.dcs.map((d) => (
                <td key={d.dc}>
                  <Link to={`/apps/${app.id}?dc=${encodeURIComponent(d.dc)}`}>
                    <span className={`cell ${d.band} ${d.stale ? 'stale' : ''}`} title={`${d.rpm} rpm · p95 ${d.p95Ms}ms · err ${d.errorRatePct}%`}>
                      {d.score}
                    </span>
                  </Link>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
