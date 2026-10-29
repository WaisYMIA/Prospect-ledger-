<?php
// Open https://YOUR-DOMAIN/api/health.php after uploading. It must show "ok": true for every check.
declare(strict_types=1);
header('Content-Type: application/json'); header('Cache-Control: no-store');
$r = ['php' => PHP_VERSION, 'php_ok' => version_compare(PHP_VERSION, '8.0.0', '>='), 'pdo_sqlite' => extension_loaded('pdo_sqlite'), 'openssl_random' => function_exists('random_bytes')];
$r['config_present'] = is_file(__DIR__ . '/config.php');
try { if (!$r['config_present']) throw new RuntimeException('no config'); $c = require __DIR__ . '/config.php'; $d = dirname($c['db_path']); if (!is_dir($d)) @mkdir($d, 0750, true); $r['data_dir_writable'] = is_writable($d); $r['admin_token_changed'] = !str_starts_with((string)$c['admin_token'], 'CHANGE-ME'); } catch (Throwable $e) { $r['config_error'] = true; }
$r['ok'] = $r['php_ok'] && $r['pdo_sqlite'] && $r['config_present'] && ($r['data_dir_writable'] ?? false) && ($r['admin_token_changed'] ?? false);
echo json_encode($r, JSON_PRETTY_PRINT);
