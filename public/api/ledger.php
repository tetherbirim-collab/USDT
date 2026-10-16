<?php
/**
 * Browser entry for the shared ledger.
 * POST JSON { action, ...fields } with header X-Clay: 1.
 */

require_once __DIR__ . "/clay-ledger.php";

function clay_json_out(int $status, array $body): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    clay_json_out(405, ["error" => "yok"]);
    exit;
}
if (($_SERVER["HTTP_X_CLAY"] ?? "") !== "1") {
    clay_json_out(403, ["error" => "yok"]);
    exit;
}
$input = json_decode(file_get_contents("php://input") ?: "", true);
if (!is_array($input)) {
    clay_json_out(400, ["error" => "yok"]);
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

[$handle, $db] = clay_load_raw();
if (!$handle || !is_array($db)) {
    clay_json_out(500, ["mode" => "php", "code" => "e-defter"]);
    exit;
}

$dirty = clay_normalize($db);
$before = $db;
$me = clay_session_user($db);
$result = clay_act($db, $me, (string) ($input["action"] ?? ""), $input);
if (!empty($result["save"])) {
    if (!clay_assert($db)) {
        $db = $before;
        $result["code"] = "e-defter";
        $result["save"] = false;
    }
} else {
    $db = $before;
}
$me = clay_session_user($db);
if (!empty($result["save"]) || $dirty) {
    clay_commit($handle, $db);
} else {
    clay_release($handle);
}

$body = [
    "mode" => "php",
    "code" => (string) ($result["code"] ?? "e-yok"),
    "me" => $me ? clay_public_user($me) : null,
    "db" => clay_view($db, $me),
];
if (isset($result["id"])) {
    $body["id"] = $result["id"];
}
if (isset($result["once"]) && is_string($result["once"]) && $result["once"] !== "") {
    $body["once"] = $result["once"];
}
if (isset($result["message"]) && is_string($result["message"]) && $result["message"] !== "") {
    $body["message"] = $result["message"];
}
$body["issuerReady"] = kripicard_ready();
clay_json_out(200, $body);
