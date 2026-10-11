async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  fleet: () => get<import('./types').FleetApp[]>('/api/fleet'),
  dcs: () => get<import('./types').DcRollup[]>('/api/dcs'),
  dcNames: () => get<string[]>('/api/dc-names'),
  appMetrics: (id: string, dc?: string, range?: string) =>
    get<import('./types').AppMetrics>(
      `/api/apps/${id}/metrics?${dc ? `dc=${encodeURIComponent(dc)}&` : ''}${range ? `range=${range}` : ''}`,
    ),
  registerApp: (body: import('./types').AppRegistration) => post<import('./types').AppRegistration>('/api/apps', body),
};
