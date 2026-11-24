# Field test: films

| | |
| --- | --- |
| Repository | https://github.com/gordienko-andrei/films.git |
| Commit | `fce553cb259965cb40438518d476a1756d140ded` |
| Run | 2026-11-23 |
| Versions | @angular/core ^19.2.9, typescript ~5.5.0 |
| ESLint config | none |
| Mapped roles | none |

## Lint

- `.html` templates linted with ESLint: 12 in 0.1 s
- Templates seen by `scan` (`.html` and inline): 12
- Stylesheets linted with stylelint: 12 in 0.2 s
- Findings: 2, parse errors: 0, crashes: 0

| Rule | Message | Count | Example |
| --- | --- | --- | --- |
| houserules/no-glued-fields | separator | 1 | Values are glued into one text with `,`. Lines glued with separators are a typical sign of generated markup and are not allowed, metadata lines included. Put each value in its own element, space them with layout (`gap`) and mute the secondary ones. See https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/no-glued-fields.md |
| stylelint/declaration-property-unit-disallowed-list |  | 1 | Font size is set in fixed px. Use rem or a typography token of the project, so text scales up to 200% (WCAG 1.4.4). (declaration-property-unit-disallowed-list) |

## Findings

Mark each finding in the Verdict column: `ok` (a real problem), `false` (a false positive) or `?`.

### houserules/no-glued-fields (1)

| # | Where | Message | Code | Verdict |
| --- | --- | --- | --- | --- |
| 1 | `src/app/components/navbar/navbar.component.html:30` | separator | `{{ movie.title }}, {{ movie.year }}` |  |

### stylelint/declaration-property-unit-disallowed-list (1)

| # | Where | Message | Code | Verdict |
| --- | --- | --- | --- | --- |
| 1 | `src/styles.scss:11` |  | `font-size: 16px;` |  |

## Scan

```text
Houserules scan: 12 templates
Roots: src, src

Missing dependencies: @angular/animations, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/platform-browser-dynamic, @angular/platform-server, @angular/router, @angular/ssr, @primeng/themes, express, primeflex, primeicons, primeng, @angular-devkit/build-angular, @angular/cli, @angular/compiler-cli, browser-sync

Money: nothing found.

Custom elements by usage:
  <p-skeleton> 19 uses (unknown)
      16× <p-skeleton width="100%" height="100%" borderRadius="1rem" />  src/app/components/movie-carousel/movie-carousel.component.html:8
      3× <p-skeleton animation="none" width="100%" height="100%" borderRadius="1rem" />  src/app/pages/movies/movie/movie.component.html:89
  <app-movie-carousel> 12 uses (project, src/app/components/movie-carousel/movie-carousel.component.ts)
      10× <app-movie-carousel [title]="'Recently Discussed Movies'" [movies]="recentlyDiscussedFilms" [loading]="mainFeedLoading">  src/app/pages/home/home/home.component.html:4
      2× <app-movie-carousel [title]="pick.emoji + ' ' + pick.name" [movies]="pick.movies">  src/app/pages/home/home/home.component.html:58
  <p-card> 11 uses (unknown)
      5× <p-card styleClass="movie-credits-card">  src/app/pages/movies/movie/movie.component.html:71
      3× <p-card [header]="title">  src/app/components/movie-carousel/movie-carousel.component.html:1
      1× <p-card class="login-card">  src/app/pages/login/login/login.component.html:137
  <p-button> 11 uses (unknown)
      2× <p-button icon="pi pi-sign-out" label="Logout" [text]="true" (onClick)="logout()">  src/app/components/navbar/navbar.component.html:42
      2× <p-button class="login-submit" severity="primary" label="Login" [fluid]="true" (click)="login()" />  src/app/pages/login/login/login.component.html:191
      2× <p-button label="Cancel" icon="pi pi-times" severity="danger" (onClick)="hideCreateReview()">  src/app/pages/reviews/create-review/create-review.component.html:101
  <p-accordion-panel> 4 uses (unknown)
      4× <p-accordion-panel value="0">  src/app/pages/reviews/create-review/create-review.component.html:6
  <p-accordion-header> 4 uses (unknown)
      4× <p-accordion-header>  src/app/pages/reviews/create-review/create-review.component.html:7
  <p-accordion-content> 4 uses (unknown)
      4× <p-accordion-content>  src/app/pages/reviews/create-review/create-review.component.html:8
  <p-rating> 4 uses (unknown)
      2× <p-rating formControlName="rating" [stars]="10" [readonly]="false">  src/app/pages/reviews/create-review/create-review.component.html:12
      2× <p-rating [stars]="10" [readonly]="true" [ngModel]="review.rating">  src/app/pages/reviews/review/review.component.html:10
  <p-carousel> 2 uses (unknown)
      1× <p-carousel class="movie-carousel__carousel" [value]="movies" [numVisible]="posterCarouselNumVisible" [numScroll]="posterCarouselNumScroll" [responsiveOptions]="posterCarouselResponsiveOptions" [circu  src/app/components/movie-carousel/movie-carousel.component.html:16
      1× <p-carousel [value]="credits!.cast!" [numVisible]="posterCarouselNumVisible" [numScroll]="posterCarouselNumScroll" [responsiveOptions]="posterCarouselResponsiveOptions" [circular]="false" [showIndicat  src/app/pages/movies/movie/movie.component.html:121
  <p-password> 2 uses (unknown)
      1× <p-password formControlName="password" inputId="password" [fluid]="true" [feedback]="false" [toggleMask]="true" />  src/app/pages/login/login/login.component.html:158
      1× <p-password formControlName="password" inputId="password-register" [fluid]="true" [toggleMask]="true" />  src/app/pages/login/login/login.component.html:178
  <p-chip> 2 uses (unknown)
      1× <p-chip [title]="emotion.name" [class.selected]="isSelected(emotion.id)" (click)="toggleEmotion(emotion.id)" class="emotion-chip">  src/app/pages/movies/emoji-rating/emoji-rating.component.html:5
      1× <p-chip>  src/app/pages/movies/movie/movie.component.html:51
  <app-root> 1 uses (project, src/app/app.component.ts)
      1× <app-root>  src/index.html:11
  <app-navbar> 1 uses (project, src/app/components/navbar/navbar.component.ts)
      1× <app-navbar>  src/app/app.component.html:3
  <app-selectable-chip> 1 uses (project, src/app/components/selectable-chip/selectable-chip.component.ts)
      1× <app-selectable-chip [tag]="tag" [disabled]="false" [selectedTagIds]="tagIdsControl.value" [formControl]="tagIdsControl" />  src/app/pages/reviews/create-review/create-review.component.html:88
  <app-emoji-rating> 1 uses (project, src/app/pages/movies/emoji-rating/emoji-rating.component.ts)
      1× <app-emoji-rating [movieId]="movieId">  src/app/pages/movies/movie/movie.component.html:63

Pipes by usage:
  shortNumber 1 uses (project, src/app/pipes/short-number.pipe.ts)
  date 1 uses (angular, @angular/common)
  safe 0 uses (project, src/app/pipes/safe.pipe.ts)
```
