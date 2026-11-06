import { describe, expect, it } from 'vitest';
import { findGlueBetweenValues, findStepsInText, findTrailingSeparator, isMenuPath } from './glued-text';

describe('findGlueBetweenValues', () => {
  it('finds a separator between two values', () => {
    expect(findGlueBetweenValues(['', ' • ', ''])).toEqual({ kind: 'separator', marker: '•' });
    expect(findGlueBetweenValues(['Товаров: ', ', скидка ', '%'])).toEqual({ kind: 'separator', marker: ',' });
    expect(findGlueBetweenValues(['', ' | ', ' | ', ''])).toEqual({ kind: 'separator', marker: '|' });
  });

  it('finds the brief example of glued fields', () => {
    expect(findGlueBetweenValues(['', ' •', '•магазин «', '»•задолжность ', ' руб•'])).toEqual({
      kind: 'separator',
      marker: '•',
    });
  });

  it('treats one arrow between values as a comparison and a chain of arrows as steps', () => {
    expect(findGlueBetweenValues(['Было ', ' → ', ''])).toEqual({ kind: 'comparison', marker: '→' });
    expect(findGlueBetweenValues(['', ' -> ', ''])).toEqual({ kind: 'comparison', marker: '->' });
    expect(findGlueBetweenValues(['', ' → ', ' → ', ''])).toEqual({ kind: 'steps', marker: '→' });
  });

  it('ignores separators outside the gaps between values', () => {
    expect(findGlueBetweenValues(['Итого, ', '; ok'])).toBeUndefined();
    expect(findGlueBetweenValues(['→ ', ''])).toBeUndefined();
  });

  it('allows commas and semicolons inside a sentence', () => {
    expect(findGlueBetweenValues(['', ' rows imported: ', ' added, ', ' updated, ', ' skipped.'])).toBeUndefined();
    expect(findGlueBetweenValues(['Exports: ', ' today; ', ' this month!'])).toBeUndefined();
  });

  it('finds separator marks even inside a sentence', () => {
    expect(findGlueBetweenValues(['', ' orders · ', ' items shipped.'])).toEqual({ kind: 'separator', marker: '·' });
    expect(findGlueBetweenValues(['', ', ', ' · ', ''])).toEqual({ kind: 'separator', marker: '·' });
  });

  it('allows words, spaces, ranges and fractions between values', () => {
    expect(findGlueBetweenValues(['', ' ', ''])).toBeUndefined();
    expect(findGlueBetweenValues(['', ' из ', ''])).toBeUndefined();
    expect(findGlueBetweenValues(['', ' – ', ''])).toBeUndefined();
    expect(findGlueBetweenValues(['', '/', ''])).toBeUndefined();
  });
});

describe('findStepsInText', () => {
  it('finds phrases joined with two or more arrows', () => {
    expect(findStepsInText('Откройте настройки → выберите профиль → сохраните')).toEqual({
      kind: 'steps',
      marker: '→',
    });
  });

  it('finds capitalised steps written as phrases', () => {
    expect(findStepsInText('First time: Create a project → wait until it is Ready → invite the team → Publish it.')).toEqual({
      kind: 'steps',
      marker: '→',
    });
  });

  it('ignores a single arrow', () => {
    expect(findStepsInText('Подробнее →')).toBeUndefined();
    expect(findStepsInText('')).toBeUndefined();
  });

  it('ignores a menu path', () => {
    expect(findStepsInText('Download your data in Settings → Account → Download my data.')).toBeUndefined();
    expect(findStepsInText('Profile → Settings → Data privacy → Get a copy of your data → Contacts.')).toBeUndefined();
    expect(findStepsInText('Откройте Настройки → Аккаунт → Удалить')).toBeUndefined();
  });
});

describe('isMenuPath', () => {
  it('needs capitalised short items on both sides of every arrow', () => {
    expect(isMenuPath('Settings → Account → Delete account')).toBe(true);
    expect(isMenuPath('Settings → open the account page and find the delete button → Delete')).toBe(false);
    expect(isMenuPath('settings → Account → Delete')).toBe(false);
    expect(isMenuPath('Settings → Account')).toBe(false);
  });
});

describe('findTrailingSeparator', () => {
  it('finds a separator left after the last value', () => {
    expect(findTrailingSeparator(['', ' ·\n  '])).toEqual({ kind: 'separator', marker: '·' });
  });

  it('ignores text after the last value and text without values', () => {
    expect(findTrailingSeparator(['', ' руб.'])).toBeUndefined();
    expect(findTrailingSeparator(['', ''])).toBeUndefined();
    expect(findTrailingSeparator([' · '])).toBeUndefined();
  });
});
