import { defineConfig } from 'houserules';

export default defineConfig({
  roles: {
    money: {
      component: 'ui-money',
      usage: '<ui-money [value]="$value" />',
      files: 'src/app/ui/money/**',
    },
  },
  currencyWords: ['руб.'],
});
