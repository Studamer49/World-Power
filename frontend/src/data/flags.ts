export type FlagData = {
  name: string;
  code: string;
  emoji: string;
  color: string;
};

const FLAGS_DATA: FlagData[] = [
  { name: 'Sweden', code: 'SE', emoji: '\u{1F1F8}\u{1F1EA}', color: '#006AA7' },
  { name: 'Mongolia', code: 'MN', emoji: '\u{1F1F2}\u{1F1F3}', color: '#C4272F' },
  { name: 'USA', code: 'US', emoji: '\u{1F1FA}\u{1F1F8}', color: '#3C3B6E' },
  { name: 'China', code: 'CN', emoji: '\u{1F1E8}\u{1F1F3}', color: '#DE2910' },
  { name: 'Russia', code: 'RU', emoji: '\u{1F1F7}\u{1F1FA}', color: '#0039A6' },
  { name: 'Argentina', code: 'AR', emoji: '\u{1F1E6}\u{1F1F7}', color: '#74ACDF' },
  { name: 'Israel', code: 'IL', emoji: '\u{1F1EE}\u{1F1F1}', color: '#0038B8' },
  { name: 'North Korea', code: 'KP', emoji: '\u{1F1F0}\u{1F1F5}', color: '#024FA2' },
  { name: 'Australia', code: 'AU', emoji: '\u{1F1E6}\u{1F1FA}', color: '#00008B' },
  { name: 'Nigeria', code: 'NG', emoji: '\u{1F1F3}\u{1F1EC}', color: '#008751' },
];

export function getFlag(countryName: string): FlagData {
  const found = FLAGS_DATA.find(
    f => f.name.toLowerCase() === countryName.toLowerCase()
  );
  if (found) return found;
  return { name: countryName, code: '??', emoji: '\u{1F30D}', color: '#666' };
}

export function getFlagEmoji(countryName: string): string {
  return getFlag(countryName).emoji;
}

export function getFlagColor(countryName: string): string {
  return getFlag(countryName).color;
}

export function getAllFlags(): FlagData[] {
  return FLAGS_DATA;
}

export default FLAGS_DATA;
