# CHANGES.md — GrapesJS/Preview Removal & JSON Import/Export

## Summary
Removed the GrapesJS-based UI builder and iframe preview panel. Added a new JSON
manifest import/export workflow. The React Flow canvas is preserved unchanged.

---

## [REMOVED] Files & Directories

| Path | Description |
|------|-------------|
| `app/builder/` | GrapesJS builder route (`/builder`) |
| `app/preview/` | iframe preview route (`/preview`) |
| `app/flow/` | Old flow route (moved to `app/flow-editor/`) |
| `shared/components/TemplateBuilder/` | All GrapesJS plugin code (20 files): blocks, panels, styles, commands, widgets, extractPagesForFlow, PagesPanel, TemplateBuilder component, toggleImagesCommand + test |
| `shared/models/template-builder-plugin.ts` | GrapesJS plugin TypeScript types |
| `lib/buildPageRuntime.ts` | Preview iframe HTML builder |
| `lib/widgets/` | Empty widgets directory |

### Removed npm packages
- `grapesjs` — GrapesJS editor
- `juice` — CSS inliner used by GrapesJS export

---

## [MODIFIED] Files

### `shared/store/useAppStore.ts`
- Removed `rawJson` / `setRawJson` (only used by GrapesJS save/load)
- Removed `activeContext` / `setActiveContext` (only used by preview iframe)
- Removed `code` field from `PageDescriptor` (GrapesJS HTML output)
- All React Flow state preserved: `pages`, `flowNodes`, `flowEdges`, `navMap`, `pendingEdgeUpdate`

### `shared/components/AppHeader.tsx`
- Removed "Template Builder" link (`/builder`)
- Removed "Preview" link (`/preview`)
- Updated to: "Import Manifest" (`/import`), "Flow Editor" (`/flow-editor`)

### `app/page.tsx`
- Replaced landing page with `redirect('/import')`

### `app/layout.tsx`
- Updated `metadata.title` to "Kiosk Flow Editor"

### `package.json`
- Removed `grapesjs` and `juice` from dependencies

---

## [ADDED] Files

### `types/manifest.ts`
New TypeScript types: `Manifest`, `ManifestScreen`, `ManifestLink`, `OutputJson`, `OutputNavigation`

### `lib/parseManifestToFlow.ts`
- `validateManifest(manifest)` — validates manifest structure, returns error array
- `parseManifestToFlow(manifest)` — pure function mapping manifest → `{ nodes, edges, pages }`

### `lib/flowToOutputJson.ts`
- `flowToOutputJson(nodes, edges)` — pure function mapping React Flow state → `OutputJson`
- `downloadOutputJson(output)` — triggers browser file download

### `app/import/page.tsx`
New `/import` route with drag-and-drop upload, JSON validation summary, and "Load into Flow Editor" button.

### `app/flow-editor/page.tsx`
Moved from `app/flow/page.tsx` with these additions:
- "Download JSON" button in toolbar (wired to `flowToOutputJson`)
- Empty state now points to `/import` instead of `/builder`
- All React Flow logic is identical to the original

### `CHANGES.md`
This file.

---

## Routing Changes

| Before | After |
|--------|-------|
| `/` → Landing page | `/` → Redirect to `/import` |
| `/builder` → GrapesJS editor | **Removed** (404) |
| `/preview` → iframe preview | **Removed** (404) |
| `/flow` → React Flow canvas | `/flow-editor` → React Flow canvas |
| — | `/import` → Manifest upload (NEW) |
