<?php
// Online payments: M-Pesa (Safaricom Daraja STK push) and cards (Stripe Checkout).
// A successful payment automatically creates an activation code, which the app redeems for the buyer.
// Setup: fill the 'billing' section in config.php, register the two callback URLs (see INSTALL-CPANEL.txt) and TEST IN SANDBOX FIRST.
declare(strict_types=1);
require __DIR__ . '/lib.php';
$B = $CFG['billing'] ?? [];
$hook = (string)($_GET['hook'] ?? '');

function plan_by_id(string $id): ?array { global $B; foreach (($B['plans'] ?? []) as $p) if (($p['id'] ?? '') === $id) return $p; return null; }
function http_call(string $method, string $url, array $headers, ?string $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return [$code, json_decode((string)$raw, true) ?: []];
}
function mark_paid(string $ref, string $providerRef = ''): void {
    $p = db(); $s = $p->prepare('SELECT * FROM orders WHERE ref = ?'); $s->execute([$ref]); $o = $s->fetch();
    if (!$o || $o['status'] === 'paid') return;
    $plan = plan_by_id($o['plan_id']); if (!$plan) return;
    $code = issue_code((string)($plan['plan'] ?? 'pro'), (int)($plan['days'] ?? 30), (int)($plan['max_devices'] ?? 2), 'Online purchase ' . $ref, 'billing');
    $p->prepare('UPDATE orders SET status = ?, code = ?, paid_at = ?, provider_ref = COALESCE(NULLIF(?, \'\'), provider_ref) WHERE ref = ?')->execute(['paid', $code, time(), $providerRef, $ref]);
}

// ---------- webhooks (called by Stripe / Safaricom, not by the app) ----------
if ($hook === 'stripe') {
    $payload = (string)file_get_contents('php://input'); $sig = (string)($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? ''); $secret = (string)($B['stripe']['webhook_secret'] ?? '');
    $t = ''; $v1 = []; foreach (explode(',', $sig) as $part) { [$k, $v] = array_pad(explode('=', trim($part), 2), 2, ''); if ($k === 't') $t = $v; if ($k === 'v1') $v1[] = $v; }
    $ok = $secret !== '' && $t !== '' && abs(time() - (int)$t) < 300 && count(array_filter($v1, fn($x) => hash_equals(hash_hmac('sha256', $t . '.' . $payload, $secret), $x))) > 0;
    if (!$ok) { http_response_code(400); echo '{"ok":false}'; exit; }
    $ev = json_decode($payload, true) ?: [];
    if (($ev['type'] ?? '') === 'checkout.session.completed' && (($ev['data']['object']['payment_status'] ?? '') === 'paid')) mark_paid((string)($ev['data']['object']['client_reference_id'] ?? ''), (string)($ev['data']['object']['id'] ?? ''));
    echo '{"ok":true}'; exit;
}
if ($hook === 'mpesa') {
    $j = json_decode((string)file_get_contents('php://input'), true) ?: []; $cb = $j['Body']['stkCallback'] ?? null;
    if (is_array($cb) && !empty($cb['CheckoutRequestID'])) {
        $s = db()->prepare('SELECT ref FROM orders WHERE provider_ref = ? AND method = ?'); $s->execute([(string)$cb['CheckoutRequestID'], 'mpesa']); $o = $s->fetch();
        if ($o) { if ((int)($cb['ResultCode'] ?? 1) === 0) mark_paid($o['ref'], (string)$cb['CheckoutRequestID']); else db()->prepare('UPDATE orders SET status = ? WHERE ref = ? AND status = ?')->execute(['failed', $o['ref'], 'pending']); }
    }
    header('Content-Type: application/json'); echo '{"ResultCode":0,"ResultDesc":"Accepted"}'; exit;
}

// ---------- app-facing actions ----------
$b = body(); $action = str($b, 'action', 20); $p = db();

if ($action === 'plans') {
    $out = [];
    foreach (($B['plans'] ?? []) as $pl) {
        $kes = (int)($pl['price_kes'] ?? 0); $usd = (int)($pl['price_usd'] ?? 0);
        if ($kes <= 0 && $usd <= 0) continue;
        $out[] = ['id' => $pl['id'], 'name' => $pl['name'], 'days' => (int)$pl['days'], 'price_kes' => $kes, 'price_usd' => $usd, 'mpesa' => $kes > 0 && !empty($B['mpesa']['consumer_key']), 'card' => $usd > 0 && !empty($B['stripe']['secret_key'])];
    }
    out(['ok' => true, 'plans' => $out]);
}

if ($action === 'start') {
    rate_limit('buy:' . client_ip(), 12, 3600);
    $pl = plan_by_id(str($b, 'planId', 40)); $method = str($b, 'method', 10); if (!$pl) fail('Unknown plan');
    $ref = bin2hex(random_bytes(8));
    if ($method === 'mpesa') {
        $kes = (int)($pl['price_kes'] ?? 0); $M = $B['mpesa'] ?? []; if ($kes <= 0 || empty($M['consumer_key'])) fail('M-Pesa is not available for this plan');
        $phone = preg_replace('/\D+/', '', str($b, 'phone', 20));
        if (preg_match('/^0([17]\d{8})$/', $phone, $m)) $phone = '254' . $m[1]; elseif (preg_match('/^\+?(254[17]\d{8})$/', $phone, $m)) $phone = $m[1];
        if (!preg_match('/^254[17]\d{8}$/', $phone)) fail('Enter a valid Safaricom number, e.g. 0712345678');
        $base = (($M['env'] ?? 'sandbox') === 'production') ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
        [$c1, $tok] = http_call('GET', $base . '/oauth/v1/generate?grant_type=client_credentials', ['Authorization: Basic ' . base64_encode($M['consumer_key'] . ':' . $M['consumer_secret'])]);
        if ($c1 !== 200 || empty($tok['access_token'])) fail('Could not reach M-Pesa right now. Try again.', 502);
        $ts = date('YmdHis'); $pw = base64_encode($M['shortcode'] . $M['passkey'] . $ts);
        $payload = json_encode(['BusinessShortCode' => $M['shortcode'], 'Password' => $pw, 'Timestamp' => $ts, 'TransactionType' => 'CustomerPayBillOnline', 'Amount' => $kes, 'PartyA' => $phone, 'PartyB' => $M['shortcode'], 'PhoneNumber' => $phone, 'CallBackURL' => $M['callback_url'], 'AccountReference' => 'PL' . substr($ref, 0, 8), 'TransactionDesc' => mb_substr($pl['name'], 0, 20)]);
        [$c2, $r] = http_call('POST', $base . '/mpesa/stkpush/v1/processrequest', ['Authorization: Bearer ' . $tok['access_token'], 'Content-Type: application/json'], $payload);
        if ($c2 !== 200 || ($r['ResponseCode'] ?? '1') !== '0') fail('M-Pesa did not accept the request: ' . mb_substr((string)($r['errorMessage'] ?? $r['ResponseDescription'] ?? 'try again'), 0, 120), 502);
        $p->prepare('INSERT INTO orders(ref, plan_id, method, amount, currency, phone, provider_ref, created_at) VALUES(?,?,?,?,?,?,?,?)')->execute([$ref, $pl['id'], 'mpesa', $kes, 'KES', $phone, (string)$r['CheckoutRequestID'], time()]);
        out(['ok' => true, 'ref' => $ref, 'message' => 'Check your phone and enter your M-Pesa PIN.']);
    }
    if ($method === 'card') {
        $usd = (int)($pl['price_usd'] ?? 0); $S = $B['stripe'] ?? []; if ($usd <= 0 || empty($S['secret_key'])) fail('Card payments are not available for this plan');
        $form = http_build_query(['mode' => 'payment', 'success_url' => $S['success_url'] ?? '', 'cancel_url' => $S['cancel_url'] ?? '', 'client_reference_id' => $ref, 'line_items' => [['quantity' => 1, 'price_data' => ['currency' => $S['currency'] ?? 'usd', 'unit_amount' => $usd * 100, 'product_data' => ['name' => $pl['name']]]]]]);
        [$c, $r] = http_call('POST', 'https://api.stripe.com/v1/checkout/sessions', ['Authorization: Bearer ' . $S['secret_key'], 'Content-Type: application/x-www-form-urlencoded'], $form);
        if ($c !== 200 || empty($r['url'])) fail('Could not start the card payment. Try again.', 502);
        $p->prepare('INSERT INTO orders(ref, plan_id, method, amount, currency, provider_ref, created_at) VALUES(?,?,?,?,?,?,?)')->execute([$ref, $pl['id'], 'card', $usd, strtoupper($S['currency'] ?? 'usd'), (string)$r['id'], time()]);
        out(['ok' => true, 'ref' => $ref, 'url' => $r['url']]);
    }
    fail('Choose M-Pesa or card');
}

if ($action === 'status') {
    $s = $p->prepare('SELECT status, code, paid_at FROM orders WHERE ref = ?'); $s->execute([str($b, 'ref', 40)]); $o = $s->fetch();
    if (!$o) fail('Order not found', 404);
    $code = ($o['status'] === 'paid' && (int)$o['paid_at'] > time() - 86400) ? $o['code'] : null;
    out(['ok' => true, 'status' => $o['status'], 'code' => $code]);
}
fail('Unknown action');
