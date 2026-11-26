// Up to two words between the number and the noun: `{{ n }} new messages`, `{{ n }} open pull requests`.
const NOUN_AFTER_VALUE = /^\s+((?:[a-z]+\s+){0,2})([a-z]{2,}s)(?![a-z])/;
const SINGULAR_ENDINGS = ['ss', 'us', 'is'];
const NOT_PLURAL_NOUNS = new Set([
  'has', 'was', 'does', 'its', 'his', 'yes', 'plus', 'thus', 'always', 'perhaps', 'across', 'unless', 'whereas',
  'besides', 'sometimes', 'towards', 'afterwards', 'news', 'series', 'species', 'means',
]);
// `{{ n }} of your bullets` and `{{ done }} of {{ total }} points` are right for one as well.
const PART_OF_WHOLE_BEFORE = /(?:\bof|\/)\s*$/;
const PART_OF_WHOLE_AFTER = /^of\s/;

export interface PluralNoun {
  readonly noun: string;
  readonly phrase: string;
}

// English only: `{{ count }} items` reads "1 items" when the count is 1.
export function findPluralNounAfterValue(
  textAfter: string,
  ignoredWords: ReadonlySet<string> = new Set(),
  textBefore = '',
): PluralNoun | undefined {
  const match = NOUN_AFTER_VALUE.exec(textAfter);
  const noun = match?.[2];
  if (match === null || noun === undefined) return undefined;
  if (PART_OF_WHOLE_BEFORE.test(textBefore) || PART_OF_WHOLE_AFTER.test(match[1] ?? '')) return undefined;
  if (NOT_PLURAL_NOUNS.has(noun) || ignoredWords.has(noun) || SINGULAR_ENDINGS.some((ending) => noun.endsWith(ending))) return undefined;
  return { noun, phrase: `${match[1] ?? ''}${noun}` };
}
