<?php
/**
 * Visitor live support. One thread per connection, labeled with the typed username.
 */

header("Content-Type: application/json; charset=UTF-8");

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "yok"], JSON_UNESCAPED_UNICODE);
    exit;
}

$https = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off")
    || (($_SERVER["HTTP_X_FORWARDED_PROTO"] ?? "") === "https");
session_name("CLAYSESS");
session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "secure" => $https,
    "httponly" => true,
    "samesite" => "Lax",
]);
session_start();

$input = json_decode(file_get_contents("php://input") ?: "", true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "yok"], JSON_UNESCAPED_UNICODE);
    exit;
}

function clay_live_out(array $body, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clay_live_name(string $raw): string
{
    $name = trim((string) preg_replace("/\\s+/u", " ", $raw));
    $name = (string) preg_replace("/[\\x00-\\x1F\\x7F]/u", "", $name);
    $len = function_exists("mb_strlen") ? mb_strlen($name) : strlen($name);
    if ($len < 2 || $len > 32) {
        return "";
    }
    return $name;
}

function clay_live_text(string $raw): string
{
    $text = trim((string) preg_replace("/\\s+/u", " ", $raw));
    $text = (string) preg_replace("/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/u", "", $text);
    $len = function_exists("mb_strlen") ? mb_strlen($text) : strlen($text);
    if ($len < 1 || $len > 400) {
        return "";
    }
    return $text;
}

function clay_live_admin(): bool
{
    $uid = $_SESSION["uid"] ?? "";
    if (!is_string($uid) || $uid === "") {
        return false;
    }
    $raw = @file_get_contents(__DIR__ . "/clay-ledger.json");
    $db = json_decode($raw ?: "", true);
    if (!is_array($db) || !isset($db["users"]) || !is_array($db["users"])) {
        $seed = json_decode((string) @file_get_contents(__DIR__ . "/clay-seed.json"), true);
        $db = is_array($seed) ? $seed : null;
    }
    if (!is_array($db)) {
        return false;
    }
    foreach ($db["users"] as $user) {
        if (($user["id"] ?? "") === $uid && ($user["role"] ?? "") === "yonetici") {
            return true;
        }
    }
    return false;
}

$path = __DIR__ . "/clay-live.json";
$handle = fopen($path, "c+");
if ($handle === false) {
    clay_live_out(["ok" => false, "error" => "kayit"], 500);
}
flock($handle, LOCK_EX);
$store = json_decode(stream_get_contents($handle) ?: "", true);
if (!is_array($store) || !isset($store["threads"]) || !is_array($store["threads"])) {
    $store = ["threads" => []];
}

$op = (string) ($input["op"] ?? "");
$now = (int) round(microtime(true) * 1000);

function clay_live_save($handle, array $store): void
{
    $store["threads"] = array_values($store["threads"]);
    if (count($store["threads"]) > 80) {
        $store["threads"] = array_slice($store["threads"], -80);
    }
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($store, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

function clay_live_find(array $store, string $id): int
{
    foreach ($store["threads"] as $i => $row) {
        if (($row["id"] ?? "") === $id) {
            return $i;
        }
    }
    return -1;
}

if ($op === "send") {
    $name = clay_live_name((string) ($input["username"] ?? ""));
    $text = clay_live_text((string) ($input["text"] ?? ""));
    if ($name === "" || $text === "") {
        flock($handle, LOCK_UN);
        fclose($handle);
        clay_live_out(["ok" => false, "error" => "alan"], 400);
    }
    $threadId = (string) ($input["thread"] ?? "");
    $index = $threadId !== "" ? clay_live_find($store, $threadId) : -1;
    if ($index >= 0 && (string) ($store["threads"][$index]["username"] ?? "") !== $name) {
        $index = -1;
    }
    if ($index < 0) {
        $threadId = "lv_" . bin2hex(random_bytes(6));
        $store["threads"][] = [
            "id" => $threadId,
            "username" => $name,
            "at" => $now,
            "messages" => [],
        ];
        $index = count($store["threads"]) - 1;
    }
    $store["threads"][$index]["messages"][] = ["from" => "visitor", "text" => $text, "at" => $now];
    $thread = $store["threads"][$index];
    clay_live_save($handle, $store);
    clay_live_out(["ok" => true, "thread" => $thread]);
}

if ($op === "read") {
    $threadId = (string) ($input["thread"] ?? "");
    $index = clay_live_find($store, $threadId);
    flock($handle, LOCK_UN);
    fclose($handle);
    if ($index < 0) {
        clay_live_out(["ok" => false, "error" => "yok"], 404);
    }
    clay_live_out(["ok" => true, "thread" => $store["threads"][$index]]);
}

if ($op === "list" || $op === "reply") {
    if (!clay_live_admin()) {
        flock($handle, LOCK_UN);
        fclose($handle);
        clay_live_out(["ok" => false, "error" => "giris"], 403);
    }
}

if ($op === "list") {
    flock($handle, LOCK_UN);
    fclose($handle);
    clay_live_out(["ok" => true, "threads" => $store["threads"]]);
}

if ($op === "reply") {
    $threadId = (string) ($input["thread"] ?? "");
    $text = clay_live_text((string) ($input["text"] ?? ""));
    $index = clay_live_find($store, $threadId);
    if ($index < 0 || $text === "") {
        flock($handle, LOCK_UN);
        fclose($handle);
        clay_live_out(["ok" => false, "error" => "yok"], 404);
    }
    $store["threads"][$index]["messages"][] = ["from" => "admin", "text" => $text, "at" => $now];
    $thread = $store["threads"][$index];
    clay_live_save($handle, $store);
    clay_live_out(["ok" => true, "thread" => $thread]);
}

flock($handle, LOCK_UN);
fclose($handle);
clay_live_out(["ok" => false, "error" => "yok"], 404);
