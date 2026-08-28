export type ResearchTier = {
  tier: number;
  gdpRange: [number, number];
  label: string;
  items: string[];
};

export const RESEARCH_TIERS: ResearchTier[] = [
  {
    tier: 1,
    gdpRange: [0, 24],
    label: 'Basic',
    items: ['Basic Army', 'Basic Industry', 'Basic Diplomacy'],
  },
  {
    tier: 2,
    gdpRange: [25, 49],
    label: 'Advanced',
    items: ['Advanced Army', 'Tanks', 'Basic Navy', 'Improved Industry', 'Special Forces'],
  },
  {
    tier: 3,
    gdpRange: [50, 74],
    label: 'Superior',
    items: ['Advanced Tanks', 'Advanced Artillery', 'Fighter Jets', 'Advanced Navy', 'Trade Network', 'Advanced Industry'],
  },
  {
    tier: 4,
    gdpRange: [75, 99],
    label: 'Elite',
    items: ['Elite Military', 'Advanced Fighters', 'Bombers', 'Elite Industry'],
  },
  {
    tier: 5,
    gdpRange: [100, 999],
    label: 'Supreme',
    items: ['Top Military', 'Strategic Weapons', 'Advanced Aircraft', 'Global Trade', 'Top Navy'],
  },
];

export const TIER_COSTS: Record<number, number> = {
  1: 2000,
  2: 5000,
  3: 10000,
  4: 20000,
  5: 40000,
};

export const ECONOMIC_INVESTMENT_COST = 4000;
export const ECONOMIC_INVESTMENT_GDP_GAIN = 2;
export const ECONOMIC_INVESTMENT_GDP_CAP = 5;

export const OCCUPIED_MONEY_INCOME = 1000;
export const OCCUPIED_MP_INCOME = 250;
export const INTEGRATED_MONEY_INCOME = 3000;
export const INTEGRATED_MP_INCOME = 500;
export const OCCUPATION_DAYS = 3;

export function getResearchTierForGDP(gdp: number): number {
  for (const tier of RESEARCH_TIERS) {
    if (gdp >= tier.gdpRange[0] && gdp <= tier.gdpRange[1]) {
      return tier.tier;
    }
  }
  return 1;
}

export function getAvailableResearch(gdp: number, completed: string[]): string[] {
  const tier = getResearchTierForGDP(gdp);
  const available: string[] = [];
  for (let i = 1; i <= tier; i++) {
    const tierData = RESEARCH_TIERS.find(t => t.tier === i);
    if (tierData) {
      for (const item of tierData.items) {
        if (!completed.includes(item)) {
          available.push(item);
        }
      }
    }
  }
  return available;
}
