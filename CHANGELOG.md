# Changelog

## 2.4.0
- **Ratiba** calendar (month, week, day, agenda): follow-ups, appointments, birthdays (from date of birth), policy renewals, quote expiry, logged activations/trainings, days off and your own repeating events appear automatically. Fixed Kenyan public holidays are built in; moon-dependent ones (Idd) are added by the agent.
- Reminders & alarms: permission prompt, daily briefing, alerts before meetings, birthdays and renewals, pop-up notifications, app badge, background delivery where the browser allows, and an `.ics` export for alarms in the phone's own calendar.
- Install button shown whenever the app is not installed (with platform-specific instructions); Device check screen with test alert, test Excel and test calendar files.
- Medical and general insurance covers: new products, policy renewal date, automatic yearly renewal for closed medical/general covers.
- Activation codes: admin generates Pro or Team codes from 3 days to 100 years (eternity); customers redeem them in the app. Online purchase by M-Pesa (Daraja STK push) or card (Stripe) creates and redeems a code automatically.
- Excel exports now contain a second sheet with native Excel charts.
- Products added from your ledger export: Term Life, Investment-Linked, Annuity / Pension.

## 2.3.0
- Appearance: Light (default) or Dark, chosen by the agent.
- Prospect list: Group by month or year with per-group summaries (closed / pending / difficult, NOPs, API), collapse all / expand all and "one open at a time".
- Alternating row shades coloured by category (cards and table).
- Contact inbox renamed **Lead Pool**; Qualify opens the full prospect form with an appointment option.
- Working-day model: Mon–Fri default, Kenya public holidays (observed rules), logged days off with reasons, extra-day production for weekends/holidays/days off.
- Analyst report (monthly, yearly, custom) with bar, line and combined charts: month → week → day, gender and age groups, products, working days.
- Birthdays are automatic from date of birth (next birthday shown, 3-day reminder window, calendar).
- Finance (commission and expenses), weekly review, planner & calendar, quotes & proposals tracker.
- Team (server edition): branch → unit → agent hierarchy, reports-only manager views with masked contacts, agent privacy switch, unit/individual analyst reports, shared targets, lead assignment.
- Security: strict CSP (external CSS/JS), PIN app lock, server-side licence registry with revocation and device limits, rate limiting, hardened `.htaccess`.
- Release tooling: `node tools/build-release.js` builds the GitHub and cPanel packages.

## 2.3.0
- Light default with Light/Dark choice; PIN app lock; strict CSP; hardened cPanel `.htaccess`.
- Group prospects by month/year with summaries and collapsible groups; category-shaded alternating rows.
- Lead Pool (renamed from Contact inbox) with full Qualify form and appointments.
- Kenya public holidays, working-day model and extra-day reporting.
- Analyst report with charts (month/week/day, gender, age groups, products).
- Automatic next-birthday display and 3-day reminders; birthdays in the planner.
- Finance, Weekly review, Planner & calendar, Quotes & proposals.
- Team server edition: branch/unit/agent hierarchy, privacy switch, masked contacts, shared targets, lead assignment, unit reports, licence revocation and device limits.
- Release tooling builds GitHub and cPanel packages.

## 2.2.0
- Collapsing identity header that stays visible while scrolling (phone and PC).
- API and NOPs for week-, month- and year-to-date, with previous-period comparison and targets.
- Activations and group trainings with weekly/monthly targets.
- Days off and working-week settings; rest days never count as zero-activity days.
- Contact inbox: imported phone contacts stay out of reports until qualified.
- Performance scorecard (Pro) with pace vs target, insights and Excel download.

## 2.1.0
- PC portal: sidebar navigation, wide dashboard, table/cards views.
- Reminders can be marked Done (outcome, note, next date), snoozed; birthdays can be cleared.
- Kenyan phone-number standard check, auto-fix, bulk fix and duplicate detection.
- Reports grouped by month with a colour per month (.xlsx, PDF); fixed "All records" export freeze.

## 2.0.0
- New logo and redesigned interface, bottom navigation, dashboard, goals, onboarding with sample data.
- Free/Trial/Pro plans with signed offline license keys.

## 1.2.0
- Automatic install prompt, automatic update checks with an update prompt, footer version and update link.

## 1.1.0
- First PWA release: manifest, service worker, icons.
