import { SECTION_END, SECTION_START } from './agents-section';

export function upsertSection(document: string, section: string): string {
  const start = document.indexOf(SECTION_START);
  const end = document.indexOf(SECTION_END);
  if (start !== -1 && end > start) {
    return document.slice(0, start) + section + document.slice(end + SECTION_END.length);
  }
  if (document.trim() === '') {
    return `${section}\n`;
  }
  return `${document.trimEnd()}\n\n${section}\n`;
}

const AGENTS_IMPORT = '@AGENTS.md';

export function ensureAgentsImport(claudeDocument: string): string {
  if (claudeDocument.split('\n').some((line) => line.trim() === AGENTS_IMPORT)) {
    return claudeDocument;
  }
  if (claudeDocument.trim() === '') {
    return `${AGENTS_IMPORT}\n`;
  }
  return `${AGENTS_IMPORT}\n\n${claudeDocument}`;
}
