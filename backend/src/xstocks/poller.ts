import cron from 'node-cron';
import { fetchCurrentMultiplier } from './client';
import { classifyEvent } from './eventDetector';
import { getLatestSnapshot, insertSnapshot, insertEvent } from '../db/database';

const NETWORK = process.env.XSTOCKS_NETWORK || 'Solana';

export const TRACKED_SYMBOLS = ['AAPLx', 'TSLAx', 'SPYx', 'NVDAx', 'QQQx'];

export async function pollOnce() {
  for (const symbol of TRACKED_SYMBOLS) {
    try {
      const current = await fetchCurrentMultiplier(symbol, NETWORK);
      const now = new Date().toISOString();

      const previous = getLatestSnapshot(symbol, NETWORK);

      insertSnapshot({
        symbol,
        network: NETWORK,
        multiplier: current.currentMultiplier,
        activation_timestamp: current.activationDateTime ? String(current.activationDateTime) : null,
        fetched_at: now
      });

      if (previous && previous.multiplier !== current.currentMultiplier) {
        const { type, explanation } = classifyEvent(previous.multiplier, current.currentMultiplier);
        insertEvent({
          symbol,
          network: NETWORK,
          event_type: type,
          old_multiplier: previous.multiplier,
          new_multiplier: current.currentMultiplier,
          ratio: current.currentMultiplier / previous.multiplier,
          detected_at: now,
          activation_timestamp: current.activationDateTime ? String(current.activationDateTime) : null,
          explanation
        });
        console.log(`[EVENT] ${symbol}: ${previous.multiplier} -> ${current.currentMultiplier} (${type})`);
      }
    } catch (err) {
      console.error(`Poll failed for ${symbol}:`, err);
    }
  }
}

export function startPoller() {
  const intervalMinutes = Number(process.env.POLL_INTERVAL_MINUTES) || 5;
  console.log(`Starting poller every ${intervalMinutes} minute(s) for: ${TRACKED_SYMBOLS.join(', ')}`);

  pollOnce();

  cron.schedule(`*/${intervalMinutes} * * * *`, () => {
    pollOnce();
  });
}