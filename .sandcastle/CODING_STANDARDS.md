# Coding Standards

<!-- Customize this file with your project's coding standards.
     The reviewer agent loads it during code review via @.sandcastle/CODING_STANDARDS.md
     so these standards are enforced during review without costing tokens during implementation. -->

## Style

### Tailwind CSS

Follow the `tailwindcss(suggestCanonicalClasses)` lint rule. Prefer Tailwind’s canonical utility names (especially v4 renames) over legacy aliases.

```tsx
// ❌ BAD — legacy alias
<div className="bg-gradient-to-r from-white to-transparent" />

// ✅ GOOD — canonical class
<div className="bg-linear-to-r from-white to-transparent" />
```

When the Tailwind language server or ESLint suggests a canonical class, apply it. Do not leave deprecated aliases in new or edited `className` strings.

**Exceptions:** keep intentional arbitrary values when they do not match theme tokens (e.g. checkbox `rounded-[4px]` while `--radius-lg` is `0.625rem`), and keep dynamic CSS-variable utilities like `border-(--color-border)` that are not the theme `border` color.

## Testing

### Core Principle

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't break unless behavior changed.

### Good Tests

Integration-style tests that exercise real code paths through public APIs. They describe _what_ the system does, not _how_.

```typescript
// GOOD: Tests observable behavior through the public interface
test('createUser makes user retrievable', async () => {
  const user = await createUser({ name: 'Alice' })
  const retrieved = await getUser(user.id)
  expect(retrieved.name).toBe('Alice')
})
```

- Test behavior users/callers care about
- Use the public API only
- Survive internal refactors
- One logical assertion per test

### Bad Tests

```typescript
// BAD: Mocks internal collaborator, tests HOW not WHAT
test('checkout calls paymentService.process', async () => {
  const mockPayment = jest.mock(paymentService)
  await checkout(cart, payment)
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total)
})

// BAD: Bypasses the interface to verify via database
test('createUser saves to database', async () => {
  await createUser({ name: 'Alice' })
  const row = await db.query('SELECT * FROM users WHERE name = ?', ['Alice'])
  expect(row).toBeDefined()
})
```

```typescript
// BAD: Test restates the implementation — the function IS the spec
test('pitchHref includes from param', () => {
  expect(pitchHref('abc')).toBe('/pitches/abc?from=deliverables')
})
```

Red flags:

- Mocking internal collaborators (your own classes/modules)
- Testing private methods
- Asserting on call counts/order of internal calls
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means (e.g. querying a DB) instead of through the interface
- Testing a trivial function (one-liner, simple mapping, string concatenation) where the test just mirrors the code — these tests add no confidence and break on any refactor
- Thin delegation tests for route handlers — when a route's only job is to parse input and call a service method, testing that it "delegates correctly" by mocking the service duplicates the route code in the test. The real behavior lives in the service; test that instead.
- Reading source files (`readFileSync`, `existsSync` on `.ts`/`.tsx`/docs) and asserting on string presence, import paths, component tags, function names, or section order in source
- Asserting that a constant equals its own literal (copy strings, CSS class names, content arrays) without exercising a behavior that uses them
- Permanent `*-prd.test.ts` suites that lock a PRD implementation shape rather than product behavior

### PRD / RALPH loop tests

During an implement loop, temporary red/green tests are fine. When the issue is done:

- **Delete** source-scanning and wiring-lock tests (`readFileSync` of app/docs sources, “module X mentions symbol Y”, file-existence checks).
- **Keep** only tests that call a public API/helper and assert observable outcomes; rename them to normal domain names (e.g. `partner-press.test.ts`), not `*-prd.test.ts`.
- Do not commit PRD acceptance locks as long-lived CI. A PRD is a product brief; lasting tests encode behavior.

```typescript
// BAD: locks implementation shape / file layout
test('page composes hero before benefits', () => {
  const page = readFileSync('app/page.tsx', 'utf8')
  expect(page.indexOf('<Hero')).toBeLessThan(page.indexOf('<Benefits'))
})

// BAD: restates a content constant
test('hero headline', () => {
  expect(HERO_HEADLINE).toBe('Because every move matters.')
})

// GOOD: exercises helper behavior callers rely on
test('hides partner rows when logos are invalid', () => {
  expect(getVisiblePartnerRows([{ src: ' ', alt: 'x' }], [])).toEqual([])
})
```

### Mocking

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Time/randomness
- File system or databases when a real instance isn't practical

**Never mock your own classes/modules or internal collaborators.** If something is hard to test without mocking internals, redesign the interface.

Prefer SDK-style interfaces over generic fetchers at boundaries — each function is independently mockable with a single return shape, no conditional logic in test setup.

### TDD Workflow: Vertical Slices

Do NOT write all tests first, then all implementation. That produces tests that verify _imagined_ behavior and are insensitive to real changes.

Correct approach — one test, one implementation, repeat:

```
RED→GREEN: test1→impl1
RED→GREEN: test2→impl2
RED→GREEN: test3→impl3
```

Each test responds to what you learned from the previous cycle. Never refactor while RED — get to GREEN first.

## Architecture

### Composition

Compose UI from small files: one JSX component per file, within the line budget. The rule set lives in `docs/agents/ui-composition.md`. Apply it when implementing or reviewing React components, pages, or feature UI.
