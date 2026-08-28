import { Country } from '../types';
import { getFlagEmoji } from './flags';

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function makeCountry(name: string): Country {
  return {
    id: makeId(),
    name,
    playerName: '',
    leaderName: '',
    governmentName: '',
    flag: getFlagEmoji(name),
    alive: true,
    dateCreated: '14 August 2026',
    money: 10000,
    mp: 1500,
    gdp: 20,
    dailyIncome: 1500,
    dailyMP: 300,
    researchTier: 1,
    investmentGDP: 0,
    completedResearch: [],
    militaryUnits: {
      infantry: 10,
      artillery: 2,
      tanks: 0,
      fighterJets: 0,
      bombers: 0,
      navalForces: 0,
      specialForces: 0,
      airTurrets: 0,
    },
    unitInventory: {
      infantry: { mp: 10, tier: 1 },
      artillery: { mp: 2, tier: 1 },
      tanks: { mp: 0, tier: 1 },
      fighterJets: { mp: 0, tier: 1 },
      bombers: { mp: 0, tier: 1 },
      navalForces: { mp: 0, tier: 1 },
      specialForces: { mp: 0, tier: 1 },
      airTurrets: { mp: 0, tier: 1 },
    },
    territories: [],
    capturedTerritories: [],
    territoryCaptureHistory: [],
    battles: [],
    wars: [],
    alliances: [],
    treaties: [],
    notes: [],
    manualOverrides: {},
  };
}

export function getInitialCountries(): Country[] {
  const names = [
    'Sweden',
    'Mongolia',
    'USA',
    'China',
    'Russia',
    'Argentina',
    'Israel',
    'North Korea',
    'Australia',
    'Nigeria',
  ];
  return names.map(makeCountry);
}
