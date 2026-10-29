<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
$b = body(); $action = str($b, 'action', 20); $p = db();
$TARGET_KEYS = ['weeklyApi','monthlyApi','yearlyApi','weeklyNops','monthlyCloses','yearlyNops','weeklyActivations','monthlyActivations','weeklyTrainings','monthlyTrainings'];
$ZERO = ['api'=>0,'nops'=>0,'activations'=>0,'trainings'=>0,'contacts'=>0,'working_days'=>0,'days_off'=>0,'updated_at'=>0];

function org_payload(array $u): array {
    $branch = branch_of((int)$u['branch_id']); $unit = unit_of($u['unit_id'] !== null ? (int)$u['unit_id'] : null);
    $mgr = '';
    if ($unit) { $s = db()->prepare('SELECT name FROM users WHERE unit_id = ? AND role = ? ORDER BY id LIMIT 1'); $s->execute([$unit['id'], 'unit']); $mgr = ($s->fetch()['name'] ?? ''); }
    return ['branch' => $branch['name'] ?? '', 'unit' => $unit['name'] ?? '', 'managerName' => $mgr,
            'inviteCode' => $u['role'] === 'branch' ? ($branch['invite_code'] ?? '') : ($u['role'] === 'unit' ? ($unit['invite_code'] ?? '') : ''),
            'targets' => $unit ? (json_decode($unit['targets'], true) ?: new stdClass()) : new stdClass()];
}
function agent_in_scope(array $leader, int $agentId): ?array {
    foreach (scope_agents($leader) as $a) if ((int)$a['id'] === $agentId) return $a;
    return null;
}

if ($action === 'me') {
    $u = require_user(); $as = [];
    if ($u['role'] === 'agent') { $s = $p->prepare('SELECT id, name, phone, note FROM assignments WHERE agent_id = ? AND delivered_at IS NULL ORDER BY id LIMIT 200'); $s->execute([$u['id']]); $as = $s->fetchAll(); }
    out(['ok' => true, 'user' => ['name' => $u['name'], 'role' => $u['role'], 'share' => (int)$u['share']], 'org' => org_payload($u), 'assignments' => $as]);
}

if ($action === 'setShare') {
    $u = require_user(); if ($u['role'] !== 'agent') fail('Only agents can change sharing');
    $share = !empty($b['share']) ? 1 : 0;
    $p->prepare('UPDATE users SET share = ? WHERE id = ?')->execute([$share, $u['id']]);
    if (!$share) { $p->prepare('DELETE FROM reports WHERE user_id = ?')->execute([$u['id']]); $p->prepare('DELETE FROM metrics WHERE user_id = ?')->execute([$u['id']]); }
    out(['ok' => true, 'share' => $share]);
}

if ($action === 'push') {
    $u = require_user(); $rows = $b['metrics'] ?? [];
    if ((int)$u['share'] !== 1 && $u['role'] === 'agent') out(['ok' => true, 'hidden' => true]);
    if (!is_array($rows) || count($rows) > 6) fail('Bad metrics');
    $st = $p->prepare('REPLACE INTO metrics(user_id, period, pkey, api, nops, activations, trainings, contacts, working_days, days_off, updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
    foreach ($rows as $r) {
        if (!is_array($r)) continue;
        $period = (string)($r['period'] ?? ''); $key = (string)($r['key'] ?? '');
        if (!in_array($period, ['week','month','year'], true) || !preg_match('/^\d{4}(-\d{2}(-\d{2})?)?$/', $key)) continue;
        $st->execute([$u['id'], $period, $key, nint($r['api'] ?? 0), nint($r['nops'] ?? 0), nint($r['activations'] ?? 0), nint($r['trainings'] ?? 0), nint($r['contacts'] ?? 0), nint($r['workingDays'] ?? 0), nint($r['daysOff'] ?? 0), time()]);
    }
    out(['ok' => true]);
}

if ($action === 'pushReport') {
    $u = require_user();
    if ((int)$u['share'] !== 1) out(['ok' => true, 'hidden' => true]);
    $rep = $b['report'] ?? null;
    if (!is_array($rep) || ($rep['v'] ?? 0) !== 1 || !isset($rep['act'], $rep['pr'], $rep['cal'])) fail('Bad report');
    // keep only the aggregate fields we expect — never store anything else
    $clean = ['v' => 1, 'built' => (string)($rep['built'] ?? ''), 'agent' => ['name' => $u['name'], 'code' => mb_substr((string)($rep['agent']['code'] ?? ''), 0, 20)],
              'from' => (string)($rep['from'] ?? ''), 'to' => (string)($rep['to'] ?? ''), 'cal' => $rep['cal'], 'act' => $rep['act'], 'pr' => $rep['pr']];
    $json = json_encode($clean, JSON_UNESCAPED_UNICODE);
    if (strlen($json) > 400000) fail('Report too large', 413);
    $p->prepare('REPLACE INTO reports(user_id, json, updated_at) VALUES(?,?,?)')->execute([$u['id'], $json, time()]);
    out(['ok' => true]);
}

if ($action === 'ack') {
    $u = require_user(); $ids = array_slice(array_map('intval', (array)($b['ids'] ?? [])), 0, 200);
    $st = $p->prepare('UPDATE assignments SET delivered_at = ? WHERE id = ? AND agent_id = ?');
    foreach ($ids as $id) $st->execute([time(), $id, $u['id']]);
    out(['ok' => true]);
}

if ($action === 'dashboard') {
    $u = require_leader(); $cur = current_keys();
    $get = $p->prepare('SELECT api, nops, activations, trainings, contacts, working_days, days_off, updated_at FROM metrics WHERE user_id = ? AND period = ? AND pkey = ?');
    $hasRep = $p->prepare('SELECT updated_at FROM reports WHERE user_id = ?');
    $unitRows = [];
    if ($u['role'] === 'unit') { $unitRows[] = unit_of((int)$u['unit_id']); }
    else { $s = $p->prepare('SELECT * FROM units WHERE branch_id = ? ORDER BY name'); $s->execute([$u['branch_id']]); $unitRows = $s->fetchAll(); }
    $agents = scope_agents($u); $units = [];
    foreach ($unitRows as $un) {
        $members = [];
        foreach ($agents as $a) {
            if ((int)$a['unit_id'] !== (int)$un['id']) continue;
            $m = ['id' => (int)$a['id'], 'name' => $a['name'], 'email' => mask_email($a['email']), 'phone' => $a['phone'] !== '' ? mask_phone($a['phone']) : '', 'shared' => (int)$a['share'] === 1];
            if ($m['shared']) {
                foreach (['week','month','year'] as $per) { $get->execute([$a['id'], $per, $cur[$per]]); $m[$per] = $get->fetch() ?: $GLOBALS['ZERO']; }
                $m['lastSync'] = max($m['week']['updated_at'], $m['month']['updated_at'], $m['year']['updated_at']);
                $hasRep->execute([$a['id']]); $m['hasReport'] = (bool)$hasRep->fetch();
            }
            $members[] = $m;
        }
        $units[] = ['id' => (int)$un['id'], 'name' => $un['name'], 'inviteCode' => $un['invite_code'], 'targets' => json_decode($un['targets'], true) ?: new stdClass(), 'members' => $members];
    }
    $branch = branch_of((int)$u['branch_id']);
    out(['ok' => true, 'role' => $u['role'], 'branch' => ['name' => $branch['name'] ?? '', 'inviteCode' => $u['role'] === 'branch' ? ($branch['invite_code'] ?? '') : ''], 'units' => $units, 'current' => $cur]);
}

if ($action === 'getReports') {
    $u = require_leader(); $want = array_map('intval', (array)($b['agentIds'] ?? []));
    $out = []; $st = $p->prepare('SELECT json FROM reports WHERE user_id = ?');
    foreach (scope_agents($u) as $a) {
        if ($want && !in_array((int)$a['id'], $want, true)) continue;
        if ((int)$a['share'] !== 1) continue;
        $st->execute([$a['id']]); $r = $st->fetch();
        if ($r) $out[] = ['id' => (int)$a['id'], 'name' => $a['name'], 'report' => json_decode($r['json'], true)];
    }
    out(['ok' => true, 'reports' => $out]);
}

if ($action === 'setTargets') {
    $u = require_leader(); $unitId = $u['role'] === 'unit' ? (int)$u['unit_id'] : (int)($b['unitId'] ?? 0);
    $un = unit_of($unitId); if (!$un || (int)$un['branch_id'] !== (int)$u['branch_id']) fail('Choose one of your units');
    $t = []; foreach ($TARGET_KEYS as $k) $t[$k] = nint(($b['targets'] ?? [])[$k] ?? 0);
    $p->prepare('UPDATE units SET targets = ? WHERE id = ?')->execute([json_encode($t), $unitId]);
    out(['ok' => true]);
}

if ($action === 'assign') {
    $u = require_leader();
    $agent = agent_in_scope($u, (int)($b['agentId'] ?? 0)); $name = str($b, 'name', 80); $phone = str($b, 'phone', 25); $note = str($b, 'note', 200);
    if ($name === '' || !preg_match('/^[0-9+\s()\-]{7,25}$/', $phone)) fail('Enter the lead name and a valid phone number');
    if (!$agent) fail('Choose an agent from your scope');
    $p->prepare('INSERT INTO assignments(unit_id, agent_id, name, phone, note, created_at) VALUES(?,?,?,?,?,?)')->execute([$agent['unit_id'], $agent['id'], $name, $phone, $note, time()]);
    out(['ok' => true]);
}
fail('Unknown action');
