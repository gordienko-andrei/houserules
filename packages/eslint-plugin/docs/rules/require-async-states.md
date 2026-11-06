# houserules/require-async-states

Require loading, error and empty states where async data is shown.

- Type: suggestion
- Layer: `recommended`
- Autofix: no

## Why

A screen that shows nothing while data loads, or the same nothing when the request failed, leaves the user
guessing. The system should always keep users informed about what is going on:
[Nielsen Norman Group heuristic #1, Visibility of System Status](https://www.nngroup.com/articles/ten-usability-heuristics/).

## How it finds async data

Templates have no types, so the rule looks for the API of Angular resources (`resource`, `httpResource`,
`rxResource`): a call `x.value()` where `x` is a property, for example `orders.value()` or `page.orders.value()`.
For such `x` the same template must contain:

| State | Counts as handled |
| --- | --- |
| loading | `x.isLoading()` or `x.status()` |
| error | `x.error()` or `x.status()` |
| empty, only when `x.value()` is the collection of a `@for` | an `@empty` block, or a check of `x.value().length` |

`form.email().value()` (Signal Forms) is not a resource and is ignored, because its receiver is a call.

The `async` pipe is checked only with `asyncPipe: true`: `@if (data$ | async; as data)` then needs an
`@else` branch. The error of an observable cannot be seen from the template.

## Examples

Incorrect:

```html
<p>{{ profile.value()?.name }}</p>

@for (order of orders.value(); track order.id) {
  <p>{{ order.id }}</p>
}
```

Correct:

```html
@if (orders.isLoading()) {
  <ui-spinner />
} @else if (orders.error()) {
  <p>Could not load orders</p>
} @else {
  @for (order of orders.value(); track order.id) {
    <p>{{ order.id }}</p>
  } @empty {
    <p>No orders yet</p>
  }
}
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `asyncPipe` | `false` | Also require an `@else` branch for `@if (data$ \| async)`. |

## Limitations

- States handled by a parent component are not seen: the rule checks one template.
- Data from `toSignal()` or plain signals looks like any other value and is not checked.
- On Angular 17–18 there is no resource API, so only the `async` pipe option applies.
