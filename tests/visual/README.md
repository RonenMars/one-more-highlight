# Visual regression tests

Playwright drives the playground (`examples/playground`) and captures pixel
snapshots of each demo route. Snapshots are committed under
`tests/visual/snapshots/` and compared on every run.

CI fails the release job if any snapshot drifts (see
`.github/workflows/release.yml`).

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm test:visual` | Run the full suite against the committed baselines. |
| `pnpm test:visual:update` | Regenerate every baseline from the current playground output. **Run this after any visual change** and commit the updated PNGs. |
| `pnpm test:visual:ui` | Open the Playwright UI to inspect a failing run interactively. |

The Vite dev server is started automatically by the Playwright config
(`webServer.command`). If port 5173 is already in use, kill the running
process first.

## Device matrix

Five projects run on every spec:

| Project | Device profile | DPR | Viewport (CSS px) | Why |
| --- | --- | --- | --- | --- |
| `chromium` | Desktop Chrome | **2** | 1280×720 | Most common desktop browser; retina capture sharpens 1px strokes and small glyphs. |
| `firefox` | Desktop Firefox | **2** | 1280×720 | Independent rendering engine — catches Gecko-specific issues. |
| `webkit` | Desktop Safari | **2** | 1280×720 | Catches macOS / Safari quirks that hit ~20% of traffic. |
| `mobile-iphone` | iPhone 14 Pro | **3** | 393×660 | Current iPhone flagship. Validates mobile layout at typical iOS DPR. |
| `mobile-android` | Galaxy S24 | **3** | 360×780 | Current Android flagship; narrower viewport stresses mobile responsiveness. |

`deviceScaleFactor: 2` on the desktop projects means each CSS pixel renders
as a 2×2 block of physical pixels — retina-equivalent. Mobile devices use
the SDK's natural DPR (3 for both picks).

Snapshots are captured at **device pixels** (`scale: 'device'` set in
`playwright.config.ts` under `expect.toHaveScreenshot`). That means a
1280×316 element on a 2× DPR project produces a 2560×632 PNG, and a
393×220 element on a 3× DPR iPhone produces a 1179×660 PNG. The PNGs match
the physical pixel density the browser actually rendered — no
downsampling, no resampling pass, retina-sharp on high-DPR displays.

## How baselines work

- The first snapshot for a test is written to disk and treated as the truth.
- Subsequent runs compare pixel-for-pixel with `maxDiffPixelRatio: 0.01`
  (allows up to 1% of pixels to differ — enough to absorb font-rendering
  fluctuations between minor browser versions without hiding real changes).
- Snapshots live under `tests/visual/snapshots/<spec>/<arg>-<project>.png`.

## Snapshot policy

Snapshots are **committed binaries**, not gitignored.

- Treat them as part of your change — like a unit test fixture.
- A regenerated PNG without a corresponding source change is a red flag
  (probably a flake, an unrelated styling drift, or a forgotten revert).
- A source change without regenerated PNGs will fail CI.

## Updating baselines

After any change that affects rendered output:

```sh
pnpm test:visual:update
pnpm test:visual    # verify the new baselines pass on a clean re-run
git add tests/visual/snapshots
```

If a regen produces unexpected drift in routes you didn't touch, **don't
commit** — investigate. Common causes: shared CSS variable changed,
font subset shifted, dark-mode rule order changed.

## Adding a new project

To add another browser or device:

1. Import a device profile from `@playwright/test` (`devices['…']`) — or
   define your own with `viewport`, `deviceScaleFactor`, `userAgent`.
2. Add an entry to the `projects` array in `playwright.config.ts`.
3. Run `pnpm test:visual:update` to seed baselines for the new project.
4. Commit the new PNGs.

## Adding a new spec

1. Create `tests/visual/specs/<feature>.spec.ts` mirroring an existing file.
2. Have the test `goto` a playground route (e.g. `/multi-state` or
   `/dark/multi-state` for the dark-theme variant).
3. Call `await expect(page).toHaveScreenshot('<name>.png')` once per state
   you want captured.
4. Run `pnpm test:visual:update` to write the initial baselines.

## Troubleshooting

- **"snapshot doesn't exist"** — first run for this project/test. Re-run
  with `pnpm test:visual:update`.
- **Drift across all snapshots** — likely a base font or CSS variable
  change. Check `examples/playground/src/index.css` and `index.html`.
- **Drift only in one browser** — usually a font-fallback or
  text-rendering quirk; widen `maxDiffPixelRatio` only as a last resort.
- **Mobile snapshots look cramped** — expected if the demo wasn't
  designed responsive. Either accept the layout, or add responsive CSS
  to the playground.
