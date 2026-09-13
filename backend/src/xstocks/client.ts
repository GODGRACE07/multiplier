import 'dotenv/config';

const BASE = process.env.XSTOCKS_API_BASE || 'https://api.xstocks.fi/api/v2/public';

export interface MultiplierResponse {
  currentMultiplier: number;
  newMultiplier: number;
  activationDateTime: number;
  reason: string | null;
}

export interface MultiplierHistoryEntry {
  id: string;
  reason: string;
  multiplier: number;
  previousMultiplier: number;
  activationDateTime: string;
}

export async function fetchCurrentMultiplier(
  symbol: string,
  network: string
): Promise<MultiplierResponse> {
  const url = `${BASE}/assets/${symbol}/multiplier?network=${network}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`xStocks API error for ${symbol}: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

export async function fetchMultiplierHistory(
  symbol: string,
  network: string,
  pageSize = 20
): Promise<MultiplierHistoryEntry[]> {
  const url = `${BASE}/assets/${symbol}/multiplier/history?page=0&pageSize=${pageSize}&network=${network}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`xStocks API error for ${symbol} history: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.nodes || [];
}

export async function fetchPriceData(symbol: string) {
  const url = `${BASE}/assets/${symbol}/price-data`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`xStocks API error for ${symbol} price: ${res.status} ${res.statusText}`);
  }
  return res.json();
}