# Urban DNA

Google 3D city visualization + Urban DNA layers + NVIDIA AI decision support,
now full-stack with a login page, a SQLite database, and a "click anywhere"
demo road/traffic dataset.

## Setup
```powershell
npm install
copy .env.example .env.local   # (mac/linux: cp .env.example .env.local)
```
Edit `.env.local` and set:
- `VITE_GOOGLE_MAPS_API_KEY` — needs Maps JavaScript API + Photorealistic 3D Maps + Geocoding API enabled
- `NVIDIA_API_KEY` — for the "Ask Urban DNA" AI panel
- `SESSION_SECRET` — any long random string (used to sign login sessions)

```powershell
npm run dev
```
Open `http://127.0.0.1:5180/`. You'll land on the **login page** first.

## What's new in this build
1. **Login page + database (full stack)**
   - `login.html` / `src/login.js` / `src/login.css` — a Sign Up / Log In screen with a
     video hero, gradient headline, and a glass-morphism auth card. No unrelated
     nav tabs — just Log In / Sign Up.
   - `db.js` — a real SQLite database (`better-sqlite3`), stored at `data/urban-dna.sqlite3`
     (auto-created, gitignored). Table `users` stores bcrypt-hashed passwords.
   - `auth.js` — `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`,
     session cookies via `express-session`.
   - `server.js` now redirects `/` to `/login.html` whenever there's no session, and every
     API route (`/api/city-data`, `/api/urban-ai`) requires login.

2. **Efficient layers**
   - Each city layer (Traffic, AQI, Population, ...) is now built **once** and cached.
     Switching layers just detaches/reattaches the cached 3D elements instead of
     recomputing every polygon, polyline, and marker from scratch every click.

3. **Working search**
   - The search box in the top bar now geocodes anything (`"Mumbai"`, `"Paris"`, an address...)
     via the Google Geocoding library, flies the 3D camera there, and immediately loads
     that location's data into the side panel — it was previously not wired to anything.

4. **Interactive, click-anywhere roads + alternate routes**
   - Roads are no longer static/hardcoded to one area. Click **anywhere** on the 3D map
     (not just FC Road) and the app:
     1. Calls `POST /api/city-data` with the clicked lat/lng.
     2. The server deterministically generates (via a seeded PRNG in `demoData.js`) a
        plausible road name + traffic/AQI/capacity stats + a short "corridor" path and
        an alternate route — then **caches it in SQLite** (`city_cells` table) so the
        same spot always returns the same numbers instantly next time.
     3. The map highlights the selected corridor and draws the alternate route in blue,
        and the side panel updates with real numbers + "-X% via alternate route".
   - This is a synthetic/demo dataset (there's no live traffic feed), but it behaves
     exactly like a real backend: same input -> same cached output, works globally.

## Main demo flow
1. Log in (or sign up) on the login page.
2. Google 3D loads Pune. Select a layer (e.g. **Air Quality**) to see the colored zones.
3. Type a place into the search bar and hit Enter to fly anywhere on Earth.
4. Click anywhere on the 3D map to select that road and see its alternate route.
5. Use **Diagnose corridor** or **Ask Urban DNA** to call the NVIDIA AI.
6. Run **Scenario Lab** to simulate an FC Road closure.

## Stable run
If port 5180 is already occupied, the server automatically falls back to 5181 and
prints the correct URL.
