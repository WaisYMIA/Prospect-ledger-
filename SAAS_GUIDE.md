# Selling Prospect Ledger — guide (v2.0.0)

## How licensing works
- New installs get a **14-day trial** of all Pro features, then drop to **Free** (25 prospects; Reports, Export, Broadcast and Phone book locked).
- A customer buys from you, you issue a **license key**, they paste it in **More → Plan & License**. The app checks the key's digital signature offline (ECDSA P-256) and its expiry date.
- The signing key is split: the **public** key is inside `index.html` (`SAAS.licensePublicKey`), the **private** key is in the separate `SELLER-ONLY` kit. Never put the private key on GitHub or your website.

## Issuing a key
```
node make-license.js "Customer name or email" 12        # Pro, 12 months
```
Send the printed key to the customer. Renewal = issue a new key.

## Setting your price and contact
Edit the `SAAS` object in `index.html`: `proPrice` (e.g. `'KES 1,500 / month'`; empty shows "Contact us"), `freeProspectLimit`, `trialDays`, and `seller` contact details. Then bump the version (`node tools/bump-version.js X.Y.Z "note"`).

## Honest limits (read before scaling)
- Licensing is **client-side**: it stops casual sharing, but a technical user could edit the JavaScript. For a few dozen paying customers this is usually acceptable.
- Data is stored **on each device** (IndexedDB), with no accounts, no cross-device sync and no team/manager dashboards.
- To become a true multi-user SaaS you need a backend. Recommended path:
  1. **Accounts & sync:** Supabase or Firebase (auth + Postgres/Firestore), one row-set per user/workspace, offline queue in the PWA.
  2. **Billing:** Stripe and/or M-Pesa Daraja (STK push) with a webhook that issues/renews licenses automatically; the app then checks the server instead of a pasted key.
  3. **Teams:** workspaces, roles (agent / manager), shared leaderboards, lead assignment, manager reports.
  4. **Compliance:** Kenya Data Protection Act registration, privacy policy and terms, data export/delete on request.
  5. **Integrations:** Google/Outlook calendar, SMS (Africa's Talking), WhatsApp Business API.
