import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function OnboardPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [indexes, setIndexes] = useState('');
  const [allDcs, setAllDcs] = useState<string[]>([]);
  const [selectedDcs, setSelectedDcs] = useState<Set<string>>(new Set());
  const [errPct, setErrPct] = useState('0.5');
  const [p95Ms, setP95Ms] = useState('300');
  const [availPct, setAvailPct] = useState('99.9');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .dcNames()
      .then((dcs) => {
        setAllDcs(dcs);
        setSelectedDcs(new Set(dcs));
      })
      .catch((e) => setError(String(e)));
  }, []);

  const toggleDc = (dc: string) => {
    setSelectedDcs((prev) => {
      const next = new Set(prev);
      if (next.has(dc)) next.delete(dc);
      else next.add(dc);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Application name is required');
      return;
    }
    if (selectedDcs.size === 0) {
      setError('Select at least one data center');
      return;
    }
    setSubmitting(true);
    try {
      const app = await api.registerApp({
        id: name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''),
        name: name.trim(),
        team: team.trim() || 'unknown',
        dcs: [...selectedDcs],
        indexes: indexes.split(',').map((s) => s.trim()).filter(Boolean),
        slo: {
          errorRatePct: Number(errPct) || 0.5,
          p95LatencyMs: Number(p95Ms) || 300,
          availabilityPct: Number(availPct) || 99.9,
        },
      });
      navigate(`/apps/${app.id}`);
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="container narrow">
      <h2>Register an application</h2>
      <p className="sub" style={{ color: 'var(--muted)', marginBottom: 20 }}>
        Defines the metric contract — the app joins the fleet grid on the next aggregation tick.
      </p>
      <form className="form" onSubmit={submit}>
        <label>
          Application name *
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Order Tracking API" />
        </label>
        <label>
          Owning team
          <input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="e.g. Logistics" />
        </label>
        <label>
          Splunk indexes (comma-separated)
          <input value={indexes} onChange={(e) => setIndexes(e.target.value)} placeholder="e.g. idx_orders (auto if empty)" />
        </label>

        <fieldset>
          <legend>Data centers *</legend>
          <div className="dc-checks">
            {allDcs.map((dc) => (
              <label key={dc} className="check">
                <input
                  type="checkbox"
                  checked={selectedDcs.has(dc)}
                  onChange={() => toggleDc(dc)}
                />
                {dc}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>SLO targets</legend>
          <div className="slo-inputs">
            <label>
              Max error rate %
              <input type="number" step="0.1" min="0" value={errPct} onChange={(e) => setErrPct(e.target.value)} />
            </label>
            <label>
              p95 latency (ms)
              <input type="number" step="10" min="0" value={p95Ms} onChange={(e) => setP95Ms(e.target.value)} />
            </label>
            <label>
              Availability %
              <input type="number" step="0.01" min="0" max="100" value={availPct} onChange={(e) => setAvailPct(e.target.value)} />
            </label>
          </div>
        </fieldset>

        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Registering…' : 'Register app'}
        </button>
      </form>
    </div>
  );
}
