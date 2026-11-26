# houserules/no-hardcoded-plural

Disallow a number followed by a fixed English plural noun.

- Type: suggestion
- Layer: `strict` (`warn`), off in `recommended`
- Autofix: no

## Why

`{{ count }} items` reads "1 items" when the count is 1. The plural form depends on the number, so it belongs in
the message, not in the template text. Angular has ICU expressions and the `i18nPlural` pipe for it.

## What it reports

An interpolation in text followed by an English noun ending in `s`, with up to two words between them:

```html
<p>{{ p.boardsFound }} boards found</p>
<p>Read {{ result.read }} new messages</p>
```

It does not report:

- verbs and other words ending in `s` (`has`, `was`, `always`) and singular words ending in `ss`, `us`, `is`
  (`process`, `status`, `analysis`);
- part of a whole, which reads right for one as well: `{{ n }} of your bullets`, `{{ done }} of {{ total }} points`,
  `{{ used }} / {{ max }} characters`;
- a value that already chooses the form: `{{ n === 1 ? 'item' : 'items' }}` or `{{ n }} {{ n === 1 ? 'merge' : 'merges' }}`;
- text in attributes.

## How to fix

```html
<p i18n>{count, plural, =1 {1 board} other {{{ count }} boards}} found</p>
<p>{{ count | i18nPlural: { '=1': '# board', other: '# boards' } }} found</p>
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `ignoreWords` | `[]` | Words ending in `s` that are not plural nouns in your texts, for example `canvas`. |

## Why it is off in `recommended`

The check knows English only and guesses a noun from its ending. Projects with texts in other languages, or with
all texts in i18n files, do not need it.
