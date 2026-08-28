import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - List all territories
router.get('/', async (_req, res) => {
  try {
    const territories = await prisma.territory.findMany({
      include: {
        country: true,
      },
    });

    res.json(territories);
  } catch (error) {
    console.error('Error fetching territories:', error);
    res.status(500).json({ error: 'Failed to fetch territories' });
  }
});

// POST - Create territory
router.post('/', requireAdmin, async (req, res) => {
  try {
    const territoryData = req.body;

    const territory = await prisma.territory.create({
      data: territoryData,
      include: {
        country: true,
      },
    });

    res.status(201).json(territory);
  } catch (error) {
    console.error('Error creating territory:', error);
    res.status(500).json({ error: 'Failed to create territory' });
  }
});

// PATCH /:id - Update territory
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const territory = await prisma.territory.update({
      where: { id },
      data: updateData,
      include: {
        country: true,
      },
    });

    res.json(territory);
  } catch (error) {
    console.error('Error updating territory:', error);
    res.status(500).json({ error: 'Failed to update territory' });
  }
});

// DELETE /:id - Delete territory
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.territory.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting territory:', error);
    res.status(500).json({ error: 'Failed to delete territory' });
  }
});

export default router;