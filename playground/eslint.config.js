import templateParser from '@angular-eslint/template-parser';
import houserules from 'eslint-plugin-houserules';

export default [
  {
    files: ['**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { houserules },
    rules: {
      'houserules/use-money-component': [
        'error',
        {
          component: 'ui-money',
          usage: '<ui-money [value]="$value" />',
          currencyWords: ['руб.'],
        },
      ],
    },
  },
  {
    files: ['src/app/ui/money/**/*.html'],
    rules: { 'houserules/use-money-component': 'off' },
  },
];
