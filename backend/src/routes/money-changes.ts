import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - List all money changes
router.get('/', async (_req, res) => {
  try {
    const moneyChanges = await prisma.moneyChange.findMany();
    res.json(moneyChanges);
  } catch (error) {
    console.error('Error fetching money changes:', error);
    res.status(500).json({ error: 'Failed to fetch money changes' });
  }
});

// POST - Create money change
router.post('/', requireAdmin, async (req, res) => {
  try {
    const moneyChange = await prisma.moneyChange.create({ data: req.body });
    res.status(201).json(moneyChange);
  } catch (error) {
    console.error('Error creating money change:', error);
    res.status(500).json({ error: 'Failed to create money change' });
  }
});

// DELETE /:id - Delete money change
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.moneyChange.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting money change:', error);
    res.status(500).json({ error: 'Failed to delete money change' });
  }
});

export default router;
