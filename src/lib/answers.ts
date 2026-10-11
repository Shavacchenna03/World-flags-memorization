import { Country } from '../types/country';

/**
 * Curated list of unambiguous, approved aliases for sovereign countries.
 * Mapped to canonical country code for unambiguous identification.
 */
export const APPROVED_ALIASES: Readonly<Record<string, readonly string[]>> = {
  US: ['usa', 'united states of america', 'america'],
  GB: ['uk', 'united kingdom', 'great britain', 'britain'],
  AE: ['uae', 'united arab emirates', 'emirates'],
  CD: [
    'drc',
    'dr congo',
    'democratic republic of the congo',
    'democratic republic of congo',
    'congo kinshasa',
  ],
  CG: ['congo', 'republic of the congo', 'republic of congo', 'congo brazzaville'],
  VA: ['holy see', 'vatican', 'vatican city state'],
  KR: ['south korea', 'republic of korea', 'rok'],
  KP: ['north korea', "democratic people's republic of korea", 'dprk'],
  RU: ['russia', 'russian federation'],
  TL: ['east timor', 'timor-leste'],
  MM: ['burma', 'myanmar'],
  NL: ['holland', 'the netherlands', 'netherlands'],
  SZ: ['swaziland', 'eswatini'],
  CV: ['cape verde', 'cabo verde'],
  CZ: ['czech republic', 'czechia'],
  TR: ['turkey', 'turkiye'],
  CI: ['ivory coast', "cote d'ivoire", 'cote divoire'],
  ST: ['sao tome', 'sao tome and principe', 'sao tome & principe'],
  TT: ['trinidad', 'trinidad & tobago', 'trinidad and tobago'],
  BA: ['bosnia', 'bosnia & herzegovina', 'bosnia and herzegovina'],
  AG: ['antigua', 'antigua & barbuda', 'antigua and barbuda'],
  KN: ['st kitts and nevis', 'saint kitts and nevis', 'st kitts & nevis'],
  VC: [
    'st vincent and the grenadines',
    'saint vincent and the grenadines',
    'st vincent & the grenadines',
  ],
  LC: ['st lucia', 'saint lucia'],
  FM: ['micronesia', 'federated states of micronesia'],
  MK: ['north macedonia', 'macedonia', 'republic of north macedonia'],
};

/**
 * Normalizes text by removing diacritics, extra spaces, and common punctuation.
 */
export function normalizeAnswerText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .toLowerCase()
    // Decompose accented characters (e.g., é -> e, ü -> u, ç -> c)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace punctuation, dashes, and typographic quotes/apostrophes with spaces
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'"?’‘“”]/g, ' ')
    // Collapse multiple whitespaces into a single space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Evaluates a typed learner response against a target country.
 * Supports exact common name, official name, and verified aliases.
 */
export function evaluateTypedAnswer(
  learnerInput: string,
  targetCountry: Country
): {
  isCorrect: boolean;
  normalizedInput: string;
  expectedAnswer: string;
} {
  const normalizedInput = normalizeAnswerText(learnerInput);
  const expectedAnswer = targetCountry.name;

  if (!normalizedInput) {
    return {
      isCorrect: false,
      normalizedInput,
      expectedAnswer,
    };
  }

  // 1. Direct match with common name
  const normalizedCommonName = normalizeAnswerText(targetCountry.name);
  if (normalizedInput === normalizedCommonName) {
    return { isCorrect: true, normalizedInput, expectedAnswer };
  }

  // 2. Direct match with official name
  const normalizedOfficialName = normalizeAnswerText(targetCountry.officialName);
  if (normalizedInput === normalizedOfficialName) {
    return { isCorrect: true, normalizedInput, expectedAnswer };
  }

  // 3. Match against approved aliases for this country
  const aliases = APPROVED_ALIASES[targetCountry.code] || [];
  for (const alias of aliases) {
    if (normalizedInput === normalizeAnswerText(alias)) {
      return { isCorrect: true, normalizedInput, expectedAnswer };
    }
  }

  return {
    isCorrect: false,
    normalizedInput,
    expectedAnswer,
  };
}

/**
 * Generates 4 distinct options for a multiple-choice question.
 * Guarantees exactly 1 correct answer and 3 distinct distractors.
 */
export function generateMultipleChoiceOptions(
  correctCountry: Country,
  candidatePool: readonly Country[],
  seed?: number
): readonly Country[] {
  // Filter out the correct country from distractors
  const distractors = candidatePool.filter((c) => c.code !== correctCountry.code);

  if (distractors.length < 3) {
    throw new Error(
      `Insufficient candidate pool to generate 4 distinct multiple choice options (found ${distractors.length} distractors).`
    );
  }

  // Simple pseudo-random or seeded shuffle
  const shuffled = [...distractors].sort((a, b) => {
    if (seed !== undefined) {
      // Deterministic comparison when seed provided
      const hA = (a.code.charCodeAt(0) * 31 + a.code.charCodeAt(1) + seed) % 100;
      const hB = (b.code.charCodeAt(0) * 31 + b.code.charCodeAt(1) + seed) % 100;
      return hA - hB;
    }
    return Math.random() - 0.5;
  });

  const selectedDistractors = shuffled.slice(0, 3);
  const allFour = [correctCountry, ...selectedDistractors];

  // Randomize insertion position of the correct answer
  const insertionIndex =
    seed !== undefined
      ? seed % 4
      : Math.floor(Math.random() * 4);

  const finalOptions: Country[] = [];
  const temp = [...selectedDistractors];
  temp.splice(insertionIndex, 0, correctCountry);

  return Object.freeze(temp);
}
