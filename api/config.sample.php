<?php
// Prospect Ledger — server edition configuration.
// SETUP: copy this file to config.php (same folder) and edit config.php. Upgrades never overwrite config.php.
return [
    'db_path'      => __DIR__ . '/data/team.sqlite',   // SQLite file; api/data/ is blocked from the web by .htaccess
    'admin_token'  => 'CHANGE-ME-TO-A-LONG-RANDOM-STRING-OF-40+-CHARACTERS',  // used by team/admin.html
    'session_days' => 30,
    'timezone'     => 'Africa/Nairobi',
    'max_devices_default' => 2,                          // devices per license key
];
