# Website

Public marketing site — landing, blog, waitlist, and contact.

## Language

**Highlight Card**:
A landing-page content unit with a title, body copy, and a Lucide icon name. Website owns presentation; Adminboard owns the managed copy and icon.
_Avoid_: Feature card, benefit card, info card

**Post**:
A blog content unit identified by a slug, with a title, excerpt, required Cover, `authorId`, ISO `publishedAt` (`YYYY-MM-DD`), optional Featured flag, and a structured body of Body Blocks.
_Avoid_: Article, blog post, blog entry

**Excerpt**:
The short supporting copy for a Post, shown on the index and under the title on the post page.
_Avoid_: Subtitle, description, summary, dek

**Author**:
A person credited on Posts, with a stable string `id`, a name, optional Role, and optional image (CDN URL). Shared across Posts via `authorId` on the Post; not a public profile.
_Avoid_: Writer, contributor, byline person

**Role**:
An Author's optional short byline label under their name (e.g. job or practice focus).
_Avoid_: Specialty, title, job title, credential

**Cover**:
The required primary image for a Post (CDN URL), used on the index. Distinct from images inside the body. Presentation may fall back to a placeholder if the asset is unavailable.
_Avoid_: Thumbnail, hero image, featured image, banner

**Featured**:
A Post flag marking it for the index spotlight. At most one published Post may be Featured; clearing Featured is allowed and the index falls back to the latest Post.
_Avoid_: Pinned, highlighted, promoted

**Body Block**:
One ordered unit in a Post's structured body. Kinds in this model: paragraph, heading, image, and video.
_Avoid_: Section, content block, rich-text node, slice

**Paragraph Block**:
A Body Block of plain text prose — no Markdown or HTML inside the text.
_Avoid_: Text block, copy block, rich text

**Heading Block**:
A Body Block for an in-body section title. Plain `text` plus `level` 2 or 3 — the Post title owns level 1.
_Avoid_: Title, subtitle, section header, H2

**Image Block**:
A Body Block for an inline image inside the Post body (not the Cover). Required CDN `src` and `alt`; optional `caption`. Layout owns sizing — not part of the content model.
_Avoid_: Inline image, media image

**Video Block**:
A Body Block for video inside the Post body. Discriminated by `source`: `cdn` (native playback from a cdn.virtality.app URL) or `youtube` (external embed). Both store a `url` — CDN asset URL, or a normal YouTube watch/share URL (not a raw video id; not required to be an embed URL). Optional `caption` (same idea as Image Block).
_Avoid_: Media block, embed block

## Section layout

Landing and marketing UI is organized by **section** (feature), not by technical layer. A section owns its UI, copy, and section-private helpers.

```
sections/<section>/
  index.ts              # public API — re-export what pages may import
  content.ts            # section copy / static content (at section root)
  <section>.tsx         # OK when there is only one UI file
  components/           # when there are 2+ UI files
  lib/                  # when there are 2+ helpers; colocated *.test.ts
```

### Rules

1. **Section is the unit of change.** Editing benefits copy or UI means opening `sections/benefits/` only.
2. **Nest by kind when crowded.** One file of a kind stays at the section root. Two or more of the same kind go in `components/` or `lib/`.
3. **Tests live with `lib/`.** Colocate `*.test.ts` next to the helper under test (not a separate `tests/` folder).
4. **`index.ts` is the public API.** Pages import from `@/sections/<section>`. Internal `components/` and `lib/` stay private to the section.
5. **Routes compose only.** `app/**/page.tsx` assembles sections; it does not own section markup or copy.
6. **Shared across sections** → `components/shared/` (or app-wide `lib/` for non-UI helpers). Do not reach into another section’s internals except via that section’s `index.ts` when a deliberate public export exists. Example: `WaitlistForm` is exported from `sections/cta` for the waitlist page.
7. **App-wide concerns stay outside `sections/`:** `components/layout/`, `components/ui/`, `lib/` (actions, utils, demo booking, legal, waitlist).

### Current landing sections

| Section        | Path                      |
| -------------- | ------------------------- |
| Hero           | `sections/hero/`          |
| Benefits grid  | `sections/benefits-grid/` |
| Benefits       | `sections/benefits/`      |
| Features       | `sections/features/`      |
| Testimonials   | `sections/testimonials/`  |
| Mosaic         | `sections/mosaic/`        |
| Promo video    | `sections/promo-video/`   |
| Supported by   | `sections/supported-by/`  |
| Call to action | `sections/cta/`           |

### Blog section

| Section | Path             |
| ------- | ---------------- |
| Blog    | `sections/blog/` |

Posts and Authors are Adminboard-managed. Website helpers (`getPosts`, `getPostBySlug`, `getFeaturedPost`) read published snapshots via the marketing blog API. `index.ts` is the public API — UI plus those read helpers. Blog routes import only from `@/sections/blog`.

Look-and-feel is the meta-rail layout (date/author rail + copy + cover): index and post under `components/`.

### Adding a section

1. Create `sections/<name>/` with `index.ts` and `content.ts` (if there is copy).
2. Add UI at the root or under `components/` per the nesting rule.
3. Wire the section into the relevant `app/**/page.tsx`.
