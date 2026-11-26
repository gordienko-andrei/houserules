export interface FormatRole {
  readonly role: string;
  readonly angularPipe: string;
  readonly defaultFormat: string;
  readonly formattingMethods: readonly string[];
}

// The formatting pipes of Angular and the defaults they use without an argument.
export const FORMAT_ROLES: readonly FormatRole[] = [
  { role: 'date', angularPipe: 'date', defaultFormat: 'mediumDate', formattingMethods: ['toLocaleDateString', 'toLocaleTimeString'] },
  { role: 'number', angularPipe: 'number', defaultFormat: '1.0-3', formattingMethods: ['toFixed', 'toPrecision'] },
  { role: 'percent', angularPipe: 'percent', defaultFormat: '1.0-0', formattingMethods: [] },
];

export function findFormatRole(role: string): FormatRole | undefined {
  return FORMAT_ROLES.find((item) => item.role === role);
}
