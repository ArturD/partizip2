export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
export function element<T extends HTMLElement>(id: string): T { return document.getElementById(id) as T; }
export const labels: Record<string, string> = { correct: 'Correct', typo: 'Single-letter typo', wrong: 'Wrong' };
