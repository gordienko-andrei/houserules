import { describeMoneyWays, findMoneyCandidates } from './money-candidates';
import type { ComponentFacts, ScanReport } from './scan-project';
import type { UsageExample } from './template-facts';

const MAX_LISTED = 15;

function where(example: UsageExample): string {
  return `${example.file}:${example.line}`;
}

function componentLines(component: ComponentFacts): string[] {
  const origin = component.declaredIn === undefined ? component.source : `${component.source}, ${component.declaredIn}`;
  const deprecated = component.isDeprecated ? ', @deprecated' : '';
  const header = `  <${component.selector}> ${component.usage.count} uses (${origin}${deprecated})`;
  const calls = component.usage.shapes.map((shape) => `      ${shape.count}× ${shape.example.text}  ${where(shape.example)}`);
  return [header, ...calls];
}

export function formatScanReport(report: ScanReport): string {
  const lines = [`Houserules scan: ${report.templateCount} templates`, ''];
  const ways = describeMoneyWays(report);
  lines.push(ways.length === 0 ? 'Money: nothing found.' : `Money is shown in ${ways.length} ways:`);
  lines.push(...ways.map((way) => `  - ${way}`));
  for (const example of report.handFormattedMoney.examples) {
    lines.push(`      ${example.text}  ${where(example)}`);
  }
  const candidates = findMoneyCandidates(report);
  if (candidates.length > 0) {
    lines.push('', 'Money candidates:');
    lines.push(...candidates.map((candidate) => `  ${candidate.kind} ${candidate.name}: ${candidate.count} uses; ${candidate.reasons.join('; ')}`));
  }
  lines.push('', 'Custom elements by usage:');
  lines.push(...report.components.slice(0, MAX_LISTED).flatMap(componentLines));
  lines.push('', 'Pipes by usage:');
  lines.push(...report.pipes.slice(0, MAX_LISTED).map((pipe) => `  ${pipe.name} ${pipe.count} uses (${pipe.source}${pipe.declaredIn === undefined ? '' : `, ${pipe.declaredIn}`})`));
  if (report.parseErrors.length > 0) {
    lines.push('', 'Templates that could not be parsed:');
    lines.push(...report.parseErrors.map((error) => `  ${error.file}: ${error.message.split('\n')[0] ?? ''}`));
  }
  return lines.join('\n');
}
