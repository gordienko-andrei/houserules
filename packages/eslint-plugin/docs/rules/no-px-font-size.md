# houserules/no-px-font-size

Disallow font sizes in fixed `px` in Angular templates.

- Type: suggestion
- Layer: `recommended`
- Autofix: no

## Why

Text must scale up to 200% without loss of content:
[WCAG 1.4.4 Resize Text (AA)](https://www.w3.org/TR/WCAG22/#resize-text). Sizes in `rem` follow the
browser font setting, sizes in `px` do not.

## What it reports

- `style="font-size: 14px"` and the `font` shorthand: `style="font: bold 12px Arial"`;
- `[style.font-size.px]="14"`;
- `[style.fontSize]="'12px'"`, `[style.font-size]="size + 'px'"`;
- `[ngStyle]` and `[style]` maps: `{ 'font-size': '10px' }`, `{ 'font-size.px': 10 }`;
- `[attr.style]="'font-size: 9px'"`.

`px` in other properties (`padding`, `width`) is allowed.

## Stylesheets

ESLint sees only templates. For `.css` and `.scss`, `houserules` ships a stylelint config with the same check
(built-in `declaration-property-unit-disallowed-list`):

```json
{ "extends": ["houserules/stylelint"] }
```

Sizes behind SCSS variables and mixins (`font-size: $base`) and inline `styles` of components are not checked.
