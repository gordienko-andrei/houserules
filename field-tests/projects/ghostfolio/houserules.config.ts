import { defineConfig } from 'houserules';

export default defineConfig({
  roles: {
    money: {
      component: 'gf-value',
      usage: '<gf-value [isCurrency]="true" [locale]="locale" [unit]="currency" [value]="$value" />',
      files: 'libs/ui/src/lib/value/**',
    },
  },
});
