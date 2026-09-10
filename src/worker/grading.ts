export function normalize(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase('de-DE');
}
/** One insertion, deletion, substitution or adjacent transposition. */
export function grade(answer: string, expected: string): 'correct' | 'typo' | 'wrong' {
  const a = Array.from(normalize(answer)), b = Array.from(normalize(expected));
  if (a.join('') === b.join('')) return 'correct';
  if (!a.length || Math.abs(a.length - b.length) > 1) return 'wrong';
  if (a.length === b.length) {
    const differences = a.map((c, i) => c === b[i] ? -1 : i).filter(i => i >= 0);
    if (differences.length === 1) return 'typo';
    const [i, j] = differences;
    return differences.length === 2 && j === i + 1 && a[i] === b[j] && a[j] === b[i] ? 'typo' : 'wrong';
  }
  const shorter = a.length < b.length ? a : b, longer = a.length < b.length ? b : a;
  let i = 0, j = 0, skipped = false;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) { i++; j++; }
    else if (skipped) return 'wrong';
    else { skipped = true; j++; }
  }
  return 'typo';
}
