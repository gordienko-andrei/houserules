import { describe, expect, it } from 'vitest';
import { summarizeReplacements } from './replacement-summary';
import type { ReplacedElement } from './template-facts';

function replaced(file: string, directives: string[] = []): ReplacedElement {
  return { selector: 'button', directives, example: { file, line: 1, text: '<button>' }, classes: [] };
}

describe('summarizeReplacements', () => {
  it('counts reported elements and the directives of skipped ones', () => {
    const elements = [
      replaced('src/a.html'),
      replaced('src/b.html', ['matChipRemove']),
      replaced('src/c.html', ['mat-tab-link', 'matChipRemove']),
    ];
    expect(summarizeReplacements([{ selector: 'button' }], elements)).toEqual([
      {
        selector: 'button',
        reported: 1,
        examples: [{ file: 'src/a.html', line: 1, text: '<button>' }],
        skipped: 2,
        directives: [
          { name: 'matChipRemove', count: 2 },
          { name: 'mat-tab-link', count: 1 },
        ],
        undeclaredAttributes: [],
        keepNativeHints: [],
      },
    ]);
  });

  it('names skipped attributes that no declared directive selects on', () => {
    const [summary] = summarizeReplacements(
      [{ selector: 'button' }],
      [replaced('src/a.html', ['tuiButton', 'iconStart'])],
      new Set(['tuibutton']),
    );
    expect(summary?.undeclaredAttributes).toEqual(['iconStart']);
  });

  it('leaves out the files of the role component, as the linter does', () => {
    const [summary] = summarizeReplacements(
      [{ selector: 'button', ignoredFiles: ['src/app/ui/button/**'] }],
      [replaced('src/app/ui/button/button.component.html'), replaced('src/app/page.html')],
    );
    expect(summary?.reported).toBe(1);
    expect(summary?.examples.map((example) => example.file)).toEqual(['src/app/page.html']);
  });
});
