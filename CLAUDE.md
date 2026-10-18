# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

JobMappe is a job-application tracker frontend: React 19, TypeScript (strict, `noUncheckedIndexedAccess`), Vite 8, React Router 8 (data router, lazy routes), TanStack Query 5 and CSS Modules. The UI language is German.

It talks to a separate Spring Boot backend (not in this repo) at `http://localhost:8080`. In dev, Vite proxies `/api` there. `VITE_API_BASE_URL` overrides the base URL (default `/api`). The backend offers endpoints for companies, job postings, applications, notes and note categories; the DTOs live in `src/api/types.ts`.

## Commands

- `npm run dev`: dev server (the backend must run on :8080)
- `npm run check`: format check, lint, build (`tsc -b`), unit tests. **Run it before finishing any change.**
- `npm test` / `npm run test:watch`: Vitest (unit and component tests)
- `npx vitest run src/features/home/homeText.test.ts`: run a single test file (`-t "<name>"` filters by test name)
- `npm run lint`, `npm run format`

## Product rules

- **Only features with an API endpoint exist.** Do not add UI for things the backend cannot do, and do not show placeholder or sample values. Show only values an endpoint delivers **directly** (fields, a page's `content`, `totalElements` of the loaded query). No client-side derivations or aggregates, no loading all pages, no extra `size=1` requests just for a count, no sums across several status queries. **When unsure whether something is "API-backed", ask the user.**
- Fixed app settings (follow-up after 20 days, used to mark overdue applications) come from `shared/settings/useSettings()`, which returns constants for now. Only that hook changes once a settings endpoint exists.
- The settings page (`/einstellungen`, `features/settings`) has no entry in the main navigation; it opens from the profile menu in the top bar (`app/ProfileMenu`: person icon, appearance switch, link to the settings). `navArea.ts` maps it to the area `settings`, for which the nav indicator is hidden. It holds the per-browser settings (`SettingsPanel`) and the note folders (`CategorySettings`).
- The display name is per browser: `shared/settings/displayName.ts` stores it in `localStorage` (`jobmappe.displayName`, max. 40 characters, whitespace-only removes it). The home page greets with its first word (`greetingFor` in `features/home/homeText.ts`), without a name it just greets.
- The appearance (light/dark/system) is per browser, not a backend setting: `shared/theme/theme.ts` stores it in `localStorage` (`jobmappe.theme`) and sets `[data-theme]` on `<html>`. An inline script in `index.html` applies it before the first paint; keep key and values in sync. Anything that depends on the scheme in JS (e.g. the logo) uses `useColorScheme()`, not `prefers-color-scheme`.
- Animations can be switched off per browser the same way: `shared/theme/motionPreference.ts` stores `off` in `localStorage` (`jobmappe.motion`) and sets `[data-motion="off"]` on `<html>` (also applied by the inline script in `index.html`). `base.css` then cuts CSS transitions and view transitions like `prefers-reduced-motion`. JS-driven animations must check `prefersReducedMotion()` from `shared/lib/motion.ts`, which covers both.
- The default view of the applications (Kanban/Tabelle) and notes (Galerie/Tabelle) pages is also per browser (`shared/settings/viewPreferences.ts`, keys `jobmappe.applicationsView`/`jobmappe.notesView`, only `table` is stored; defaults Kanban and Galerie, chosen in Einstellungen). A URL without `ansicht` shows the default view; the pages write `ansicht` only when the view differs from it, so `ansicht` has explicit values for both views.
- Lists are paginated (`Page<T>`, `page` is 0-based, `api/pagination.ts` has `PAGE_SIZE`, `nextPageParam`, `clampedPage`). Filtering and sorting happen on the server: never filter, search or re-sort a page's `content` on the client (only note categories are a plain array sorted locally). UI values map to backend parameters in `select*.ts` (e.g. `apiPostingSort`, `apiTableSort`); URL values are parsed against whitelists, so invalid `sort`/`filter` never reach the backend. The board loads each column as its own infinite query (`?status=…`, "Mehr laden"); the company picker in "Neue Stelle" opens only once you type, searches by `q` and loads pages the same way.
- Text search (`q`, `shared/ui/SearchBox`, live and debounced) exists for companies, postings, applications and notes. It **cannot be combined with a filter** (backend: 400 `Invalid request combination`): searching sets the postings filter to "Alle" and clears status/priority or the notes folder, picking a filter clears the search, and the URL parsers ignore filters while `suche` is set (`effectivePostingFilter`, `useApplicationsView`, `effectiveNoteCategory`). The board cannot search (its columns use `status`), so a search there switches to the table.
- Command Palette (`features/command-palette`): ⌘K/Strg+K or the magnifier in the top bar (`app/PaletteTrigger`). Typing filters only a fixed command list (`commands.ts`: label + German `keywords`, matched locally in `commandMatch.ts`): pages, "Neu" actions, posting filters, appearance and animations. "Stellen/Bewerbungen/Firmen/Notizen suchen" switch into a search mode (chip in the field) that queries the backend with `q` page by page (only `content`/`totalElements`, never with filters); Escape or Backspace in the empty field leave the mode. Notes have no URL of their own: a note hit and "Neue Notiz" open the note window on the current page (`CommandContext.openNote`). Pages can later add their own commands via `useRegisterCommands`. ⌘K checks `isModalDialogOpen()` (floating note windows don't block it, other modals do); the note editor keeps ⌘K for links.
- Only the posting detail (`JobPostingDetail.applicationId`) knows the application ID; the list only has `hasApplication`. "Zur Bewerbung" links via that ID, and Enter in the posting list loads the detail via `postingQuery` (usually cached). The postings page does not load `/api/applications`.
- PATCH semantics: a null or missing field is left unchanged, and an empty string is invalid. `appliedVia` (enum `ApplicationChannel`, labels in `APP_CHANNEL`) and `portalUrl` can be changed but not cleared (`viaPatch.ts`).
- The backend sets `appliedAt` (on `APPLIED`) and `closedAt` itself. The UI only sends `status`, updates optimistically, then refetches. Back to `IN_PROGRESS` clears `appliedAt`, `appliedVia` and `portalUrl`, even if they are sent in the same request.
- Allowed status changes live only in `domain/transitions.ts`: from In Bearbeitung only to Beworben (asks for the Bewerbungsweg) or closed as Zurückgezogen; after that freely between the running statuses, and back to In Bearbeitung only after a reset confirmation. Closing outcomes depend on the status (`outcomesFor`). Closed applications are locked and reopen only via "Wieder öffnen" on the detail page. Board columns and status pills follow these rules. The backend enforces the same table (409 otherwise); the fake backend keeps its own copy so tests catch drift.
- Notes are an independent resource (`GET/POST /api/notes`, paginated): a note may belong to at most one application (`applicationId`, shown as `jobTitle · companyName`). The `/notizen` page lists all notes; the application detail and the editor list `?applicationId=…`. Folder tabs come from `GET /note-categories` and filter on the server via `noteCategoryId` (`categoryTabs` in `noteText.ts`). The application panel sends `applicationId` **and** `noteCategoryId` together (the backend supports that combination). The assignment is changed in the note's header (`ApplicationPicker`, searches applications by `q`). `PUT /notes/{id}` is a full update, so the form always sends the current `applicationId` and `noteCategoryId`. Note windows are app-wide: `NoteWorkspaceProvider` (in the AppShell) renders `NoteWorkspace` and the tray `MinimizedNotes`; pages and the command palette open notes via `useNoteWindows().open(noteId, { categoryName, application, scope })` (`scope` = application a new note from the fullscreen list is assigned to; the fullscreen list itself always shows all notes, filtered by folder tab or its own search `q`). Windows can be minimized into the tray, a page change (pathname) minimizes all open ones, and all windows incl. drafts persist in `localStorage` (`jobmappe.noteWindows`, `noteWindowsStorage.ts`) and come back minimized after a reload. The pop-out window route is `/notiz/:noteId`.
- DELETE exists only for notes and note categories (both behind a `ConfirmDialog`). Companies, postings and applications cannot be deleted.
- Archiving a posting (`PATCH /job-postings/{id}/archive`) lives only in the posting detail: "Archivieren" without an application, "Wiederherstellen" when archived (no "Bewerbung starten" then). List entries do not carry `archivedAt` or `status`; the "Archiviert" and "Inaktiv" filters come from `GET /job-postings?filter=ARCHIVED|INACTIVE`.

## Architecture

```text
src/
  app/        router (lazy pages, errorElement), AppShell (top bar + nav/mobile dock, profile menu), providers
              (QueryClient; MutationCache shows meta.errorMessage as a toast), paths.ts (path
              builders + typed navigation state), global hotkeys
  api/        one file per resource: endpoints + useQuery/useMutation hooks; types.ts (backend DTOs; note
              responses carry the category *name* in `noteCategory`, requests its ID), queryKeys.ts
  domain/     labels.ts: the single place for enum → German label/color
  features/   postings, applications (board, table, detail), notes (page, windows), categories, home, settings,
              command-palette; pure logic lives in *.ts next to the components (select*, noteGrid …)
  shared/     ui (design-system components), editor (contenteditable → Markdown), hooks, lib, settings, theme
  styles/     tokens.css (colors/radii/shadows, light + dark), base.css (reset only)
  test/       fake-backend (in-memory implementation of the backend API + sample seed data), MSW setup
```

- URL state (pages 1-based in the URL, `paths.ts` builds and parses them; `?suche=` holds the search on all three lists): postings `?filter=open|with|inactive|archived|all&suche=…&seite=N&sortierung=new|old|title|company&anzahl=10|15|25|50|100` (page size from `LIST_PAGE_SIZES`, default 15 like the backend; card pager, always visible); companies `?suche=…&seite=N&anzahl=…` (same page sizes and always-visible card pager as the postings); notes `?ansicht=tabelle|galerie&suche=…&ordner=<categoryId>&seite=N&sortierung=new|edited|old|title&anzahl=…` (gallery by default, `PageSwitchButton` toggles; `anzahl` only in the table, which has the size select like the other lists) (folder IDs are only sent after checking them against the loaded categories; in the gallery the page size is as many fixed-height cards as fit into the full-height card, `noteGrid.ts`/`useFitPageSize`, a resize keeps the first visible note on screen, and paging slides the cards sideways once the new page has loaded, `PageSlide`); applications `?ansicht=tabelle|kanban&suche=…&status=<one ApplicationStatus>&prioritaet=…&seite=N&sortierung=<key>-auf|ab&anzahl=…` (same page sizes; the table's pager is the always-visible numbers pager in the table card's footer). Selection lives in the path (`/stellen/:id`, `/firmen/:id`, `/bewerbungen/:id`). Where you came from (for back links) travels in `location.state`, typed in `paths.ts`.
- Empty lists, tables and pages use `shared/ui/EmptyState` with an `icon`. Empty posting lists offer `FindPostingsActions` (capture a posting by hand).
- Error handling: the backend returns Spring `ProblemDetail`. `api/client.ts` turns it into `ApiError` (`status`, `title`, `fieldErrors`). The UI shows **only German texts derived from status and field name** (`api/errors.ts`). Backend `detail` and validation messages are English: never display or parse them.
  - Mutations declare `meta: { errorMessage }`. The central handler (`app/queryClient.ts`, also used by `renderWithApp`) toasts it with a reason by status.
  - Forms that show server errors inline also declare `inlineFields` (backend property names) and, for 409 on a field, `conflictField`/`conflictMessage`. They export the meta object, so the form can call `serverFieldErrors(err, meta)` in `onError`, and the toast is suppressed for those errors.
  - Queries render through `QueryView` or `LoadingState`/`ErrorState`. 400/404 shows "nicht gefunden" without a retry, and 4xx queries are not retried. 404 `Endpoint not found` (`isEndpointMissing`) is a client bug: generic error, no retry.
  - The fake backend mirrors the backend's ProblemDetail responses (validation `errors`, UUID check, case-insensitive name conflicts, `Invalid sort property`, `Endpoint not found`) and its pagination/sorting/filter rules; `handle()` takes the path including the query string.

## Conventions

- **CSS Modules only.** Every component has a `*.module.css` next to it that uses the tokens from `tokens.css`. No ID selectors, no `!important` (the only exceptions are the reduced-motion and `data-motion="off"` resets in `base.css`), no inline styles except CSS custom properties for data-driven values (`style={{ '--dot': color }}`). Do not target another module's markup; add a prop or variant instead (e.g. `Dialog size="document"`, `Select compact`).
- Accessibility: clickable things are `<button>` or `<Link>`. Rows and cards use a "stretched link" (the title link's `::after` covers the row) instead of `onClick` on `div`/`tr`. Dialogs use native `<dialog>.showModal()` via `shared/ui/Dialog`. Confirmations use `ConfirmDialog`, never `window.confirm`.
- Hooks: global listeners go through `useHotkey` (registered once, reads the latest handler via `useLatest`). No `window.innerWidth` in render; use `useMediaQuery`. Clean up timers and listeners.
- Component files export only components (Fast Refresh). Helpers go into sibling `.ts` files.
- Lint deliberately turns off `jsx-a11y/prefer-tag-over-role` (custom ARIA widgets such as radiogroup and textbox follow WAI-ARIA patterns) and `jsx-a11y/no-autofocus` (focusing the first field of a dialog is the WAI-ARIA recommendation). Remaining inline `oxlint-disable` comments must state a reason.
- Never commit real personal data (names, e-mail addresses, real employers or job ads). Sample data uses fictional companies on `*.example` domains.

## Testing

- Component tests (`renderWithApp` from `src/test/render.tsx`) run against the fake backend through MSW. Assert on its state via `currentBackend().db`. Seed IDs come from `seedId('application', 1)` (= sample `a1`). The sample data's "today" is 2026-09-01 (`SAMPLE_TODAY`).
