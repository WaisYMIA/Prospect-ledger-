<?php
// Prospect Ledger — server edition configuration.
// SETUP: copy this file to config.php (same folder) and edit config.php. Upgrades never overwrite config.php.
return [
    'db_path'      => __DIR__ . '/data/team.sqlite',   // SQLite file; api/data/ is blocked from the web by .htaccess
    'admin_token'  => 'CHANGE-ME-TO-A-LONG-RANDOM-STRING-OF-40+-CHARACTERS',  // used by team/admin.html
    'session_days' => 30,
    'timezone'     => 'Africa/Nairobi',
    'max_devices_default' => 2,
    // ---- Online billing (optional). A plan with price 0 is hidden. Put your REAL prices here — nothing is invented. ----
    'billing' => [
        'plans' => [
            // 'days' = how long the code lasts after the buyer redeems it; 'plan' = 'pro' or 'team'
            ['id' => 'pro-1m',  'name' => 'Pro — 1 month',  'plan' => 'pro', 'days' => 30,  'price_kes' => 0, 'price_usd' => 0, 'max_devices' => 2],
            ['id' => 'pro-3m',  'name' => 'Pro — 3 months', 'plan' => 'pro', 'days' => 90,  'price_kes' => 0, 'price_usd' => 0, 'max_devices' => 2],
            ['id' => 'pro-12m', 'name' => 'Pro — 1 year',   'plan' => 'pro', 'days' => 365, 'price_kes' => 0, 'price_usd' => 0, 'max_devices' => 2],
        ],
        'mpesa'  => ['env' => 'sandbox', 'consumer_key' => '', 'consumer_secret' => '', 'shortcode' => '', 'passkey' => '', 'callback_url' => 'https://YOUR-DOMAIN/api/billing.php?hook=mpesa'],
        'stripe' => ['secret_key' => '', 'webhook_secret' => '', 'currency' => 'usd', 'success_url' => 'https://YOUR-DOMAIN/?paid=1', 'cancel_url' => 'https://YOUR-DOMAIN/'],
    ],                          // devices per license key
];
