# Prospect Ledger — Security guide (v2.3.0)

This guide answers one question: **how do we keep licensing and client data safe when part of the app runs in the user's browser?** It lists what is already built in, what each edition can and cannot guarantee, and a repeatable security check to run before every release.

## 1. The honest picture

| Area | GitHub Pages edition | cPanel server edition |
|---|---|---|
| Licence check | Offline signature check in the browser. Stops casual sharing; a technical user can edit JavaScript to bypass it. No revocation. | Same offline check **plus** a server check: keys must be registered by you, can be **revoked**, are limited to N devices, and must re-check at least every 30 days. |
| Client data | Stays on the agent's device (IndexedDB). | Same. Only aggregate numbers are sent to the server, and only if the agent leaves sharing on. |
| Team / unit managers | Not available | Reports only; agent email and phone masked; agent can switch sharing off. |
| Security headers | Meta CSP only (GitHub Pages cannot set headers) | Full headers via `.htaccess` (HSTS, CSP, frame-ancestors, nosniff…) |

**Rule of thumb:** use GitHub Pages for trials and demos; sell and support customers on the cPanel edition, where you control revocation.

## 2. What is already built in

**Application**
- No third-party scripts, fonts or trackers. All code is served from your own domain.
- Strict **Content-Security-Policy**: `script-src 'self'` (no inline scripts, no `eval`); only your sync target, Google Apps Script and the Anthropic API are allowed for network calls.
- All user-entered text is HTML-escaped before display; even if one slipped through, CSP blocks inline script execution.
- **App lock (PIN)**: PBKDF2 (150,000 iterations) hashed PIN, auto-lock after 1–15 minutes away, throttling after 5 wrong tries.
- Backups never contain the AI key, team session token or PIN lock; the device id is regenerated on restore.
- Phone numbers are validated to the Kenyan standard; imported contacts stay in the Lead Pool until qualified.

**Licensing**
- Licences are ECDSA P-256 signatures. The private key never ships with the app (seller kit only).
- Server edition: only keys you register in `team/admin.html` are valid; revoke or reset devices at any time.

**Server (PHP)**
- Passwords: `password_hash` (bcrypt/argon). Session tokens: 256-bit random, only their SHA-256 hash stored, 30-day expiry.
- All SQL uses prepared statements. JSON-only responses with `nosniff` and `default-src 'none'`.
- Login, registration and licence checks are rate limited per IP.
- Managers can only see agents inside their own unit or branch. Agents can turn sharing off, which deletes their stored report and metrics.
- Stored report data contains no names, phones, emails or notes of clients: only counts, premiums, age group, gender, product and dates.
- `config.php`, `lib.php` and `api/data/` are blocked from the web by `.htaccess`.

## 3. Hardening you must do (10 minutes)

1. **Host on HTTPS only.** Turn on AutoSSL; the supplied `.htaccess` redirects http to https and sets HSTS.
2. **Set a strong `admin_token`** in `api/config.php` (40+ random characters). Never reuse a password.
3. **Keep the signing key offline.** Store `license-private-key.pem` (seller kit) on an encrypted drive plus one offline backup. Never upload it to GitHub, cPanel or email.
4. **Make the repository private** if you sell the app. A private repo hides the code (and the embedded public key logic) from casual copying. GitHub Pages from a private repo needs a paid GitHub plan; cPanel hosting does not.
5. **Protect cPanel itself:** strong unique password, two-factor authentication, remove unused FTP accounts, keep PHP on a supported version.
6. **Back up** `api/data/team.sqlite` weekly (cPanel backup or cron) and test a restore once.
7. **Issue short licences** (3 or 12 months) rather than lifetime keys for customers, so a leaked key expires by itself. Keep lifetime keys for yourself only.

## 4. Security check before every release (checklist)

Run these in order; tick each one before you ship.

**A. Automated**
- [ ] `node --check app.js reportkit.js sw.js` and the test flows pass (install, update prompt, lock, export).
- [ ] Open the live site: https://securityheaders.com — target **A** (cPanel edition).
- [ ] https://observatory.mozilla.org — target **B+ or better**.
- [ ] https://www.ssllabs.com/ssltest/ — target **A**.
- [ ] Chrome DevTools -> Lighthouse -> PWA and Best Practices: no failures.
- [ ] DevTools -> Console while using every screen: **no "Refused to … Content Security Policy" messages**.

**B. Manual attack tests (5 minutes)**
- [ ] Paste `<img src=x onerror=alert(1)>` into a prospect name, notes and the Lead Pool import file. Nothing may execute; text appears literally.
- [ ] Edit a licence key (change one character in the middle). The app must reject it.
- [ ] Decode the key payload, change `exp`, re-encode. Must be rejected (signature fails).
- [ ] Revoke a test licence in `team/admin.html`; within 12 hours (or on "Check for updates" + reload) the app must drop to Free.
- [ ] Register a test licence with 1 device; activate on a second device. Must show *device limit reached*.
- [ ] As an agent, turn sharing off. The unit manager must see "Hidden by agent" and no numbers; unit reports must exclude that agent.
- [ ] As a unit manager, try to fetch another unit's agent id through the API. Must fail ("Choose an agent from your scope").
- [ ] Visit `/api/data/team.sqlite`, `/api/config.php`, `/api/lib.php`. All must be 403 or 404.
- [ ] Try 10 wrong passwords. The 9th attempt must be rate limited.

**C. Release hygiene**
- [ ] `dist/` is built only with `node tools/build-release.js` (it refuses to include `.pem`, `.key`, `config.php` or the database).
- [ ] Unzip the cPanel zip and confirm there is no `config.php`, no `.sqlite` and no private key inside.
- [ ] CHANGELOG updated; version number bumped everywhere with `tools/bump-version.js`.

## 5. Known limits (so nobody is surprised)
- **Data at rest on the device is not encrypted.** The PIN is a screen lock. Advise agents to keep their phone passcode on and to use encrypted backups storage.
- **Offline licence check can be bypassed** by someone who edits the code on their own device. The server edition's registry, revocation and device limits are the real control; the 30-day re-check grace is the trade-off for offline use in the field.
- **Shared hosting** means other tenants share the machine. Choose a reputable host, keep `api/data` outside web access, and restrict file permissions to 640/750.
- **Eid dates** are gazetted late; add them under Days off -> Public holidays or ship an update.

## 6. If something goes wrong
1. **Leaked licence key:** revoke it in `team/admin.html`; issue a new key to the customer.
2. **Suspected admin token leak:** edit `api/config.php`, set a new token, then check `licenses` for entries you did not create.
3. **Suspected signing-key leak:** generate a new keypair, embed the new public key in `app.js` (`licensePublicKey`), release a new version, re-issue and re-register every active key, then retire the old key.
4. **Server compromise:** take the site offline, restore from a clean zip and your last database backup, rotate the admin token, and force a password reset by telling agents to register again. Tell affected users promptly; if personal data may have been exposed, follow the Kenya Data Protection Act, 2019 notification duties.

## 7. Privacy summary for agents and managers
- Managers see **reports only**; client names, phone numbers, emails and notes are never uploaded.
- Agent emails and phones are **masked** on the manager side (for example `j***@g***.com`, `0724***57`).
- Agents can **switch sharing off** at any time (More -> Team); this also deletes what was stored.
- Leads a manager assigns arrive in the agent's **Lead Pool** and only become prospects when the agent qualifies them.

## 8. Added in v2.4.0
**Activation codes.** Codes look like `PL-XXXX-XXXX-XXXX`, are generated only in `team/admin.html` (admin token required), are stored only as SHA-256 hashes (the plain code is shown once at creation), can be revoked, are limited per device, and the clock starts when the customer redeems. Treat generated codes like cash: send them privately.

**Online billing.** Payment confirmation comes only from the provider's server-to-server callback: Stripe webhooks are verified with the signing secret and a 5-minute timestamp window; M-Pesa callbacks are matched to an order you created. The app never decides a payment succeeded. Always test with the **sandbox** first and keep keys only in `api/config.php`.

**Notifications.** Alert content is built on the device from the agent's own data and stored only in the device's IndexedDB. Nothing about reminders is sent to the server. Lock-screen previews can reveal client names; advise agents to hide notification previews in phone settings if they share a device.

**Extra checks before release:** generate a code, redeem it on two devices (the third must say *device limit*), revoke it and confirm the app drops to Free; replay a Stripe webhook with a wrong signature (must be rejected); open `api/billing.php?hook=mpesa` with junk (must do nothing).
