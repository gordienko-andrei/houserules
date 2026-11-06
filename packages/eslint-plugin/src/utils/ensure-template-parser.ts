import type { TSESLint } from '@typescript-eslint/utils';

export function ensureTemplateParser(context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>): void {
  const services: Partial<Record<string, unknown>> = context.sourceCode.parserServices ?? {};
  if (typeof services['convertNodeSourceSpanToLoc'] !== 'function') {
    throw new Error(
      `Rule "${context.id}" needs '@angular-eslint/template-parser' as the parser for Angular templates.`,
    );
  }
}
