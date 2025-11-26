const API_BASE = import.meta?.env?.VITE_API_BASE || '';
const TTL = 25_000;

const _mem = new Map();
const timeoutFetch = (url, ms = 7000) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id));
};

async function getJSONCached(path) {
  const key = path;
  const hit = _mem.get(key);
  const now = Date.now();
  if (hit && now - hit.t < TTL) return hit.data;

  const res = await timeoutFetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  _mem.set(key, { t: now, data });
  return data;
}

export const fetchElectricSummary = () => getJSONCached('/api/energy/electric');
export const fetchThermalSummary  = () => getJSONCached('/api/energy/thermal');
