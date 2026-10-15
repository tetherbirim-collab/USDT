<?php
/**
 * Pulls the operator's PST.NET account into the shared ledger.
 * Card prices and fee percents are stored at 8% above the PST figures.
 * Imported movements keep the PST amount.
 * The bearer token stays in pst.config.php and is not returned to the browser.
 */

function pst_config_path(): string
{
    return dirname(__DIR__) . "/pst.config.php";
}

function pst_config(): array
{
    $path = pst_config_path();
    $config = is_file($path) ? include $path : [];
    if (!is_array($config)) {
        $config = [];
    }
    $token = trim((string) ($config["token"] ?? ""));
    $markup = (float) ($config["markup"] ?? 1.08);
    if ($markup < 1 || $markup > 3) {
        $markup = 1.08;
    }
    return ["token" => $token, "markup" => $markup];
}

function pst_save_token(string $token): bool
{
    $body = "<?php\nreturn [\n    \"token\" => " . var_export($token, true) . ",\n    \"markup\" => 1.08,\n];\n";
    return file_put_contents(pst_config_path(), $body, LOCK_EX) !== false;
}

function clay_pst_blank(): array
{
    return [
        "on" => false,
        "markup" => 8,
        "syncedAt" => "",
        "cards" => 0,
        "transactions" => 0,
        "orders" => 0,
        "loadSource" => 0,
        "issueSourceUsd" => 0,
        "transferSource" => 0,
        "error" => "",
        "tokenTail" => "",
        "watchedAt" => "",
        "wallets" => [],
        "queue" => [],
    ];
}

function clay_pst_ensure(array &$settings): bool
{
    $blank = clay_pst_blank();
    if (!isset($settings["pst"]) || !is_array($settings["pst"])) {
        $settings["pst"] = $blank;
        return true;
    }
    $dirty = false;
    foreach ($blank as $key => $value) {
        if (!array_key_exists($key, $settings["pst"])) {
            $settings["pst"][$key] = $value;
            $dirty = true;
        }
    }
    return $dirty;
}

function pst_percent($raw): ?float
{
    if (!is_numeric($raw)) {
        return null;
    }
    $value = (float) $raw;
    if ($value < 0) {
        return null;
    }
    if ($value <= 1) {
        $value *= 100;
    }
    return $value;
}

function pst_usd($raw): ?float
{
    if (!is_numeric($raw)) {
        return null;
    }
    $value = (float) $raw;
    return $value >= 0 ? $value : null;
}

function pst_mask(string $mask): ?string
{
    $mask = strtoupper(trim($mask));
    if (preg_match("/^(\\d{6})[X*]{2,12}(\\d{4})$/", $mask, $hit)) {
        return $hit[1] . "******" . $hit[2];
    }
    $digits = (string) preg_replace("/\\D/", "", $mask);
    if (strlen($digits) < 10) {
        return null;
    }
    return substr($digits, 0, 6) . "******" . substr($digits, -4);
}

function pst_type(array $card, array $tariffs): string
{
    $tariff = $tariffs[(string) ($card["tariff_id"] ?? "")] ?? [];
    $blob = strtolower(trim(
        (string) ($card["description"] ?? "") . " "
        . (string) ($tariff["slug"] ?? "") . " "
        . (string) ($tariff["name"] ?? "")
    ));
    if (str_contains($blob, "tiktok") || str_contains($blob, "tik-tok") || str_contains($blob, "tik_tok")) {
        return "tiktok";
    }
    if (str_contains($blob, "google")) {
        return "google_ads";
    }
    if (str_contains($blob, "ultima")) {
        return "ultima";
    }
    return "facebook_ads";
}

function pst_status(array $card): string
{
    $simple = strtolower((string) ($card["simple_status"] ?? ""));
    if ($simple === "active") {
        return "aktif";
    }
    $tags = "";
    foreach ($card["tags"] ?? [] as $tag) {
        if (is_array($tag)) {
            $tags .= " " . strtolower((string) ($tag["slug"] ?? "") . " " . (string) ($tag["name"] ?? ""));
        }
    }
    $text = strtolower((string) ($card["status_text"] ?? "") . " " . (string) ($card["status_name"] ?? "")) . $tags;
    $code = is_numeric($card["status"] ?? null) ? (int) $card["status"] : 0;
    if ($simple === "inactive" || $code >= 20 || str_contains($text, "clos") || str_contains($text, "block") || str_contains($text, "expir") || str_contains($text, "delet")) {
        return "kapali";
    }
    return "donduruldu";
}

function pst_expiry(array $card): string
{
    $until = (string) ($card["ordered_until"] ?? "");
    if (preg_match("/^(\\d{4})-(\\d{2})/", $until, $hit)) {
        return $hit[2] . "/" . substr($hit[1], 2);
    }
    return "12/29";
}

function pst_iso(string $value): string
{
    try {
        return (new DateTimeImmutable($value))->setTimezone(new DateTimeZone("UTC"))->format("Y-m-d\\TH:i:s.v\\Z");
    } catch (Exception $error) {
        return clay_now();
    }
}

function pst_kind(array $tx): string
{
    $blob = strtolower((string) ($tx["type"] ?? "") . " " . (string) ($tx["type_enum"] ?? "") . " " . (string) ($tx["description"] ?? ""));
    if (str_contains($blob, "refund") || str_contains($blob, "reversal")) {
        return "iade";
    }
    if (str_contains($blob, "topup") || str_contains($blob, "top-up") || str_contains($blob, "top_up") || str_contains($blob, "refill") || str_contains($blob, "replen") || str_contains($blob, "deposit")) {
        return "yukleme";
    }
    if (str_contains($blob, "withdraw") || str_contains($blob, "payout")) {
        return "transfer";
    }
    if (str_contains($blob, "transfer")) {
        return "transfer";
    }
    if (str_contains($blob, "buy") || str_contains($blob, "issue") || str_contains($blob, "order") || str_contains($blob, "fee")) {
        return "basim";
    }
    return "harcama";
}

function pst_tx_ok(array $tx): bool
{
    $statusText = strtolower(trim((string) ($tx["status_text"] ?? "")));
    $custom = strtolower(trim((string) ($tx["custom_status"] ?? "")));
    $text = $statusText . " " . $custom;
    foreach (["declin", "reject", "fail", "cancel", "error", "block", "insufficient", "restrict"] as $needle) {
        if (str_contains($text, $needle)) {
            return false;
        }
    }
    if ($statusText === "") {
        return true;
    }
    return in_array($statusText, ["approved", "success", "completed", "settled"], true);
}

function pst_merchant(array $tx): string
{
    $merchant = $tx["merchant"] ?? "";
    if (is_array($merchant)) {
        $merchant = (string) ($merchant["name"] ?? $merchant["title"] ?? "");
    }
    $merchant = trim((string) $merchant);
    if ($merchant !== "") {
        return $merchant;
    }
    $description = trim((string) ($tx["description"] ?? ""));
    return $description !== "" ? $description : "PST hareketi";
}

function pst_rows(array $json): array
{
    $data = $json["data"] ?? null;
    if (is_array($data) && isset($data["data"]) && is_array($data["data"])) {
        $data = $data["data"];
    }
    if (!is_array($data)) {
        return [];
    }
    $rows = [];
    foreach ($data as $row) {
        if (is_array($row)) {
            $rows[] = $row;
        }
    }
    return $rows;
}

function pst_http(string $url, string $token): array
{
    if (!function_exists("curl_init")) {
        return ["_error" => 0];
    }
    $handle = curl_init($url);
    if ($handle === false) {
        return ["_error" => 0];
    }
    curl_setopt_array($handle, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . $token,
            "Accept: application/json",
        ],
    ]);
    $body = curl_exec($handle);
    $code = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    if (!is_string($body) || $code < 200 || $code >= 300) {
        return ["_error" => $code];
    }
    $json = json_decode($body, true);
    return is_array($json) ? $json : ["_error" => 0];
}

function pst_http_many(array $urls, string $token): array
{
    $out = [];
    foreach ($urls as $i => $url) {
        $out[$i] = ["_error" => 0];
    }
    if (!$urls) {
        return $out;
    }
    if (!function_exists("curl_multi_init")) {
        foreach ($urls as $i => $url) {
            $out[$i] = pst_http($url, $token);
        }
        return $out;
    }
    $multi = curl_multi_init();
    $handles = [];
    foreach ($urls as $i => $url) {
        $handle = curl_init($url);
        if ($handle === false) {
            continue;
        }
        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer " . $token,
                "Accept: application/json",
            ],
        ]);
        curl_multi_add_handle($multi, $handle);
        $handles[$i] = $handle;
    }
    $running = null;
    do {
        $status = curl_multi_exec($multi, $running);
        if ($running) {
            curl_multi_select($multi, 1.0);
        }
    } while ($running && $status === CURLM_OK);
    foreach ($handles as $i => $handle) {
        $body = curl_multi_getcontent($handle);
        $code = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        curl_multi_remove_handle($multi, $handle);
        curl_close($handle);
        if (!is_string($body) || $code < 200 || $code >= 300) {
            $out[$i] = ["_error" => $code];
            continue;
        }
        $json = json_decode($body, true);
        $out[$i] = is_array($json) ? $json : ["_error" => 0];
    }
    curl_multi_close($multi);
    return $out;
}

/**
 * @return array{rows?: array, next?: int, _error?: int}
 */
function pst_collect(string $path, array $query, string $token, int $maxPages, int $start = 1): array
{
    $rows = [];
    $page = max(1, $start);
    $guard = 0;
    $lastPage = 0;
    while ($guard < $maxPages) {
        $room = min(($start === 1 && $guard === 0) ? 1 : 4, $maxPages - $guard);
        $batch = [];
        for ($i = 0; $i < $room; $i += 1) {
            $number = $page + $i;
            if ($lastPage > 0 && $number > $lastPage) {
                break;
            }
            $batch[] = $number;
        }
        if (!$batch) {
            break;
        }
        $urls = [];
        foreach ($batch as $number) {
            $query["page"] = $number;
            $urls[] = "https://api.pst.net" . $path . "?" . http_build_query($query);
        }
        $bodies = pst_http_many($urls, $token);
        foreach ($bodies as $i => $json) {
            if (isset($json["_error"])) {
                if (!$rows) {
                    return ["_error" => (int) $json["_error"]];
                }
                return ["rows" => $rows, "next" => $batch[$i]];
            }
            foreach (pst_rows($json) as $row) {
                $rows[] = $row;
            }
            $metaLast = (int) ($json["meta"]["last_page"] ?? 0);
            if ($metaLast > $lastPage) {
                $lastPage = $metaLast;
            }
        }
        $page += count($batch);
        $guard += count($batch);
        if ($lastPage === 0 || $page > $lastPage) {
            return ["rows" => $rows, "next" => 0];
        }
    }
    return ["rows" => $rows, "next" => $page];
}

function pst_owner(array $db, array $card): string
{
    $description = (string) ($card["description"] ?? "");
    if (preg_match("/(?:^|\\s)uye:([a-z0-9_]{3,24})\\b/i", $description, $hit)) {
        $name = strtolower($hit[1]);
        foreach ($db["users"] as $user) {
            if (strtolower((string) ($user["username"] ?? "")) === $name && ($user["role"] ?? "") === "uye") {
                return (string) $user["id"];
            }
        }
    }
    return "usr_admin";
}

function pst_balance_kurus(array $card): ?int
{
    $raw = null;
    if (isset($card["account"]) && is_array($card["account"]) && is_numeric($card["account"]["balance"] ?? null)) {
        $raw = $card["account"]["balance"];
    } else {
        foreach (["balance", "available", "available_balance", "card_balance", "amount"] as $key) {
            if (isset($card[$key]) && is_numeric($card[$key])) {
                $raw = $card[$key];
                break;
            }
        }
    }
    if ($raw === null) {
        return null;
    }
    return clay_kurus((int) round(((float) $raw) * 100));
}

function clay_pst_apply(array &$db, array $cards, array $transactions, array $tariffs, array $fees): bool
{
    clay_pst_ensure($db["settings"]);
    $markup = (float) pst_config()["markup"];
    $byId = [];
    $issueSource = null;
    $loadSource = null;
    foreach ($tariffs as $tariff) {
        if (!is_array($tariff)) {
            continue;
        }
        $byId[(string) ($tariff["id"] ?? "")] = $tariff;
        if (array_key_exists("is_allowed_for_user", $tariff) && !$tariff["is_allowed_for_user"]) {
            continue;
        }
        $price = pst_usd($tariff["card_price"] ?? null);
        $load = pst_percent($tariff["fee_topup"] ?? null);
        if ($price !== null && ($issueSource === null || $price > $issueSource)) {
            $issueSource = $price;
        }
        if ($load !== null && ($loadSource === null || $load > $loadSource)) {
            $loadSource = $load;
        }
    }
    if ($loadSource === null && isset($fees["default_card_refill"])) {
        $loadSource = pst_percent($fees["default_card_refill"]);
    }
    $transferSource = isset($fees["withdraw"]) ? pst_percent($fees["withdraw"]) : null;
    if ($issueSource !== null && $issueSource > 0) {
        $db["settings"]["issueFeeKurus"] = clay_kurus((int) round($issueSource * $markup * 100));
    }
    if ($loadSource !== null && $loadSource > 0) {
        $db["settings"]["loadFeePercent"] = round($loadSource * $markup, 2);
    }
    if ($transferSource !== null && $transferSource > 0) {
        $db["settings"]["transferFeePercent"] = round($transferSource * $markup, 2);
    }

    $cardIndex = [];
    foreach ($db["cards"] as $i => $card) {
        $cardIndex[(string) ($card["id"] ?? "")] = $i;
    }
    $orderIndex = [];
    foreach ($db["orders"] as $i => $order) {
        $orderIndex[(string) ($order["id"] ?? "")] = $i;
    }
    $txIndex = [];
    foreach ($db["transactions"] as $i => $entry) {
        if (!empty($entry["ref"])) {
            $txIndex[(string) $entry["ref"]] = $i;
        }
    }

    $cardCount = 0;
    $knownBalance = [];
    foreach ($cards as $card) {
        if (!is_array($card) || !isset($card["id"])) {
            continue;
        }
        $mask = pst_mask((string) ($card["mask"] ?? ""));
        if ($mask === null) {
            continue;
        }
        $pstId = (string) $card["id"];
        $id = "crd_pst_" . preg_replace("/\\D/", "", $pstId);
        if ($id === "crd_pst_") {
            continue;
        }
        $owner = pst_owner($db, $card);
        if (clay_user_index($db, $owner) < 0) {
            $owner = "usr_admin";
        }
        if (clay_user_index($db, $owner) < 0) {
            continue;
        }
        $tariff = $byId[(string) ($card["tariff_id"] ?? "")] ?? [];
        $label = trim((string) ($card["description"] ?? ""));
        if ($label === "") {
            $label = trim((string) ($tariff["name"] ?? ""));
        }
        if ($label === "") {
            $label = "PST " . substr($mask, -4);
        }
        $label = mb_substr($label, 0, 32);
        $available = pst_balance_kurus($card);
        if ($available !== null) {
            $knownBalance[$id] = $available;
        }
        $created = pst_iso((string) ($card["ordered_at"] ?? clay_now()));
        $row = [
            "id" => $id,
            "userId" => $owner,
            "type" => pst_type($card, $byId),
            "label" => $label,
            "limit" => $available ?? 0,
            "spent" => 0,
            "pan" => $mask,
            "bin" => substr($mask, 0, 6),
            "binLabel" => "PST",
            "expiry" => pst_expiry($card),
            "cvv" => "•••",
            "holder" => clay_holder((string) ($card["holder_name"] ?? "CLAY")),
            "status" => pst_status($card),
            "readyAt" => null,
            "period" => 1,
            "createdAt" => $created,
            "feeDueAt" => null,
        ];
        if (isset($cardIndex[$id])) {
            $keep = $db["cards"][$cardIndex[$id]];
            $row["period"] = $keep["period"] ?? 1;
            $row["starred"] = !empty($keep["starred"]);
            if ($available === null) {
                $row["limit"] = (int) ($keep["limit"] ?? 0);
            }
            if (($keep["status"] ?? "") !== "kapali" && $row["status"] === "kapali") {
                clay_notice($db, $owner, "PST kartı kapatıldı", $label . " PST tarafında kapandı.", "pst-kapandi:" . $id);
            }
            $db["cards"][$cardIndex[$id]] = $row;
        } else {
            $db["cards"][] = $row;
            $cardIndex[$id] = count($db["cards"]) - 1;
        }
        $price = pst_usd($tariff["card_price"] ?? null);
        $fee = $price === null ? 0 : clay_kurus((int) round($price * 100));
        $orderId = "ord_pst_" . preg_replace("/\\D/", "", $pstId);
        $orderStatus = $row["status"] === "kapali" ? "iptal" : "hazir";
        $order = [
            "id" => $orderId,
            "userId" => $owner,
            "cardId" => $id,
            "type" => $row["type"],
            "label" => $label,
            "limit" => $row["limit"],
            "fee" => $fee,
            "status" => $orderStatus,
            "createdAt" => $created,
            "readyAt" => null,
        ];
        if (isset($orderIndex[$orderId])) {
            $db["orders"][$orderIndex[$orderId]] = $order;
        } else {
            $db["orders"][] = $order;
            $orderIndex[$orderId] = count($db["orders"]) - 1;
        }
        $cardCount += 1;
    }

    $txCount = 0;
    foreach ($transactions as $tx) {
        if (!is_array($tx) || !isset($tx["id"])) {
            continue;
        }
        $enum = strtolower((string) ($tx["type_enum"] ?? ""));
        $total = is_numeric($tx["amount_total"] ?? null) ? (float) $tx["amount_total"] : null;
        if ($enum === "settlement" && $total !== null && abs($total) < 0.0000001) {
            continue;
        }
        $ref = "pst:" . preg_replace("/\\D/", "", (string) $tx["id"]);
        if ($ref === "pst:") {
            continue;
        }
        $cardKey = isset($tx["card_id"]) ? "crd_pst_" . preg_replace("/\\D/", "", (string) $tx["card_id"]) : "";
        $cardId = ($cardKey !== "crd_pst_" && isset($cardIndex[$cardKey])) ? $cardKey : null;
        $owner = "usr_admin";
        if ($cardId !== null) {
            $owner = (string) $db["cards"][$cardIndex[$cardId]]["userId"];
        }
        $usd = is_numeric($tx["amount"] ?? null) ? (float) $tx["amount"] : 0.0;
        $cents = (int) round($usd * 100);
        $amount = (int) round($cents * 49.3929);
        $kind = pst_kind($tx);
        if ($usd > 0 && $kind === "harcama") {
            $kind = "iade";
        }
        $ok = pst_tx_ok($tx);
        $when = pst_iso((string) ($tx["processed_at"] ?? $tx["created_at"] ?? clay_now()));
        $entry = [
            "id" => "tx_" . $ref,
            "userId" => $owner,
            "cardId" => $cardId,
            "kind" => $kind,
            "title" => mb_substr(pst_merchant($tx), 0, 80),
            "note" => "PST hareketi. " . trim((string) ($tx["description"] ?? "")),
            "amount" => $amount,
            "usdMinor" => $cents,
            "status" => $ok ? "tamamlandi" : "reddedildi",
            "createdAt" => $when,
            "ref" => $ref,
        ];
        if (isset($txIndex[$ref])) {
            $db["transactions"][$txIndex[$ref]] = $entry;
        } else {
            $db["transactions"][] = $entry;
            $txIndex[$ref] = count($db["transactions"]) - 1;
        }
        $txCount += 1;
    }

    $spentByCard = [];
    foreach ($db["transactions"] as $entry) {
        $cid = (string) ($entry["cardId"] ?? "");
        if (!str_starts_with($cid, "crd_pst_")) {
            continue;
        }
        if (($entry["status"] ?? "") !== "tamamlandi" || ($entry["kind"] ?? "") !== "harcama") {
            continue;
        }
        $moved = (int) ($entry["amount"] ?? 0);
        if ($moved < 0) {
            $spentByCard[$cid] = ($spentByCard[$cid] ?? 0) + (-$moved);
        }
    }
    foreach ($db["cards"] as $index => $card) {
        $id = (string) ($card["id"] ?? "");
        if (!str_starts_with($id, "crd_pst_") || !isset($cardIndex[$id])) {
            continue;
        }
        if (!isset($knownBalance[$id]) && !isset($spentByCard[$id])) {
            continue;
        }
        $spent = $spentByCard[$id] ?? 0;
        $db["cards"][$index]["spent"] = $spent;
        if (isset($knownBalance[$id])) {
            $db["cards"][$index]["limit"] = $knownBalance[$id] + $spent;
        } else {
            $db["cards"][$index]["limit"] = max((int) $db["cards"][$index]["limit"], $spent);
        }
    }
    foreach ($db["orders"] as $index => $order) {
        $cid = (string) ($order["cardId"] ?? "");
        if (!str_starts_with($cid, "crd_pst_") || !isset($cardIndex[$cid])) {
            continue;
        }
        $db["orders"][$index]["limit"] = (int) $db["cards"][$cardIndex[$cid]]["limit"];
    }
    $txCount = 0;
    foreach ($db["transactions"] as $entry) {
        if (str_starts_with((string) ($entry["ref"] ?? ""), "pst:")) {
            $txCount += 1;
        }
    }

    $token = pst_config()["token"];
    $prev = $db["settings"]["pst"];
    $db["settings"]["pst"] = [
        "on" => $token !== "",
        "markup" => (int) round(($markup - 1) * 100),
        "syncedAt" => clay_now(),
        "cards" => $cardCount,
        "transactions" => $txCount,
        "orders" => $cardCount,
        "loadSource" => $loadSource ?? (float) ($prev["loadSource"] ?? 0),
        "issueSourceUsd" => $issueSource ?? (float) ($prev["issueSourceUsd"] ?? 0),
        "transferSource" => $transferSource ?? (float) ($prev["transferSource"] ?? 0),
        "error" => "",
        "tokenTail" => $token === "" ? "" : substr($token, -4),
        "watchedAt" => (string) ($prev["watchedAt"] ?? ""),
        "wallets" => is_array($prev["wallets"] ?? null) ? $prev["wallets"] : [],
        "queue" => is_array($prev["queue"] ?? null) ? $prev["queue"] : [],
    ];
    return true;
}

function pst_pull(string $token, bool $cabinet, int $txPages, bool $rates = true): array
{
    if ($cabinet) {
        $cardPath = "/card";
        $txPath = "/transactions-v2";
        $txQuery = ["direction" => "desc", "per_page" => 100];
        $tariffPath = "/user/tariff";
        $feeUrl = "https://api.pst.net/dictionary/fees";
    } else {
        $cardPath = "/integration/members/cards";
        $txPath = "/integration/transactions-v2";
        $txQuery = ["sort" => "processed_at", "direction" => "desc", "per_page" => 100];
        $tariffPath = "/integration/user/tariff";
        $feeUrl = "https://api.pst.net/integration/dictionary/fees";
    }
    $cardQuery = ["per_page" => 100, "page" => 1];
    $firstTx = $txQuery;
    $firstTx["page"] = 1;
    $urls = [
        "https://api.pst.net" . $cardPath . "?" . http_build_query($cardQuery),
        "https://api.pst.net" . $txPath . "?" . http_build_query($firstTx),
        $cabinet ? "https://api.pst.net/account" : "https://api.pst.net/integration/account",
        $cabinet ? "https://api.pst.net/withdrawal?per_page=50&page=1" : "https://api.pst.net/integration/withdrawal?per_page=50&page=1",
    ];
    if ($rates) {
        $urls[] = "https://api.pst.net" . $tariffPath . "?" . http_build_query(["per_page" => 100, "page" => 1]);
        $urls[] = $feeUrl;
    }
    $bodies = pst_http_many($urls, $token);
    $cardsJson = $bodies[0];
    $txJson = $bodies[1];
    $accountJson = $bodies[2];
    $withdrawJson = $bodies[3];
    $tariffJson = $rates ? $bodies[4] : ["data" => []];
    $fees = $rates ? $bodies[5] : ["data" => []];
    if ($cabinet && isset($cardsJson["_error"]) && (int) $cardsJson["_error"] === 401) {
        return ["denied" => true];
    }
    $cards = isset($cardsJson["_error"]) ? $cardsJson : pst_rows($cardsJson);
    $transactions = isset($txJson["_error"]) ? $txJson : pst_rows($txJson);
    $tariffs = isset($tariffJson["_error"]) ? $tariffJson : pst_rows($tariffJson);
    if ($txPages > 1 && !isset($transactions["_error"])) {
        $last = (int) ($txJson["meta"]["last_page"] ?? 1);
        $morePages = min($txPages, max($last, 1)) - 1;
        if ($morePages > 0) {
            $more = pst_collect($txPath, $txQuery, $token, $morePages, 2);
            if (!isset($more["_error"])) {
                foreach ($more["rows"] ?? [] as $row) {
                    $transactions[] = $row;
                }
            }
        }
    }
    $cardLast = (int) ($cardsJson["meta"]["last_page"] ?? 1);
    if ($cardLast > 1 && !isset($cards["_error"])) {
        $moreCards = pst_collect($cardPath, ["per_page" => 100], $token, min(3, $cardLast - 1), 2);
        if (!isset($moreCards["_error"])) {
            foreach ($moreCards["rows"] ?? [] as $row) {
                $cards[] = $row;
            }
        }
    }
    return [
        "denied" => false,
        "cards" => $cards,
        "transactions" => $transactions,
        "tariffs" => $tariffs,
        "fees" => $fees,
        "accounts" => isset($accountJson["_error"]) ? $accountJson : pst_rows($accountJson),
        "withdrawals" => isset($withdrawJson["_error"]) ? $withdrawJson : pst_rows($withdrawJson),
    ];
}

function pst_request(string $method, string $url, string $token, ?string $body = null): array
{
    if (!function_exists("curl_init")) {
        return ["code" => 0, "json" => ["_error" => 0]];
    }
    $handle = curl_init($url);
    if ($handle === false) {
        return ["code" => 0, "json" => ["_error" => 0]];
    }
    $headers = ["Authorization: Bearer " . $token, "Accept: application/json"];
    if ($body !== null) {
        $headers[] = "Content-Type: application/json";
    }
    curl_setopt_array($handle, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    if ($body !== null) {
        curl_setopt($handle, CURLOPT_POSTFIELDS, $body);
    }
    $raw = curl_exec($handle);
    $code = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    $json = is_string($raw) ? json_decode($raw, true) : null;
    return ["code" => $code, "json" => is_array($json) ? $json : []];
}

function pst_close_card(string $pstId, string $token): array
{
    $id = preg_replace("/\\D/", "", $pstId);
    if ($id === "") {
        return ["ok" => false, "code" => 0];
    }
    $hit = pst_request("DELETE", "https://api.pst.net/card/" . $id, $token, null);
    $ok = $hit["code"] === 200 || $hit["code"] === 204 || $hit["code"] === 404;
    return ["ok" => $ok, "code" => $hit["code"]];
}

function clay_pst_queue_close(array &$db, array $card): void
{
    clay_pst_ensure($db["settings"]);
    if (!is_array($db["settings"]["pst"]["queue"] ?? null)) {
        $db["settings"]["pst"]["queue"] = [];
    }
    $cardId = (string) ($card["id"] ?? "");
    if (!str_starts_with($cardId, "crd_pst_")) {
        return;
    }
    foreach ($db["settings"]["pst"]["queue"] as $job) {
        if (($job["cardId"] ?? "") === $cardId && ($job["op"] ?? "") === "kapat" && ($job["status"] ?? "") === "bekliyor") {
            return;
        }
    }
    $db["settings"]["pst"]["queue"][] = [
        "id" => "q_" . preg_replace("/\\D/", "", $cardId),
        "op" => "kapat",
        "cardId" => $cardId,
        "pstId" => preg_replace("/\\D/", "", $cardId),
        "status" => "bekliyor",
        "tries" => 0,
        "error" => "",
        "at" => clay_now(),
    ];
}

function clay_pst_hold_closed(array &$db): void
{
    $waiting = [];
    foreach ($db["settings"]["pst"]["queue"] ?? [] as $job) {
        if (($job["op"] ?? "") === "kapat" && ($job["status"] ?? "") === "bekliyor") {
            $waiting[(string) ($job["cardId"] ?? "")] = true;
        }
    }
    if (!$waiting) {
        return;
    }
    foreach ($db["cards"] as $i => $card) {
        $id = (string) ($card["id"] ?? "");
        if (isset($waiting[$id])) {
            $db["cards"][$i]["status"] = "kapali";
        }
    }
}

function clay_pst_run_queue(array &$db): bool
{
    clay_pst_ensure($db["settings"]);
    $token = pst_config()["token"];
    $queue = $db["settings"]["pst"]["queue"] ?? [];
    if (!is_array($queue) || !$queue || $token === "") {
        clay_pst_hold_closed($db);
        return false;
    }
    $changed = false;
    foreach ($queue as $i => $job) {
        if (($job["status"] ?? "") !== "bekliyor" || ($job["op"] ?? "") !== "kapat") {
            continue;
        }
        $hit = pst_close_card((string) ($job["pstId"] ?? ""), $token);
        $queue[$i]["tries"] = (int) ($job["tries"] ?? 0) + 1;
        if ($hit["ok"]) {
            $queue[$i]["status"] = "bitti";
            $queue[$i]["error"] = "";
            $changed = true;
            continue;
        }
        $queue[$i]["error"] = "PST kapatma yanıtı " . (int) $hit["code"];
        if ($queue[$i]["tries"] >= 8) {
            $queue[$i]["status"] = "hata";
            $db["settings"]["pst"]["error"] = "Kart kapatma PST tarafında tamamlanmadı.";
        }
        $changed = true;
    }
    $db["settings"]["pst"]["queue"] = $queue;
    clay_pst_hold_closed($db);
    return $changed;
}

function clay_pst_tx_ref_exists(array $db, string $ref): bool
{
    foreach ($db["transactions"] as $entry) {
        if (($entry["ref"] ?? "") === $ref) {
            return true;
        }
    }
    return false;
}

function clay_pst_push_money(array &$db, string $ref, string $kind, string $title, string $note, int $usdMinor, ?string $cardId = null): void
{
    if ($ref === "" || clay_pst_tx_ref_exists($db, $ref) || $usdMinor === 0) {
        return;
    }
    $amount = clay_kurus($usdMinor);
    if ($amount === 0) {
        return;
    }
    $db["transactions"][] = [
        "id" => "tx_" . $ref,
        "userId" => "usr_admin",
        "cardId" => $cardId,
        "kind" => $kind,
        "title" => mb_substr($title, 0, 80),
        "note" => $note,
        "amount" => $amount,
        "usdMinor" => $cents,
        "status" => "tamamlandi",
        "createdAt" => clay_now(),
        "ref" => $ref,
    ];
}

function clay_pst_cash(array &$db, array $accounts, array $withdrawals): void
{
    clay_pst_ensure($db["settings"]);
    $booked = [];
    if (!isset($withdrawals["_error"])) {
        foreach ($withdrawals as $row) {
            if (!is_array($row) || !isset($row["id"])) {
                continue;
            }
            $rawAmount = $row["amount"] ?? $row["amount_total"] ?? null;
            $state = strtolower((string) ($row["status"] ?? "") . " " . (string) ($row["status_text"] ?? ""));
            if (!is_numeric($rawAmount)) {
                continue;
            }
            if (str_contains($state, "declin") || str_contains($state, "fail") || str_contains($state, "cancel")) {
                continue;
            }
            $usd = (float) $rawAmount;
            $minor = (int) round(abs($usd) * 100);
            if ($minor === 0) {
                continue;
            }
            $ref = "pst:cek:" . preg_replace("/\\D/", "", (string) $row["id"]);
            $wallet = trim((string) ($row["wallet"] ?? ""));
            $tail = $wallet === "" ? "" : " · " . substr($wallet, 0, 4) . "…" . substr($wallet, -4);
            clay_pst_push_money(
                $db,
                $ref,
                "transfer",
                "PST çekim",
                "PST çekimi." . $tail,
                -$minor
            );
            $booked[$minor] = ($booked[$minor] ?? 0) + 1;
        }
    }
    if (isset($accounts["_error"])) {
        return;
    }
    $prevRows = $db["settings"]["pst"]["wallets"] ?? [];
    $prev = [];
    if (is_array($prevRows)) {
        foreach ($prevRows as $row) {
            if (is_array($row) && isset($row["id"])) {
                $prev[(string) $row["id"]] = (int) ($row["minor"] ?? 0);
            }
        }
    }
    $next = [];
    $known = $prevRows !== [] && $prevRows !== null;
    foreach ($accounts as $account) {
        if (!is_array($account) || !isset($account["id"]) || !is_numeric($account["balance"] ?? null)) {
            continue;
        }
        if ((int) ($account["currency_id"] ?? 0) !== 2) {
            continue;
        }
        $id = (string) $account["id"];
        $minor = (int) round(((float) $account["balance"]) * 100);
        $next[] = ["id" => (int) $account["id"], "minor" => $minor];
        if (!$known || !array_key_exists($id, $prev) || $prev[$id] === $minor) {
            continue;
        }
        $delta = $minor - $prev[$id];
        if ($delta < 0 && isset($booked[abs($delta)])) {
            continue;
        }
        $ref = "pst:cuzdan:" . $id . ":" . $prev[$id] . ":" . $minor;
        if ($delta > 0) {
            clay_pst_push_money($db, $ref, "yukleme", "PST yatırım", "PST cüzdanına yatırım geçti.", $delta);
        } else {
            clay_pst_push_money($db, $ref, "transfer", "PST çekim", "PST cüzdanından çekim geçti.", $delta);
        }
    }
    if ($next) {
        $db["settings"]["pst"]["wallets"] = $next;
    }
}

function clay_pst_sync(array &$db, bool $force, int $minMs = 15000): bool
{
    clay_pst_ensure($db["settings"]);
    $config = pst_config();
    $tail = $config["token"] === "" ? "" : substr($config["token"], -4);
    $changed = ($db["settings"]["pst"]["tokenTail"] ?? "") !== $tail;
    $db["settings"]["pst"]["tokenTail"] = $tail;
    if ($config["token"] === "") {
        if (($db["settings"]["pst"]["on"] ?? false) || ($db["settings"]["pst"]["error"] ?? "") !== "") {
            $changed = true;
        }
        $db["settings"]["pst"]["on"] = false;
        $db["settings"]["pst"]["error"] = "";
        return $changed;
    }
    $seen = clay_ms((string) ($db["settings"]["pst"]["syncedAt"] ?? ""));
    if (!$force && $seen > 0 && (int) round(microtime(true) * 1000) - $seen < $minMs) {
        $queueDirty = clay_pst_run_queue($db);
        return $queueDirty;
    }
    set_time_limit(120);
    $txPages = $force ? 20 : 1;
    $rates = $force || (float) ($db["settings"]["pst"]["loadSource"] ?? 0) <= 0;
    $pulled = pst_pull($config["token"], true, $txPages, $rates);
    if (!empty($pulled["denied"])) {
        $pulled = pst_pull($config["token"], false, $txPages, $rates);
    }
    $cards = $pulled["cards"];
    $transactions = $pulled["transactions"];
    $tariffs = $pulled["tariffs"];
    $feeJson = $pulled["fees"];
    if (isset($cards["_error"]) || isset($transactions["_error"]) || isset($tariffs["_error"]) || isset($feeJson["_error"])) {
        $code = (int) ($cards["_error"] ?? $transactions["_error"] ?? $tariffs["_error"] ?? $feeJson["_error"] ?? 0);
        $db["settings"]["pst"]["on"] = true;
        $db["settings"]["pst"]["syncedAt"] = clay_now();
        $db["settings"]["pst"]["error"] = $code === 401 ? "PST anahtarı kabul edilmedi." : "PST yanıt vermedi.";
        $db["settings"]["pst"]["tokenTail"] = $tail;
        return true;
    }
    $fees = is_array($feeJson["data"] ?? null) ? $feeJson["data"] : [];
    $applied = clay_pst_apply($db, $cards, $transactions, $tariffs, $fees);
    clay_pst_cash($db, is_array($pulled["accounts"] ?? null) ? $pulled["accounts"] : [], is_array($pulled["withdrawals"] ?? null) ? $pulled["withdrawals"] : []);
    $pstTx = 0;
    foreach ($db["transactions"] as $entry) {
        if (str_starts_with((string) ($entry["ref"] ?? ""), "pst:")) {
            $pstTx += 1;
        }
    }
    $db["settings"]["pst"]["transactions"] = $pstTx;
    clay_pst_run_queue($db);
    return $applied;
}
