import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { ESLint, Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import houserules from '../index';

describe('CLI and ESLint workflow', () => {
  it('validates, generates and applies configured rules', async () => {
    const root = mkdtempSync(resolve('../../playground/.workflow-'));
    const cli = resolve('../cli/dist/cli.mjs');
    const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args, '--cwd', root], { encoding: 'utf8' });
    const config = (rule: string, usage = '<ui-money [value]="$value" />') =>
      `export default ${JSON.stringify({ roles: { money: { component: 'ui-money', usage }, status: { component: 'ui-status', usage: '<ui-status />' } }, glossary: 'Private domain context', rules: { 'no-glued-fields': rule } })};`;
    try {
      writeFileSync(join(root, 'package.json'), '{}');
      writeFileSync(join(root, 'eslint.config.mjs'), "import houserules from 'eslint-plugin-houserules'; export default [...houserules.configs.recommended({ cwd: import.meta.dirname })];");
      writeFileSync(join(root, 'money.ts'), "@Component({selector: 'ui-money'}) class Money {}\n@Component({selector: 'ui-status'}) class Status {}");
      writeFileSync(join(root, 'houserules.config.mjs'), config('error'));
      writeFileSync(join(root, 'AGENTS.md'), '# Project rules\n');
      expect(run('validate').status).toBe(0);
      expect(run('generate').status).toBe(0);
      expect(run('generate', '--check').status).toBe(0);
      expect(readFileSync(join(root, 'AGENTS.md'), 'utf8')).toContain('# Project rules');
      const eslint = new ESLint({ cwd: root });
      const [result] = await eslint.lintText('{{ order.total | currency }}', { filePath: 'example.html' });
      expect(result?.messages[0]?.message).toContain('<ui-money [value]="order.total" />');
      const [fixed] = await eslint.lintText('<ui-money [value]="order.total" />', { filePath: 'example.html' });
      expect(fixed?.messages).toHaveLength(0);
      const lint = (input: string, severity: 'error' | 'off') => new Linter({ configType: 'flat' })
        .verify(input, houserules.configs.recommended({ config: {
          roles: { money: { component: 'ui-money', usage: '<ui-money [value]="$value" />' } },
          rules: { 'no-glued-fields': severity },
        } }), 'src/example.html');
      expect(lint('{{ order.total | currency }}', 'error')[0]?.message).toContain('<ui-money [value]="order.total" />');
      expect(lint('{{ a }} • {{ b }}', 'error')).toHaveLength(1);
      writeFileSync(join(root, 'houserules.config.mjs'), config('off'));
      expect(run('generate', '--check').status).toBe(0);
      expect(run('generate').status).toBe(0);
      expect(run('generate', '--check').status).toBe(0);
      expect(readFileSync(join(root, 'AGENTS.md'), 'utf8')).not.toContain('Never glue');
      expect(readFileSync(join(root, '.claude/skills/houserules-plan/SKILL.md'), 'utf8')).not.toContain('never join values');
      expect(lint('{{ a }} • {{ b }}', 'off')).toHaveLength(0);
      expect(run('context', '--list').stdout).toContain('money');
      const selectedContext = run('context', '--roles', 'money').stdout;
      expect(selectedContext).toContain('<ui-money');
      expect(selectedContext).not.toContain('<ui-status');
      expect(selectedContext).not.toContain('Private domain context');
      expect(run('context', '--roles', 'money', '--project').stdout).toContain('Private domain context');
      expect(run('context', '--roles', 'missing').status).toBe(1);
      const gluedUsage = '<ui-money [value]="$value" /><p>{{ a }} • {{ b }}</p>';
      writeFileSync(join(root, 'houserules.config.mjs'), config('warn', gluedUsage));
      const warning = run('validate');
      expect(warning.status).toBe(0);
      expect(warning.stdout).toContain('usage breaks its own rules');
      writeFileSync(join(root, 'houserules.config.mjs'), config('error', gluedUsage));
      expect(run('validate').status).toBe(1);
      writeFileSync(join(root, 'houserules.config.mjs'), config('off', '<ui-money-old [value]="$value" />'));
      expect(run('validate').status).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30000);
});
