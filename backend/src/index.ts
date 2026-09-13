import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events';
import { startPoller } from './xstocks/poller';
import './db/database';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'multiplier-backend' });
});

app.use('/api', eventsRouter);

app.listen(PORT, () => {
  console.log(`Multiplier backend running on http://localhost:${PORT}`);
  startPoller();
});