import { describe, expect, it } from 'vitest';
import type { Finding } from './lint-project';
import { codeCell, countMessages } from './report';

function finding(ruleId: string, messageId: string, message = `${messageId} message`): Finding {
  return { ruleId, messageId, file: 'a.html', line: 1, column: 1, message, code: '' };
}

describe('countMessages', () => {
  it('counts findings per rule and message, keeping the first message as the example', () => {
    const counts = countMessages([
      finding('houserules/b', 'x', 'first'),
      finding('houserules/a', 'y'),
      finding('houserules/b', 'x', 'second'),
      finding('houserules/b', 'z'),
    ]);

    expect(counts).toEqual([
      { ruleId: 'houserules/a', messageId: 'y', count: 1, example: 'y message' },
      { ruleId: 'houserules/b', messageId: 'x', count: 2, example: 'first' },
      { ruleId: 'houserules/b', messageId: 'z', count: 1, example: 'z message' },
    ]);
  });
});

describe('codeCell', () => {
  it('escapes pipes for a Markdown table', () => {
    expect(codeCell('{{ total | currency }}')).toBe('`{{ total \\| currency }}`');
  });

  it('uses a double backtick span for code with backticks', () => {
    expect(codeCell('[title]="`a`"')).toBe('`` [title]="`a`" ``');
  });

  it('shortens long lines', () => {
    expect(codeCell('x'.repeat(200))).toBe(`\`${'x'.repeat(120)}…\``);
  });

  it('keeps an empty cell empty', () => {
    expect(codeCell('')).toBe('');
  });
});
