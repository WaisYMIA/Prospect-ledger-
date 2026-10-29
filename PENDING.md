# Pending items

## Waiting on the owner
1. **Rebrand:** colour direction (warm / bold / minimal, liked and disliked colours) → palette options → recolour the app and rebuild the logo as a transparent version.
2. **Diaspora category:** its fields, stages and place in the pipeline.
3. **Pro / Team pricing:** set `proPrice` in the `SAAS` object (app.js) once decided.
4. **Eid dates for 2027+:** add under Days off → Public holidays when gazetted (2026 is built in).
5. **Branch / unit structure check:** confirm the hierarchy (branch manager → unit managers → agents) matches how your company works.

## Waiting on testing
6. Real-phone test (install, update prompt, voice input, contact picker) and Microsoft Excel test of the `.xlsx` exports.
7. Live test of the PHP server edition on cPanel (`api/health.php`, register, sync, reports). The PHP could not be run in the build environment.

## Later
8. Billing (M-Pesa Daraja / Stripe) so licences are issued automatically.
9. Calendar integrations (Google/Outlook), SMS and WhatsApp Business API.
10. Native Excel charts in exports (the analyst report currently holds the charts).
