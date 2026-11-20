# Snello Layouts: UI design map

How the interface is built and why, so a new page can reuse the same pieces. Styles are global in `src/styles.css`; shared building blocks are small standalone components in `src/app`.

Read this before adding a page or restyling one. Section 11 is a checklist for a new page.

## 1. Principles

- **Quiet and monochrome.** Black ink on white, grey surfaces, one red for danger. No accent colour.
- **One radius: 6px** (`--radius`). Round things (type badges, step dots, count pills, dirty dot, thumbs) are the only exceptions.
- **Edge-to-edge work areas.** Pages that are tools (builder, library, data) fill the window under a slim top bar. Panes are separated by 1px lines, not by gaps or floating cards.
- **Cards only where they carry content** (a block of fields, a record, an empty state). Don't nest bordered boxes inside bordered boxes.
- **Icons are Lucide only**, through `<app-icon name="…">`. No inline SVG, no other icon fonts in our own UI.
- **Buttons are PrimeNG** (`pButton`) in the page bar, the dialogs' primary actions, and form footers. They have no visible border.
- **No browser dialogs.** Never `window.confirm/alert`. Use the app's dialog or toast.
- **Content scrolls inside panes, never the page.** Each pane has a fixed height and its own thin scrollbar.

## 2. Tokens

Defined in `:root` of `src/styles.css`.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#171717` | text, primary buttons, active states |
| `--muted` | `#737373` | secondary text, inactive icons |
| `--line` | `#e6e6e6` | every 1px border and divider |
| `--radius` | `6px` | all corners |
| `--topbar` | `48px` | height of the app top bar (not the page bar) |

Colours used inline (keep them consistent):

| Colour | Use |
|---|---|
| `#f7f8f7` | pane background behind cards (builder canvas, data dock, record window body) |
| `#f1f2f1` / `#f0f1f0` | soft fills: disabled inputs, toggle group, hover, tiles |
| `#c4c7c4` | selected / hover border on cards, scrollbar thumb, resizer line |
| `#d4d6d4` | input border |
| `#9a9d9a` | quiet icons (grips, type icons in forms) |
| `#d92d20` | required `*`, delete text, error, destructive confirm |

Spacing: pane padding 16px, page-bar padding `0 20px`, gaps 8px (12px between form columns), form rows 14px.
Type: Inter. Body 13px; labels 12px/600; pane headings 15px/600; page title 17px/600; kickers 11px uppercase.

## 3. Shell

`src/app/app.html`

```
.shell  (grid: 64px rail | workspace | ai-dock)
├─ aside            left icon rail (global `.shell aside` rule styles ANY <aside> in the shell!)
├─ .workspace
│  ├─ header.topbar   48px: crumbs, help, avatar, Ask AI button (to the right of the avatar)
│  └─ main            padding 28px 32px 40px, holds the routed page
├─ app-ai-panel.ai-dock   collapsible right panel (state: AiPanelState)
└─ app-toast              one black toast, bottom centre (state: ToastService)
```

Gotcha: never use `<aside>` for page panes. The shell rule turns it into the narrow sidebar. Use `<div>` or `<section>`.

## 4. Shared components

| Component | File | Purpose |
|---|---|---|
| `app-icon` | `icon.ts` | Lucide icon by short name (`pencil`, `trash`, `type-date`, …). Add new icons to the `ICONS` map there. |
| `app-page-bar` | `page-bar.ts` | The top bar of every page. |
| `app-field-row` | `field-row.ts` | A draggable field row (grip, type icon, name, options slot, move/remove). Used by the list editor's Columns. |
| `app-toast` + `ToastService` | `toast.ts`, `core/toast.ts` | Confirmation toast. `inject(ToastService).show('Record updated.')`. |
| `app-ai-panel` + `AiPanelState` | `ai-panel.ts`, `core/ai-panel-state.ts` | Right-hand Ask AI panel (stub replies for now). |
| `app-meta-icon` | `meta-icon.ts` | Icon of a metadata table. These are FontAwesome classes from the API, not Lucide. |

### `app-page-bar`

```html
<app-page-bar kicker="Builder" [title]="name()" back="/layouts" backLabel="Library"
              [editable]="true" editLabel="Edit layout settings" [flush]="true" (edit)="open()">
  <app-meta-icon bar-icon … />            <!-- optional icon before the kicker -->
  <button pButton severity="contrast" size="small" class="bar-action">…</button>   <!-- actions, right side -->
</app-page-bar>
```

- Height 56px, sticky under the app top bar, negative margins so it runs edge to edge (it assumes `main` padding of 28px/32px).
- `flush` = no gap below (use it when full-height panes follow). Without it there is a 16px gap.
- Inside the bar, buttons are 32px high, icon-only ones 32px square (`bar-icon-btn`), labelled ones `bar-action`. Dividers: `<span class="bar-sep">`.
- PrimeNG injects its own button padding after our CSS. The bar overrides it with higher specificity (`.top-bar .p-button.p-component`). Copy that pattern when you must override PrimeNG.

Button vocabulary in the bar and footers:

| Role | Markup |
|---|---|
| Primary | `pButton severity="contrast" size="small"` |
| Secondary / toggle | `pButton [text]="true" severity="secondary" size="small"` (filled while "on") |
| Destructive | `pButton [text]="true" severity="danger"`; the confirm step is a filled `severity="danger"` |

## 5. Layout patterns

All full-height patterns use `height: calc(100vh - var(--topbar) - 56px)` (app top bar + page bar) and `margin: 0 -32px -40px` to cancel `main` padding. Every pane is `min-height: 0; overflow-y: auto`.

### 5.1 Builder studio (`/layouts/:id`)

```
.studio   [ .canvas (1fr) | resizer | .side-pane (--side-w, default 280px) ]
```

- `.canvas`: page tabs, "Add block", and the blocks (PrimeNG panels). Background `#f7f8f7`.
- `.side-pane`: field inspector (top) then field palette (below). Both are plain sections inside one scroll.
- **Resizer** (`.side-resizer`): drag, double-click resets, arrow keys resize. Width clamped 220–560, saved in `localStorage` key `studio-side-width`. Set through the `--side-w` CSS variable.
- List layouts use the same shell (`.is-list`) with columns and filters in the canvas and only the palette in the side pane.

### 5.2 Library split (`/layouts?view=split|cards`)

```
.library-split   [ .list-pane 420px (filters + cards + paginator) | .editor-pane (the embedded builder) ]
```

- Cards view (`?view=cards`) is a normal card grid in `.library-grid`.
- The right pane embeds `LayoutEditorComponent` with `[embedded]="true"`. The builder hides its back arrow, does not navigate after saving, and uses `.embedded` CSS overrides (static page bar, shorter studio height).
- A card per `@for` item is re-created when the selection changes (switching layouts discards unsaved edits).

### 5.3 Data page (`/data/:id?view=list|split`)

```
.data-split   [ .data-side filters 300px (optional) | .data-main | .data-dock (record, optional) ]
```

- **List view**: table in `.data-main`; records open as floating windows (`.window-row`).
- **Split view** (`.is-split`): `.data-main` becomes a card list (`.rec-list`, cards `.rec-card`: thumbnail, title, one sub line), the paginator is fixed at the bottom of the column. The record is docked in `.data-dock` (default 2/3 width) with its own resizer. Width in `localStorage` `data-dock-width`; clamped between 320px and the split width minus 240px.
- Filters open from the **Filters** button in the page bar; the **Columns** button next to it opens the column picker popup. Filters are one per row in the pane.
- "Add new" opens a blank record in the dock (split) or a window (list).

### 5.4 Record window / dock (`.drawer`)

```
.drawer
├─ header.drawer-head   56px: icon tile, title + kicker, minimize / close (PrimeNG text buttons)
└─ .drawer-body         flex column, no padding
   └─ app-layout-play.play-embedded
      └─ .wizard: [ .stepper ] [ form: formly-form (scrolls) + .form-actions (fixed) ]
```

Only `formly-form` scrolls; the action bar is a fixed footer with a top border. The stepper (below) is outside the scroll area.

## 6. Forms (record forms and the builder's mock)

- **Block** = PrimeNG panel as a white card with a bold 15px title and no header line.
- **Grid**: `.field-grid`, 12 columns, spans 12 / 6 / 4 from the layout (`formly-field.span-*`).
- **Field**: label 12px/600, red `*` when required, small grey type icon; input below. Inputs, textareas, selects and PrimeNG select/datepicker have a **visible `#d4d6d4` border and no background**. Only disabled/read-only fields get the grey fill `#f1f2f1`. Focus = dark border + soft ring (no black outline).
- **Stepper** (layouts with more than one page): `.steps` / `.step`, numbered dots joined by lines, done steps show a check, clicking an earlier step is free, going forward validates one step at a time (`goToStep`).
- **Footer** `.form-actions`: Back (only when multi-page), spacer, Delete (text, red), Update/Create (contrast), Next, Source (text).

### Builder canvas field (`.canvas-field`)

White card with 1px `--line` border, 20px right padding, grip always visible (dark on hover/selected), label, a mock input that depends on the field type (`mockKind()`), the field name in mono, and on hover/selected a width pill plus a remove button. Selected = grey border `#c4c7c4` + `#f7f8f7` fill (never a black border).

## 7. Reusable controls

| Class | Look |
|---|---|
| `.chip` | 28px toggle pill-like button, grey text; `.on` = black fill. Used for Required, Show if, Shown/Hidden. |
| `.segmented` / `.span-picker` | Small grouped buttons (Full / ½ / ⅓); `.on` = white with shadow. |
| `p-selectbutton.view-toggle` | PrimeNG select button restyled as a grey group with a white active segment (List/Split, Split/Cards). |
| `.applied` | Chips listing applied filters. |
| `.type-badge` | 22px black circle with a white icon (palette, inspector). In forms it is flattened to a quiet grey icon. |
| `.fr-options` | Controls in a field row: chip, select and read-only label share one look (28px, 12px text, border, radius). Options start at the same left edge in every row (name column fixed at 240px). |

## 8. Dialogs, confirmations, notifications

- **Dialog**: `.sheet-back` (dim backdrop) wrapping `.sheet` (+ `.settings-sheet`, 520px). Header with title and close, a `.settings-form`, then `.dialog-actions` (right-aligned Cancel + primary). Forms use `(submit)` so Enter confirms. See the page and block dialogs in the builder.
- **Confirmation dialog**: the builder's `confirmDialog` signal (`title`, `message`, `confirmLabel`, `danger`, `action`, `cancel`). Delete page/block, change metadata and switch layout type all use it.
- **Naming things** (page, block): always through a dialog, never an inline input. Creating also opens the dialog with a proposed name.
- **Toast**: `ToastService.show(text)`; black pill, check icon, bottom centre, 3.5 s, click to dismiss. Use it for success of save/update/delete. Errors that need attention stay as `.banner` at the top of the page.

## 9. Behaviours worth keeping

- **Save button** (builder): reads Save / Saving… / Saved, disabled when nothing changed, orange dot when dirty, Ctrl/⌘+S. Dirty = current document differs from the stored one.
- **View params in the URL**: `view` is always written to the address bar (library: `split|cards`, data: `list|split`) and remembered in `localStorage` (`layout-library-view`, `data-view`). Paging uses `page` and `size`.
- **Drag and drop** (Angular CDK): fields reorder inside and between blocks, and can be dragged from the palette. One `cdkDropListGroup` on the studio connects everything. The palette drop list refuses entries (`noEntry`).
- **Scrollbars**: global thin style (pill thumb `#c4c7c4`, dark on hover).
- **Selection**: neutral grey border and fill, never black.

## 10. Known pitfalls

- Specificity: PrimeNG styles are injected later than `styles.css`. When an override seems ignored, raise specificity (e.g. `.top-bar .p-button.p-component`) instead of using `!important`.
- Old global rules can leak: `.shell aside`, `.row-actions { margin-top: 8px }`, `.page-head`. Check them when a new element is oddly spaced.
- The fixed heights assume the app top bar (48px) and page bar (56px). Banners above a pane push it down; keep banners out of full-height pages or accept the offset.
- Lucide icons use a 24px grid; our CSS sizes them (15–16px, stroke 2). Do not set sizes in the icon component.
- A `view` query param change re-renders the page; do not store view state in component-only signals.

## 11. Checklist for a new page

1. Start with `<app-page-bar kicker title …>`; put actions inside it using PrimeNG buttons. Use `[flush]="true"` if full-height panes follow.
2. Choose a pattern: single scroll page (cards in `main`), or edge-to-edge panes (copy `.data-split` / `.library-split`: grid, `height: calc(100vh - var(--topbar) - 56px)`, `margin: 0 -32px -40px`, panes `min-height:0; overflow-y:auto`).
3. Pane backgrounds: white for lists/inspectors, `#f7f8f7` behind cards. Separate panes with a 1px `--line`.
4. If a pane should be resizable, copy the `.side-resizer` markup and the pointer/keyboard handlers from the builder (`startResize`, `resizeKey`, `resetSide`) or the data page (`startDockResize` …), store the width in `localStorage`, and drive the grid with a CSS variable.
5. Forms: use the field/label/input styles in section 6; footers go in a fixed `.form-actions` bar outside the scroll area.
6. Naming/creating/deleting: dialog + confirmation dialog + toast. No `window.confirm`.
7. Icons: add any new name to `ICONS` in `icon.ts`; use Lucide components only.
8. Selections and hovers: grey `#c4c7c4` borders and `#f7f8f7` fills.
9. Check the narrow layout (< 1100px): panes stack, fixed heights drop, resizers hide.
10. Run `npx ng build` before handing over.

## 12. File map

| Area | Files |
|---|---|
| Global styles | `src/styles.css` (sections are appended in feature order; later rules win) |
| Shell | `src/app/app.html`, `app.ts` |
| Shared components | `page-bar.ts`, `field-row.ts`, `icon.ts`, `toast.ts`, `ai-panel.ts`, `meta-icon.ts` |
| Shared state | `core/toast.ts`, `core/ai-panel-state.ts`, `core/layout-store.ts`, `core/metadata-catalog.ts` |
| Pages | `pages/layout-list.*` (library), `pages/layout-editor.*` (builder), `pages/layout-play.*` (data + record), `pages/home.*`, `pages/data-layouts.*` |
| Form rendering | `formly/shells.ts` (field and block wrappers), `core/layout-formly.ts` |
