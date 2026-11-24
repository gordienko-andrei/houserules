# Журнал изменений интерфейса аудита кампании

## Границы сравнения

Исходная точка — WIP-коммит `8d2c2f4d4`, в котором уже существовала первая версия журнала, созданная в ходе этой задачи. Текущее состояние — файлы рабочего каталога на момент подготовки отчёта, включая незакоммиченные изменения. Это сравнение показывает изменения относительно исходного WIP, а не относительно основной ветки проекта.

Последовательность ниже восстановлена по вашим сообщениям и текущему сравнению файлов. Промежуточные версии отдельно не зафиксированы коммитами, поэтому пункты описывают порядок запросов и итоговую реализацию, а не точный состав каждого промежуточного сохранения.

## Изначальное состояние

Журнал уже находился в настройках кампании и показывал события с фильтрами по дате, инициатору и ошибкам, обновлением и постраничной навигацией. Подробности загружались при раскрытии строки. В первой версии для раскрытия использовались кнопки `+` и `−`, инициатор выбирался через внутренний компонент, а фильтр ошибок использовал обычный HTML-чекбокс. Явно были представлены события комментариев; остальные типы нуждались в расширении отображения.

## Изменения по вашим просьбам

1. **Расширение журнала событий.** Добавлены названия и обработка пользовательских событий, а также предусмотрены типы событий автоматизации, автобиддера и синхронизации. Для подробностей добавлено представление известных полей и изменений значений. События, которые сервер ещё не создаёт, появятся в журнале только после соответствующей реализации на сервере.

2. **Доработка недостающих сценариев.** Для событий с общим `group_id` при раскрытии запрашиваются связанные записи других кампаний. Имя инициатора показывается, если сервер передаёт `actor_name`; иначе остаётся общее обозначение сотрудника. Подробности повторно формируются при смене языка. Добавлены переводы и проверки обработки событий.

3. **Ручная проверка.** Журнал проверялся в браузере на доступных событиях магазина «Мои подарки», включая фильтры, раскрытие, пагинацию и смену языка. Для проверки переименование кампании было выполнено и затем возвращено к исходному названию; записи об этих действиях остаются в аудите. Не все разновидности событий были доступны на реальных данных, в частности пакетное действие и ошибка.

4. **Отступы и границы таблиц.** У заголовка журнала убран стандартный внешний отступ. Для таблицы журнала и таблицы истории автоматизации включены границы ячеек. Фильтр ошибок сначала был выровнен с полями, а затем перенесён под фильтр даты по последующему запросу.

5. **Штатное раскрытие PrimeNG.** Ручные кнопки `+` и `−` заменены механизмом раскрытия строк таблицы PrimeNG. Переключатель перемещён в первую колонку; используются шевроны `pi-chevron-right` и `pi-chevron-down`. Подробности расположены в раскрываемой строке.

6. **Фильтр и обозначение инициатора.** В фильтре используется `p-select`. Для вариантов инициатора создан общий конфиг с подписью и цветовым типом `p-tag`; соответствующая метка показывается в таблице. Применены варианты `info`, `success`, `warn`, `contrast` и `secondary`.

7. **Кнопки действий.** «Сбросить фильтры» и «Обновить» сделаны компактнее, с закруглением, семантическим оформлением и иконками перед текстом. Блок кнопок отделён от фильтров через расположение по краям строки.

8. **Представление изменений.** Значение «было» выделено красным фоном, «стало» — зелёным, в палитре GitHub. Если в одном событии приходит несколько изменений, они выводятся в таблице с типом изменения и значениями до и после; для поддерживаемых данных сохраняется контекст товара и места показа. Список событий и подробности загружаются отдельно, при раскрытии строки.

9. **Чекбокс и выравнивание.** Обычный чекбокс заменён на `p-checkbox`; к нему добавлена подсказка `pTooltip` о фильтрации ошибок. Заголовки и значения основной таблицы выровнены по центру. Содержимое раскрытых строк оставлено по левому краю.

10. **Размеры полей и таблица.** Поля даты и инициатора приведены к одной высоте. Таблица получила прокрутку с высотой 400 px, изменение ширины колонок и минимальную ширину. Добавлены чередование фона строк и отдельное визуальное выделение раскрытых подробностей.

11. **Загрузка и общий шеврон.** При загрузке или обновлении отображаются строки-скелетоны. В первой ячейке заголовка добавлен шеврон для раскрытия и закрытия событий текущей страницы. Если открыта только часть строк, он раскрывает остальные; если открыты все — закрывает их. На пустой странице и во время загрузки управление недоступно, состояние других страниц сохраняется.

## Границы реализации и проверки

- Группировка по `group_id` реализована в подробностях события. Это не объединение всех строк разных кампаний в одну строку общего журнала.
- Вывод имени зависит от поля `actor_name` в ответе сервера. На проверенных данных имя не возвращалось.
- Серверная часть автоматизации, автобиддера и синхронизации была описана как незавершённая. Наличие отображения на фронте само по себе не подтверждает, что сервер уже создаёт все такие события.
- При проверке обнаружены события синхронизации бюджета, включающие постепенные списания, хотя исходное описание исключает их из аудита. Для окончательной фильтрации необходимы достаточные данные или изменение серверной части.
- Сведения о ручной проверке относятся к выполненным ранее сценариям и не означают, что все возможные события проверены на реальных данных.
- Изменения относятся к рекламе; обновление пользовательского журнала Task Tracker не требуется.

## Полные исходные и текущие файлы представления

Ниже приведены полные снимки файлов из WIP-коммита и рабочего каталога. Основной шаблон использует вложенные компоненты строки и подробностей, поэтому включены все три HTML-шаблона и связанные с ними SCSS-файлы. TypeScript-логика, переводы и тесты в эту подборку исходного кода не включены; их изменения описаны выше.

### Основной компонент журнала — HTML

Путь в проекте `src/app/features/seller/advertisement/campaign-audit/components/campaign-audit-journal/campaign-audit-journal.component.html`

#### Исходная версия

```html
<section class="audit" aria-labelledby="audit-title">
  <h2 id="audit-title">{{ 'seller-advertisement.audit.title' | transloco }}</h2>
  <p>{{ 'seller-advertisement.audit.notice' | transloco }}</p>
  <form class="filters" [formGroup]="form">
    <label
      >{{ 'seller-advertisement.settings.automationHistory.period' | transloco
      }}<p-datepicker
        formControlName="period"
        selectionMode="range"
        [showClear]="true"
        [showIcon]="true"
        appendTo="body"
    /></label>
    <mp-select
      formControlName="actorType"
      [label]="'seller-advertisement.audit.actor' | transloco"
      [options]="actorOptions()"
    />
    <label class="checkbox"
      ><input type="checkbox" formControlName="onlyErrors" />
      {{ 'seller-advertisement.audit.onlyErrors' | transloco }}</label
    >
    <button pButton type="button" (click)="resetFilters()" [disabled]="!hasFilters()">
      {{ 'seller-advertisement.common.actions.resetFilters' | transloco }}
    </button>
    <button pButton type="button" (click)="refresh()">
      {{ 'seller-advertisement.audit.refresh' | transloco }}
    </button>
  </form>
  @if (state().status === 'error') {
    <div role="alert">
      {{ 'seller-advertisement.audit.error' | transloco }}
      <button type="button" (click)="refresh()">
        {{ 'seller-advertisement.settings.automationHistory.retry' | transloco }}
      </button>
    </div>
  } @else {
    <div class="table-scroll">
      <p-table
        [value]="rows()"
        [loading]="state().status === 'loading'"
        dataKey="id"
        [tableStyle]="{ 'min-width': '600px', width: '100%' }"
      >
        <ng-template pTemplate="header"
          ><tr>
            <th>{{ 'seller-advertisement.settings.automationHistory.time' | transloco }}</th>
            <th>{{ 'seller-advertisement.audit.actor' | transloco }}</th>
            <th>{{ 'seller-advertisement.settings.automationHistory.action' | transloco }}</th>
            <th></th></tr
        ></ng-template>
        <ng-template pTemplate="body" let-row
          ><tr
            appAuditEventRow
            [row]="row"
            [expanded]="!!expanded()[key(row.id)]"
            (toggleDetails)="toggle(row.id, row.eventType)"
          ></tr>
          @if (expanded()[key(row.id)]) {
            <tr>
              <td colspan="4">
                @let detail = details()[key(row.id)];
                @if (detail && detail.status === 'loading') {
                  {{ 'seller-advertisement.audit.loading' | transloco }}
                } @else if (detail && detail.status === 'error') {
                  <span role="alert">{{
                    'seller-advertisement.audit.detailError' | transloco
                  }}</span>
                  <button type="button" (click)="loadDetails(row.id, row.eventType)">
                    {{ 'seller-advertisement.settings.automationHistory.retry' | transloco }}
                  </button>
                } @else if (detail && detail.status === 'ready') {
                  <app-audit-event-details [details]="detail.details" />
                } @else {
                  {{ 'seller-advertisement.audit.unavailable' | transloco }}
                }
              </td>
            </tr>
          }
        </ng-template>
        <ng-template pTemplate="emptymessage">
          @if (state().status !== 'loading') {
            <tr>
              <td colspan="4">
                {{
                  (hasFilters()
                    ? 'seller-advertisement.settings.automationHistory.emptyFiltered'
                    : 'seller-advertisement.settings.automationHistory.empty'
                  ) | transloco
                }}
              </td>
            </tr>
          }
        </ng-template>
      </p-table>
    </div>
    <mp-pagination
      [visible]="state().total > 0"
      [collectionSize]="state().total"
      [page]="page()"
      [pageSize]="pageSize()"
      [pageSizeOptions]="[10, 25, 50]"
      [showPageSizeOptions]="true"
      (pageChange)="page.set($event)"
      (pageSizeChange)="pageSize.set($event)"
    />
  }
</section>
```

#### Текущая версия

```html
<section class="audit" aria-labelledby="audit-title">
  <h2 id="audit-title">{{ 'seller-advertisement.audit.title' | transloco }}</h2>
  <p>{{ 'seller-advertisement.audit.notice' | transloco }}</p>
  <form class="filters" [formGroup]="form">
    <div class="filter-fields">
      <div class="date-filter">
        <label
          >{{ 'seller-advertisement.settings.automationHistory.period' | transloco }}
          <p-datepicker
            formControlName="period"
            selectionMode="range"
            [showClear]="true"
            [showIcon]="true"
            appendTo="body"
          />
        </label>
        <div
          class="checkbox"
          [pTooltip]="'seller-advertisement.audit.onlyErrorsHelp' | transloco"
          tooltipPosition="top"
        >
          <p-checkbox formControlName="onlyErrors" [binary]="true" inputId="audit-only-errors" />
          <label for="audit-only-errors">{{
            'seller-advertisement.audit.onlyErrors' | transloco
          }}</label>
        </div>
      </div>
      <label
        >{{ 'seller-advertisement.audit.actor' | transloco }}
        <p-select
          formControlName="actorType"
          [options]="actorOptions()"
          optionLabel="label"
          optionValue="value"
          appendTo="body"
        >
          <ng-template #selectedItem let-option
            ><p-tag [value]="option.label" [severity]="option.severity"
          /></ng-template>
          <ng-template #item let-option
            ><p-tag [value]="option.label" [severity]="option.severity"
          /></ng-template>
        </p-select>
      </label>
    </div>
    <div class="filter-actions">
      <p-button
        type="button"
        severity="secondary"
        size="small"
        [rounded]="true"
        icon="pi pi-filter-slash"
        [label]="'seller-advertisement.common.actions.resetFilters' | transloco"
        (onClick)="resetFilters()"
        [disabled]="!hasFilters()"
      />
      <p-button
        type="button"
        severity="primary"
        size="small"
        [rounded]="true"
        icon="pi pi-refresh"
        [label]="'seller-advertisement.audit.refresh' | transloco"
        (onClick)="refresh()"
      />
    </div>
  </form>
  @if (state().status === 'error') {
    <div role="alert">
      {{ 'seller-advertisement.audit.error' | transloco }}
      <button type="button" (click)="refresh()">
        {{ 'seller-advertisement.settings.automationHistory.retry' | transloco }}
      </button>
    </div>
  } @else {
    <div class="table-scroll">
      <p-table
        [value]="rows()"
        [showGridlines]="true"
        [scrollable]="true"
        scrollHeight="400px"
        [resizableColumns]="true"
        [stripedRows]="true"
        [attr.aria-busy]="state().status === 'loading'"
        tableStyleClass="audit-events-table"
        [expandedRowKeys]="expandedRows"
        (onRowExpand)="onRowExpand($event.data)"
        dataKey="id"
        [tableStyle]="{ 'min-width': '50rem', width: '100%' }"
      >
        <ng-template pTemplate="header"
          ><tr>
            <th style="width: 4rem">
              <button
                type="button"
                pButton
                class="p-button-text p-button-rounded p-button-secondary"
                [disabled]="state().status !== 'ready' || !rows().length"
                [attr.aria-expanded]="allRowsExpanded()"
                [attr.aria-label]="
                  (allRowsExpanded()
                    ? 'seller-advertisement.audit.collapsePage'
                    : 'seller-advertisement.audit.expandPage'
                  ) | transloco
                "
                (click)="toggleCurrentPage()"
              >
                <i
                  [class]="allRowsExpanded() ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                  aria-hidden="true"
                ></i>
              </button>
            </th>
            <th pResizableColumn>
              {{ 'seller-advertisement.settings.automationHistory.time' | transloco }}
            </th>
            <th pResizableColumn>{{ 'seller-advertisement.audit.actor' | transloco }}</th>
            <th pResizableColumn>
              {{ 'seller-advertisement.settings.automationHistory.action' | transloco }}
            </th>
          </tr></ng-template
        >
        <ng-template pTemplate="body" let-row let-expanded="expanded" let-rowIndex="rowIndex">
          <tr
            appAuditEventRow
            class="audit-event-row"
            [class.audit-striped-row]="rowIndex % 2 === 1"
            [row]="row"
            [expanded]="expanded"
          ></tr>
        </ng-template>
        <ng-template #expandedrow let-row>
          <tr class="audit-expanded-row">
            <td colspan="4">
              @let group = groups()[storeId() + ':' + row.groupId];
              @if (group && group.status === 'error') {
                <span role="alert">{{ 'seller-advertisement.audit.groupError' | transloco }}</span>
                <button type="button" (click)="loadGroup(row.groupId)">
                  {{ 'seller-advertisement.settings.automationHistory.retry' | transloco }}
                </button>
              } @else if (group && group.status === 'ready' && group.items.length > 1) {
                <p>
                  {{ 'seller-advertisement.audit.batchAction' | transloco }} ({{
                    group.items.length
                  }})
                </p>
                <ul>
                  @for (event of group.items; track event.id) {
                    <li>
                      {{ 'seller-advertisement.audit.campaign' | transloco }}
                      {{ event.campaign_id }} — {{ event.message }}
                    </li>
                  }
                </ul>
              }
              @let detail = details()[key(row.id)];
              @if (detail && detail.status === 'loading') {
                {{ 'seller-advertisement.audit.loading' | transloco }}
              } @else if (detail && detail.status === 'error') {
                <span role="alert">{{ 'seller-advertisement.audit.detailError' | transloco }}</span>
                <button type="button" (click)="loadDetails(row.id, row.eventType)">
                  {{ 'seller-advertisement.settings.automationHistory.retry' | transloco }}
                </button>
              } @else if (detail && detail.status === 'ready') {
                <app-audit-event-details [details]="detail.details" />
              } @else {
                {{ 'seller-advertisement.audit.unavailable' | transloco }}
              }
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          @if (state().status === 'loading') {
            @for (skeleton of skeletonRows; track skeleton) {
              <tr aria-hidden="true">
                <td><p-skeleton shape="circle" size="1.5rem" /></td>
                <td><p-skeleton width="8rem" /></td>
                <td><p-skeleton width="6rem" /></td>
                <td><p-skeleton width="10rem" /></td>
              </tr>
            }
          } @else {
            <tr>
              <td colspan="4">
                {{
                  (hasFilters()
                    ? 'seller-advertisement.settings.automationHistory.emptyFiltered'
                    : 'seller-advertisement.settings.automationHistory.empty'
                  ) | transloco
                }}
              </td>
            </tr>
          }
        </ng-template>
      </p-table>
    </div>
    <mp-pagination
      [visible]="state().total > 0"
      [collectionSize]="state().total"
      [page]="page()"
      [pageSize]="pageSize()"
      [pageSizeOptions]="[10, 25, 50]"
      [showPageSizeOptions]="true"
      (pageChange)="page.set($event)"
      (pageSizeChange)="pageSize.set($event)"
    />
  }
</section>
```

### Строка события — HTML

Путь в проекте `src/app/features/seller/advertisement/campaign-audit/components/audit-event-row/audit-event-row.component.html`

#### Исходная версия

```html
<td>{{ row().time }}</td>
<td>{{ row().actorKey | transloco }}</td>
<td>{{ row().titleKey | transloco }}</td>
<td>
  <button
    type="button"
    (click)="toggleDetails.emit()"
    [attr.aria-expanded]="expanded()"
    [attr.aria-label]="'seller-advertisement.audit.details' | transloco"
  >
    {{ expanded() ? '−' : '+' }}
  </button>
</td>
```

#### Текущая версия

```html
<td>
  <button
    type="button"
    pButton
    [pRowToggler]="row()"
    class="p-button-text p-button-rounded p-button-secondary"
    [attr.aria-expanded]="expanded()"
    [attr.aria-label]="'seller-advertisement.audit.details' | transloco"
  >
    <i [class]="expanded() ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" aria-hidden="true"></i>
  </button>
</td>
<td>{{ row().time }}</td>
<td>
  <p-tag
    [value]="row().actorName || (row().actorKey | transloco)"
    [severity]="row().actorSeverity"
  />
</td>
<td>
  {{ row().titleKey | transloco }}
  @if (row().level === 'error') {
    <strong>{{ 'seller-advertisement.audit.failed' | transloco }}</strong>
  }
</td>
```

### Подробности события — HTML

Путь в проекте `src/app/features/seller/advertisement/campaign-audit/components/audit-event-details/audit-event-details.component.html`

#### Исходная версия

```html
@for (detail of details(); track $index) {
  <div class="detail">
    <strong>{{ detail.labelKey | transloco }}</strong>
    @if (detail.kind === 'text') {
      <span>{{ expanded() ? detail.value : detail.value.slice(0, maxLength) }}</span>
      @if (detail.value.length > maxLength && !expanded()) {
        <button type="button" (click)="expanded.set(true)">
          {{ 'seller-advertisement.audit.showAll' | transloco }}
        </button>
      }
    } @else {
      <div class="change">
        <span>{{ expanded() ? detail.before : detail.before.slice(0, maxLength) }}</span
        ><span aria-hidden="true">→</span
        ><span>{{ expanded() ? detail.after : detail.after.slice(0, maxLength) }}</span>
      </div>
      @if ((detail.before.length > maxLength || detail.after.length > maxLength) && !expanded()) {
        <button type="button" (click)="expanded.set(true)">
          {{ 'seller-advertisement.audit.showAll' | transloco }}
        </button>
      }
    }
  </div>
}
```

#### Текущая версия

```html
@for (detail of textDetails(); track $index) {
  <div class="detail">
    <strong>{{ detail.labelKey | transloco }}</strong>
    <span>{{ expanded() ? detail.value : detail.value.slice(0, maxLength) }}</span>
    @if (detail.value.length > maxLength && !expanded()) {
      <button type="button" (click)="expanded.set(true)">
        {{ 'seller-advertisement.audit.showAll' | transloco }}
      </button>
    }
  </div>
}
@if (changes().length > 1) {
  <div class="changes-table">
    <p-table [value]="changes()" [showGridlines]="true">
      <ng-template #header>
        <tr>
          <th>{{ 'seller-advertisement.audit.changeType' | transloco }}</th>
          <th>{{ 'seller-advertisement.audit.before' | transloco }}</th>
          <th>{{ 'seller-advertisement.audit.after' | transloco }}</th>
        </tr>
      </ng-template>
      <ng-template #body let-change>
        <tr>
          <td>
            {{ change.labelKey | transloco }}
            @if (change.context) {
              · {{ change.context }}
            }
          </td>
          <td class="before">
            {{ expanded() ? change.before : change.before.slice(0, maxLength) }}
          </td>
          <td class="after">{{ expanded() ? change.after : change.after.slice(0, maxLength) }}</td>
        </tr>
      </ng-template>
    </p-table>
    @if (!expanded() && hasLongChanges()) {
      <button type="button" (click)="expanded.set(true)">
        {{ 'seller-advertisement.audit.showAll' | transloco }}
      </button>
    }
  </div>
} @else {
  @for (change of changes(); track $index) {
    <div class="detail">
      <strong
        >{{ change.labelKey | transloco }}
        @if (change.context) {
          · {{ change.context }}
        }
      </strong>
      <div class="change">
        <span class="before">{{
          expanded() ? change.before : change.before.slice(0, maxLength)
        }}</span>
        <span aria-hidden="true">→</span>
        <span class="after">{{
          expanded() ? change.after : change.after.slice(0, maxLength)
        }}</span>
      </div>
      @if ((change.before.length > maxLength || change.after.length > maxLength) && !expanded()) {
        <button type="button" (click)="expanded.set(true)">
          {{ 'seller-advertisement.audit.showAll' | transloco }}
        </button>
      }
    </div>
  }
}
```

### Основной компонент журнала — SCSS

Путь в проекте `src/app/features/seller/advertisement/campaign-audit/components/campaign-audit-journal/campaign-audit-journal.component.scss`

#### Исходная версия

```scss
.audit {
  display: grid;
  gap: 1rem;
}
.audit p {
  margin: 0;
}
.filters {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 1rem;
}
.filters label:not(.checkbox) {
  display: grid;
  gap: 0.5rem;
}
.table-scroll {
  overflow-x: auto;
}
td {
  overflow-wrap: anywhere;
}
```

#### Текущая версия

```scss
.audit {
  display: grid;
  gap: 1rem;
}
.audit h2,
.audit p {
  margin: 0;
}
.filters {
  display: flex;
  justify-content: space-between;
  align-items: start;
  flex-wrap: wrap;
  gap: 1rem;
}
.filter-fields,
.filter-actions {
  display: flex;
  align-items: start;
  flex-wrap: wrap;
  gap: 1rem;
}
.filter-actions {
  padding-top: 1.5rem;
}
.filter-fields > label,
.date-filter > label {
  display: grid;
  gap: 0.5rem;
  line-height: 1.25rem;
}
:host ::ng-deep .filter-fields .p-datepicker-input,
:host ::ng-deep .filter-fields .p-select {
  height: 40px;
}
.date-filter {
  display: grid;
  gap: 0.5rem;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}
:host ::ng-deep .audit-events-table > thead > tr > th,
:host ::ng-deep .audit-events-table > tbody > tr > td {
  text-align: center;
}
:host ::ng-deep .audit-events-table > tbody > tr.audit-expanded-row > td {
  text-align: left;
  background-color: #eef4fc;
}
:host ::ng-deep .audit-events-table > tbody > tr.audit-event-row > td {
  background-color: #fff;
}
:host ::ng-deep .audit-events-table > tbody > tr.audit-event-row.audit-striped-row > td {
  background-color: #f5f7fa;
}
.table-scroll {
  overflow-x: auto;
}
td {
  overflow-wrap: anywhere;
}
```

### Подробности события — SCSS

Путь в проекте `src/app/features/seller/advertisement/campaign-audit/components/audit-event-details/audit-event-details.component.scss`

#### Исходная версия

```scss
.detail {
  display: grid;
  gap: 0.5rem;
}
.detail span {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.change {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
button {
  justify-self: start;
}
```

#### Текущая версия

```scss
.detail {
  display: grid;
  gap: 0.5rem;
}
.detail span {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.change {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.before,
.after {
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.before {
  background-color: #ffebe9;
}
.after {
  background-color: #dafbe1;
}
.changes-table {
  overflow-x: auto;
}
button {
  justify-self: start;
}
```
