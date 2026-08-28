import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - List all treaties
router.get('/', async (_req, res) => {
  try {
    const treaties = await prisma.treaty.findMany();

    const parsedTreaties = treaties.map((treaty) => ({
      ...treaty,
      countryIds: JSON.parse(treaty.countryIds || '[]'),
      splits: JSON.parse(treaty.splits || '[]'),
    }));

    res.json(parsedTreaties);
  } catch (error) {
    console.error('Error fetching treaties:', error);
    res.status(500).json({ error: 'Failed to fetch treaties' });
  }
});

// POST - Create treaty
router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = req.body;

    const treaty = await prisma.treaty.create({
      data: {
        name: data.name,
        countryIds: JSON.stringify(data.countryIds || []),
        territoryId: data.territoryId || '',
        territoryOwnerId: data.territoryOwnerId || '',
        splits: JSON.stringify(data.splits || []),
        day: data.day,
        date: data.date,
        notes: data.notes || '',
      },
    });

    res.status(201).json({
      ...treaty,
      countryIds: data.countryIds || [],
      splits: data.splits || [],
    });
  } catch (error) {
    console.error('Error creating treaty:', error);
    res.status(500).json({ error: 'Failed to create treaty' });
  }
});

// PATCH /:id - Update treaty
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const data: any = {};

    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.countryIds !== undefined) data.countryIds = JSON.stringify(updateData.countryIds);
    if (updateData.territoryId !== undefined) data.territoryId = updateData.territoryId;
    if (updateData.territoryOwnerId !== undefined) data.territoryOwnerId = updateData.territoryOwnerId;
    if (updateData.splits !== undefined) data.splits = JSON.stringify(updateData.splits);
    if (updateData.notes !== undefined) data.notes = updateData.notes;

    const treaty = await prisma.treaty.update({ where: { id }, data });

    res.json({
      ...treaty,
      countryIds: JSON.parse(treaty.countryIds || '[]'),
      splits: JSON.parse(treaty.splits || '[]'),
    });
  } catch (error) {
    console.error('Error updating treaty:', error);
    res.status(500).json({ error: 'Failed to update treaty' });
  }
});

// DELETE /:id - Delete treaty
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.treaty.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting treaty:', error);
    res.status(500).json({ error: 'Failed to delete treaty' });
  }
});

export default router;
