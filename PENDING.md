# Pending items

## Waiting on the owner
1. **Your other ledger (medical prospects and extra features):** upload it (zip or HTML) so it can be compared with this app and the missing features merged. The files uploaded so far were this app's own v2.3.0 packages.
2. **Rebrand:** colour direction (warm / bold / minimal; liked and disliked colours), then logo rebuilt as a transparent version.
3. **Diaspora category:** its fields, stages and place in the pipeline.
4. **Prices:** real KES / USD prices for the plans in `api/config.php` (online purchase stays hidden until you set them).
5. **Payment accounts:** Safaricom Daraja credentials (consumer key/secret, shortcode, passkey) and a Stripe account, then one sandbox purchase to confirm.
6. **Idd dates** for each year, added under Days off -> Public holidays when gazetted.
7. **Hierarchy check:** branch manager -> unit managers -> agents.

## Waiting on testing (cannot be done in the build environment)
8. Real-phone checks (install, update prompt, alerts) and Microsoft Excel checks: follow `TESTING.md`.
9. Live test of the PHP server edition on cPanel, including a billing test in sandbox.

## Later
10. SMS gateway (e.g. Africa's Talking) and WhatsApp Business API sending: needs your provider accounts. Today the app opens the phone's own SMS and WhatsApp with the message ready.
11. Web Push from the server so alerts reach phones even when nothing is running (the strongest option for iPhone).
12. Live two-way sync with Google or Outlook calendars (today: `.ics` export with alarms).
