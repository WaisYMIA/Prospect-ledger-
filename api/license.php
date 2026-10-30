<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
$b = body(); $action = str($b, 'action', 20); $p = db();

if ($action === 'verify') {
    rate_limit('lic:' . client_ip(), 120, 3600);
    $key = str($b, 'key', 2000); $dev = str($b, 'deviceId', 80); $label = str($b, 'device', 90);
    if ($key === '' || $dev === '') fail('Bad request');
    if (stripos($key, 'PL-') === 0) { $c = find_code($key); out($c ? code_check($c, $dev, $label, false) : ['ok' => false, 'reason' => 'unknown']); }
    $l = find_license($key);
    if (!$l) out(['ok' => false, 'reason' => 'unknown']);
    if ((int)$l['revoked']) out(['ok' => false, 'reason' => 'revoked']);
    if ($l['exp'] < date('Y-m-d')) out(['ok' => false, 'reason' => 'expired']);
    $s = $p->prepare('SELECT 1 FROM devices WHERE license_id = ? AND device_id = ?'); $s->execute([$l['id'], $dev]);
    if ($s->fetch()) { $p->prepare('UPDATE devices SET last_seen = ?, label = ? WHERE license_id = ? AND device_id = ?')->execute([time(), $label, $l['id'], $dev]); }
    else {
        $c = $p->prepare('SELECT COUNT(*) c FROM devices WHERE license_id = ?'); $c->execute([$l['id']]);
        if ((int)$c->fetch()['c'] >= (int)$l['max_devices']) out(['ok' => false, 'reason' => 'device_limit']);
        $p->prepare('INSERT INTO devices(license_id, device_id, label, first_seen, last_seen) VALUES(?,?,?,?,?)')->execute([$l['id'], $dev, $label, time(), time()]);
    }
    out(['ok' => true, 'plan' => $l['plan'], 'exp' => $l['exp']]);
}

if ($action === 'redeem') {
    rate_limit('redeem:' . client_ip(), 20, 3600);
    $key = str($b, 'key', 40); $dev = str($b, 'deviceId', 80); $label = str($b, 'device', 90);
    if ($key === '' || $dev === '') fail('Bad request');
    $c = find_code($key);
    out($c ? code_check($c, $dev, $label, true) : ['ok' => false, 'reason' => 'unknown']);
}

// ---- seller administration (token from api/config.php) ----
global $CFG;
$tok = (string)($b['adminToken'] ?? '');
$real = (string)($CFG['admin_token'] ?? '');
if ($real === '' || str_starts_with($real, 'CHANGE-ME') || !hash_equals($real, $tok)) { rate_limit('adm:' . client_ip(), 10, 900); fail('Not authorised', 401); }

if ($action === 'add') {
    $key = str($b, 'key', 2000); $parts = explode('.', $key);
    $pl = json_decode((string)base64_decode(strtr($parts[0] ?? '', '-_', '+/')), true);
    if (!is_array($pl) || empty($pl['exp']) || empty($pl['p'])) fail('That does not look like a Prospect Ledger license key');
    $max = max(1, min(50, (int)($b['maxDevices'] ?? $CFG['max_devices_default'] ?? 2)));
    try {
        $p->prepare('INSERT INTO licenses(key_hash, lic_id, holder, plan, exp, max_devices, created_at) VALUES(?,?,?,?,?,?,?)')
          ->execute([lic_hash($key), (string)($pl['id'] ?? ''), (string)($pl['n'] ?? ''), (string)$pl['p'], (string)$pl['exp'], $max, time()]);
    } catch (Throwable $e) { fail('This key is already registered'); }
    out(['ok' => true]);
}
if ($action === 'list') {
    $rows = $p->query('SELECT l.id, l.lic_id, l.holder, l.plan, l.exp, l.max_devices, l.revoked, (SELECT COUNT(*) FROM devices d WHERE d.license_id = l.id) devices FROM licenses l ORDER BY l.id DESC LIMIT 500')->fetchAll();
    out(['ok' => true, 'licenses' => $rows]);
}
if ($action === 'revoke') { $p->prepare('UPDATE licenses SET revoked = ? WHERE id = ?')->execute([(int)!empty($b['revoked']), (int)($b['id'] ?? 0)]); out(['ok' => true]); }
if ($action === 'setDevices') { $p->prepare('UPDATE licenses SET max_devices = ? WHERE id = ?')->execute([max(1, min(50, (int)($b['maxDevices'] ?? 2))), (int)($b['id'] ?? 0)]); out(['ok' => true]); }
if ($action === 'resetDevices') { $p->prepare('DELETE FROM devices WHERE license_id = ?')->execute([(int)($b['id'] ?? 0)]); out(['ok' => true]); }
if ($action === 'generate') {
    $plan = in_array(($b['plan'] ?? 'pro'), ['pro', 'team'], true) ? (string)$b['plan'] : 'pro';
    $days = max(1, min(36500, (int)($b['days'] ?? 30))); $count = max(1, min(100, (int)($b['count'] ?? 1)));
    $max = max(1, min(50, (int)($b['maxDevices'] ?? ($CFG['max_devices_default'] ?? 2)))); $note = str($b, 'note', 120);
    $codes = []; for ($i = 0; $i < $count; $i++) $codes[] = issue_code($plan, $days, $max, $note, 'admin');
    out(['ok' => true, 'codes' => $codes, 'plan' => $plan, 'days' => $days]);
}
if ($action === 'listCodes') {
    $rows = $p->query('SELECT c.id, c.tail, c.plan, c.days, c.status, c.revoked, c.source, c.note, c.max_devices, c.created_at, c.redeemed_at, c.expires, (SELECT COUNT(*) FROM code_devices d WHERE d.code_id = c.id) devices FROM codes c ORDER BY c.id DESC LIMIT 500')->fetchAll();
    out(['ok' => true, 'codes' => $rows]);
}
if ($action === 'revokeCode') { $p->prepare('UPDATE codes SET revoked = ? WHERE id = ?')->execute([(int)!empty($b['revoked']), (int)($b['id'] ?? 0)]); out(['ok' => true]); }
if ($action === 'resetCodeDevices') { $p->prepare('DELETE FROM code_devices WHERE code_id = ?')->execute([(int)($b['id'] ?? 0)]); out(['ok' => true]); }
fail('Unknown action');
