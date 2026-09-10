export type Tier = 'essential' | 'common' | 'extended';
export interface Verb {
  id: string; infinitive: string; participle: string; english: string;
  tier: Tier; type: 'regular' | 'irregular'; subtype: 'weak' | 'strong' | 'mixed' | 'suppletive';
  separable: boolean;
}
// Tiers are editorial importance groups, not corpus frequency rankings.
// Stable IDs keep historical attempts meaningful when this file is edited.
type Entry = [id: string, participle: string, english: string, subtype: Verb['subtype'], separable: boolean];

function group(tier: Tier, entries: Entry[]): Verb[] {
  return entries.map(([id, participle, english, subtype, separable]) => ({
    id, infinitive: id, participle, english, tier,
    type: subtype === 'weak' ? 'regular' : 'irregular', subtype, separable,
  }));
}

export const verbs: Verb[] = [
  ...group('essential', [
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
  ]),
  ...group('essential', [
    ['machen', 'gemacht', 'do / make', 'weak', false],
    ['lernen', 'gelernt', 'learn', 'weak', false],
    ['arbeiten', 'gearbeitet', 'work', 'weak', false],
    ['wohnen', 'gewohnt', 'live / reside', 'weak', false],
    ['kaufen', 'gekauft', 'buy', 'weak', false],
    ['sagen', 'gesagt', 'say', 'weak', false],
    ['fragen', 'gefragt', 'ask', 'weak', false],
    ['hören', 'gehört', 'hear / listen', 'weak', false],
    ['spielen', 'gespielt', 'play', 'weak', false],
    ['kochen', 'gekocht', 'cook', 'weak', false],
    ['suchen', 'gesucht', 'search / look for', 'weak', false],
    ['warten', 'gewartet', 'wait', 'weak', false],
    ['bezahlen', 'bezahlt', 'pay', 'weak', false],
    ['einkaufen', 'eingekauft', 'shop / buy groceries', 'weak', true],
    ['telefonieren', 'telefoniert', 'talk on the phone', 'weak', false],
  ]),
  ...group('common', [
    ['bleiben', 'geblieben', 'stay', 'strong', false],
    ['finden', 'gefunden', 'find', 'strong', false],
    ['nehmen', 'genommen', 'take', 'strong', false],
    ['geben', 'gegeben', 'give', 'strong', false],
    ['kommen', 'gekommen', 'come', 'strong', false],
    ['trinken', 'getrunken', 'drink', 'strong', false],
    ['helfen', 'geholfen', 'help', 'strong', false],
    ['treffen', 'getroffen', 'meet', 'strong', false],
    ['tragen', 'getragen', 'carry / wear', 'strong', false],
    ['laufen', 'gelaufen', 'run / walk', 'strong', false],
    ['stehen', 'gestanden', 'stand', 'strong', false],
    ['liegen', 'gelegen', 'lie / be located', 'strong', false],
    ['verstehen', 'verstanden', 'understand', 'strong', false],
    ['vergessen', 'vergessen', 'forget', 'strong', false],
    ['verlieren', 'verloren', 'lose', 'strong', false],
    ['bringen', 'gebracht', 'bring', 'mixed', false],
    ['denken', 'gedacht', 'think', 'mixed', false],
    ['kennen', 'gekannt', 'know / be familiar with', 'mixed', false],
    ['aufstehen', 'aufgestanden', 'get up', 'strong', true],
    ['anrufen', 'angerufen', 'call on the phone', 'strong', true],
  ]),
];
