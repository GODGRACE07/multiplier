import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4000/api';
const SYMBOLS = ['AAPLx', 'TSLAx', 'SPYx', 'NVDAx', 'QQQx'];

const REAL_HISTORY = [
  { multiplier: 1.0, date: 'Aug 14, 2025', reason: 'Dividend' },
  { multiplier: 1.000781855115, date: 'Nov 13, 2025', reason: 'Dividend' },
  { multiplier: 1.0013934869619912, date: 'Feb 12, 2026', reason: 'Dividend' },
  { multiplier: 1.002018559465695, date: 'May 09, 2026', reason: 'Dividend' },
  { multiplier: 1.0026642075893797, date: 'Aug 08, 2026', reason: 'Dividend' },
  { multiplier: 1.0032690125398187, date: 'today', reason: 'current' },
];
const HERO_HOLDING = 10;

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

function App() {
  // --- hero loop ---
  const [heroStep, setHeroStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeroStep((s) => (s + 1) % REAL_HISTORY.length), 1800);
    return () => clearInterval(t);
  }, []);
  const heroCurrent = REAL_HISTORY[heroStep];
  const heroTrueValue = HERO_HOLDING * heroCurrent.multiplier;
  const heroDrift = (heroCurrent.multiplier - 1) * 100;

  // --- tilt-on-scroll for the hero card ---
  const cardRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--rx', `${y * -6}deg`);
    card.style.setProperty('--ry', `${x * 6}deg`);
  };
  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  // --- live console ---
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

  useEffect(() => { loadData(); }, [loadData]);

  const driftPct = balance && balance.naiveDisplay > 0
    ? ((balance.correctDisplay / balance.naiveDisplay - 1) * 100)
    : 0;
  const totalDrift = timeline.length > 0
    ? ((timeline[timeline.length - 1].to / timeline[0].from - 1) * 100)
    : 0;

  return (
    <div className="app">
      <div className="grid-glow" aria-hidden="true" />

      <nav className="topnav">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Multiplier
        </div>
        <div className="navlinks">
          <a href="#problem">Problem</a>
          <a href="#how">How it works</a>
          <a href="#console" className="nav-cta">Try it live</a>
        </div>
      </nav>

      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-tag mono">
          <span className="tag-dot" aria-hidden="true" />
          SOLANA · XSTOCKS · LIVE DATA
        </div>
        <h1 className="hero-title">
          Your stock balance<br />is <span className="grad-text">wrong.</span>
        </h1>
        <p className="hero-lede">
          Tokenized stocks on Solana don't rebase. Your wallet shows the raw number
          and quietly ignores every dividend you've earned. Watch the gap open up —
          this is real AAPL dividend history, not a simulation.
        </p>

        <div
          className="drift-demo"
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="drift-meta">
            <span className="drift-symbol mono">AAPLx</span>
            <span className="drift-holding mono">{HERO_HOLDING} raw units held</span>
          </div>

          <div className="drift-row">
            <span className="drift-label">Your wallet shows</span>
            <span className="drift-value frozen mono">{HERO_HOLDING.toFixed(6)}</span>
          </div>
          <div className="drift-row">
            <span className="drift-label">You actually own</span>
            <span className="drift-value live mono" key={heroStep}>
              {heroTrueValue.toFixed(6)}
            </span>
          </div>

          <div className="drift-timeline">
            <div className="drift-event mono" key={`e-${heroStep}`}>
              {heroCurrent.reason === 'current'
                ? `current multiplier · ${heroCurrent.multiplier.toFixed(8)}`
                : `${heroCurrent.reason} · ${heroCurrent.date} · ${heroCurrent.multiplier.toFixed(6)}`}
            </div>
            <div className="drift-bar">
              <div className="drift-fill" style={{ width: `${(heroStep / (REAL_HISTORY.length - 1)) * 100}%` }} />
            </div>
            <div className="drift-gap mono">gap: +{heroDrift.toFixed(4)}%</div>
          </div>
        </div>

        <a href="#console" className="cta">Check a real balance</a>
      </section>

      {/* ---------- LIVE CONSOLE ---------- */}
      <section id="console" className="panel-section">
        <div className="section-head">
          <span className="eyebrow-line" aria-hidden="true" />
          <h2>Try it live</h2>
        </div>
        <p className="section-lede">
          Pick a stock and an amount. Everything below calls the real xStocks public API.
        </p>

        <div className="panel">
          <div className="panel-head">
            <h3>Corrected balance</h3>
            <div className="controls">
              <select className="mono" value={symbol} onChange={(e) => setSymbol(e.target.value)} aria-label="Stock symbol">
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
                  <span className="drift-tag mono">
                    {driftPct > 0 ? '+' : ''}{driftPct.toFixed(4)}%
                  </span>
                )}
              </div>
              <div className="multiplier-note mono">
                current multiplier {balance.multiplier.toFixed(8)}
                <span className="sep"> · </span>
                {timeline.length} recorded {timeline.length === 1 ? 'event' : 'events'}
                {totalDrift > 0 && (
                  <><span className="sep"> · </span>{totalDrift.toFixed(4)}% cumulative since launch</>
                )}
              </div>
            </div>
          )}

          {loading && <div className="loading-row">fetching live data…</div>}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Corporate action ledger</h3>
            <span className="panel-sub">every recorded multiplier change for {symbol}</span>
          </div>
          {timeline.length === 0 && !loading && !error && (
            <div className="empty-row">No corporate actions recorded for {symbol} yet. Try AAPLx or QQQx.</div>
          )}
          <div className="ledger">
            {timeline.map((entry) => {
              const pct = (entry.to / entry.from - 1) * 100;
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
        </div>

        <div className="panel api-panel">
          <div className="panel-head">
            <h3>The same data, over HTTP</h3>
            <span className="panel-sub">what a wallet or lending protocol would call</span>
          </div>
          <div className="endpoints mono">
            <div className="endpoint"><span className="verb">GET</span> /api/balance/{symbol}?raw={rawAmount || '0'}</div>
            <div className="endpoint"><span className="verb">GET</span> /api/replay/{symbol}</div>
            <div className="endpoint"><span className="verb">GET</span> /api/events</div>
          </div>
        </div>
      </section>

      {/* ---------- PROBLEM + HOW IT WORKS (side by side) ---------- */}
      <div className="two-col">
        <section id="problem" className="text-section">
          <div className="section-head">
            <span className="eyebrow-line" aria-hidden="true" />
            <h2>The problem</h2>
          </div>
          <div className="prose">
            <p>
              On Ethereum and other EVM chains, tokenized stocks rebase automatically —
              a dividend lands and your token count goes up. Solana's xStocks don't:
              your raw balance never changes, a separate multiplier does, and every
              app is expected to fetch and apply it themselves.
            </p>
            <p>
              Most don't. xStocks' own docs say a webhook system for these events is
              still forthcoming. For a holder this is a wrong number. For a lending
              protocol holding it as collateral, it's a solvency risk.
            </p>
          </div>
        </section>

        <section id="how" className="text-section">
          <div className="section-head">
            <span className="eyebrow-line" aria-hidden="true" />
            <h2>How it works</h2>
          </div>
          <ol className="steps">
            <li>
              <span className="step-n mono">1</span>
              <div>
                <h3>Watch</h3>
                <p>A poller reads the xStocks multiplier endpoint on a fixed interval.</p>
              </div>
            </li>
            <li>
              <span className="step-n mono">2</span>
              <div>
                <h3>Detect and classify</h3>
                <p>Each change is recorded with its cause — dividend, split, reverse split.</p>
              </div>
            </li>
            <li>
              <span className="step-n mono">3</span>
              <div>
                <h3>Publish</h3>
                <p>Corrected balances go out over a plain HTTP API — the console above.</p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      {/* ---------- WHO ---------- */}
      <section className="text-section">
        <div className="section-head">
          <span className="eyebrow-line" aria-hidden="true" />
          <h2>Who this is for</h2>
        </div>
        <div className="audience">
          <div className="aud-card">
            <h3>Protocols and builders</h3>
            <p>Lending markets, wallets and portfolio tools that need multiplier-correct pricing. A missed corporate action here is mispriced collateral, not a cosmetic bug.</p>
          </div>
          <div className="aud-card">
            <h3>Holders</h3>
            <p>Anyone holding xStocks who wants to see what they actually own, and a plain record of every dividend that has quietly adjusted their position.</p>
          </div>
        </div>
      </section>

      <footer className="foot">
        <p>Live data from the public xStocks API. Built for the Stocklana hackathon.</p>
      </footer>
    </div>
  );
}

export default App;