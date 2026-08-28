import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - List all MP changes
router.get('/', async (_req, res) => {
  try {
    const mpChanges = await prisma.mPChange.findMany();
    res.json(mpChanges);
  } catch (error) {
    console.error('Error fetching MP changes:', error);
    res.status(500).json({ error: 'Failed to fetch MP changes' });
  }
});

// POST - Create MP change
router.post('/', requireAdmin, async (req, res) => {
  try {
    const mpChange = await prisma.mPChange.create({ data: req.body });
    res.status(201).json(mpChange);
  } catch (error) {
    console.error('Error creating MP change:', error);
    res.status(500).json({ error: 'Failed to create MP change' });
  }
});

// DELETE /:id - Delete MP change
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.mPChange.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting MP change:', error);
    res.status(500).json({ error: 'Failed to delete MP change' });
  }
});

export default router;
