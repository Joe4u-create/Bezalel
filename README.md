# Lumière Interiors — website

A static, single-page interior-design site with a built-in admin panel, staff clock-in/out (with location) and a consultation form.
It runs on **GitHub Pages** (free). Optional Google Sheet + WhatsApp integrations store attendance and enquiries.

## Files
| File | Purpose |
|---|---|
| `index.html` | The whole website |
| `config.json` | Published customisation (exported from the admin panel). Starts nearly empty |
| `Code.gs` | Google Apps Script backend — **not** uploaded to GitHub, paste it into Google Apps Script |
| `404.html`, `robots.txt`, `.nojekyll` | Pages housekeeping |

## 1. Deploy on GitHub Pages
1. Create a GitHub account → **New repository** (e.g. `lumiere-interiors`). **Public** (Pages on private repos needs a paid plan).
2. **Add file → Upload files**: upload `index.html`, `config.json`, `404.html`, `robots.txt`, `.nojekyll` (not `Code.gs`). Commit.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)` → Save.**
4. After ~1 minute the site is live at `https://YOUR-USERNAME.github.io/lumiere-interiors/`.
5. Custom domain (optional): Settings → Pages → Custom domain, then add the DNS records GitHub shows.

Test locally first, if you like: `python3 -m http.server 8000` in the folder, then open http://localhost:8000.

## 2. Customise (admin panel)
1. On the site click **Admin**. First password is `admin123` — you are sent straight to **Security** to change it. Do this first.
2. Change colours, text, logo, banner, services, portfolio, staff, etc. Edits are saved **in your browser only**.
3. To publish for everyone: **Admin → Backup → Export config.json**, then in GitHub **Add file → Upload files**, upload it (same name replaces the old one) and commit. Live in ~1 minute.
4. Photos: uploads are embedded inside `config.json` (GitHub's web upload limit is 25 MB — the Backup tab shows the size). For many photos, put them in an `images/` folder in the repo and paste URLs like `images/living-room.jpg` instead.

## 3. Google Sheet backend (attendance + enquiries)
1. Create a Google Sheet → **Extensions → Apps Script**. Paste all of `Code.gs`.
2. Change `TOKEN` and `READ_KEY` to long random strings. Optional: fill `WA_PHONE` / `WA_APIKEY` (WhatsApp alerts via CallMeBot).
3. Select function `setup` → **Run** → grant permissions (creates the tabs).
4. **Deploy → New deployment → Web app** → Execute as **Me**, Who has access **Anyone** → Deploy → copy the `/exec` URL.
5. Site → Admin → **Integrations**: paste the URL and the same `TOKEN`, press **Send test row**, check the *Tests* tab. Then export `config.json` and upload it.
6. Changing `Code.gs` later requires **Deploy → Manage deployments → Edit → New version**.
7. In **Admin → Logs**, "Load from Google Sheet" asks for `READ_KEY` (kept only for that browser session, never stored on the site).

## 4. Google sign-in (optional)
1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID → Web application**.
2. **Authorized JavaScript origins**: `https://YOUR-USERNAME.github.io` (no path, no trailing slash; add your custom domain too if used).
3. Paste the Client ID in **Admin → Integrations**. Set your admin Google email there, and each employee's Google email under **Staff**.

## 5. Staff & location
Add employees in **Admin → Staff** (name + password, optional Google email). Under *Location rules* press "Use my current location as office" while at the office. Location needs HTTPS (GitHub Pages provides it) and the employee must allow it.

## Security — please read
This is a static site: there is no server to check passwords. Therefore:
- Admin and staff passwords are salted + hashed, but the hashes, staff names and staff emails are **public inside `config.json`**. Use strong passwords and don't put anything sensitive in the site.
- The admin panel only changes things in the visitor's own browser; **nobody can change your live site without write access to your GitHub repo**. Protect your GitHub account with 2-factor authentication.
- Attendance can be faked by a determined employee (browser clock/location). Treat it as a convenience log, not proof.
- The Sheet `TOKEN` is public and only filters spam; `READ_KEY` is what protects your data. Keep the Sheet private.
- The clock-in state ("clocked in") is remembered per device; the Sheet holds the full history.
