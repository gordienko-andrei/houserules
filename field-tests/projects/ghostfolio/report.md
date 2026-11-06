# Field test: ghostfolio

| | |
| --- | --- |
| Repository | https://github.com/ghostfolio/ghostfolio.git |
| Commit | `157e425ffea3f0ad616ca4713ec19417d7d1fbca` |
| Run | 2026-11-06 |
| Versions | @angular/core 22.1.2, eslint 9.35.0, @angular-eslint/template-parser 22.1.0, typescript 6.0.3 |
| ESLint config | eslint.config.cjs, Nx workspace |
| Mapped roles | money → <gf-value> |

## Lint

- `.html` templates linted with ESLint: 155 in 0.8 s
- Templates seen by `scan` (`.html` and inline): 160
- Stylesheets linted with stylelint: 128 in 3.7 s
- Findings: 14, parse errors: 0, crashes: 0

| Rule | Message | Count | Example |
| --- | --- | --- | --- |
| houserules/no-glued-fields | separator | 3 | Values are glued into one text with `·`. Lines glued with separators are a typical sign of generated markup and are not allowed, metadata lines included. Put each value in its own element, space them with layout (`gap`) and mute the secondary ones. See https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/no-glued-fields.md |
| houserules/use-money-component | moneyNextToCurrencyUsage | 7 | Show `price` with `<gf-value [isCurrency]="true" [locale]="locale" [unit]="currency" [value]="price" />` instead of formatting it by hand next to a currency sign or code. |
| stylelint/declaration-property-unit-disallowed-list |  | 4 | Font size is set in fixed px. Use rem or a typography token of the project, so text scales up to 200% (WCAG 1.4.4). (declaration-property-unit-disallowed-list) |

## Findings

Mark each finding in the Verdict column: `ok` (a real problem), `false` (a false positive) or `?`.

### houserules/no-glued-fields (3)

| # | Where | Message | Code | Verdict |
| --- | --- | --- | --- | --- |
| 1 | `apps/client/src/app/pages/portfolio/activities/import-activities-dialog/import-activities-dialog.html:54` | separator | `>{{ holding.assetProfile.symbol }} ·` |  |
| 2 | `libs/ui/src/lib/account-selector/account-selector.component.html:44` | separator | `{{ account.platform?.name }} ·` |  |
| 3 | `libs/ui/src/lib/portfolio-filter-form/portfolio-filter-form.component.html:28` | separator | `>{{ holding.assetProfile.symbol }} ·` |  |

### houserules/use-money-component (7)

| # | Where | Message | Code | Verdict |
| --- | --- | --- | --- | --- |
| 1 | `apps/client/src/app/components/user-account-membership/user-account-membership.html:32` | moneyNextToCurrencyUsage | `>{{ baseCurrency }}&nbsp;{{ price }}</del` |  |
| 2 | `apps/client/src/app/components/user-account-membership/user-account-membership.html:33` | moneyNextToCurrencyUsage | `>&nbsp;{{ baseCurrency }}&nbsp;{{ price - coupon }}` |  |
| 3 | `apps/client/src/app/components/user-account-membership/user-account-membership.html:35` | moneyNextToCurrencyUsage | `{{ baseCurrency }}&nbsp;{{ price }}` |  |
| 4 | `apps/client/src/app/pages/api/api-page.html:116` | moneyNextToCurrencyUsage | `{{ quote.key }}: {{ quote.value.marketPrice }}` |  |
| 5 | `apps/client/src/app/pages/blog/2026/11/black-weeks-2026/black-weeks-2026-page.html:79` | moneyNextToCurrencyUsage | `price / 15 \| number: '1.2-2'` |  |
| 6 | `apps/client/src/app/pages/pricing/pricing-page.html:177` | moneyNextToCurrencyUsage | `>{{ baseCurrency }}&nbsp;{{ price }}</del` |  |
| 7 | `apps/client/src/app/pages/resources/personal-finance-tools/product-page.html:352` | moneyNextToCurrencyUsage | `<span i18n>Starting from</span> ${{ price() }} /` |  |

### stylelint/declaration-property-unit-disallowed-list (4)

| # | Where | Message | Code | Verdict |
| --- | --- | --- | --- | --- |
| 1 | `libs/ui/src/lib/membership-card/membership-card.component.scss:34` |  | `font-size: 13px;` |  |
| 2 | `libs/ui/src/lib/membership-card/membership-card.component.scss:38` |  | `font-size: 18px;` |  |
| 3 | `apps/client/src/app/pages/about/changelog/changelog-page.scss:23` |  | `font-size: 18px;` |  |
| 4 | `apps/client/src/app/pages/about/changelog/changelog-page.scss:31` |  | `font-size: 15px;` |  |

## Scan

```text
Houserules scan: 160 templates

Money is shown in 2 ways:
  - <gf-value> component: 188 uses
  - by hand next to a currency sign or code: 7 places
      >{{ baseCurrency }}&nbsp;{{ price }}</del  apps/client/src/app/components/user-account-membership/user-account-membership.html:32
      >&nbsp;{{ baseCurrency }}&nbsp;{{ price - coupon }}  apps/client/src/app/components/user-account-membership/user-account-membership.html:33
      {{ baseCurrency }}&nbsp;{{ price }}  apps/client/src/app/components/user-account-membership/user-account-membership.html:35
      {{ quote.key }}: {{ quote.value.marketPrice }}  apps/client/src/app/pages/api/api-page.html:116
      price / 15 | number: '1.2-2'  apps/client/src/app/pages/blog/2026/11/black-weeks-2026/black-weeks-2026-page.html:79

Money candidates:
  component gf-value: 188 uses; name or inputs mention currency; shows a single value
  component gf-portfolio-proportion-chart: 18 uses; name or inputs mention currency
  component gf-activities-table: 5 uses; name or inputs mention currency, total
  component gf-investment-chart: 5 uses; name or inputs mention currency
  component gf-line-chart: 5 uses; name or inputs mention currency
  component gf-currency-selector: 3 uses; name or inputs mention currency
  component gf-accounts-table: 2 uses; name or inputs mention currency, balance, total
  component gf-historical-market-data-editor: 2 uses; name or inputs mention currency
  component gf-portfolio-summary: 1 uses; name or inputs mention currency
  component gf-account-balances: 1 uses; name or inputs mention currency, balance
  component gf-fire-calculator: 1 uses; name or inputs mention currency, total, amount
  component gf-top-holdings: 1 uses; name or inputs mention currency
  component gf-treemap-chart: 1 uses; name or inputs mention currency
  component gf-transfer-balance-dialog: 0 uses; name or inputs mention balance

Custom elements by usage:
  <ion-icon> 245 uses (unknown)
      130× <ion-icon class="me-2" name="create-outline" />  apps/client/src/app/components/access-table/access-table.component.html:73
      67× <ion-icon name="ellipsis-horizontal" />  apps/client/src/app/components/access-table/access-table.component.html:58
      32× <ion-icon class="d-none d-sm-block" name="person-circle-outline" size="large" />  apps/client/src/app/components/header/header.component.html:173
  <gf-value> 188 uses (project, libs/ui/src/lib/value/value.component.ts)
      11× <gf-value class="justify-content-end" [isCurrency]="true" [isLoading]="isLoading" [locale]="locale" [precision]="precision" [unit]="displayedCurrency" [value]="summary?.totalBuy" />  apps/client/src/app/components/portfolio-summary/portfolio-summary.component.html:45
      10× <gf-value size="medium" [isLoading]="isLoading" [locale]="user?.settings?.locale" [value]="activitiesCount" >  apps/client/src/app/components/account-detail-dialog/account-detail-dialog.html:132
      9× <gf-value i18n size="medium" [isCurrency]="true" [isLoading]="isLoading" [locale]="user?.settings?.locale" [precision]="balancePrecision" [unit]="currency" [value]="balance" >  apps/client/src/app/components/account-detail-dialog/account-detail-dialog.html:49
  <mat-card> 145 uses (unknown)
      127× <mat-card appearance="outlined" class="mb-3">  apps/client/src/app/components/admin-overview/admin-overview.html:50
      14× <mat-card appearance="outlined">  apps/client/src/app/components/admin-overview/admin-overview.html:4
      2× <mat-card appearance="outlined" class="h-100" [class.active]="user?.subscription?.type === 'Basic'" >  apps/client/src/app/pages/pricing/pricing-page.html:16
  <mat-card-content> 145 uses (unknown)
      108× <mat-card-content>  apps/client/src/app/components/admin-overview/admin-overview.html:5
      37× <mat-card-content class="gf-text-wrap-balance py-3" i18n>  apps/client/src/app/components/admin-settings/admin-settings.component.html:19
  <mat-form-field> 82 uses (unknown)
      75× <mat-form-field appearance="outline" class="w-100 without-hint">  apps/client/src/app/components/admin-jobs/admin-jobs.html:5
      4× <mat-form-field appearance="outline" class="w-100" [class.without-hint]="!isPublicAccess" >  apps/client/src/app/components/user-account-access/create-or-update-access-dialog/create-or-update-access-dialog.html:27
      2× <mat-form-field appearance="outline" class="without-hint w-50" [hideRequiredMarker]="true" >  apps/client/src/app/components/user-account-access/user-account-access.html:10
  <mat-card-header> 78 uses (unknown)
      58× <mat-card-header>  apps/client/src/app/components/admin-overview/admin-overview.html:153
      20× <mat-card-header class="align-items-center">  apps/client/src/app/components/home-overview/home-overview.html:104
  <mat-card-title> 78 uses (unknown)
      53× <mat-card-title i18n>  apps/client/src/app/components/admin-overview/admin-overview.html:154
      25× <mat-card-title class="align-items-center d-flex m-0" >  apps/client/src/app/components/admin-settings/admin-settings.component.html:12
  <mat-option> 76 uses (unknown)
      70× <mat-option [value]="statusFilterOption">  apps/client/src/app/components/admin-jobs/admin-jobs.html:12
      3× <mat-option value="CREATE_READ_RESTRICTED_UPDATE_DELETE" [disabled]="!canGrantWriteAccess" >  apps/client/src/app/components/user-account-access/create-or-update-access-dialog/create-or-update-access-dialog.html:86
      1× <mat-option />  apps/client/src/app/components/admin-jobs/admin-jobs.html:7
  <mat-label> 72 uses (unknown)
      72× <mat-label i18n>  apps/client/src/app/components/admin-market-data/asset-profile-dialog/asset-profile-dialog.html:136
  <gf-premium-indicator> 58 uses (project, libs/ui/src/lib/premium-indicator/premium-indicator.component.ts)
      30× <gf-premium-indicator class="ms-1" />  apps/client/src/app/components/benchmark-comparator/benchmark-comparator.component.html:8
      26× <gf-premium-indicator class="d-inline-block mx-1" [enableLink]="false" />  apps/client/src/app/components/admin-settings/admin-settings.component.html:14
      1× <gf-premium-indicator [enableLink]="false" />  apps/client/src/app/components/admin-market-data/admin-market-data.html:235
  <ngx-skeleton-loader> 52 uses (unknown)
      30× <ngx-skeleton-loader animation="pulse" class="px-4 py-3" [theme]="{ height: '1.5rem', width: '100%' }" />  apps/client/src/app/components/access-table/access-table.component.html:114
      20× <ngx-skeleton-loader animation="pulse" [theme]="{ height: '100%', width: '100%' }" />  apps/client/src/app/components/benchmark-comparator/benchmark-comparator.component.html:48
      1× <ngx-skeleton-loader animation="pulse" [class.px-4]="mode() === 'default'" [class.py-3]="mode() === 'default'" [theme]="{ height: '1.5rem', width: '100%' }" />  libs/ui/src/lib/holdings-table/holdings-table.component.html:236
  <mat-select> 25 uses (unknown)
      15× <mat-select formControlName="status">  apps/client/src/app/components/admin-jobs/admin-jobs.html:6
      4× <mat-select name="benchmark" [disabled]="user()?.subscription?.type === 'Basic'" [value]="benchmark()?.id" (selectionChange)="onChangeBenchmark($event.value)" >  apps/client/src/app/components/benchmark-comparator/benchmark-comparator.component.html:19
      1× <mat-select name="duration" [value]="couponDuration" (selectionChange)="onChangeCouponDuration($event.value)" >  apps/client/src/app/components/admin-overview/admin-overview.html:260
  <mat-menu> 23 uses (unknown)
      11× <mat-menu #jobsActionsMenu="matMenu" xPosition="before">  apps/client/src/app/components/admin-jobs/admin-jobs.html:191
      10× <mat-menu #accessActionsMenu="matMenu" class="no-max-width" xPosition="before" >  apps/client/src/app/components/access-table/access-table.component.html:60
      1× <mat-menu #gatherHistoricalMarketDataMenu="matMenu">  apps/client/src/app/components/admin-market-data/asset-profile-dialog/asset-profile-dialog.html:38
  <gf-portfolio-proportion-chart> 18 uses (project, libs/ui/src/lib/portfolio-proportion-chart/portfolio-proportion-chart.component.ts)
      5× <gf-portfolio-proportion-chart [baseCurrency]="user?.settings?.baseCurrency" [colorScheme]="user?.settings?.colorScheme" [data]="platforms" [isInPercentage]="showValuesInPercentage()" [keys]="['id']"   apps/client/src/app/pages/portfolio/allocations/allocations-page.html:45
      4× <gf-portfolio-proportion-chart [baseCurrency]="data.baseCurrency" [colorScheme]="data.colorScheme" [data]="sectors" [isInPercentage]="true" [keys]="['name']" [locale]="data.locale" [maxItems]="10" />  apps/client/src/app/components/holding-detail-dialog/holding-detail-dialog.html:304
      2× <gf-portfolio-proportion-chart [colorScheme]="data.colorScheme" [data]="sectors" [isInPercentage]="true" [keys]="['name']" [maxItems]="10" />  apps/client/src/app/components/admin-market-data/asset-profile-dialog/asset-profile-dialog.html:313
  <gf-entity-logo> 16 uses (project, libs/ui/src/lib/entity-logo/entity-logo.component.ts)
      5× <gf-entity-logo class="me-1" [hasPlaceholder]="true" [tooltip]="platformEntry.name ?? ''" [url]="platformEntry.url" />  apps/client/src/app/pages/accounts/create-or-update-account-dialog/create-or-update-account-dialog.html:73
      2× <gf-entity-logo class="mat-icon" matSuffix [url]="assetProfileForm.controls.url.value" />  apps/client/src/app/components/admin-market-data/asset-profile-dialog/asset-profile-dialog.html:456
      2× <gf-entity-logo [dataSource]="element.assetProfile?.dataSource" [symbol]="element.assetProfile?.symbol" [tooltip]="element.assetProfile?.name" />  libs/ui/src/lib/activities-table/activities-table.component.html:175

Pipes by usage:
  async 13 uses (angular, @angular/common)
  date 9 uses (angular, @angular/common)
  json 6 uses (angular, @angular/common)
  keyvalue 4 uses (angular, @angular/common)
  number 3 uses (angular, @angular/common)
  slice 1 uses (angular, @angular/common)
```
