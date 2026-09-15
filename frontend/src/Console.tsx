import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:4000/api';
const SYMBOLS = ['AAPLx', 'TSLAx', 'SPYx', 'NVDAx', 'QQQx'];

interface BalanceData {
  symbol: string;
  rawAmount: number;
  multiplier: number;
  scaledAmount: number;
  naiveDisplay: number;
  correctDisplay: number;
}

interface TimelineEntry {
  id: string;
  from: number;
  to: number;
  activationDateTime: string;
  reason: string;
  explanation: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function Console() {
  const [symbol, setSymbol] = useState('AAPLx');
  const [rawAmount, setRawAmount] = useState('10');
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = Number(rawAmount) || 0;
      const [balanceRes, timelineRes] = await Promise.all([
        fetch(`${API_BASE}/balance/${symbol}?raw=${raw}`),
        fetch(`${API_BASE}/replay/${symbol}`)
      ]);

      if (!balanceRes.ok || !timelineRes.ok) {
        throw new Error('The Multiplier API is not responding. Start the backend on port 4000 and reload.');
      }

      setBalance(await balanceRes.json());
      const timelineData = await timelineRes.json();
      setTimeline(timelineData.timeline || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [symbol, rawAmount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const driftPct = balance && balance.naiveDisplay > 0
    ? ((balance.correctDisplay / balance.naiveDisplay - 1) * 100)
    : 0;

  const totalDrift = timeline.length > 0
    ? ((timeline[timeline.length - 1].to / timeline[0].from - 1) * 100)
    : 0;

  return (
    <div className="console">
      <header className="console-head">
        <h1>Console</h1>
        <p>
          Pick a stock and a balance. Everything below is fetched live from the
          xStocks public API when the values change.
        </p>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2>Corrected balance</h2>
          <div className="controls">
            <select
              className="mono"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              aria-label="Stock symbol"
            >
              {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              className="mono"
              type="number"
              min="0"
              step="0.0001"
              value={rawAmount}
              onChange={(e) => setRawAmount(e.target.value)}
              aria-label="Raw token amount"
            />
            <span className="unit">raw units</span>
          </div>
        </div>

        {error && <div className="error-row">{error}</div>}

        {!error && balance && (
          <div className="comparison">
            <div className="comparison-row naive">
              <span className="row-label">A naive wallet shows</span>
              <span className="row-value mono">{balance.naiveDisplay.toFixed(6)}</span>
            </div>
            <div className="comparison-row correct">
              <span className="row-label">You actually own</span>
              <span className="row-value mono">{balance.correctDisplay.toFixed(6)}</span>
              {Math.abs(driftPct) > 0.00001 && (
                <span className="drift mono">
                  {driftPct > 0 ? '+' : ''}{driftPct.toFixed(4)}%
                </span>
              )}
            </div>
            <div className="multiplier-note mono">
              current multiplier {balance.multiplier.toFixed(8)}
              <span className="sep"> · </span>
              {timeline.length} recorded {timeline.length === 1 ? 'event' : 'events'}
              {totalDrift > 0 && (
                <>
                  <span className="sep"> · </span>
                  {totalDrift.toFixed(4)}% cumulative since launch
                </>
              )}
            </div>
          </div>
        )}

        {loading && <div className="loading-row">fetching live data…</div>}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Corporate action ledger</h2>
          <span className="panel-sub">every recorded multiplier change for {symbol}</span>
        </div>

        {timeline.length === 0 && !loading && !error && (
          <div className="empty-row">
            No corporate actions recorded for {symbol} yet. Try AAPLx or QQQx.
          </div>
        )}

        <div className="ledger">
          {timeline.map((entry) => {
            const pct = ((entry.to / entry.from - 1) * 100);
            return (
              <div key={entry.id} className="ledger-row">
                <span className="ledger-date mono">{formatDate(entry.activationDateTime)}</span>
                <span className="ledger-diff mono">
                  <span className="ledger-old">{entry.from.toFixed(6)}</span>
                  <span className="ledger-arrow"> → </span>
                  <span className="ledger-new">{entry.to.toFixed(6)}</span>
                </span>
                <span className="ledger-pct mono">+{pct.toFixed(3)}%</span>
                <span className="ledger-reason">{entry.reason}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel api-panel">
        <div className="panel-head">
          <h2>The same data, over HTTP</h2>
          <span className="panel-sub">what a wallet or lending protocol would call</span>
        </div>
        <div className="endpoints mono">
          <div className="endpoint">
            <span className="verb">GET</span> /api/balance/{symbol}?raw={rawAmount || '0'}
          </div>
          <div className="endpoint">
            <span className="verb">GET</span> /api/replay/{symbol}
          </div>
          <div className="endpoint">
            <span className="verb">GET</span> /api/events
          </div>
        </div>
      </section>
    </div>
  );
}

export default Console;