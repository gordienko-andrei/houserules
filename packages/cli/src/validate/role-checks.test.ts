import { afterAll, describe, expect, it } from 'vitest';
import { parseConfig } from '../config/load-config';
import type { RoleMapping } from '../config/schema';
import { scanProject } from '../scan/scan-project';
import { createFixtureProject, SAMPLE_PROJECT } from '../testing/fixture-project';
import { checkRoleTarget, checkUsageCallsTarget, checkUsageSyntax } from './role-checks';
import { validateProject } from './validate-project';

function role(input: Record<string, string>): RoleMapping {
  const mapping = parseConfig({ roles: { status: input } }).roles['status'];
  if (mapping === undefined) {
    throw new Error('The role was not parsed.');
  }
  return mapping;
}

describe('role checks', () => {
  const project = createFixtureProject(SAMPLE_PROJECT);
  afterAll(() => project.remove());
  const scan = scanProject(project.root);

  it('accepts components and pipes from the project or its libraries', () => {
    const projectComponent = role({ component: 'app-money', usage: '<app-money [value]="$value" />' });
    const libraryComponent = role({ component: 'acme-badge', usage: '<acme-badge />' });
    const libraryPipe = role({ pipe: 'acmeAmount', usage: '{{ $value | acmeAmount }}' });
    expect(checkRoleTarget('money', projectComponent, scan).status).toBe('ok');
    expect(checkRoleTarget('status', libraryComponent, scan).status).toBe('ok');
    expect(checkRoleTarget('money', libraryPipe, scan).status).toBe('ok');
  });

  it('rejects a component that does not exist', () => {
    expect(checkRoleTarget('money', role({ component: 'app-price', usage: '<app-price />' }), scan)).toEqual({
      status: 'error',
      message: 'money: <app-price> is not declared in the project or its libraries and is never used.',
    });
  });

  it('checks that the usage is a template that calls its target', () => {
    const broken = role({ component: 'app-money', usage: '<app-money [value]="$value"' });
    const otherComponent = role({ component: 'app-money', usage: '<app-price [value]="$value" />' });
    const pipe = role({ pipe: 'acmeAmount', usage: '{{ $value | acmeAmount: "RUB" }}' });
    expect(checkUsageSyntax('money', broken).status).toBe('error');
    expect(checkUsageCallsTarget('money', otherComponent).status).toBe('error');
    expect(checkUsageCallsTarget('money', pipe).status).toBe('ok');
  });
});

describe('validateProject', () => {
  it('reports a missing config as an error', async () => {
    const project = createFixtureProject({ 'package.json': '{}' });
    const checks = await validateProject(project.root);
    project.remove();
    expect(checks).toHaveLength(1);
    expect(checks[0]?.status).toBe('error');
  });

  it('checks every role and lists the rules that are on', async () => {
    const project = createFixtureProject({
      ...SAMPLE_PROJECT,
      'houserules.config.ts':
        "export default { roles: { money: { component: 'app-price', usage: '<app-price [value]=\"$value\" />' } } };\n",
    });
    const checks = await validateProject(project.root);
    project.remove();
    expect(checks.map((check) => `${check.status} ${check.message}`)).toEqual([
      expect.stringMatching(/^ok config .*houserules\.config\.ts is valid\.$/),
      'error money: <app-price> is not declared in the project or its libraries and is never used.',
      'ok money: usage calls <app-price>.',
      'ok money: usage is a valid template.',
      expect.stringMatching(/^(ok money: usage passes Houserules rules|skipped money: usage not linted.*)\.$/),
      'ok rule houserules/use-money-component is on.',
      'ok rule houserules/no-glued-fields is on.',
      'ok rule houserules/require-async-states is on.',
      'ok rule houserules/no-px-font-size is on.',
    ]);
  });
});
