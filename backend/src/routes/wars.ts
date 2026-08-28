import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - List all wars
router.get('/', async (_req, res) => {
  try {
    const wars = await prisma.war.findMany();

    const parsedWars = wars.map((war) => ({
      ...war,
      attackerIds: JSON.parse(war.attackerIds || '[]'),
      defenderIds: JSON.parse(war.defenderIds || '[]'),
      battles: JSON.parse(war.battles || '[]'),
      territoriesCaptured: JSON.parse(war.territoriesCaptured || '[]'),
      territoriesLost: JSON.parse(war.territoriesLost || '[]'),
      warScore: JSON.parse(war.warScore || '{}'),
    }));

    res.json(parsedWars);
  } catch (error) {
    console.error('Error fetching wars:', error);
    res.status(500).json({ error: 'Failed to fetch wars' });
  }
});

// POST - Create war
router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = req.body;

    const war = await prisma.war.create({
      data: {
        id: data.id,
        name: data.name,
        attackerIds: JSON.stringify(data.attackerIds || []),
        defenderIds: JSON.stringify(data.defenderIds || []),
        startDate: data.startDate || '',
        startDay: data.startDay || 0,
        endDate: data.endDate || '',
        endDay: data.endDay || 0,
        status: data.status || 'active',
        battles: JSON.stringify(data.battles || []),
        territoriesCaptured: JSON.stringify(data.territoriesCaptured || []),
        territoriesLost: JSON.stringify(data.territoriesLost || []),
        warScore: JSON.stringify(data.warScore || {}),
        notes: data.notes || '',
      },
    });

    res.status(201).json({
      ...war,
      attackerIds: data.attackerIds || [],
      defenderIds: data.defenderIds || [],
      battles: data.battles || [],
      territoriesCaptured: data.territoriesCaptured || [],
      territoriesLost: data.territoriesLost || [],
      warScore: data.warScore || {},
    });
  } catch (error) {
    console.error('Error creating war:', error);
    res.status(500).json({ error: 'Failed to create war' });
  }
});

// PATCH /:id - Update war
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const data: any = {};
    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.status !== undefined) data.status = updateData.status;
    if (updateData.notes !== undefined) data.notes = updateData.notes;
    if (updateData.endDate !== undefined) data.endDate = updateData.endDate;
    if (updateData.endDay !== undefined) data.endDay = updateData.endDay;
    if (updateData.attackerIds !== undefined) data.attackerIds = JSON.stringify(updateData.attackerIds);
    if (updateData.defenderIds !== undefined) data.defenderIds = JSON.stringify(updateData.defenderIds);
    if (updateData.battles !== undefined) data.battles = JSON.stringify(updateData.battles);
    if (updateData.territoriesCaptured !== undefined) data.territoriesCaptured = JSON.stringify(updateData.territoriesCaptured);
    if (updateData.territoriesLost !== undefined) data.territoriesLost = JSON.stringify(updateData.territoriesLost);
    if (updateData.warScore !== undefined) data.warScore = JSON.stringify(updateData.warScore);

    const war = await prisma.war.update({
      where: { id },
      data,
    });

    res.json({
      ...war,
      attackerIds: JSON.parse(war.attackerIds || '[]'),
      defenderIds: JSON.parse(war.defenderIds || '[]'),
      battles: JSON.parse(war.battles || '[]'),
      territoriesCaptured: JSON.parse(war.territoriesCaptured || '[]'),
      territoriesLost: JSON.parse(war.territoriesLost || '[]'),
      warScore: JSON.parse(war.warScore || '{}'),
    });
  } catch (error) {
    console.error('Error updating war:', error);
    res.status(500).json({ error: 'Failed to update war' });
  }
});

// DELETE /:id - Delete war
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.war.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting war:', error);
    res.status(500).json({ error: 'Failed to delete war' });
  }
});

// POST /:id/score - Add war score event
router.post('/:id/score', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const scoreData = req.body;

    const event = await prisma.warScoreEvent.create({
      data: {
        warId: id,
        countryId: scoreData.countryId,
        amount: scoreData.amount,
        reason: scoreData.reason || '',
        day: scoreData.day,
        date: scoreData.date,
      },
    });

    // Update war score
    const war = await prisma.war.findUnique({ where: { id } });
    if (war) {
      const warScore = JSON.parse(war.warScore || '{}');
      warScore[scoreData.countryId] = (warScore[scoreData.countryId] || 0) + scoreData.amount;
      await prisma.war.update({
        where: { id },
        data: { warScore: JSON.stringify(warScore) },
      });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Error adding war score:', error);
    res.status(500).json({ error: 'Failed to add war score' });
  }
});

export default router;
