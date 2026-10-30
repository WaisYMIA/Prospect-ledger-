# Real-device and Excel test script (v2.4.0)

I could test everything in an automated browser, but not on a physical phone or in Microsoft Excel. Please run these checks once per release and note any step that fails.
You need: the live https link, one Android phone, one iPhone (if your agents use them), one PC with Chrome or Edge, and Microsoft Excel.

## 1. Install (each device)
| Device | Steps | Expected |
|---|---|---|
| Android (Chrome) | Open the link. Tap the yellow **Install app** button (or the install bar). Confirm. | An icon appears in the app list; it opens full-screen without browser bars. The Install button disappears inside the installed app. |
| iPhone (Safari) | Open the link in Safari. Tap **Install app** -> follow the steps (Share -> Add to Home Screen). | Icon on the home screen; opens full-screen. |
| PC (Chrome/Edge) | Open the link, click **Install app** in the header or sidebar. | The app opens in its own window and appears in Start menu / Applications. |

## 2. Update prompt
1. Install version N on the phone and open it once.
2. Deploy version N+1 (cPanel: upload zip -> extract with overwrite).
3. Reopen the installed app (or tap **Check for updates** in the footer).
4. Expected: a bar says *Version N+1 is ready — Update now / Later*. Tap **Update now**; the app reloads and the footer shows N+1. Your prospects are all still there.

## 3. Reminders and alarms
1. More -> **Reminders & alarms** -> **Turn on alerts**. Allow when the phone asks. (iPhone: only works from the installed icon.)
2. Tap **Send test alert**. Expected: a pop-up at the top like other apps, with a sound/vibration according to your phone settings.
3. Create an event in **Ratiba** for 5 minutes from now with *At time* ticked. Lock the phone. Expected: an alert appears (Android/Chrome while the app is in the background; exact timing for a fully closed app is up to the browser).
4. Tap the alert. Expected: the app opens on that day or prospect.
5. For must-not-miss alarms: Ratiba -> **.ics** -> open the downloaded file -> add to the phone calendar. Expected: the event and its alarms are in Google/Apple/Outlook Calendar and ring on time even with the app closed.

## 4. Microsoft Excel
1. More -> Reminders & alarms -> **Device check** -> **Test Excel file**. Open `prospect-ledger-excel-test.xlsx` in Excel.
   Expected: one sheet with a small table and **one chart** (columns for API, a line for NOPs). No repair message.
2. Export (sidebar) -> format **Excel** -> run. Open the file.
   Expected: sheet **Report** (month headings in different colours when the range spans months) and sheet **Charts** with up to four charts.
3. If Excel says "We found a problem with some content", choose Repair, then send me a screenshot and the file.

## 5. Calendar content
- Add a follow-up date, a date of birth and a renewal date to three prospects. Expected: all three appear in Ratiba (Agenda view) without any extra step.
- December in Ratiba shows Jamhuri Day, Christmas Day and Utamaduni Day. Idd is **not** shown until you add it (Days off -> See public holidays -> Add).

## 6. Server edition (cPanel)
- `https://YOUR-DOMAIN/api/health.php` shows `"ok": true`.
- Generate a code in `team/admin.html`, redeem it in the app: the plan pill changes to **Pro**.
- Register two test accounts (unit manager and agent), sync, and open the manager dashboard.

Send back: device model + browser, the step number that failed, and a screenshot.
