import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './prisma';

import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import countriesRoutes from './routes/countries';
import battlesRoutes from './routes/battles';
import warsRoutes from './routes/wars';
import territoriesRoutes from './routes/territories';
import treatiesRoutes from './routes/treaties';
import militaryRoutes from './routes/military';
import expensesRoutes from './routes/expenses';
import moneyChangesRoutes from './routes/money-changes';
import mpChangesRoutes from './routes/mp-changes';
import notesRoutes from './routes/notes';
import snapshotsRoutes from './routes/snapshots';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
// Normalize so a trailing slash or path (e.g. ".../World-Power/") never leaks
// into the CORS origin header. CORS origins are scheme://host[:port] only.
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '').replace(/(https?:\/\/[^/]+)\/.*$/i, '$1');

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/battles', battlesRoutes);
app.use('/api/wars', warsRoutes);
app.use('/api/territories', territoriesRoutes);
app.use('/api/treaties', treatiesRoutes);
app.use('/api/military', militaryRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/money-changes', moneyChangesRoutes);
app.use('/api/mp-changes', mpChangesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/snapshots', snapshotsRoutes);

// Start server
async function start() {
  try {
    // Prisma health check
    await prisma.$connect();
    console.log('✓ Database connected');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
      console.log(`✓ Frontend URL: ${FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

start();