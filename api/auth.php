<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
$b = body(); $action = str($b, 'action', 20); $p = db();

function session_reply(int $uid, array $u, array $branch, array $unit): void {
    $code = $u['role'] === 'branch' ? $branch['invite_code'] : ($u['role'] === 'unit' ? ($unit['invite_code'] ?? '') : '');
    out(['ok' => true, 'token' => new_session($uid),
         'user' => ['name' => $u['name'], 'role' => $u['role'], 'share' => (int)$u['share']],
         'org' => ['branch' => $branch['name'] ?? '', 'unit' => $unit['name'] ?? '', 'inviteCode' => $code, 'branchCode' => $u['role'] === 'branch' ? $branch['invite_code'] : '']]);
}

if ($action === 'register') {
    $email = strtolower(str($b, 'email', 120)); $name = str($b, 'name', 80); $pw = (string)($b['password'] ?? ''); $phone = str($b, 'phone', 25);
    rate_limit('reg:' . client_ip(), 10, 3600);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Enter a valid email address');
    if ($name === '') fail('Enter your name');
    if (strlen($pw) < 8 || strlen($pw) > 200) fail('Password must be at least 8 characters');
    $s = $p->prepare('SELECT 1 FROM users WHERE email = ?'); $s->execute([$email]);
    if ($s->fetch()) fail('That email is already registered');
    $mode = str($b, 'mode', 10);   // agent | unit | branch
    $p->beginTransaction();
    try {
        $unitId = null;
        if ($mode === 'agent') {
            $s = $p->prepare('SELECT * FROM units WHERE invite_code = ?'); $s->execute([strtoupper(str($b, 'inviteCode', 12))]); $unit = $s->fetch();
            if (!$unit) { $p->rollBack(); fail('Unit invite code not found'); }
            $role = 'agent'; $unitId = (int)$unit['id']; $branch = branch_of((int)$unit['branch_id']);
        } elseif ($mode === 'unit') {
            $s = $p->prepare('SELECT * FROM branches WHERE invite_code = ?'); $s->execute([strtoupper(str($b, 'branchCode', 12))]); $branch = $s->fetch();
            if (!$branch) { $p->rollBack(); fail('Branch code not found'); }
            $unitName = str($b, 'unitName', 80); if ($unitName === '') { $p->rollBack(); fail('Enter a name for your unit'); }
            do { $c = invite_code(); $s = $p->prepare('SELECT 1 FROM units WHERE invite_code = ?'); $s->execute([$c]); } while ($s->fetch());
            $p->prepare('INSERT INTO units(branch_id, name, invite_code, created_at) VALUES(?,?,?,?)')->execute([$branch['id'], $unitName, $c, time()]);
            $unitId = (int)$p->lastInsertId(); $unit = unit_of($unitId); $role = 'unit';
        } elseif ($mode === 'branch') {
            $bn = str($b, 'branchName', 80); if ($bn === '') { $p->rollBack(); fail('Enter a branch name'); }
            $lic = find_license(str($b, 'licenseKey', 2000));
            if (!$lic || (int)$lic['revoked'] || $lic['plan'] !== 'team' || $lic['exp'] < date('Y-m-d')) { $p->rollBack(); fail('A valid Team license key is required to create a branch'); }
            $s = $p->prepare('SELECT 1 FROM branches WHERE license_id = ?'); $s->execute([$lic['id']]);
            if ($s->fetch()) { $p->rollBack(); fail('This license already runs a branch'); }
            do { $c = invite_code(); $s = $p->prepare('SELECT 1 FROM branches WHERE invite_code = ?'); $s->execute([$c]); } while ($s->fetch());
            $p->prepare('INSERT INTO branches(name, invite_code, license_id, created_at) VALUES(?,?,?,?)')->execute([$bn, $c, $lic['id'], time()]);
            $branch = branch_of((int)$p->lastInsertId()); $unit = []; $role = 'branch';
        } else { $p->rollBack(); fail('Choose how you are joining'); }
        $p->prepare('INSERT INTO users(email, pass_hash, name, phone, role, branch_id, unit_id, created_at) VALUES(?,?,?,?,?,?,?,?)')
          ->execute([$email, password_hash($pw, PASSWORD_DEFAULT), $name, $phone, $role, $branch['id'], $unitId, time()]);
        $uid = (int)$p->lastInsertId();
        $p->commit();
    } catch (Throwable $e) { if ($p->inTransaction()) $p->rollBack(); fail('Could not register right now', 500); }
    $u = ['name' => $name, 'role' => $role, 'share' => 1];
    session_reply($uid, $u, $branch, $unit ?? []);
}

if ($action === 'login') {
    $email = strtolower(str($b, 'email', 120)); $pw = (string)($b['password'] ?? '');
    rate_limit('login:' . client_ip() . ':' . $email, 8, 900);
    $s = $p->prepare('SELECT * FROM users WHERE email = ?'); $s->execute([$email]); $u = $s->fetch();
    if (!$u || !password_verify($pw, $u['pass_hash'])) fail('Wrong email or password', 401);
    session_reply((int)$u['id'], $u, branch_of((int)$u['branch_id']), unit_of($u['unit_id'] !== null ? (int)$u['unit_id'] : null));
}

if ($action === 'logout') {
    $tok = str($b, 'token', 100);
    if ($tok !== '') $p->prepare('DELETE FROM sessions WHERE token_hash = ?')->execute([hash('sha256', $tok)]);
    out(['ok' => true]);
}
fail('Unknown action');
