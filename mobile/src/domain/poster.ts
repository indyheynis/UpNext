export type Sport = 'football' | 'basketball';
export type Template = 'cinematic' | 'dark' | 'neon';
export type Format = 'story' | 'post';
export type Poster = {
  id: string;
  sport: Sport;
  template: Template;
  name: string;
  number: string;
  team: string;
  opponent: string;
  date: string;
  time: string;
  primary: string;
  secondary: string;
  photoUri?: string;
  originalUri?: string;
  cutout: boolean;
};
export type Creation = { poster: Poster; uri: string; format: Format; createdAt: string };
export const sizes = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1350 },
} as const;
export const templates: { id: Template; title: string; subtitle: string }[] = [
  { id: 'cinematic', title: 'Cinematic', subtitle: 'BIG LIGHTS. BIG MOMENTS.' },
  { id: 'dark', title: 'Dark', subtitle: 'QUIET CONFIDENCE. LOUD GAME.' },
  { id: 'neon', title: 'Neon', subtitle: 'BUILT FOR THE SPOTLIGHT.' },
];
export function newPoster(): Poster {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    sport: 'football',
    template: 'cinematic',
    name: '',
    number: '',
    team: '',
    opponent: '',
    date: '',
    time: '',
    primary: '#C7FF43',
    secondary: '#37D9FF',
    cutout: false,
  };
}
export function validateDetails(p: Poster): string | null {
  if (!p.name.trim()) return 'Add your player name.';
  if (!p.team.trim()) return 'Add your team name.';
  if (!/^\d{1,2}$/.test(p.number)) return 'Use a jersey number from 0 to 99.';
  if (p.date && !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) return 'Use YYYY-MM-DD for the game date.';
  if (p.date) {
    const d = new Date(`${p.date}T12:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== p.date)
      return 'Enter a valid game date.';
  }
  if (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)) return 'Use 24-hour time, like 19:30.';
  if (![p.primary, p.secondary].every((c) => /^#[0-9a-f]{6}$/i.test(c)))
    return 'Use six-digit hex team colors, like #C7FF43.';
  return null;
}
export function canExport(id: string, freePosterId: string | null): boolean {
  return !freePosterId || freePosterId === id;
}
