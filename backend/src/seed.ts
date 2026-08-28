import prisma from './prisma';

const defaultCountries = [
  { name: 'Sweden', flag: '\u{1F1F8}\u{1F1EA}' },
  { name: 'Mongolia', flag: '\u{1F1F2}\u{1F1F3}' },
  { name: 'USA', flag: '\u{1F1FA}\u{1F1F8}' },
  { name: 'China', flag: '\u{1F1E8}\u{1F1F3}' },
  { name: 'Russia', flag: '\u{1F1F7}\u{1F1FA}' },
  { name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  { name: 'Israel', flag: '\u{1F1EE}\u{1F1F1}' },
  { name: 'North Korea', flag: '\u{1F1F0}\u{1F1F5}' },
  { name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { name: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}' },
];

const defaultUnitInventory = {
  infantry: { mp: 10, tier: 1 },
  artillery: { mp: 2, tier: 1 },
  tanks: { mp: 0, tier: 1 },
  fighterJets: { mp: 0, tier: 1 },
  bombers: { mp: 0, tier: 1 },
  navalForces: { mp: 0, tier: 1 },
  specialForces: { mp: 0, tier: 1 },
  airTurrets: { mp: 0, tier: 1 },
};

async function main() {
  console.log('Seeding database...');

  // Create default game config
  const existingConfig = await prisma.gameConfig.findUnique({
    where: { id: 'default' },
  });

  if (!existingConfig) {
    await prisma.gameConfig.create({
      data: {
        id: 'default',
        gameDay: 1,
        gameDate: '14 August 2026',
      },
    });
    console.log('Created default game config');
  }

  // Create default countries
  const existingCountries = await prisma.country.count();
  if (existingCountries === 0) {
    for (const country of defaultCountries) {
      await prisma.country.create({
        data: {
          name: country.name,
          flag: country.flag,
          alive: true,
          dateCreated: '14 August 2026',
          money: 10000,
          mp: 1500,
          gdp: 20,
          dailyIncome: 1500,
          dailyMP: 300,
          researchTier: 1,
          investmentGDP: 0,
          completedResearch: JSON.stringify([]),
          unitInventory: JSON.stringify(defaultUnitInventory),
          manualOverrides: JSON.stringify({}),
        },
      });
      console.log(`Created country: ${country.name}`);
    }
  }

  // Create default military config
  const existingMilitaryConfig = await prisma.militaryConfig.findUnique({
    where: { id: 'default' },
  });

  if (!existingMilitaryConfig) {
    const defaultUnitConfigs = {
      infantry: {
        id: 'infantry', name: 'Infantry', description: 'Basic ground troops', role: 'Frontline',
        tierRatios: [1, 1.5, 2.2, 3, 4], counters: ['artillery'], counteredBy: ['tanks', 'artillery'],
        researchRequirement: 'Basic Army', available: true,
      },
      artillery: {
        id: 'artillery', name: 'Artillery', description: 'Long-range bombardment', role: 'Support',
        tierRatios: [5, 7, 10, 14, 18], counters: ['infantry'], counteredBy: ['tanks', 'fighterJets'],
        researchRequirement: 'Basic Army', available: true,
      },
      tanks: {
        id: 'tanks', name: 'Tanks', description: 'Armored assault vehicles', role: 'Armored',
        tierRatios: [15, 22, 32, 44, 58], counters: ['artillery', 'infantry'], counteredBy: ['fighterJets', 'bombers'],
        researchRequirement: 'Tanks', available: true,
      },
      fighterJets: {
        id: 'fighterJets', name: 'Fighter Jets', description: 'Air superiority fighters', role: 'Air',
        tierRatios: [20, 30, 44, 60, 80], counters: ['tanks', 'bombers'], counteredBy: ['airTurrets'],
        researchRequirement: 'Fighter Jets', available: true,
      },
      bombers: {
        id: 'bombers', name: 'Bombers', description: 'Strategic bombing aircraft', role: 'Air',
        tierRatios: [25, 37, 54, 74, 98], counters: ['navalForces', 'tanks'], counteredBy: ['fighterJets'],
        researchRequirement: 'Bombers', available: true,
      },
      navalForces: {
        id: 'navalForces', name: 'Naval Forces', description: 'Naval fleet units', role: 'Naval',
        tierRatios: [18, 27, 39, 54, 71], counters: ['airTurrets'], counteredBy: ['bombers'],
        researchRequirement: 'Basic Navy', available: true,
      },
      specialForces: {
        id: 'specialForces', name: 'Special Forces', description: 'Elite specialized troops', role: 'Special',
        tierRatios: [12, 18, 26, 36, 48], counters: ['infantry'], counteredBy: [],
        researchRequirement: 'Special Forces', available: true,
      },
      airTurrets: {
        id: 'airTurrets', name: 'Air Turrets', description: 'Anti-air defense systems', role: 'Defense',
        tierRatios: [10, 15, 22, 30, 40], counters: ['fighterJets'], counteredBy: ['navalForces'],
        researchRequirement: 'Basic Army', available: true,
      },
    };

    const defaultMatchups = [
      { attackerUnit: 'infantry', defenderUnit: 'artillery', modifier: 0.6 },
      { attackerUnit: 'infantry', defenderUnit: 'tanks', modifier: 0.3 },
      { attackerUnit: 'artillery', defenderUnit: 'infantry', modifier: 2.0 },
      { attackerUnit: 'artillery', defenderUnit: 'tanks', modifier: 0.7 },
      { attackerUnit: 'tanks', defenderUnit: 'infantry', modifier: 3.0 },
      { attackerUnit: 'tanks', defenderUnit: 'artillery', modifier: 1.5 },
      { attackerUnit: 'fighterJets', defenderUnit: 'tanks', modifier: 2.5 },
      { attackerUnit: 'fighterJets', defenderUnit: 'bombers', modifier: 1.8 },
      { attackerUnit: 'bombers', defenderUnit: 'navalForces', modifier: 2.5 },
      { attackerUnit: 'bombers', defenderUnit: 'tanks', modifier: 2.0 },
      { attackerUnit: 'navalForces', defenderUnit: 'airTurrets', modifier: 1.2 },
      { attackerUnit: 'specialForces', defenderUnit: 'infantry', modifier: 2.0 },
      { attackerUnit: 'airTurrets', defenderUnit: 'fighterJets', modifier: 2.0 },
    ];

    await prisma.militaryConfig.create({
      data: {
        id: 'default',
        unitConfigs: JSON.stringify(defaultUnitConfigs),
        matchups: JSON.stringify(defaultMatchups),
        tierResearchRequirements: JSON.stringify({}),
      },
    });
    console.log('Created default military config');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
