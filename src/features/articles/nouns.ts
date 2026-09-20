export type Question = 'gender' | 'accusative' | 'dative' | 'genitive';
export type Article = 'der' | 'die' | 'das' | 'den' | 'dem' | 'des';
export const steps: Question[] = ['gender', 'accusative', 'dative', 'genitive'];
export const articles: Article[] = ['der', 'die', 'das', 'den', 'dem', 'des'];
export type Gender = 'masculine' | 'feminine' | 'neuter';
export const forms: Record<Gender, Article[]> = { masculine: ['der','den','dem','des'], feminine: ['die','die','der','der'], neuter: ['das','das','dem','des'] };
export interface Noun { id: string; noun: string; english: string; gender: Gender; tier: 'essential' | 'common' | 'extended'; version: number; sentences: Record<Exclude<Question, 'gender'>, string> }
// Editorial importance tiers. Each underscore is the one article blank.
export const nouns: Noun[] = [
  {
    "id": "hund",
    "noun": "Hund",
    "english": "dog",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich sehe _ Hund.",
      "dative": "Ich spiele mit _ Hund.",
      "genitive": "Das Spielzeug _ Hundes ist rot."
    }
  },
  {
    "id": "mann",
    "noun": "Mann",
    "english": "man",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich sehe _ Mann.",
      "dative": "Ich helfe _ Mann.",
      "genitive": "Die Tasche _ Mannes ist schwer."
    }
  },
  {
    "id": "vater",
    "noun": "Vater",
    "english": "father",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich frage _ Vater.",
      "dative": "Ich danke _ Vater.",
      "genitive": "Das Auto _ Vaters ist blau."
    }
  },
  {
    "id": "bruder",
    "noun": "Bruder",
    "english": "brother",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich besuche _ Bruder.",
      "dative": "Ich helfe _ Bruder.",
      "genitive": "Das Fahrrad _ Bruders ist neu."
    }
  },
  {
    "id": "freund",
    "noun": "Freund",
    "english": "friend (male)",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich besuche _ Freund.",
      "dative": "Ich spreche mit _ Freund.",
      "genitive": "Das Haus _ Freundes ist groß."
    }
  },
  {
    "id": "tisch",
    "noun": "Tisch",
    "english": "table",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich kaufe _ Tisch.",
      "dative": "Das Buch liegt auf _ Tisch.",
      "genitive": "Die Beine _ Tisches sind kurz."
    }
  },
  {
    "id": "stuhl",
    "noun": "Stuhl",
    "english": "chair",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich kaufe _ Stuhl.",
      "dative": "Ich sitze auf _ Stuhl.",
      "genitive": "Die Lehne _ Stuhls ist kaputt."
    }
  },
  {
    "id": "tag",
    "noun": "Tag",
    "english": "day",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich genieße _ Tag.",
      "dative": "An _ Tag bin ich zu Hause.",
      "genitive": "Am Ende _ Tages bin ich müde."
    }
  },
  {
    "id": "zug",
    "noun": "Zug",
    "english": "train",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich nehme _ Zug.",
      "dative": "Ich fahre mit _ Zug.",
      "genitive": "Die Türen _ Zuges sind offen."
    }
  },
  {
    "id": "apfel",
    "noun": "Apfel",
    "english": "apple",
    "gender": "masculine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich esse _ Apfel.",
      "dative": "In _ Apfel ist ein Wurm.",
      "genitive": "Die Schale _ Apfels ist rot."
    }
  },
  {
    "id": "frau",
    "noun": "Frau",
    "english": "woman",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich sehe _ Frau.",
      "dative": "Ich helfe _ Frau.",
      "genitive": "Das Auto _ Frau ist rot."
    }
  },
  {
    "id": "mutter",
    "noun": "Mutter",
    "english": "mother",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich frage _ Mutter.",
      "dative": "Ich danke _ Mutter.",
      "genitive": "Die Tasche _ Mutter ist blau."
    }
  },
  {
    "id": "schwester",
    "noun": "Schwester",
    "english": "sister",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich besuche _ Schwester.",
      "dative": "Ich helfe _ Schwester.",
      "genitive": "Das Zimmer _ Schwester ist groß."
    }
  },
  {
    "id": "katze",
    "noun": "Katze",
    "english": "cat",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich sehe _ Katze.",
      "dative": "Ich spiele mit _ Katze.",
      "genitive": "Das Fell _ Katze ist weich."
    }
  },
  {
    "id": "schule",
    "noun": "Schule",
    "english": "school",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich besuche _ Schule.",
      "dative": "Ich lerne in _ Schule.",
      "genitive": "Der Eingang _ Schule ist offen."
    }
  },
  {
    "id": "tür",
    "noun": "Tür",
    "english": "door",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich öffne _ Tür.",
      "dative": "Ich stehe vor _ Tür.",
      "genitive": "Der Griff _ Tür ist kaputt."
    }
  },
  {
    "id": "tasche",
    "noun": "Tasche",
    "english": "bag",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich kaufe _ Tasche.",
      "dative": "Das Buch liegt in _ Tasche.",
      "genitive": "Die Farbe _ Tasche gefällt mir."
    }
  },
  {
    "id": "stadt",
    "noun": "Stadt",
    "english": "city",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich besuche _ Stadt.",
      "dative": "Ich wohne in _ Stadt.",
      "genitive": "Das Zentrum _ Stadt ist schön."
    }
  },
  {
    "id": "straße",
    "noun": "Straße",
    "english": "street",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich überquere _ Straße.",
      "dative": "Ich wohne in _ Straße.",
      "genitive": "Der Name _ Straße ist kurz."
    }
  },
  {
    "id": "zeit",
    "noun": "Zeit",
    "english": "time",
    "gender": "feminine",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich nutze _ Zeit.",
      "dative": "Mit _ Zeit wird es leichter.",
      "genitive": "Während _ Zeit war ich krank."
    }
  },
  {
    "id": "kind",
    "noun": "Kind",
    "english": "child",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich sehe _ Kind.",
      "dative": "Ich helfe _ Kind.",
      "genitive": "Das Spielzeug _ Kindes ist neu."
    }
  },
  {
    "id": "haus",
    "noun": "Haus",
    "english": "house",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich kaufe _ Haus.",
      "dative": "Ich wohne in _ Haus.",
      "genitive": "Das Dach _ Hauses ist rot."
    }
  },
  {
    "id": "auto",
    "noun": "Auto",
    "english": "car",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich wasche _ Auto.",
      "dative": "Ich fahre mit _ Auto.",
      "genitive": "Die Farbe _ Autos ist blau."
    }
  },
  {
    "id": "buch",
    "noun": "Buch",
    "english": "book",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich lese _ Buch.",
      "dative": "Ich lese in _ Buch.",
      "genitive": "Der Titel _ Buches ist lang."
    }
  },
  {
    "id": "zimmer",
    "noun": "Zimmer",
    "english": "room",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich putze _ Zimmer.",
      "dative": "Ich schlafe in _ Zimmer.",
      "genitive": "Die Tür _ Zimmers ist offen."
    }
  },
  {
    "id": "fenster",
    "noun": "Fenster",
    "english": "window",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich öffne _ Fenster.",
      "dative": "Ich stehe vor _ Fenster.",
      "genitive": "Das Glas _ Fensters ist sauber."
    }
  },
  {
    "id": "bett",
    "noun": "Bett",
    "english": "bed",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich kaufe _ Bett.",
      "dative": "Ich schlafe in _ Bett.",
      "genitive": "Die Größe _ Bettes passt gut."
    }
  },
  {
    "id": "wasser",
    "noun": "Wasser",
    "english": "water",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich trinke _ Wasser.",
      "dative": "Der Fisch schwimmt in _ Wasser.",
      "genitive": "Die Temperatur _ Wassers ist angenehm."
    }
  },
  {
    "id": "essen",
    "noun": "Essen",
    "english": "food",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich koche _ Essen.",
      "dative": "Nach _ Essen gehe ich spazieren.",
      "genitive": "Der Geruch _ Essens ist gut."
    }
  },
  {
    "id": "fahrrad",
    "noun": "Fahrrad",
    "english": "bicycle",
    "gender": "neuter",
    "tier": "essential",
    "version": 1,
    "sentences": {
      "accusative": "Ich repariere _ Fahrrad.",
      "dative": "Ich fahre mit _ Fahrrad.",
      "genitive": "Die Farbe _ Fahrrads ist grün."
    }
  }
];
export function solution(noun: Noun, question: Question) {
  const expected = forms[noun.gender][steps.indexOf(question)];
  const dativeSentence = noun.sentences.dative;
  const preposition = /\b(mit|in|auf|vor|nach) _/i.exec(dativeSentence)?.[1]?.toLowerCase() ?? (/^An _/.test(dativeSentence) ? 'an' : undefined);
  const dativeRule = preposition === 'mit' || preposition === 'nach' ? `${preposition} always takes the dative.` : preposition === 'an' ? 'An takes the dative in this expression of time.' : preposition ? `${preposition} describes a location here, so it takes the dative.` : 'Helfen and danken take a dative object.';
  const rule = question === 'gender' ? 'Learn the nominative article together with the noun.' : question === 'accusative' ? 'The noun is the direct object of the verb.' : question === 'dative' ? dativeRule : 'The noun expresses a relationship or possession, or follows während, which takes genitive in standard German. Masculine and neuter nouns also have a genitive ending supplied in the sentence.';
  return { expected, explanation: `${noun.noun} is ${noun.gender}. ${question === 'gender' ? 'Nominative' : question} uses ${expected}. ${rule}` };
}
