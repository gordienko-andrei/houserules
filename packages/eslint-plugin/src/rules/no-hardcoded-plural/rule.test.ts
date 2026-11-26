import { describe, expect, it } from 'vitest';
import { createTemplateRuleTester } from '../../testing/rule-tester';
import { findPluralNounAfterValue } from './plural-noun';
import { RULE_NAME, noHardcodedPlural } from './rule';

describe('findPluralNounAfterValue', () => {
  it('finds a plural noun right after the value or after up to two words', () => {
    expect(findPluralNounAfterValue(' boards found')).toEqual({ noun: 'boards', phrase: 'boards' });
    expect(findPluralNounAfterValue(' new messages')).toEqual({ noun: 'messages', phrase: 'new messages' });
  });

  it('ignores verbs, singular words in -ss, -us, -is and ignored words', () => {
    for (const text of [' has joined', ' was sent', ' status', ' process', ' analysis', ' of 10', ' items'.toUpperCase(), '']) {
      expect(findPluralNounAfterValue(text), text).toBeUndefined();
    }
    expect(findPluralNounAfterValue(' canvas', new Set(['canvas']))).toBeUndefined();
  });
});

createTemplateRuleTester().run(RULE_NAME, noHardcodedPlural, {
  valid: [
    '<p>{{ user.name }} has joined</p>',
    "<p>{{ count }} {{ count === 1 ? 'item' : 'items' }}</p>",
    "<p>{{ count | i18nPlural: itemsMapping }}</p>",
    '<p>{{ done }} of {{ total }}</p>',
    '<p title="{{ n }} items"></p>',
    '<p>Combines {{ sources.length }} of your bullets</p>',
    '<p>{{ done }} of {{ total }} weighted points</p>',
    '<p>{{ text().length }} / {{ maxChars }} characters</p>',
    "<p>{{ n === 1 ? '1 question asks' : n + ' questions ask' }}</p>",
    "<p>{{ count }} {{ count === 1 ? 'merge' : 'merges' }} of existing bullets</p>",
    { code: '<p>{{ n }} canvas</p>', options: [{ ignoreWords: ['canvas'] }] },
  ],
  invalid: [
    {
      code: '<p>{{ p.boardsFound }} boards</p>',
      errors: [{ messageId: 'hardcodedPlural', data: { value: '{{ p.boardsFound }}', phrase: 'boards' }, column: 7 }],
    },
    {
      code: '<p>Read {{ result.read }} new messages</p>',
      errors: [{ messageId: 'hardcodedPlural', data: { value: '{{ result.read }}', phrase: 'new messages' } }],
    },
    {
      code: '<span>{{ items.length }} items · {{ total }} orders</span>',
      errors: [{ messageId: 'hardcodedPlural' }, { messageId: 'hardcodedPlural' }],
    },
  ],
});
