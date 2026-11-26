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

Templates have no types, so the rule reads the component next to the template: `orders-page.component.ts` for
`orders-page.component.html`, the component whose `templateUrl` points to the template, or the component itself
for an inline template. A call `x.value()` counts only when `x` is a member of that component created by
`resource()`, `httpResource()` or `rxResource()`, or typed as `Resource<…>`, `ResourceRef<…>` or
`HttpResourceRef<…>` (an input that receives a resource). `form.value()` of Signal Forms, `slider.value()` of a
signal wrapper and `store.items.value()` of a service are not resources the rule can confirm, so it stays silent.

When no component file is found, every `x.value()` on a property counts, as in the first versions of the rule.

For a resource `x` the same template must contain:

| State | Counts as handled |
| --- | --- |
| loading | `x.isLoading()` or `x.status()` |
| error | `x.error()` or `x.status()` |
| empty, only when `x.value()` is the collection of a `@for` | an `@empty` block, or a check of `x.value().length` |

`form.email().value()` is ignored in any case, because its receiver is a call. `x.hasValue()` guards against an
empty value but shows neither loading nor error, so it does not count as a handled state.

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
| `resourceFactories` | `[]` | Functions of the project that create a resource, besides `resource`, `httpResource` and `rxResource`, for example `['apiResource']`. |

## Limitations

- States handled by a parent component are not seen: the rule checks one template.
- Data from `toSignal()` or plain signals looks like any other value and is not checked.
- On Angular 17–18 there is no resource API, so only the `async` pipe option applies.
