export type Tier = 'essential' | 'common' | 'extended';
export interface Verb {
  id: string; infinitive: string; participle: string; english: string;
  tier: Tier; type: 'regular' | 'irregular'; subtype: 'weak' | 'strong' | 'mixed' | 'suppletive';
  separable: boolean;
}
// Tiers are editorial importance groups, not corpus frequency rankings.
// Stable IDs keep historical attempts meaningful when this file is edited.
export const verbs: Verb[] = [
  ['beginnen', 'begonnen', 'begin', 'strong', false],
  ['bekommen', 'bekommen', 'receive / get', 'strong', false],
  ['essen', 'gegessen', 'eat', 'strong', false],
  ['fahren', 'gefahren', 'drive / travel', 'strong', false],
  ['gehen', 'gegangen', 'go', 'strong', false],
  ['lesen', 'gelesen', 'read', 'strong', false],
  ['schlafen', 'geschlafen', 'sleep', 'strong', false],
  ['schreiben', 'geschrieben', 'write', 'strong', false],
  ['sehen', 'gesehen', 'see', 'strong', false],
  ['sein', 'gewesen', 'be', 'suppletive', false],
  ['sitzen', 'gesessen', 'sit', 'strong', false],
  ['sprechen', 'gesprochen', 'speak', 'strong', false],
  ['teilnehmen', 'teilgenommen', 'participate / take part', 'strong', true],
  ['tun', 'getan', 'do', 'strong', false],
  ['werden', 'geworden', 'become', 'strong', false],
].map(([id, participle, english, subtype, separable]) => ({
  id: id as string, infinitive: id as string, participle: participle as string,
  english: english as string, tier: 'essential', type: 'irregular',
  subtype: subtype as Verb['subtype'], separable: separable as boolean,
}));
