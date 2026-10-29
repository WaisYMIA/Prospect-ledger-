<?php
declare(strict_types=1);

if (!is_file(__DIR__ . '/config.php')) { http_response_code(500); header('Content-Type: application/json'); echo json_encode(['ok' => false, 'error' => 'Server not configured: copy api/config.sample.php to api/config.php and edit it.']); exit; }
$CFG = require __DIR__ . '/config.php';
date_default_timezone_set($CFG['timezone'] ?? 'Africa/Nairobi');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

function out(array $d, int $code = 200): void { http_response_code($code); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function fail(string $msg, int $code = 400, string $reason = ''): void { out(['ok' => false, 'error' => $msg, 'reason' => $reason], $code); }
function body(): array {
    static $b = null;
    if ($b === null) {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail('POST only', 405);
        $raw = file_get_contents('php://input');
        if (strlen((string)$raw) > 450000) fail('Request too large', 413);
        $b = json_decode($raw ?: '[]', true);
        if (!is_array($b)) $b = [];
    }
    return $b;
}
function str(array $a, string $k, int $max = 200): string { $v = $a[$k] ?? ''; return is_string($v) ? mb_substr(trim($v), 0, $max) : ''; }
function nint($v): int { $n = is_numeric($v) ? (int)round((float)$v) : 0; return max(0, min(10000000000, $n)); }

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    global $CFG;
    $dir = dirname($CFG['db_path']);
    if (!is_dir($dir)) mkdir($dir, 0750, true);
    $pdo = new PDO('sqlite:' . $CFG['db_path']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');
    foreach ([
        'CREATE TABLE IF NOT EXISTS branches(id INTEGER PRIMARY KEY, name TEXT NOT NULL, invite_code TEXT UNIQUE NOT NULL, license_id INTEGER, created_at INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS units(id INTEGER PRIMARY KEY, branch_id INTEGER NOT NULL, name TEXT NOT NULL, invite_code TEXT UNIQUE NOT NULL, targets TEXT NOT NULL DEFAULT \'{}\', created_at INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, pass_hash TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT \'\', role TEXT NOT NULL, branch_id INTEGER NOT NULL, unit_id INTEGER, share INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS metrics(user_id INTEGER NOT NULL, period TEXT NOT NULL, pkey TEXT NOT NULL, api INTEGER NOT NULL DEFAULT 0, nops INTEGER NOT NULL DEFAULT 0, activations INTEGER NOT NULL DEFAULT 0, trainings INTEGER NOT NULL DEFAULT 0, contacts INTEGER NOT NULL DEFAULT 0, working_days INTEGER NOT NULL DEFAULT 0, days_off INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id, period, pkey))',
        'CREATE TABLE IF NOT EXISTS reports(user_id INTEGER PRIMARY KEY, json TEXT NOT NULL, updated_at INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS assignments(id INTEGER PRIMARY KEY, unit_id INTEGER NOT NULL, agent_id INTEGER NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, note TEXT NOT NULL DEFAULT \'\', created_at INTEGER NOT NULL, delivered_at INTEGER)',
        'CREATE TABLE IF NOT EXISTS attempts(k TEXT NOT NULL, ts INTEGER NOT NULL)',
        'CREATE INDEX IF NOT EXISTS attempts_k ON attempts(k, ts)',
        'CREATE TABLE IF NOT EXISTS licenses(id INTEGER PRIMARY KEY, key_hash TEXT UNIQUE NOT NULL, lic_id TEXT, holder TEXT, plan TEXT NOT NULL, exp TEXT NOT NULL, max_devices INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS devices(license_id INTEGER NOT NULL, device_id TEXT NOT NULL, label TEXT, first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL, PRIMARY KEY(license_id, device_id))',
    ] as $sql) $pdo->exec($sql);
    return $pdo;
}

function client_ip(): string { return substr((string)($_SERVER['REMOTE_ADDR'] ?? 'x'), 0, 64); }
function rate_limit(string $key, int $max, int $windowSec): void {
    $p = db(); $now = time();
    $p->prepare('DELETE FROM attempts WHERE ts < ?')->execute([$now - 86400]);
    $s = $p->prepare('SELECT COUNT(*) c FROM attempts WHERE k = ? AND ts > ?'); $s->execute([$key, $now - $windowSec]);
    if ((int)$s->fetch()['c'] >= $max) fail('Too many attempts. Please wait and try again.', 429, 'rate');
    $p->prepare('INSERT INTO attempts(k, ts) VALUES(?, ?)')->execute([$key, $now]);
}

function new_session(int $userId): string {
    global $CFG;
    $token = bin2hex(random_bytes(32));
    db()->prepare('INSERT INTO sessions(token_hash, user_id, expires) VALUES(?,?,?)')
        ->execute([hash('sha256', $token), $userId, time() + 86400 * (int)($CFG['session_days'] ?? 30)]);
    return $token;
}
function require_user(): array {
    $tok = str(body(), 'token', 100);
    if ($tok === '') fail('Please log in again', 401, 'session');
    $s = db()->prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires > ?');
    $s->execute([hash('sha256', $tok), time()]);
    $u = $s->fetch();
    if (!$u) fail('Please log in again', 401, 'session');
    return $u;
}
function branch_of(int $id): array { $s = db()->prepare('SELECT * FROM branches WHERE id = ?'); $s->execute([$id]); return $s->fetch() ?: []; }
function unit_of(?int $id): array { if (!$id) return []; $s = db()->prepare('SELECT * FROM units WHERE id = ?'); $s->execute([$id]); return $s->fetch() ?: []; }
function mask_email(string $e): string {
    if (!str_contains($e, '@')) return '***';
    [$l, $d] = explode('@', $e, 2); $dot = strrpos($d, '.');
    $tld = $dot === false ? '' : substr($d, $dot);
    return mb_substr($l, 0, 1) . '***@' . mb_substr($d, 0, 1) . '***' . $tld;
}
function mask_phone(string $p): string {
    $digits = preg_replace('/\D+/', '', $p); $n = strlen($digits);
    if ($n < 7) return '***';
    return substr($digits, 0, 4) . str_repeat('*', max(3, $n - 6)) . substr($digits, -2);
}
/** Agents a manager may see (reports only). Unit managers: their unit. Branch managers: their whole branch. */
function scope_agents(array $u): array {
    if ($u['role'] === 'unit') $s = db()->prepare('SELECT * FROM users WHERE role = \'agent\' AND unit_id = ? ORDER BY name');
    else $s = db()->prepare('SELECT * FROM users WHERE role = \'agent\' AND branch_id = ? ORDER BY name');
    $s->execute([$u['role'] === 'unit' ? $u['unit_id'] : $u['branch_id']]);
    return $s->fetchAll();
}
function require_leader(): array { $u = require_user(); if (!in_array($u['role'], ['unit', 'branch'], true)) fail('Managers only', 403); return $u; }
function lic_hash(string $key): string { return hash('sha256', trim($key)); }
function find_license(string $key): ?array {
    $s = db()->prepare('SELECT * FROM licenses WHERE key_hash = ?'); $s->execute([lic_hash($key)]);
    $r = $s->fetch(); return $r ?: null;
}
function invite_code(): string {
    $alpha = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; $c = '';
    for ($i = 0; $i < 6; $i++) $c .= $alpha[random_int(0, strlen($alpha) - 1)];
    return $c;
}
function current_keys(): array {
    return ['week' => date('Y-m-d', strtotime('monday this week')), 'month' => date('Y-m'), 'year' => date('Y')];
}
