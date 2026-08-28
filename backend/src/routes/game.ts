import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Date helpers that match the frontend's "14 August 2026" format
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseGameDate(dateStr: string): Date {
  const parts = dateStr.trim().split(' ');
  if (parts.length < 3) return new Date();
  const day = parseInt(parts[0]);
  const month = MONTHS.indexOf(parts[1]);
  const year = parseInt(parts[2]);
  if (isNaN(day) || month < 0 || isNaN(year)) return new Date();
  return new Date(year, month, day);
}

function formatDateStr(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function advanceDate(dateStr: string, days: number = 1): string {
  const date = parseGameDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateStr(date);
}

const OCCUPIED_MONEY_INCOME = 1000;
const OCCUPIED_MP_INCOME = 250;
const INTEGRATED_MONEY_INCOME = 3000;
const INTEGRATED_MP_INCOME = 500;
const OCCUPATION_DAYS = 3;

// GET /state - Return the full serialized game state (single source of truth)
router.get('/state', async (_req, res) => {
  try {
    const saved = await prisma.gameState.findUnique({ where: { id: 'default' } });
    if (!saved) {
      res.json({ data: null });
      return;
    }
    res.json({ data: JSON.parse(saved.data), updatedAt: saved.updatedAt });
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ error: 'Failed to fetch game state' });
  }
});

// PUT /state - Save the full serialized game state (admin)
router.put('/state', requireAdmin, async (req, res) => {
  try {
    const { data } = req.body;
    if (data === undefined) {
      res.status(400).json({ error: 'Game state data required' });
      return;
    }
    const saved = await prisma.gameState.upsert({
      where: { id: 'default' },
      update: { data: JSON.stringify(data) },
      create: { id: 'default', data: JSON.stringify(data) },
    });
    res.json({ success: true, updatedAt: saved.updatedAt });
  } catch (error) {
    console.error('Error saving game state:', error);
    res.status(500).json({ error: 'Failed to save game state' });
  }
});

// GET - Return game config
router.get('/', async (_req, res) => {
  try {
    let config = await prisma.gameConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await prisma.gameConfig.create({
        data: {
          id: 'default',
          gameDay: 1,
          gameDate: '14 August 2026',
        },
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Error fetching game config:', error);
    res.status(500).json({ error: 'Failed to fetch game config' });
  }
});

// PATCH - Update game config
router.patch('/', requireAdmin, async (req, res) => {
  try {
    const { gameDay, gameDate } = req.body;
    const config = await prisma.gameConfig.upsert({
      where: { id: 'default' },
      update: {
        ...(gameDay !== undefined && { gameDay }),
        ...(gameDate !== undefined && { gameDate }),
      },
      create: {
        id: 'default',
        gameDay: gameDay || 1,
        gameDate: gameDate || '14 August 2026',
      },
    });
    res.json(config);
  } catch (error) {
    console.error('Error updating game config:', error);
    res.status(500).json({ error: 'Failed to update game config' });
  }
});

// POST /next-day - Process next day logic
router.post('/next-day', requireAdmin, async (_req, res) => {
  try {
    const config = await prisma.gameConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      res.status(404).json({ error: 'Game config not found' });
      return;
    }

    const newDay = config.gameDay + 1;
    const newDate = advanceDate(config.gameDate, 1);
    const growGDP = newDay % 3 === 0;

    // Get all alive countries with territories
    const countries = await prisma.country.findMany({
      where: { alive: true },
      include: { capturedTerritories: true },
    });

    // Get all treaties
    const treaties = await prisma.treaty.findMany();

    const countryUpdates: Promise<any>[] = [];

    for (const country of countries) {
      let moneyGain = country.dailyIncome;
      let mpGain = country.dailyMP;

      // Process territories
      const updatedTerritories: Promise<any>[] = [];
      for (const territory of country.capturedTerritories) {
        if (territory.status === 'occupied') {
          const daysHeld = newDay - territory.capturedOnDay;
          if (daysHeld >= OCCUPATION_DAYS) {
            // Auto-integrate
            updatedTerritories.push(
              prisma.territory.update({
                where: { id: territory.id },
                data: { status: 'integrated', moneyIncome: INTEGRATED_MONEY_INCOME },
              })
            );
            moneyGain += INTEGRATED_MONEY_INCOME;
            mpGain += INTEGRATED_MP_INCOME;
          } else {
            moneyGain += OCCUPIED_MONEY_INCOME;
            mpGain += OCCUPIED_MP_INCOME;
          }
        } else {
          // Integrated
          moneyGain += territory.moneyIncome > 0 ? territory.moneyIncome : INTEGRATED_MONEY_INCOME;
          mpGain += INTEGRATED_MP_INCOME;
        }
      }
      await Promise.all(updatedTerritories);

      // Process treaty income splits
      for (const treaty of treaties) {
        const splits = JSON.parse(treaty.splits || '[]') as { countryId: string; percent: number }[];

        if (treaty.territoryOwnerId === country.id) {
          // This country is the territory owner - reduce their income by the split percentages given to others
          const ownerSplit = splits.find(s => s.countryId === country.id);
          if (ownerSplit) {
            // Find the territory to get its income
            const terr = country.capturedTerritories.find(t => t.id === treaty.territoryId);
            if (terr) {
              const baseIncome = terr.status === 'integrated'
                ? (terr.moneyIncome > 0 ? terr.moneyIncome : INTEGRATED_MONEY_INCOME)
                : OCCUPIED_MONEY_INCOME;
              const baseMP = terr.status === 'integrated' ? INTEGRATED_MP_INCOME : OCCUPIED_MP_INCOME;
              // Owner already got full income from territory processing above, subtract what was given away
              const givenAway = splits
                .filter(s => s.countryId !== country.id)
                .reduce((sum, s) => sum + s.percent, 0);
              moneyGain -= Math.round(baseIncome * (givenAway / 100));
              mpGain -= Math.round(baseMP * (givenAway / 100));
            }
          }
        } else {
          // This country receives a share from the territory owner
          const split = splits.find(s => s.countryId === country.id);
          if (split) {
            const ownerCountry = countries.find(c => c.id === treaty.territoryOwnerId);
            if (ownerCountry) {
              const ownerTerr = ownerCountry.capturedTerritories.find(t => t.id === treaty.territoryId);
              if (ownerTerr) {
                const baseIncome = ownerTerr.status === 'integrated'
                  ? (ownerTerr.moneyIncome > 0 ? ownerTerr.moneyIncome : INTEGRATED_MONEY_INCOME)
                  : OCCUPIED_MONEY_INCOME;
                const baseMP = ownerTerr.status === 'integrated' ? INTEGRATED_MP_INCOME : OCCUPIED_MP_INCOME;
                moneyGain += Math.round(baseIncome * (split.percent / 100));
                mpGain += Math.round(baseMP * (split.percent / 100));
              }
            }
          }
        }
      }

      const gdpGain = growGDP ? 2 : 0;

      countryUpdates.push(
        prisma.country.update({
          where: { id: country.id },
          data: {
            money: country.money + moneyGain,
            mp: country.mp + mpGain,
            gdp: country.gdp + gdpGain,
          },
        })
      );
    }

    await Promise.all(countryUpdates);

    // Update game config
    const updatedConfig = await prisma.gameConfig.update({
      where: { id: 'default' },
      data: {
        gameDay: newDay,
        gameDate: newDate,
      },
    });

    res.json({
      config: updatedConfig,
      processedCountries: countries.length,
    });
  } catch (error) {
    console.error('Error processing next day:', error);
    res.status(500).json({ error: 'Failed to process next day' });
  }
});

// POST /snapshot - Create daily snapshot
router.post('/snapshot', requireAdmin, async (_req, res) => {
  try {
    const config = await prisma.gameConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      res.status(404).json({ error: 'Game config not found' });
      return;
    }

    const countries = await prisma.country.findMany();
    const snapshots = await Promise.all(
      countries.map((country) =>
        prisma.dailySnapshot.create({
          data: {
            gameDay: config.gameDay,
            date: config.gameDate,
            countryId: country.id,
            data: JSON.stringify({
              startingMoney: country.money,
              startingMP: country.mp,
              startingGDP: country.gdp,
            }),
          },
        })
      )
    );

    res.json({ snapshots, day: config.gameDay });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

export default router;
