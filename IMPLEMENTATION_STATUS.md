# Urban DNA v7 — Full-Stack: Auth + DB + Efficient Layers + Live Search + Interactive Roads

## Done in this pass
- Login/Sign-up page (`login.html`) with session auth, gating the whole app.
- SQLite database (`better-sqlite3`) for users + a demo "city cells" cache.
- Layer rendering rewritten to build-once/cache instead of rebuild-on-every-click.
- Search bar wired to Google Geocoding — flies camera + loads data for any query.
- Click-anywhere road selection: any lat/lng on the 3D map now returns a
  deterministically generated (and cached) road + stats + alternate route via
  `POST /api/city-data`, instead of only working on the few hardcoded Pune polygons.
- All API routes (`/api/city-data`, `/api/urban-ai`) require a logged-in session.

## Known limitations / next steps
- `city_cells` data is synthetic (seeded PRNG), not a real traffic feed — swap
  `demoData.js` for a real provider (e.g. TomTom/HERE traffic API, Google Roads API)
  when ready for production data.
- Sessions use the default in-memory `express-session` store — fine for local/demo use;
  swap in `connect-sqlite3` or Redis before deploying multiple server instances.
- The `gmp-click` event payload shape on `Map3DElement` is read defensively
  (`position`/`detail.position`/`latLng`) since it can vary by Maps JS API version —
  verify against the exact library version once you have a live API key/billing enabled.
- Login page video/marquee assets are placeholders from the supplied design spec;
  swap `src/login.js` `BRANDS` array and the video URL for your own assets/logo.
