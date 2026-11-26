import type { Linter } from 'eslint';
import { findInlineTemplates, type InlineTemplateSpan } from '@andrewgordienko/houserules';

export const INLINE_TEMPLATES_PROCESSOR = 'inline-templates';

const templatesByFile = new Map<string, InlineTemplateSpan[]>();

function shiftPosition(template: InlineTemplateSpan, line: number, column: number): { line: number; column: number } {
  return line === 1 ? { line: template.line, column: template.column + column - 1 } : { line: template.line + line - 1, column };
}

function shiftFix(fix: Linter.LintMessage['fix'], offset: number): Linter.LintMessage['fix'] {
  return fix === undefined ? undefined : { ...fix, range: [fix.range[0] + offset, fix.range[1] + offset] };
}

function shiftMessage(message: Linter.LintMessage, template: InlineTemplateSpan): Linter.LintMessage {
  const start = shiftPosition(template, message.line, message.column);
  const end = message.endLine === undefined || message.endColumn === undefined ? undefined : shiftPosition(template, message.endLine, message.endColumn);
  const fix = shiftFix(message.fix, template.offset);
  const suggestions = message.suggestions?.map((suggestion) => ({ ...suggestion, fix: shiftFix(suggestion.fix, template.offset) ?? suggestion.fix }));
  return {
    ...message,
    ...start,
    ...(end === undefined ? {} : { endLine: end.line, endColumn: end.column }),
    ...(fix === undefined ? {} : { fix }),
    ...(suggestions === undefined ? {} : { suggestions }),
  };
}

// The `.ts` text goes through unchanged as the first block, so the project's own TypeScript rules keep working.
export const inlineTemplatesProcessor: Linter.Processor = {
  meta: { name: INLINE_TEMPLATES_PROCESSOR },
  supportsAutofix: true,
  preprocess(text, filename) {
    const templates = findInlineTemplates(filename, text);
    templatesByFile.set(filename, templates);
    return [text, ...templates.map((template, index) => ({ text: template.text, filename: `${index}_inline-template.component.html` }))];
  },
  postprocess(messageLists, filename) {
    const templates = templatesByFile.get(filename) ?? [];
    templatesByFile.delete(filename);
    const [own = [], ...templateMessages] = messageLists;
    return [
      ...own,
      ...templateMessages.flatMap((messages, index) => {
        const template = templates[index];
        return template === undefined ? [] : messages.map((message) => shiftMessage(message, template));
      }),
    ];
  },
};
