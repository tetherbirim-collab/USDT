<?php
/**
 * Kripicard Premium BIN caller.
 * Base: https://home.kripicard.com/api/premium
 * POST /Create_card  api_key, amount, bankBin
 * POST /Fund_Card    api_key, card_id, amount
 * GET  /Get_CardDetails  api_key, card_id
 * POST /Freeze_Unfreeze  api_key, card_id, action (freeze|unfreeze)
 * Amounts are USD. Minimum 10. The key is read here and never logged.
 */

const KRIPICARD_KEY_MISSING = "Kart sağlayıcı anahtarı yok. Yönetim ücretler ekranından Kripicard anahtarı yapıştırılmalı. Kart numarası üretilmedi.";

function kripicard_config_path(): string
{
    return dirname(__DIR__) . "/kripicard.config.php";
}

function kripicard_key(): string
{
    $path = kripicard_config_path();
    if (!is_file($path)) {
        return "";
    }
    $tmp = tempnam(sys_get_temp_dir(), "kcrip");
    if ($tmp === false) {
        return "";
    }
    $php = $tmp . ".php";
    @unlink($tmp);
    if (!@copy($path, $php)) {
        return "";
    }
    $config = include $php;
    @unlink($php);
    if (!is_array($config)) {
        return "";
    }
    return trim((string) ($config["api_key"] ?? ""));
}

function kripicard_ready(): bool
{
    return kripicard_key() !== "";
}

function kripicard_key_shape(string $key): bool
{
    if ($key === "") {
        return true;
    }
    $length = strlen($key);
    if ($length < 8 || $length > 256) {
        return false;
    }
    if (preg_match("/[\\x00-\\x20]/", $key)) {
        return false;
    }
    if (str_contains($key, "<?") || str_contains($key, "?>")) {
        return false;
    }
    return true;
}

function kripicard_write_key(string $key): bool
{
    if (!kripicard_key_shape($key)) {
        return false;
    }
    $path = kripicard_config_path();
    $body = "<?php\nreturn [\n    \"api_key\" => " . var_export($key, true) . ",\n];\n";
    $tmp = $path . ".tmp";
    if (file_put_contents($tmp, $body, LOCK_EX) === false) {
        return false;
    }
    return rename($tmp, $path);
}

function kripicard_redact(string $text): string
{
    $key = kripicard_key();
    if ($key !== "") {
        $text = str_replace($key, "", $text);
    }
    $text = trim((string) preg_replace("/\\s+/u", " ", $text));
    if ($text === "") {
        return "";
    }
    return function_exists("mb_substr") ? mb_substr($text, 0, 240) : substr($text, 0, 240);
}

function kripicard_fail(string $message): array
{
    $clean = kripicard_redact($message);
    if ($clean === "") {
        $clean = "Kart sağlayıcı isteği kabul etmedi.";
    }
    return ["ok" => false, "message" => $clean, "body" => null];
}

function kripicard_request(string $method, string $endpoint, array $fields): array
{
    $key = kripicard_key();
    if ($key === "") {
        return kripicard_fail(KRIPICARD_KEY_MISSING);
    }
    $method = strtoupper($method);
    $url = "https://home.kripicard.com/api/premium/" . ltrim($endpoint, "/");
    $payload = null;
    $headers = ["Accept: application/json"];
    if ($method === "GET") {
        $fields["api_key"] = $key;
        $url .= "?" . http_build_query($fields);
    } else {
        $fields["api_key"] = $key;
        $payload = json_encode($fields, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($payload)) {
            return kripicard_fail("Kart sağlayıcı isteği hazırlanamadı.");
        }
        $headers[] = "Content-Type: application/json";
    }
    $raw = false;
    $code = 0;
    if (function_exists("curl_init")) {
        $ch = curl_init($url);
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 25,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CUSTOMREQUEST => $method,
        ];
        if ($payload !== null) {
            $opts[CURLOPT_POSTFIELDS] = $payload;
        }
        curl_setopt_array($ch, $opts);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    } else {
        $header = implode("\r\n", $headers);
        $context = stream_context_create([
            "http" => [
                "method" => $method,
                "header" => $header,
                "content" => $payload ?? "",
                "timeout" => 25,
                "ignore_errors" => true,
            ],
        ]);
        $raw = file_get_contents($url, false, $context);
        foreach ($http_response_header ?? [] as $line) {
            if (preg_match("/^HTTP\\/\\S+\\s+(\\d+)/", $line, $match)) {
                $code = (int) $match[1];
            }
        }
    }
    if (!is_string($raw) || $raw === "") {
        return kripicard_fail("Kart sağlayıcıya ulaşılamadı.");
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return kripicard_fail("Kart sağlayıcı yanıtı okunamadı.");
    }
    if (!kripicard_success($decoded)) {
        $message = "";
        if (isset($decoded["message"]) && is_scalar($decoded["message"])) {
            $message = (string) $decoded["message"];
        }
        if ($message === "") {
            $message = "Kart sağlayıcı isteği kabul etmedi.";
        }
        return kripicard_fail($message);
    }
    return ["ok" => true, "message" => kripicard_redact((string) ($decoded["message"] ?? "")), "body" => $decoded, "http" => $code];
}

function kripicard_success(array $body): bool
{
    if (!array_key_exists("success", $body)) {
        return false;
    }
    return $body["success"] === true || $body["success"] === 1;
}

function kripicard_card_id(array $body): string
{
    $value = $body["card_id"] ?? ($body["data"]["card_id"] ?? "");
    if (!is_scalar($value)) {
        return "";
    }
    $id = trim((string) $value);
    if ($id === "" || strlen($id) > 120 || preg_match("/[\\x00-\\x1f]/", $id)) {
        return "";
    }
    return $id;
}

function kripicard_pick($node, array $keys, int $depth = 0)
{
    if ($depth > 3 || !is_array($node)) {
        return null;
    }
    foreach ($keys as $key) {
        if (array_key_exists($key, $node) && !is_array($node[$key]) && $node[$key] !== null && $node[$key] !== "") {
            return $node[$key];
        }
    }
    foreach ($node as $value) {
        if (is_array($value)) {
            $found = kripicard_pick($value, $keys, $depth + 1);
            if ($found !== null && $found !== "") {
                return $found;
            }
        }
    }
    return null;
}

function kripicard_pan($raw): string
{
    $digits = preg_replace("/\\D/", "", (string) $raw);
    if (!is_string($digits) || !preg_match("/^\\d{16}$/", $digits)) {
        return "";
    }
    if (!function_exists("clay_luhn_ok") || !clay_luhn_ok($digits)) {
        return "";
    }
    return $digits;
}

function kripicard_cvv($raw): string
{
    $digits = preg_replace("/\\D/", "", (string) $raw);
    if (!is_string($digits) || !preg_match("/^\\d{3,4}$/", $digits)) {
        return "";
    }
    return $digits;
}

function kripicard_expiry($raw): string
{
    $raw = trim((string) $raw);
    if (preg_match("/^(0[1-9]|1[0-2])\\/(\\d{2})$/", $raw)) {
        return $raw;
    }
    if (preg_match("/^(0[1-9]|1[0-2])\\/(\\d{4})$/", $raw, $match)) {
        return $match[1] . "/" . substr($match[2], -2);
    }
    if (preg_match("/^(20\\d{2})-(0[1-9]|1[0-2])$/", $raw, $match)) {
        return $match[2] . "/" . substr($match[1], -2);
    }
    if (preg_match("/^(0[1-9]|1[0-2])[- ]?(20\\d{2}|\\d{2})$/", $raw, $match)) {
        return substr($raw, 0, 2) . "/" . substr($match[2], -2);
    }
    return "";
}

function kripicard_details(array $body): array
{
    $data = $body["data"] ?? [];
    if (!is_array($data)) {
        $data = [];
    }
    $details = $data["details"] ?? $data["Details"] ?? [];
    if (!is_array($details)) {
        $details = [];
    }
    $pan = kripicard_pan(kripicard_pick($details, ["card_number", "cardNumber", "card_no", "cardNo", "pan", "cc_number", "ccNumber"]));
    $cvv = kripicard_cvv(kripicard_pick($details, ["cvv", "cvc", "card_cvv", "cardCvv", "CVV", "security_code", "securityCode"]));
    $expiry = kripicard_expiry(kripicard_pick($details, ["expiry", "expiration", "exp", "card_expires", "cardExpires", "expiry_date", "expiryDate", "valid_thru", "validThru", "expiration_date"]));
    if ($expiry === "") {
        $month = kripicard_pick($details, ["exp_month", "expMonth", "expiry_month", "expiryMonth"]);
        $year = kripicard_pick($details, ["exp_year", "expYear", "expiry_year", "expiryYear"]);
        if ($month !== null && $year !== null) {
            $expiry = kripicard_expiry(str_pad((string) $month, 2, "0", STR_PAD_LEFT) . "/" . $year);
        }
    }
    $balance = kripicard_pick($details, ["balance", "available_balance", "availableBalance", "card_balance", "cardBalance", "current_balance"]);
    $limit = 0;
    if (is_numeric($balance) && (float) $balance > 0 && function_exists("clay_kurus")) {
        $cents = (int) round(((float) $balance) * 100);
        if ($cents > 0) {
            $limit = clay_kurus($cents);
        }
    }
    return ["pan" => $pan, "cvv" => $cvv, "expiry" => $expiry, "limit" => $limit];
}

function kripicard_person(string $name): array
{
    $name = trim((string) preg_replace("/\\s+/u", " ", $name));
    if ($name === "") {
        return [];
    }
    $parts = explode(" ", $name, 2);
    $out = ["first_name" => function_exists("mb_substr") ? mb_substr($parts[0], 0, 50) : substr($parts[0], 0, 50)];
    if (isset($parts[1]) && trim($parts[1]) !== "") {
        $last = trim($parts[1]);
        $out["last_name"] = function_exists("mb_substr") ? mb_substr($last, 0, 50) : substr($last, 0, 50);
    }
    return $out;
}

function kripicard_create(float $amount, string $bankBin, string $holderName): array
{
    if ($amount < 10) {
        return kripicard_fail("Kripicard tutarı en az 10 USD olmalı.");
    }
    if (!preg_match("/^\\d{4,8}$/", $bankBin)) {
        return kripicard_fail("BIN seç.");
    }
    $fields = [
        "amount" => $amount,
        "bankBin" => (int) $bankBin,
    ];
    foreach (kripicard_person($holderName) as $key => $value) {
        $fields[$key] = $value;
    }
    $created = kripicard_request("POST", "Create_card", $fields);
    if (!$created["ok"]) {
        return $created;
    }
    $cardId = kripicard_card_id($created["body"]);
    if ($cardId === "") {
        return kripicard_fail("Kart sağlayıcı kart kimliği döndürmedi.");
    }
    $face = ["pan" => "", "cvv" => "", "expiry" => "", "limit" => 0];
    $detailNote = "";
    $details = kripicard_request("GET", "Get_CardDetails", ["card_id" => $cardId]);
    if ($details["ok"]) {
        $face = kripicard_details($details["body"]);
    } else {
        $detailNote = $details["message"];
    }
    return [
        "ok" => true,
        "message" => $created["message"],
        "card_id" => $cardId,
        "pan" => $face["pan"],
        "cvv" => $face["cvv"],
        "expiry" => $face["expiry"],
        "limit" => $face["limit"],
        "detailNote" => $detailNote,
        "body" => $created["body"],
    ];
}

function kripicard_fund(string $cardId, float $amount): array
{
    if ($cardId === "" || $amount < 10) {
        return kripicard_fail("Kripicard tutarı en az 10 USD olmalı.");
    }
    $funded = kripicard_request("POST", "Fund_Card", [
        "card_id" => $cardId,
        "amount" => $amount,
    ]);
    if (!$funded["ok"]) {
        return $funded;
    }
    $echo = null;
    $data = $funded["body"]["data"] ?? null;
    if (is_array($data) && isset($data["amount"]) && is_numeric($data["amount"])) {
        $echo = (float) $data["amount"];
    }
    return ["ok" => true, "message" => $funded["message"], "amount" => $echo, "body" => $funded["body"]];
}

function kripicard_freeze(string $cardId, string $action): array
{
    if ($cardId === "" || ($action !== "freeze" && $action !== "unfreeze")) {
        return kripicard_fail("Kart bu işlem için uygun durumda değil.");
    }
    return kripicard_request("POST", "Freeze_Unfreeze", [
        "card_id" => $cardId,
        "action" => $action,
    ]);
}
