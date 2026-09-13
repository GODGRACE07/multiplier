import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.join(__dirname, '../../multiplier.db');
export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS multiplier_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    network TEXT NOT NULL,
    multiplier REAL NOT NULL,
    activation_timestamp TEXT,
    fetched_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS corporate_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    network TEXT NOT NULL,
    event_type TEXT NOT NULL,
    old_multiplier REAL NOT NULL,
    new_multiplier REAL NOT NULL,
    ratio REAL NOT NULL,
    detected_at TEXT NOT NULL,
    activation_timestamp TEXT,
    explanation TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_symbol ON multiplier_snapshots(symbol);
  CREATE INDEX IF NOT EXISTS idx_events_symbol ON corporate_events(symbol);
`);

export interface MultiplierSnapshot {
  id?: number;
  symbol: string;
  network: string;
  multiplier: number;
  activation_timestamp: string | null;
  fetched_at: string;
}

export interface CorporateEvent {
  id?: number;
  symbol: string;
  network: string;
  event_type: 'DIVIDEND' | 'SPLIT' | 'REVERSE_SPLIT' | 'UNKNOWN';
  old_multiplier: number;
  new_multiplier: number;
  ratio: number;
  detected_at: string;
  activation_timestamp: string | null;
  explanation: string;
}

export function insertSnapshot(snap: MultiplierSnapshot) {
  const stmt = db.prepare(`
    INSERT INTO multiplier_snapshots (symbol, network, multiplier, activation_timestamp, fetched_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(snap.symbol, snap.network, snap.multiplier, snap.activation_timestamp, snap.fetched_at);
}

export function getLatestSnapshot(symbol: string, network: string): MultiplierSnapshot | undefined {
  const stmt = db.prepare(`
    SELECT * FROM multiplier_snapshots
    WHERE symbol = ? AND network = ?
    ORDER BY fetched_at DESC
    LIMIT 1
  `);
  return stmt.get(symbol, network) as MultiplierSnapshot | undefined;
}

export function insertEvent(event: CorporateEvent) {
  const stmt = db.prepare(`
    INSERT INTO corporate_events
      (symbol, network, event_type, old_multiplier, new_multiplier, ratio, detected_at, activation_timestamp, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    event.symbol, event.network, event.event_type, event.old_multiplier,
    event.new_multiplier, event.ratio, event.detected_at, event.activation_timestamp, event.explanation
  );
}

export function getEventsForSymbol(symbol: string): CorporateEvent[] {
  const stmt = db.prepare(`SELECT * FROM corporate_events WHERE symbol = ? ORDER BY detected_at DESC`);
  return stmt.all(symbol) as CorporateEvent[];
}

export function getAllEvents(): CorporateEvent[] {
  const stmt = db.prepare(`SELECT * FROM corporate_events ORDER BY detected_at DESC LIMIT 100`);
  return stmt.all() as CorporateEvent[];
}
