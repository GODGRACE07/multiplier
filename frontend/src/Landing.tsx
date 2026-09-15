import { useState, useEffect } from 'react';

// Real AAPLx corporate-action history, pulled from the xStocks public API.
const REAL_HISTORY = [
  { multiplier: 1.0,               date: 'Aug 14, 2025', reason: 'Dividend' },
  { multiplier: 1.000781855115,    date: 'Nov 13, 2025', reason: 'Dividend' },
  { multiplier: 1.0013934869619912, date: 'Feb 12, 2026', reason: 'Dividend' },
  { multiplier: 1.002018559465695,  date: 'May 09, 2026', reason: 'Dividend' },
  { multiplier: 1.0026642075893797, date: 'Aug 08, 2026', reason: 'Dividend' },
  { multiplier: 1.0032690125398187, date: 'today',        reason: 'current' },
];

const HOLDING = 10;

function Landing() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % REAL_HISTORY.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const current = REAL_HISTORY[step];
  const trueValue = HOLDING * current.multiplier;
  const drift = ((current.multiplier - 1) * 100);

  return (
    <div className="landing">
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <h1 className="hero-title">
          Your stock balance is wrong.
        </h1>
        <p className="hero-lede">
          Tokenized stocks on Solana don't rebase. Your wallet shows the raw number
          and quietly ignores every dividend you've earned. Watch the gap open up.
        </p>

        <div className="drift-demo">
          <div className="drift-meta">
            <span className="drift-symbol mono">AAPLx</span>
            <span className="drift-holding mono">{HOLDING} raw units held</span>
          </div>

          <div className="drift-rows">
            <div className="drift-row">
              <span className="drift-label">Your wallet shows</span>
              <span className="drift-value frozen mono">{HOLDING.toFixed(6)}</span>
            </div>

            <div className="drift-row">
              <span className="drift-label">You actually own</span>
              <span className="drift-value live mono" key={step}>
                {trueValue.toFixed(6)}
              </span>
            </div>
          </div>

          <div className="drift-timeline">
            <div className="drift-event mono" key={`e-${step}`}>
              {current.reason === 'current'
                ? `current multiplier · ${current.multiplier.toFixed(8)}`
                : `${current.reason} · ${current.date} · multiplier ${current.multiplier.toFixed(6)}`}
            </div>
            <div className="drift-bar">
              <div
                className="drift-fill"
                style={{ width: `${(step / (REAL_HISTORY.length - 1)) * 100}%` }}
              />
            </div>
            <div className="drift-gap mono">
              gap: {drift > 0 ? '+' : ''}{drift.toFixed(4)}%
            </div>
          </div>
        </div>

        <a href="#/console" className="cta">Check a balance</a>
      </section>

      {/* ---------- PROBLEM ---------- */}
      <section className="section">
        <h2>The problem</h2>
        <div className="prose">
          <p>
            On Ethereum and other EVM chains, tokenized stocks rebase automatically —
            a dividend lands and your token count goes up. On Solana, xStocks work
            differently. Your raw on-chain balance never changes. Instead, a separate
            multiplier is updated, and every application is expected to fetch it and
            apply it themselves.
          </p>
          <p>
            Most don't. Wallets, explorers and portfolio trackers show the raw number,
            which drifts further from the truth with every dividend. xStocks' own
            developer documentation notes that a webhook notification system for these
            events is still forthcoming, and recommends venues pause interactions for
            roughly fifteen minutes around each multiplier activation — a window nothing
            currently monitors in public.
          </p>
          <p>
            For a retail holder this is a wrong number on a screen. For a lending
            protocol holding tokenized equity as collateral, it is a solvency risk.
          </p>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="section">
        <h2>How it works</h2>
        <ol className="steps">
          <li>
            <span className="step-n mono">1</span>
            <div>
              <h3>Watch</h3>
              <p>
                A poller reads the xStocks public multiplier endpoint on a fixed interval
                for every tracked symbol, storing each snapshot with its timestamp.
              </p>
            </div>
          </li>
          <li>
            <span className="step-n mono">2</span>
            <div>
              <h3>Detect and classify</h3>
              <p>
                When a multiplier moves, the change is recorded as a corporate action with
                its old value, new value, ratio and cause — dividend, split or reverse split.
              </p>
            </div>
          </li>
          <li>
            <span className="step-n mono">3</span>
            <div>
              <h3>Publish</h3>
              <p>
                Corrected balances and the full event history are exposed over a plain HTTP
                API that any wallet, dashboard or lending protocol can consume, and rendered
                here in the console.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* ---------- WHO ---------- */}
      <section className="section">
        <h2>Who this is for</h2>
        <div className="audience">
          <div className="aud-card">
            <h3>Protocols and builders</h3>
            <p>
              Lending markets, wallets and portfolio tools that need multiplier-correct
              pricing. A missed corporate action here is mispriced collateral, not a
              cosmetic bug.
            </p>
          </div>
          <div className="aud-card">
            <h3>Holders</h3>
            <p>
              Anyone holding xStocks who wants to see what they actually own, and a plain
              record of every dividend that has quietly adjusted their position.
            </p>
          </div>
        </div>
      </section>

      <section className="section closing">
        <p className="closing-line">
          Every number in the console is fetched live from the xStocks public API.
          Nothing here is simulated.
        </p>
        <a href="#/console" className="cta">Open the console</a>
      </section>
    </div>
  );
}

export default Landing;