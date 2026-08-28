import { MilitaryConfig, MilitaryUnitConfig, MatchupModifier } from '../types';

export type UnitId = 'infantry' | 'artillery' | 'tanks' | 'fighterJets' | 'bombers' | 'navalForces' | 'specialForces' | 'airTurrets';

const DEFAULT_UNIT_CONFIGS: Record<string, MilitaryUnitConfig> = {
  infantry: {
    id: 'infantry',
    name: 'Infantry',
    description: 'Standard ground forces. Versatile but average efficiency.',
    role: 'Ground / General',
    tierRatios: [1.00, 1.10, 1.20, 1.30, 1.40],
    counters: ['artillery'],
    counteredBy: ['tanks', 'fighterJets', 'bombers'],
    researchRequirement: 'Basic Army',
    available: true,
  },
  artillery: {
    id: 'artillery',
    name: 'Artillery',
    description: 'Long-range bombardment. Strong against fortified positions.',
    role: 'Ground / Support',
    tierRatios: [1.20, 1.35, 1.50, 1.65, 1.80],
    counters: ['tanks'],
    counteredBy: ['specialForces', 'fighterJets'],
    researchRequirement: 'Basic Army',
    available: true,
  },
  tanks: {
    id: 'tanks',
    name: 'Tanks',
    description: 'Heavy armored vehicles. Strong vs infantry, weak to air.',
    role: 'Ground / Assault',
    tierRatios: [1.40, 1.60, 1.80, 2.00, 2.20],
    counters: ['infantry', 'artillery'],
    counteredBy: ['fighterJets', 'bombers'],
    researchRequirement: 'Tanks',
    available: true,
  },
  fighterJets: {
    id: 'fighterJets',
    name: 'Fighter Jets',
    description: 'Air superiority fighters. Strong vs aircraft and ground.',
    role: 'Air / Air Superiority',
    tierRatios: [1.50, 1.75, 2.00, 2.25, 2.50],
    counters: ['bombers', 'tanks', 'artillery'],
    counteredBy: ['airTurrets', 'fighterJets'],
    researchRequirement: 'Fighter Jets',
    available: true,
  },
  bombers: {
    id: 'bombers',
    name: 'Bombers',
    description: 'Heavy strategic bombers. Devastating vs ground, vulnerable to fighters.',
    role: 'Air / Strategic',
    tierRatios: [1.60, 1.85, 2.10, 2.35, 2.60],
    counters: ['airTurrets', 'tanks', 'infantry'],
    counteredBy: ['fighterJets', 'airTurrets'],
    researchRequirement: 'Bombers',
    available: true,
  },
  navalForces: {
    id: 'navalForces',
    name: 'Naval Forces',
    description: 'Naval fleet. Strong at sea, weak against ground.',
    role: 'Naval',
    tierRatios: [1.20, 1.40, 1.60, 1.80, 2.00],
    counters: [],
    counteredBy: ['fighterJets', 'bombers'],
    researchRequirement: 'Basic Navy',
    available: true,
  },
  specialForces: {
    id: 'specialForces',
    name: 'Special Forces',
    description: 'Elite covert units. Strong vs soft targets.',
    role: 'Ground / Special Operations',
    tierRatios: [1.70, 1.90, 2.10, 2.30, 2.50],
    counters: ['artillery', 'infantry'],
    counteredBy: ['tanks', 'airTurrets'],
    researchRequirement: 'Special Forces',
    available: true,
  },
  airTurrets: {
    id: 'airTurrets',
    name: 'Air Turrets',
    description: 'Defensive anti-air installations. Strong vs aircraft, weak vs ground.',
    role: 'Defense / Anti-Air',
    tierRatios: [1.30, 1.50, 1.70, 1.90, 2.10],
    counters: ['fighterJets', 'bombers'],
    counteredBy: ['tanks', 'infantry', 'artillery'],
    researchRequirement: 'Basic Army',
    available: true,
  },
};

const DEFAULT_MATCHUPS: MatchupModifier[] = [
  { attackerUnit: 'infantry', defenderUnit: 'infantry', modifier: 1.00 },
  { attackerUnit: 'tanks', defenderUnit: 'infantry', modifier: 1.25 },
  { attackerUnit: 'infantry', defenderUnit: 'tanks', modifier: 0.75 },
  { attackerUnit: 'artillery', defenderUnit: 'tanks', modifier: 1.20 },
  { attackerUnit: 'tanks', defenderUnit: 'artillery', modifier: 1.10 },
  { attackerUnit: 'fighterJets', defenderUnit: 'bombers', modifier: 1.30 },
  { attackerUnit: 'bombers', defenderUnit: 'fighterJets', modifier: 0.75 },
  { attackerUnit: 'fighterJets', defenderUnit: 'fighterJets', modifier: 1.00 },
  { attackerUnit: 'airTurrets', defenderUnit: 'fighterJets', modifier: 1.40 },
  { attackerUnit: 'fighterJets', defenderUnit: 'airTurrets', modifier: 0.70 },
  { attackerUnit: 'airTurrets', defenderUnit: 'bombers', modifier: 1.30 },
  { attackerUnit: 'bombers', defenderUnit: 'airTurrets', modifier: 0.75 },
  { attackerUnit: 'bombers', defenderUnit: 'tanks', modifier: 1.25 },
  { attackerUnit: 'bombers', defenderUnit: 'infantry', modifier: 1.25 },
  { attackerUnit: 'bombers', defenderUnit: 'artillery', modifier: 1.20 },
  { attackerUnit: 'navalForces', defenderUnit: 'navalForces', modifier: 1.00 },
  { attackerUnit: 'navalForces', defenderUnit: 'infantry', modifier: 0.60 },
  { attackerUnit: 'navalForces', defenderUnit: 'tanks', modifier: 0.55 },
  { attackerUnit: 'navalForces', defenderUnit: 'artillery', modifier: 0.65 },
  { attackerUnit: 'specialForces', defenderUnit: 'artillery', modifier: 1.25 },
  { attackerUnit: 'specialForces', defenderUnit: 'infantry', modifier: 1.15 },
  { attackerUnit: 'specialForces', defenderUnit: 'tanks', modifier: 0.80 },
  { attackerUnit: 'specialForces', defenderUnit: 'specialForces', modifier: 1.00 },
  { attackerUnit: 'airTurrets', defenderUnit: 'infantry', modifier: 0.70 },
  { attackerUnit: 'airTurrets', defenderUnit: 'tanks', modifier: 0.60 },
  { attackerUnit: 'tanks', defenderUnit: 'tanks', modifier: 1.00 },
  { attackerUnit: 'infantry', defenderUnit: 'fighterJets', modifier: 0.50 },
  { attackerUnit: 'infantry', defenderUnit: 'bombers', modifier: 0.55 },
  { attackerUnit: 'fighterJets', defenderUnit: 'infantry', modifier: 1.15 },
  { attackerUnit: 'fighterJets', defenderUnit: 'tanks', modifier: 1.10 },
];

const TIER_RESEARCH_REQUIREMENTS: Record<number, string> = {
  1: 'Basic Army',
  2: 'Advanced Army',
  3: 'Modern Military',
  4: 'Advanced Military',
  5: 'Elite Military',
};

export function getDefaultMilitaryConfig(): MilitaryConfig {
  return {
    unitConfigs: { ...DEFAULT_UNIT_CONFIGS },
    matchups: [...DEFAULT_MATCHUPS],
    tierResearchRequirements: { ...TIER_RESEARCH_REQUIREMENTS },
  };
}

export function getUnitConfig(config: MilitaryConfig, unitId: string): MilitaryUnitConfig | undefined {
  return config.unitConfigs[unitId];
}

export function getUnitRatio(config: MilitaryConfig, unitId: string, tier: number): number {
  const unit = config.unitConfigs[unitId];
  if (!unit) return 1.0;
  const idx = Math.max(0, Math.min(tier - 1, unit.tierRatios.length - 1));
  return unit.tierRatios[idx];
}

export function getMatchupModifier(config: MilitaryConfig, attackerUnit: string, defenderUnit: string): number {
  const found = config.matchups.find(
    m => m.attackerUnit === attackerUnit && m.defenderUnit === defenderUnit
  );
  return found ? found.modifier : 1.0;
}

export const ALL_UNIT_IDS: UnitId[] = [
  'infantry', 'artillery', 'tanks', 'fighterJets', 'bombers', 'navalForces', 'specialForces', 'airTurrets',
];

export const UNIT_NAMES: Record<string, string> = {
  infantry: 'Infantry',
  artillery: 'Artillery',
  tanks: 'Tanks',
  fighterJets: 'Fighter Jets',
  bombers: 'Bombers',
  navalForces: 'Naval Forces',
  specialForces: 'Special Forces',
  airTurrets: 'Air Turrets',
};
