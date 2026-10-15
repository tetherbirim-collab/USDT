<?php
/**
 * Heleket invoice endpoint for the static site.
 * The browser asks for an invoice. Heleket posts status changes here.
 * The payment key stays in heleket.config.php and never goes to the browser.
 * A paid webhook credits the shared ledger once.
 */

require_once __DIR__ . "/clay-ledger.php";

function heleket_config(): array
{
    $path = dirname(__DIR__) . "/heleket.config.php";
    $config = is_file($path) ? include $path : [];
    return [
        "merchant" => trim((string) ($config["merchant"] ?? "")),
        "payment_key" => trim((string) ($config["payment_key"] ?? "")),
    ];
}

function heleket_origin(): string
{
    $https = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off")
        || (($_SERVER["HTTP_X_FORWARDED_PROTO"] ?? "") === "https");
    $host = $_SERVER["HTTP_HOST"] ?? "localhost";
    if (!preg_match("/^[A-Za-z0-9.-]+(?::\\d+)?$/", $host)) {
        $host = "localhost";
    }
    return ($https ? "https" : "http") . "://" . $host;
}

function heleket_json($status, array $body): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function heleket_amount_ok(string $amount): bool
{
    if (!preg_match("/^\\d+\\.\\d{2}$/", $amount)) {
        return false;
    }
    $cents = (int) round((float) $amount * 100);
    return $cents >= 100 && $cents <= 500000;
}

function heleket_user_ok(string $userId): bool
{
    return (bool) preg_match("/^usr_[A-Za-z0-9_-]{1,80}$/", $userId);
}

function heleket_order_ok(string $orderId): bool
{
    return (bool) preg_match("/^clay-[a-f0-9]{16}$/", $orderId);
}

function heleket_sign(string $body, string $key): string
{
    return md5(base64_encode($body) . $key);
}

function heleket_store(callable $change)
{
    $path = __DIR__ . "/heleket-payments.json";
    $handle = fopen($path, "c+");
    if ($handle === false) {
        return null;
    }
    flock($handle, LOCK_EX);
    $raw = stream_get_contents($handle);
    $data = json_decode($raw ?: "{}", true);
    if (!is_array($data)) {
        $data = [];
    }
    $result = $change($data);
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    return $result;
}

function heleket_post(string $path, array $payload, array $config): array
{
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($body === false) {
        return ["ok" => false, "error" => "govde"];
    }
    $headers = [
        "Content-Type: application/json",
        "merchant: " . $config["merchant"],
        "sign: " . heleket_sign($body, $config["payment_key"]),
    ];
    $url = "https://api.heleket.com" . $path;
    if (function_exists("curl_init")) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => $headers,
        ]);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    } else {
        $context = stream_context_create([
            "http" => [
                "method" => "POST",
                "header" => implode("\r\n", $headers),
                "content" => $body,
                "timeout" => 20,
                "ignore_errors" => true,
            ],
        ]);
        $raw = file_get_contents($url, false, $context);
        $code = 0;
        foreach ($http_response_header ?? [] as $line) {
            if (preg_match("/^HTTP\\/\\S+\\s+(\\d+)/", $line, $match)) {
                $code = (int) $match[1];
            }
        }
    }
    if (!is_string($raw) || $raw === "") {
        return ["ok" => false, "error" => "ag"];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return ["ok" => false, "error" => "ag", "http" => $code];
    }
    return ["ok" => $code >= 200 && $code < 300 && (int) ($decoded["state"] ?? 1) === 0, "body" => $decoded, "http" => $code];
}

function heleket_paid(string $status): bool
{
    return $status === "paid" || $status === "paid_over";
}

function heleket_create(array $input): void
{
    $config = heleket_config();
    if ($config["merchant"] === "" || $config["payment_key"] === "") {
        heleket_json(503, ["error" => "anahtar"]);
        return;
    }
    $amount = (string) ($input["amount"] ?? "");
    $userId = (string) ($input["userId"] ?? "");
    if (!heleket_amount_ok($amount) || !heleket_user_ok($userId)) {
        heleket_json(422, ["error" => "tutar"]);
        return;
    }
    $orderId = "clay-" . bin2hex(random_bytes(8));
    $origin = heleket_origin();
    $back = $origin . "/panel/yukle/?siparis=" . $orderId;
    $payload = [
        "amount" => $amount,
        "currency" => "USD",
        "order_id" => $orderId,
        "url_callback" => $origin . "/api/heleket.php",
        "url_success" => $back,
        "url_return" => $back,
        "lifetime" => 3600,
        "additional_data" => $userId,
        "theme" => "dark",
    ];
    $response = heleket_post("/v1/payment", $payload, $config);
    $result = $response["body"]["result"] ?? null;
    if (!$response["ok"] || !is_array($result) || empty($result["url"])) {
        heleket_json(502, ["error" => "heleket"]);
        return;
    }
    heleket_store(function (&$data) use ($orderId, $userId, $amount, $result) {
        $data[$orderId] = [
            "order_id" => $orderId,
            "user_id" => $userId,
            "amount" => $amount,
            "uuid" => (string) ($result["uuid"] ?? ""),
            "status" => (string) ($result["payment_status"] ?? $result["status"] ?? "check"),
            "final" => (bool) ($result["is_final"] ?? false),
            "url" => (string) $result["url"],
        ];
        return true;
    });
    heleket_json(200, ["url" => $result["url"], "orderId" => $orderId]);
}

function heleket_refresh(array $row, array $config): array
{
    if (heleket_paid($row["status"] ?? "")) {
        return $row;
    }
    $response = heleket_post("/v1/payment/info", ["order_id" => $row["order_id"]], $config);
    $result = $response["body"]["result"] ?? null;
    if (!$response["ok"] || !is_array($result)) {
        return $row;
    }
    $row["status"] = (string) ($result["payment_status"] ?? $result["status"] ?? $row["status"]);
    $row["final"] = (bool) ($result["is_final"] ?? $row["final"]);
    if (!empty($result["uuid"])) {
        $row["uuid"] = (string) $result["uuid"];
    }
    return $row;
}

function heleket_status(array $input): void
{
    $orderId = (string) ($input["orderId"] ?? "");
    $userId = (string) ($input["userId"] ?? "");
    if (!heleket_order_ok($orderId) || !heleket_user_ok($userId)) {
        heleket_json(422, ["error" => "tutar"]);
        return;
    }
    $config = heleket_config();
    $row = heleket_store(function (&$data) use ($orderId, $userId, $config) {
        $current = $data[$orderId] ?? null;
        if (!is_array($current) || ($current["user_id"] ?? "") !== $userId) {
            return ["missing" => true];
        }
        if ($config["merchant"] !== "" && $config["payment_key"] !== "" && !heleket_paid($current["status"] ?? "")) {
            $current = heleket_refresh($current, $config);
            $data[$orderId] = $current;
        }
        return $current;
    });
    if (!is_array($row) || !empty($row["missing"])) {
        heleket_json(404, ["error" => "yok"]);
        return;
    }
    heleket_json(200, [
        "status" => (string) ($row["status"] ?? "check"),
        "amount" => (string) ($row["amount"] ?? ""),
        "final" => (bool) ($row["final"] ?? false),
    ]);
}

function heleket_webhook(): void
{
    $raw = file_get_contents("php://input");
    $decoded = json_decode($raw ?: "", true);
    if (!is_array($decoded) || empty($decoded["sign"])) {
        heleket_json(400, ["error" => "imza"]);
        return;
    }
    $config = heleket_config();
    if ($config["payment_key"] === "") {
        heleket_json(503, ["error" => "anahtar"]);
        return;
    }
    $sign = (string) $decoded["sign"];
    unset($decoded["sign"]);
    $check = json_encode($decoded, JSON_UNESCAPED_UNICODE);
    if (!is_string($check) || !hash_equals(heleket_sign($check, $config["payment_key"]), $sign)) {
        heleket_json(403, ["error" => "imza"]);
        return;
    }
    $orderId = (string) ($decoded["order_id"] ?? "");
    if (!heleket_order_ok($orderId)) {
        heleket_json(422, ["error" => "tutar"]);
        return;
    }
    $status = (string) ($decoded["status"] ?? $decoded["payment_status"] ?? "");
    $paidRow = null;
    heleket_store(function (&$data) use ($orderId, $decoded, $status, &$paidRow) {
        $current = $data[$orderId] ?? [
            "order_id" => $orderId,
            "user_id" => (string) ($decoded["additional_data"] ?? ""),
            "amount" => (string) ($decoded["amount"] ?? ""),
            "uuid" => (string) ($decoded["uuid"] ?? ""),
            "status" => "check",
            "final" => false,
            "url" => "",
        ];
        $current["status"] = $status;
        $current["final"] = (bool) ($decoded["is_final"] ?? heleket_paid($status));
        if (!empty($decoded["uuid"])) {
            $current["uuid"] = (string) $decoded["uuid"];
        }
        $data[$orderId] = $current;
        $paidRow = $current;
        return true;
    });
    if (heleket_paid($status) && is_array($paidRow)) {
        $cents = (int) round((float) ($paidRow["amount"] ?? "0") * 100);
        $credited = clay_credit_heleket((string) ($paidRow["user_id"] ?? ""), $orderId, $cents);
        if ($credited === "e-defter") {
            heleket_json(500, ["error" => "defter"]);
            return;
        }
    }
    heleket_json(200, ["ok" => true]);
}

function heleket_handle(): void
{
    $raw = file_get_contents("php://input");
    $input = json_decode($raw ?: "", true);
    if (!is_array($input)) {
        $input = [];
    }
    $action = (string) ($input["action"] ?? "");
    if ($action === "create") {
        heleket_create($input);
        return;
    }
    if ($action === "status") {
        heleket_status($input);
        return;
    }
    heleket_webhook();
}

if (PHP_SAPI !== "cli" && basename(__FILE__) === basename($_SERVER["SCRIPT_FILENAME"] ?? "")) {
    heleket_handle();
}
