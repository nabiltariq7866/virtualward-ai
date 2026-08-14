# Custom Dropdown Verification

This release replaces all native HTML dropdowns with the shared `CustomSelect` component.

## Verified source state

- Native native select tags in release: **0**
- Native native option tags in release: **0**
- Playwright `selectOption()` calls: **0**
- Custom dropdown runtime instances: **20**
- Custom dropdown keyboard E2E coverage: **included**
- TS/TSX syntax diagnostics: **0** across 34 source/E2E files
- Broken local imports: **0**

## Keyboard behavior

- Arrow Down / Arrow Up opens and navigates options.
- Home / End jumps to first / last option.
- Enter / Space selects the focused option.
- Escape closes the menu.
- Clicking outside closes the menu.
- Disabled controls cannot be opened.

## Runtime verification note

The sandbox used for this packaging step does not contain this project's npm dependencies, so a dependency-backed Vite build/Vitest/Playwright run was not claimed here. Run locally after `npm install`:

```bash
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```
