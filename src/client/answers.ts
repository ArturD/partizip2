export function normalize(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase('de-DE');
}

// Only expand actual umlauts in the expected form: ordinary "ue" (gedauert)
// must not accidentally make an incorrect umlaut (gedaürt) acceptable.
export function answersMatch(answer: string, expected: string): boolean {
  const alternatives: Record<string, string> = { 'ä': '(?:ä|ae)', 'ö': '(?:ö|oe)', 'ü': '(?:ü|ue)' };
  const pattern = Array.from(normalize(expected), letter =>
    alternatives[letter] ?? letter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('');
  return new RegExp(`^${pattern}$`, 'u').test(normalize(answer));
}
