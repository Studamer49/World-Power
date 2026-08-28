import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /all - Get all snapshot days
router.get('/all', async (_req, res) => {
  try {
    const snapshots = await prisma.dailySnapshot.findMany({
      select: { gameDay: true },
      distinct: ['gameDay'],
      orderBy: { gameDay: 'desc' },
    });
    res.json(snapshots.map((s) => s.gameDay));
  } catch (error) {
    console.error('Error fetching snapshot days:', error);
    res.status(500).json({ error: 'Failed to fetch snapshot days' });
  }
});

// GET - Get snapshots for a day
router.get('/', async (req, res) => {
  try {
    const { day } = req.query;
    if (!day) {
      res.status(400).json({ error: 'Day parameter required' });
      return;
    }

    const snapshots = await prisma.dailySnapshot.findMany({
      where: { gameDay: parseInt(day as string) },
    });

    const parsed = snapshots.map((s) => ({
      ...s,
      data: JSON.parse(s.data || '{}'),
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

// POST - Create snapshot
router.post('/', async (req, res) => {
  try {
    const snapshot = await prisma.dailySnapshot.create({
      data: {
        gameDay: req.body.gameDay,
        date: req.body.date || '',
        countryId: req.body.countryId,
        data: JSON.stringify(req.body.data || {}),
      },
    });
    res.status(201).json({ ...snapshot, data: JSON.parse(snapshot.data || '{}') });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

export default router;
