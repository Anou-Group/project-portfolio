# UI design standards

The product should read as a polished internal company portal: calm, precise,
typographic. Not a generic admin template.

## Foundations

- **Type:** Geist Sans (UI), Geist Mono only for codes/IDs. Page title 24px/600,
  tight tracking. Section title 15–16px/600. Body 14–15px, line-height 1.6. Muted
  text uses `text-muted-foreground`. Never use oversized hero headings.
- **Colour:** neutral surfaces; one accent (deep ink blue, `--primary`). Status
  colours are reserved for status: Completed (emerald), In Progress (blue), Pending
  (slate), Blocked (red), Awaiting Approval (amber). Tokens live in `globals.css`.
- **Spacing:** 4px grid. Page padding 16px mobile / 32px desktop. Card padding 20px.
  Sections separated by 32–40px.
- **Surfaces:** cards are `rounded-xl border bg-card shadow-xs`. Hover raises the
  border contrast and shadow slightly. No gradients, no glassmorphism.
- **Icons:** Lucide, 16px in text rows, 18px in nav, stroke 1.75–2. One icon per
  concept (see `src/components/portfolio/labels.tsx`).
- **Motion:** only for state change (collapse, sheet). Respect `prefers-reduced-motion`.

## Components

- `StatusBadge` for every status (dot + label). Never colour text alone.
- `SectionCard` with collapsible header (`aria-expanded`, chevron rotates).
- `ProjectCard` is a single link; the whole card is the hit target with a visible
  focus ring.
- `EmptyState` (icon, one-line title, one-line explanation, optional action) for
  every list that can be empty.
- Filters are chips/selects bound to the URL, so views are shareable and the
  back button works. Selected chips use `aria-pressed`/`aria-current` and a filled style.
- External links: `target="_blank" rel="noopener noreferrer"` and an
  `ExternalLink` icon; screen-reader text says "opens in a new tab".

## Layout

- Sidebar 248px at ≥ 1024px with Overview, All Projects, Activity & Updates,
  Resources, About. Active item: filled background, medium weight,
  `aria-current="page"`.
- Below 1024px: top bar with menu button opening a left sheet with the same nav.
- Content max width 1152px. No horizontal scroll at 390, 900 or 1440 px.

## States

- Loading: skeletons that match the final layout (`loading.tsx` / Suspense fallbacks).
- Error: a calm card with what happened and "Try again".
- Not found: explains and links back to All Projects.
- Empty: never a blank box.

## Accessibility

- Skip link to main content; landmarks (`nav`, `main`, `header`).
- Visible focus on every interactive element; full keyboard operation.
- Contrast ≥ 4.5:1 for text. Hit targets ≥ 40px on touch.
