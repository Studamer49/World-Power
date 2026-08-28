import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - Get military config
router.get('/', async (_req, res) => {
  try {
    let config = await prisma.militaryConfig.findUnique({ where: { id: 'default' } });

    if (!config) {
      config = await prisma.militaryConfig.create({
        data: {
          id: 'default',
          unitConfigs: JSON.stringify({}),
          matchups: JSON.stringify([]),
          tierResearchRequirements: JSON.stringify({}),
        },
      });
    }

    res.json({
      ...config,
      unitConfigs: JSON.parse(config.unitConfigs || '{}'),
      matchups: JSON.parse(config.matchups || '[]'),
      tierResearchRequirements: JSON.parse(config.tierResearchRequirements || '{}'),
    });
  } catch (error) {
    console.error('Error fetching military config:', error);
    res.status(500).json({ error: 'Failed to fetch military config' });
  }
});

// PATCH - Update military config
router.patch('/', requireAdmin, async (req, res) => {
  try {
    const updateData = req.body;
    const data: any = {};

    if (updateData.unitConfigs !== undefined) data.unitConfigs = JSON.stringify(updateData.unitConfigs);
    if (updateData.matchups !== undefined) data.matchups = JSON.stringify(updateData.matchups);
    if (updateData.tierResearchRequirements !== undefined) data.tierResearchRequirements = JSON.stringify(updateData.tierResearchRequirements);

    let config = await prisma.militaryConfig.findUnique({ where: { id: 'default' } });

    if (config) {
      config = await prisma.militaryConfig.update({ where: { id: 'default' }, data });
    } else {
      config = await prisma.militaryConfig.create({
        data: {
          id: 'default',
          unitConfigs: data.unitConfigs || JSON.stringify({}),
          matchups: data.matchups || JSON.stringify([]),
          tierResearchRequirements: data.tierResearchRequirements || JSON.stringify({}),
        },
      });
    }

    res.json({
      ...config,
      unitConfigs: JSON.parse(config.unitConfigs || '{}'),
      matchups: JSON.parse(config.matchups || '[]'),
      tierResearchRequirements: JSON.parse(config.tierResearchRequirements || '{}'),
    });
  } catch (error) {
    console.error('Error updating military config:', error);
    res.status(500).json({ error: 'Failed to update military config' });
  }
});

export default router;
