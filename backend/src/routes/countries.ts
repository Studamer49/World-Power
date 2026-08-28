import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - List all countries
router.get('/', async (_req, res) => {
  try {
    const countries = await prisma.country.findMany({
      include: {
        capturedTerritories: true,
        notes: true,
      },
    });

    // Parse JSON fields
    const parsedCountries = countries.map((country) => ({
      ...country,
      password: undefined,
      unitInventory: JSON.parse(country.unitInventory),
      manualOverrides: country.manualOverrides ? JSON.parse(country.manualOverrides) : null,
      completedResearch: JSON.parse(country.completedResearch),
    }));

    res.json(parsedCountries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /:id - Get single country
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        capturedTerritories: true,
        notes: true,
      },
    });

    if (!country) {
      res.status(404).json({ error: 'Country not found' });
      return;
    }

    // Parse JSON fields
    const parsedCountry = {
      ...country,
      password: undefined,
      unitInventory: JSON.parse(country.unitInventory),
      manualOverrides: country.manualOverrides ? JSON.parse(country.manualOverrides) : null,
      completedResearch: JSON.parse(country.completedResearch),
    };

    res.json(parsedCountry);
  } catch (error) {
    console.error('Error fetching country:', error);
    res.status(500).json({ error: 'Failed to fetch country' });
  }
});

// POST - Create country
router.post('/', requireAdmin, async (req, res) => {
  try {
    const countryData = req.body;

    // Stringify JSON fields
    const createData = {
      ...countryData,
      unitInventory: JSON.stringify(countryData.unitInventory || {}),
      manualOverrides: countryData.manualOverrides
        ? JSON.stringify(countryData.manualOverrides)
        : null,
      completedResearch: JSON.stringify(countryData.completedResearch || []),
    };

    const country = await prisma.country.create({
      data: createData,
    });

    res.status(201).json(country);
  } catch (error) {
    console.error('Error creating country:', error);
    res.status(500).json({ error: 'Failed to create country' });
  }
});

// PATCH /:id - Update country
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Stringify JSON fields if they exist
    if (updateData.unitInventory) {
      updateData.unitInventory = JSON.stringify(updateData.unitInventory);
    }
    if (updateData.manualOverrides) {
      updateData.manualOverrides = JSON.stringify(updateData.manualOverrides);
    }
    if (updateData.completedResearch) {
      updateData.completedResearch = JSON.stringify(updateData.completedResearch);
    }

    const country = await prisma.country.update({
      where: { id },
      data: updateData,
    });

    res.json(country);
  } catch (error) {
    console.error('Error updating country:', error);
    res.status(500).json({ error: 'Failed to update country' });
  }
});

// DELETE /:id - Delete country
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    if (hard === 'true') {
      await prisma.country.delete({ where: { id } });
    } else {
      await prisma.country.update({
        where: { id },
        data: { alive: false },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting country:', error);
    res.status(500).json({ error: 'Failed to delete country' });
  }
});

// POST /:id/dead - Toggle alive status
router.post('/:id/dead', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const country = await prisma.country.findUnique({ where: { id } });

    if (!country) {
      res.status(404).json({ error: 'Country not found' });
      return;
    }

    const updated = await prisma.country.update({
      where: { id },
      data: { alive: !country.alive },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error toggling country status:', error);
    res.status(500).json({ error: 'Failed to toggle country status' });
  }
});

// POST /:id/password - Set a country's public access password (admin)
router.post('/:id/password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (typeof password !== 'string') {
      res.status(400).json({ error: 'Password required' });
      return;
    }
    const country = await prisma.country.update({
      where: { id },
      data: { password },
    });
    res.json({ success: true, id: country.id, password: country.password });
  } catch (error) {
    console.error('Error setting country password:', error);
    res.status(500).json({ error: 'Failed to set country password' });
  }
});

export default router;