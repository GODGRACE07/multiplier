import { Router } from 'express';
import { getAllEvents, getEventsForSymbol, getLatestSnapshot } from '../db/database';
import { fetchMultiplierHistory, fetchCurrentMultiplier } from '../xstocks/client';
import { TRACKED_SYMBOLS } from '../xstocks/poller';

const router = Router();
const NETWORK = process.env.XSTOCKS_NETWORK || 'Solana';

router.get('/events', (req, res) => {
  res.json(getAllEvents());
});

router.get('/events/:symbol', (req, res) => {
  res.json(getEventsForSymbol(req.params.symbol));
});

router.get('/multiplier/:symbol', async (req, res) => {
  try {
    const live = await fetchCurrentMultiplier(req.params.symbol, NETWORK);
    const cached = getLatestSnapshot(req.params.symbol, NETWORK);
    res.json({ live, cached });
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

router.get('/balance/:symbol', async (req, res) => {
  const rawAmount = Number(req.query.raw) || 1;
  try {
    const live = await fetchCurrentMultiplier(req.params.symbol, NETWORK);
    res.json({
      symbol: req.params.symbol,
      rawAmount,
      multiplier: live.currentMultiplier,
      scaledAmount: rawAmount * live.currentMultiplier,
      naiveDisplay: rawAmount,
      correctDisplay: rawAmount * live.currentMultiplier
    });
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

router.get('/replay/:symbol', async (req, res) => {
  try {
    const history = await fetchMultiplierHistory(req.params.symbol, NETWORK, 20);

    // API returns newest-first; reverse to chronological order for a natural timeline
    const chronological = [...history].reverse();

    const timeline = chronological.map(entry => {
      const pct = ((entry.multiplier / entry.previousMultiplier - 1) * 100).toFixed(3);
      return {
        id: entry.id,
        from: entry.previousMultiplier,
        to: entry.multiplier,
        activationDateTime: entry.activationDateTime,
        reason: entry.reason,
        explanation: `${entry.reason}: multiplier changed from ${entry.previousMultiplier.toFixed(6)} to ${entry.multiplier.toFixed(6)} (+${pct}%), effective ${entry.activationDateTime}.`
      };
    });

    res.json({ symbol: req.params.symbol, timeline });
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

router.get('/symbols', (req, res) => {
  res.json(TRACKED_SYMBOLS);
});

export default router;