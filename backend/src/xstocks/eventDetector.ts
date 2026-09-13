import { CorporateEvent } from '../db/database';

export function classifyEvent(oldMultiplier: number, newMultiplier: number): {
  type: CorporateEvent['event_type'];
  explanation: string;
} {
  const ratio = newMultiplier / oldMultiplier;

  if (Math.abs(ratio - 1) < 0.0001) {
    return { type: 'UNKNOWN', explanation: 'No material change detected.' };
  }

  if (ratio > 1 && ratio < 1.5) {
    const pct = ((ratio - 1) * 100).toFixed(2);
    return {
      type: 'DIVIDEND',
      explanation: `Dividend reinvested. Multiplier increased by ${pct}%, meaning your token now represents ${pct}% more underlying equity than before, with no action needed from you.`
    };
  }

  if (ratio >= 1.5) {
    const forSplit = ratio.toFixed(2);
    return {
      type: 'SPLIT',
      explanation: `Stock split detected. Each unit of underlying equity effectively became ~${forSplit}x more tokens; your scaled balance increased proportionally, your raw on-chain balance did not change.`
    };
  }

  if (ratio < 1) {
    const factor = (1 / ratio).toFixed(2);
    return {
      type: 'REVERSE_SPLIT',
      explanation: `Reverse split detected. Approximately ${factor} prior units consolidated into 1; your scaled balance decreased proportionally, your raw on-chain balance did not change.`
    };
  }

  return { type: 'UNKNOWN', explanation: 'Multiplier changed but could not be classified confidently.' };
}