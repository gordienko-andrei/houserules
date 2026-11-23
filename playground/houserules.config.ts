import { defineConfig } from 'houserules';

export default defineConfig({
  roles: {
    money: {
      component: 'ui-money',
      usage: '<ui-money [value]="$value" />',
      files: 'src/app/ui/money/**',
    },
    action: {
      component: 'ui-button',
      usage: '<ui-button (pressed)="run()">{{ $value }}</ui-button>',
      files: 'src/app/ui/button/**',
      replaces: 'button',
    },
  },
  restrictions: [
    {
      selector: 'BoundAttribute[name="innerHTML"]',
      message: 'Do not render backend text as HTML with [innerHTML]: interpolate it, so it stays text.',
      bad: '<p [innerHTML]="event.message"></p>',
      good: '<p>{{ event.message }}</p>',
    },
  ],
  currencyWords: ['руб.'],
});
