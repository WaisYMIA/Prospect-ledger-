# Prospect Ledger

A mobile-first, offline-capable, **installable** prospecting and client-management tool built for a life insurance agent's day-to-day workflow — capturing leads, tracking them through a full sales pipeline, and reporting on performance. It's a Progressive Web App (PWA): open it once from its hosted link, and it behaves like a real app from then on — an icon on your home screen, its own window, and offline access, with no app store involved.

**Current version: 2.1.0**

**Developed by Walter Jungah** · 0798 511 366 · walterjungah9@outlook.com

---

## What's new in 2.1.0

- **PC portal:** left sidebar, wide dashboard grid, Table / Cards switch for prospects (bottom bar remains on phones).
- **Reminders:** *Done* (outcome, note, optional next follow-up), *+1 day* snooze, birthday *Done*; completed items leave the bell count immediately.
- **Number integrity:** Kenyan standard (07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX / +2541XXXXXXXX) is checked everywhere; non-standard numbers show a flag, are auto-fixed when you type them, and can be fixed in bulk from *Number check*, which also finds duplicates.
- **Reports:** exports spanning several months are grouped under month sub-headings with a different colour and shade per month (Excel .xlsx, PDF; CSV stays flat). Fixed a freeze when exporting "All records".

---

## What's new in 2.0.0

- **New brand & design:** the Team-Growth-Magnifier logo is used for the app icon, header and install icons; new blue design system, bottom navigation, animated cards, bottom sheets and confetti when a deal closes.
- **Dashboard:** follow-ups due, open pipeline (annualised premium), monthly closes vs target, daily-contact ring, 7-day activity, streak, pipeline mix, win rate and an "Up next" agenda.
- **Goals & Targets** (More → Goals), **first-run onboarding** with optional sample data, and a richer empty state.
- **Sellable as a product:** Free plan (25 prospects), 14-day Pro trial, Pro features (Reports, Export, Broadcast, Phone book, unlimited prospects) and **cryptographically signed license keys** that work offline. See `SAAS_GUIDE.md`.

---

## 1. What's in this repository

```
prospect-ledger/
├── index.html                          ← the entire app (open this in a browser)
├── manifest.json                       ← PWA metadata (name, icons, colors)
├── version.json                        ← current version number (read by the update checker)
├── tools/bump-version.js               ← one command to bump the version everywhere
├── sw.js                               ← service worker (offline app-shell caching)
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   └── apple-touch-icon.png
├── google-apps-script/
│   └── ProspectLedgerSync.gs           ← optional Google Sheets sync backend
├── LICENSE.md
└── README.md                           ← this file
```

`index.html` still holds the entire application — HTML, CSS, and JavaScript in one file, using the browser's built-in IndexedDB for storage. The manifest, service worker, and icons are what turn it from "a web page" into "an installable app."

---

## 2. Deploying to GitHub Pages

1. **Create a new repository** on GitHub (public or private — Pages works with both, though private repos need GitHub Pro/Team/Enterprise for Pages).
2. **Upload every file above, keeping the folder structure intact** — `index.html`, `manifest.json`, and `sw.js` must sit at the repo **root**, and `icons/` must stay a subfolder named exactly `icons`, since the app references them as `./manifest.json`, `./sw.js`, and `./icons/...`.
   - Easiest way: **Add file → Upload files**, drag in everything (including the `icons` folder), commit.
   - Or via git on a computer:
     ```
     git init
     git add .
     git commit -m "Initial deploy of Prospect Ledger (PWA)"
     git branch -M main
     git remote add origin https://github.com/<your-username>/<your-repo>.git
     git push -u origin main
     ```
3. **Turn on GitHub Pages**: repo **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → **Save**.
4. GitHub gives you a live URL shortly after, typically:
   ```
   https://<your-username>.github.io/<your-repo>/
   ```
5. **This must be served over HTTPS** for installability to work — GitHub Pages does this automatically, so no extra setup is needed there.

### Releasing a new version (v1.2.0 onward)

1. Make your changes.
2. Run `node tools/bump-version.js 1.3.0 "What changed"` — this updates `version.json`, `sw.js`, `index.html` (footer + menu) and this README together. (No Node? Edit those four spots by hand: `VERSION` in sw.js, `APP_VERSION` in index.html, `version` in version.json, and the line above.)
3. Zip the folder as `prospect-ledger-repo-v1.3.0.zip` for your records, and upload the files to your host.
4. Devices detect the change, show **"Version 1.3.0 is ready — Update now / Later"**, and reload after confirmation.

**Install prompt:** on first open, Chrome/Edge (Android & desktop) show an in-app **Install** bar; iPhone Safari shows Add-to-Home-Screen steps. If dismissed, it returns after 3 days. The footer shows the version with a **Check for updates** link.

**Install not offered?** It requires an `https://` address (or `http://localhost`) — opening `index.html` as a file, or over `http://192.168…`, can never install or update.

### Updating the app later (and how devices find out)

**The two-step release checklist** — do both, every time you deploy a change:
1. Upload the new `index.html` (and any other changed files) to GitHub.
2. **Bump `CACHE_NAME` in `sw.js`** (e.g. `prospect-ledger-shell-v2` → `v3`), and bump `APP_VERSION` near the bottom of `index.html` to match (e.g. `1.1.0` → `1.2.0`) so the version number users see in *⋯ More → Check for Updates* is accurate.

Skipping step 2 is the one easy mistake: the browser decides "is there an update?" by comparing `sw.js` byte-for-byte against what it has cached, so if that file hasn't changed, devices will keep serving their old cached copy of `index.html` indefinitely, even though GitHub has the new one.

**What happens on the user's device once you've deployed:**
- Each time the app is opened (and each time it's brought back to the foreground), it asks the browser to check `sw.js` for changes right away — it doesn't wait for the browser's own slow, once-a-day schedule.
- If a newer version is found, it downloads quietly in the background, then a bar appears at the bottom: **"🔄 A new version is ready — Update now / Later."** Nothing swaps out mid-task without permission.
- Tapping **Update now** activates the new version and reloads once. Tapping **Later** dismisses the bar; it will be offered again next time the app is opened.
- Users can also check manually anytime via **⋯ More → 🔄 Check for Updates**, which also shows the version they're currently on.

**What updates never touch:** your prospects, agent profile, and settings live in IndexedDB, completely separate from the cached app files — updating the app doesn't erase, migrate, or reset any client data.

**A note on why it works this way rather than polling GitHub's API directly:** a request to GitHub's API could tell the app "a new commit exists," but it couldn't actually replace the app's cached files — only the service worker's own install/activate process does that, which is why the update flow is built on it instead.

---

## 3. Installing it on a phone or computer

Once the GitHub Pages link is live:

- **In the app itself**: open the **⋯ More** menu → **📲 Install App**. On Android/Chrome/Edge this triggers the native install prompt directly. On iPhone (Safari doesn't support automatic install prompts) it shows you the manual steps instead.
- **iPhone (Safari)**: open the link → tap the **Share** icon → **Add to Home Screen**.
- **Android (Chrome)**: open the link → Chrome will often show its own "Add to Home screen" banner automatically, or use the ⋮ menu → **Install app**.
- **Desktop (Chrome/Edge)**: an install icon (⊕ or a monitor-with-arrow) appears in the address bar — click it.

Once installed, it opens in its own window (no browser address bar), with the navy-and-gold "PL" icon on your home screen or app list, exactly like a normal app.

### What installing actually changes (and what it doesn't)
- **Faster startup and offline resilience**: the service worker caches the app shell, so it opens instantly even with no signal, including the very first time you open it after a while.
- **Your data does not move or duplicate.** Installing is a presentation layer — your prospects and profile still live in that browser's IndexedDB, exactly as before. Installing the same URL twice, in two different browsers, or on two different devices, still means two separate, non-synced data stores. See the data-ownership note in section 4 — nothing about that changed by becoming a PWA.

---

## 4. First-time setup (do this once)

1. Open the app URL (or the installed app).
2. Tap **⚙ Settings** and fill in your **agent profile**: name, gender, email, phone, agent code, and "Date coded" (your start date — used to calculate your tenure, shown in the header).
3. Optionally add a profile photo.
4. Set your **country code** (defaults to 254 for Kenya) — this drives phone number validation and Call/WhatsApp links.
5. Save.

### Important: data is per-browser, not per-GitHub-account
All data (prospects, agent profile) is stored **locally in that browser's IndexedDB**, not on GitHub and not on any server. GitHub Pages only hosts the *code* — it never sees or stores your client data. This means:
- Data does **not** sync automatically between your phone and a computer, or between two different browsers, even after installing as a PWA.
- Clearing your browser's site data/cache — or uninstalling the PWA on some platforms — will erase everything.
- Use **⚙ Settings → Export full backup (.json)** regularly, and/or set up Google Sheet sync (see section 7), as your safety net.

---

## 5. User Guide

### Logging a prospect
Tap the **+** button (bottom right). Choose **Individual** or **Corporate** — the form fields adjust automatically, including Name, Gender, Date of Birth, Phone, Email, Where you met, Sector, County, Product, Premium, Referred By, and Next Follow-up. Fields are lightly color-coded by type (identity/contact/location/financial/referral/reminder) so a long form stays easy to scan.

**Phone number is mandatory and must be unique** across your whole ledger — it acts as the record's primary key. **County and Sector are mandatory**; choosing "Other" for Sector requires typing the specific sector.

Every entry is timestamped automatically.

### The pipeline: Category + Stage
Each record has two independent statuses:
- **Category** (quick temperature): 🟡 Unsorted → New → Promising → Difficult → Closed.
- **Stage** (where they are in the sales process): a full pipeline from Prospecting through After-Sale Service (with extra steps like Tender/Procurement and Committee Decision for Corporate).

### Automatic activity logging
Every Call, WhatsApp, Email, Category change, Stage change, Premium change, or field edit is automatically logged with a timestamp in that record's history — no manual note-taking required to keep a full trail.

### Finding records
Search bar (name/phone/email), **Category filter chips with live counts**, Individual/Corporate tabs, and **🔍 Filters** (date, gender, county, sector, stage) — all combinable — plus a sort dropdown with an ascending/descending toggle.

### Reminders (🔔)
Set a "Next follow-up" date on any record (or quick-set it right from the detail view) and 🔔 shows what's Overdue, Due Today, or coming up in the next 7 days — plus an automatic **🎂 Birthday** reminder the day before any client's birthday, if you've recorded their date of birth. Turn on browser notifications from inside 🔔 (these only fire while the app is open — no website can alert you when it's closed).

### Referral chains
Link a prospect to whoever referred them, and the app tracks the full chain — however many levels deep — showing each person's own downstream referrals and rolling up **NOPS and API generated by their entire referral network** on their own record. The **Referral Leaderboard** (in Reports) ranks your best referral sources.

### Reports (📊)
- **Agent Summary** — close rate for Daily/Weekly/Monthly/Annually/Custom periods, category breakdown, NOPS/API for closed business, your average data-completeness score, a sector breakdown, and a county breakdown — each with a Bar/Pie chart-type toggle.
- **Activity Trends** — Bar/Line/Stacked charts of prospected vs. closed activity, by Day/Week/Month/Year.
- **Referral Leaderboard** — Bar/Line views ranking clients by referred people, NOPS, or API.

### AI Message Assistant (✨, optional)
Add your own Anthropic API key under ⚙ Settings to enable AI-drafted emails and SMS/WhatsApp messages from any record's detail view — pick a purpose (follow-up, birthday, holiday, reminder, or custom), generate a draft, edit it, then send via your normal Email/WhatsApp flow. This needs internet at the moment of generating, costs are billed to your own Anthropic account, and the key never leaves this device (not synced, not in backups).

### Exporting vs. backing up — these are different things
- **⬇ Export** (in ⋯ More) — a **report** (CSV/Excel or PDF) for a chosen date range, with a column picker and an optional 🔒 mask phone numbers/emails checkbox for privacy. This is for reading/sharing/printing — **it cannot be imported back into the app.**
- **⚙ Settings → Export full backup (.json)** — the real backup: every record *and* your agent profile (but never your AI key), in the only format that can be restored later via **Restore from backup**.
- **📤 Send** (inside any record's detail view) — shares that one record via your phone's native Share sheet where supported, or a pre-filled Email/WhatsApp message otherwise.

### Importing contacts (📇 Phone Book, in ⋯ More)
Pick from phone contacts (Chrome/Android only) or import a `.vcf`/`.csv` file exported from your phone's Contacts app (works everywhere). Imported contacts land as 🟡 Unsorted with duplicate phone numbers automatically skipped — move them into your normal pipeline once you've reached out. Export your filtered list back to a `.vcf` for your phone's Contacts app too.

### Broadcast (📣, in ⋯ More)
Message many prospects at once: pick an audience (with its own search box), write one message, then send via Email (true one-tap bulk send, using BCC) or WhatsApp (steps you through your list one chat at a time, pre-filled — the most any website is allowed to automate for WhatsApp specifically).

### Google Sheets sync (optional, live cloud backup/reporting)
See `google-apps-script/ProspectLedgerSync.gs` for the full script and setup instructions in its header comment. In short: create a project at script.google.com, paste in the script, deploy as a Web app (Execute as: Me, Who has access: Anyone), and paste the resulting URL into ⚙ Settings → Google Sheet sync. From then on, every add/edit/follow-up/delete — and your agent profile — sync automatically to an auto-created Google Sheet, with Individual and Corporate leads in separate tabs and your profile in its own tab.

---

## 6. Data protection

This app stores real personal client data. It carries an in-app disclaimer, also shown on generated reports:

> This report contains personal client data protected under the Kenya Data Protection Act, 2019. As the agent handling it, you are personally responsible for storing, sharing, and disposing of this information securely, and using it only for the legitimate insurance purpose for which it was collected.

Practical implications: treat your device's own security (lock screen, etc.) as part of your data protection duty; take regular backups and store them securely; clear a device's browser data for this site before disposing of or handing it over.

---

## 7. Browser & platform support notes

| Feature | Support |
|---|---|
| Core app (add/edit/search/reports) | Any modern mobile or desktop browser |
| Install as PWA / offline app-shell caching | Chrome, Edge, Safari (iOS 16.4+), most modern browsers |
| Automatic install prompt (📲 Install App) | Chrome/Edge on Android & desktop; iOS Safari always needs the manual Share → Add to Home Screen steps |
| Offline data storage (IndexedDB) | All modern browsers |
| Voice input (🎤) | Chrome-based browsers; limited/no support on Safari/iOS |
| Native contact picker (📇) | Chrome on Android only |
| File sharing via 📤 Send | Chrome/Safari on mobile with Web Share API support; falls back to text-only sharing or manual Email/WhatsApp links otherwise |
| PDF export | Uses your browser's built-in print dialog ("Save as PDF") — works everywhere, needs pop-ups allowed |
| AI Message Assistant (✨) | Requires internet and your own Anthropic API key; direct-from-browser calls work in modern Chrome/Safari/Edge |

---

## 8. License / Copyright

© 2026 Walter Jungah. All rights reserved.
Developed by Walter Jungah · 0798 511 366 · walterjungah9@outlook.com
