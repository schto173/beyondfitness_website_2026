# Beyond Fitness Festival — website

Public festival website **plus a password-protected admin panel** so the organizers can
change text, schedules, talks, FAQ, links and logos themselves — no developer needed.

- Public site: `/`
- Admin panel: `/admin`

All editable content lives in **`data/content.json`**. The site is rendered from that file,
so anything the organizers change in the admin panel appears on the site immediately —
no rebuild required.

---

## How it works (the short version)

- **Node + Express** server (`server/index.js`) renders the page from `data/content.json`
  using the template in `views/index.ejs`. The look is identical to the original static site.
- **`/admin`** asks for a password, then shows tabbed forms to edit every part of the site,
  including drag-and-drop logo/photo replacement. Saving writes `data/content.json` and
  copies uploaded images into `img/…`.
- Everything is stored as plain files (JSON + images) — easy to back up, inspect, or restore.

## Running it (Docker Compose)

```bash
docker compose up --build -d
```

The site is then on **http://localhost:3000** (put it behind your existing reverse proxy /
domain as usual).

### Before going live — edit `docker-compose.yml`

```yaml
environment:
  ADMIN_PASSWORD: "changeme-please"   # <-- the password organizers type at /admin
  SESSION_SECRET: "change-this-..."   # <-- any long random string, set once and leave it
```

- **`ADMIN_PASSWORD`** — give this to the organizers. Change it anytime by editing this file
  and running `docker compose up -d` again.
- **`SESSION_SECRET`** — signs the login cookie. Set it once to a long random value. Changing
  it later just logs everyone out (harmless). Generate one with e.g.
  `openssl rand -hex 32`.

### Data persistence

`docker-compose.yml` mounts two folders as volumes so edits survive rebuilds:

```yaml
volumes:
  - ./data:/app/data   # content.json
  - ./img:/app/img     # all images / uploaded logos
```

**Back up `data/` and `img/`** and you have backed up the whole site's content.

## For the organizers — using the admin panel

1. Go to **`/admin`** and enter the password.
2. Pick a section from the left (Hero, Classes schedule, Talks, FAQ, Sponsors, …).
3. Edit text in the boxes. Add or remove schedule rows / talks / logos with the
   **+ Add** and **Remove** buttons.
4. To change a logo or photo: use **Upload new** (or pick one already uploaded from the
   dropdown).
5. Click **Save changes** (top right). The website updates right away.

Tip: use **View site ↗** (top right) to open the live site in a new tab and check your changes.

## Project layout

```
server/index.js      Express server: rendering, auth, admin API, uploads
views/index.ejs      The public page template (rendered from content.json)
views/admin.ejs      The admin editor UI
views/login.ejs      The admin login page
data/content.json    ALL editable content (text, schedules, talks, logos, links…)
css/ js/ img/         Static assets (unchanged from the original site)
index.html           The original static page, kept for reference (not served)
Dockerfile
docker-compose.yml
```
