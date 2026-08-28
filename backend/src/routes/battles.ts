import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - List all battles
router.get('/', async (_req, res) => {
  try {
    const battles = await prisma.battle.findMany();

    const parsedBattles = battles.map((battle) => ({
      ...battle,
      attackerUnits: JSON.parse(battle.attackerUnitsData || '[]'),
      defenderUnits: JSON.parse(battle.defenderUnitsData || '[]'),
    }));

    res.json(parsedBattles);
  } catch (error) {
    console.error('Error fetching battles:', error);
    res.status(500).json({ error: 'Failed to fetch battles' });
  }
});

// POST - Create battle
router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = req.body;

    const battle = await prisma.battle.create({
      data: {
        id: data.id,
        warId: data.warId || null,
        day: data.day,
        date: data.date,
        attackerId: data.attackerId,
        defenderId: data.defenderId,
        target: data.target || '',
        attackerUnitsData: JSON.stringify(data.attackerUnits || []),
        defenderUnitsData: JSON.stringify(data.defenderUnits || []),
        attackerMP: data.attackerMP || 0,
        defenderMP: data.defenderMP || 0,
        attackerEffectivePower: data.attackerEffectivePower || 0,
        defenderEffectivePower: data.defenderEffectivePower || 0,
        winner: data.winner || '',
        result: data.result || '',
        mpLostAttacker: data.mpLostAttacker || 0,
        mpLostDefender: data.mpLostDefender || 0,
        territoryCaptured: data.territoryCaptured || false,
        territoryName: data.territoryName || '',
        notes: data.notes || '',
      },
    });

    // Deduct MP from attacker and defender
    if (data.mpLostAttacker > 0 && data.attackerId) {
      await prisma.country.update({
        where: { id: data.attackerId },
        data: { mp: { decrement: data.mpLostAttacker } },
      });
    }
    if (data.mpLostDefender > 0 && data.defenderId) {
      await prisma.country.update({
        where: { id: data.defenderId },
        data: { mp: { decrement: data.mpLostDefender } },
      });
    }

    res.status(201).json({ ...battle, attackerUnits: data.attackerUnits || [], defenderUnits: data.defenderUnits || [] });
  } catch (error) {
    console.error('Error creating battle:', error);
    res.status(500).json({ error: 'Failed to create battle' });
  }
});

// DELETE /:id - Delete battle
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const battle = await prisma.battle.findUnique({ where: { id } });
    if (!battle) {
      res.status(404).json({ error: 'Battle not found' });
      return;
    }

    // Restore MP to attacker and defender
    if (battle.mpLostAttacker > 0 && battle.attackerId) {
      await prisma.country.update({
        where: { id: battle.attackerId },
        data: { mp: { increment: battle.mpLostAttacker } },
      });
    }
    if (battle.mpLostDefender > 0 && battle.defenderId) {
      await prisma.country.update({
        where: { id: battle.defenderId },
        data: { mp: { increment: battle.mpLostDefender } },
      });
    }

    await prisma.battle.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting battle:', error);
    res.status(500).json({ error: 'Failed to delete battle' });
  }
});

export default router;
