import { describe, expect, it } from 'vitest';
import { findGlueBetweenValues, findStepsInText } from './glued-text';

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

  it('ignores a single arrow', () => {
    expect(findStepsInText('Подробнее →')).toBeUndefined();
    expect(findStepsInText('')).toBeUndefined();
  });
});
