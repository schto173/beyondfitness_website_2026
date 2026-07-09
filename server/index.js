const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const app = express();

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'content.json');
const IMG_DIR = path.join(ROOT, 'img');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme-please';
const SESSION_SECRET = process.env.SESSION_SECRET || 'insecure-default-secret-change-me';
const COOKIE_NAME = 'bf_admin';
const SESSION_MAX_AGE = 1000 * 60 * 60 * 12; // 12 hours

if (ADMIN_PASSWORD === 'changeme-please') {
  console.warn('[WARN] ADMIN_PASSWORD is still the default. Set it in docker-compose.yml before going live.');
}

// ---------- View engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(ROOT, 'views'));

// ---------- Body parsing ----------
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: false }));

// ---------- Static assets ----------
// NOTE: we deliberately do NOT serve the repo root, so the old index.html is never served.
app.use('/css', express.static(path.join(ROOT, 'css')));
app.use('/js', express.static(path.join(ROOT, 'js')));
app.use('/img', express.static(IMG_DIR));

// ---------- Content store ----------
function readContent() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeContent(obj) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE); // atomic replace
}

// ---------- Auth (signed cookie, no external deps) ----------
function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

function makeToken() {
  const expires = Date.now() + SESSION_MAX_AGE;
  const payload = String(expires);
  return payload + '.' + sign(payload);
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const idx = token.lastIndexOf('.');
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(payload);
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  return true;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const i = pair.indexOf('=');
    if (i === -1) return;
    const k = pair.slice(0, i).trim();
    const v = pair.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function isAuthed(req) {
  const cookies = parseCookies(req);
  return verifyToken(cookies[COOKIE_NAME]);
}

function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.redirect('/admin/login');
}

// ---------- Public site ----------
app.get('/', (req, res) => {
  try {
    res.render('index', { c: readContent() });
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load site content.');
  }
});

// ---------- Admin: login / logout ----------
app.get('/admin/login', (req, res) => {
  if (isAuthed(req)) return res.redirect('/admin');
  res.render('login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const password = (req.body && req.body.password) || '';
  const ok =
    password.length === ADMIN_PASSWORD.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD));
  if (!ok) {
    return res.status(401).render('login', { error: 'Wrong password. Please try again.' });
  }
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${makeToken()}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE / 1000}`
  );
  res.redirect('/admin');
});

app.post('/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  res.redirect('/admin/login');
});

// ---------- Admin: page ----------
app.get('/admin', requireAuth, (req, res) => {
  res.render('admin');
});

// ---------- Admin API ----------
app.get('/api/admin/content', requireAuth, (req, res) => {
  try {
    res.json(readContent());
  } catch (err) {
    res.status(500).json({ error: 'Could not read content.' });
  }
});

app.post('/api/admin/content', requireAuth, (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Invalid content payload.' });
    }
    writeContent(body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save content.' });
  }
});

// Allowed image sub-folders for uploads / listing
const IMAGE_FOLDERS = ['partners', 'market', 'sponsors', 'instructors', 'hero', ''];

function safeFolder(folder) {
  folder = (folder || '').replace(/[^a-z0-9_-]/gi, '');
  if (!IMAGE_FOLDERS.includes(folder)) return null;
  return folder;
}

app.get('/api/admin/images', requireAuth, (req, res) => {
  const folder = safeFolder(req.query.folder);
  if (folder === null) return res.status(400).json({ error: 'Unknown folder.' });
  const dir = folder ? path.join(IMG_DIR, folder) : IMG_DIR;
  try {
    const files = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(d.name))
      .map((d) => (folder ? `img/${folder}/${d.name}` : `img/${d.name}`));
    res.json({ images: files });
  } catch (err) {
    res.json({ images: [] });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = safeFolder(req.query.folder);
    if (folder === null) return cb(new Error('Unknown folder'));
    const dir = folder ? path.join(IMG_DIR, folder) : IMG_DIR;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Keep a clean, predictable filename. Same name overwrites (handy for replacing a logo).
    const clean = file.originalname.replace(/[^a-z0-9._-]/gi, '_');
    cb(null, clean);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (/\.(png|jpe?g|webp|svg|gif|avif)$/i.test(file.originalname)) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

app.post('/api/admin/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const folder = safeFolder(req.query.folder);
    const rel = folder ? `img/${folder}/${req.file.filename}` : `img/${req.file.filename}`;
    res.json({ ok: true, path: rel });
  });
});

app.listen(PORT, () => {
  console.log(`Beyond Fitness site running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
