<?php
/**
 * Shared CLAY ledger. The JSON file is the authority when PHP runs.
 * Money changes happen here. The browser cannot submit a balance.
 */

if (PHP_SAPI !== "cli" && realpath((string) ($_SERVER["SCRIPT_FILENAME"] ?? "")) === realpath(__FILE__)) {
    http_response_code(404);
    exit;
}

if (!function_exists("mb_strlen")) {
    function mb_strlen($string, $encoding = null): int
    {
        return preg_match_all("/./u", (string) $string);
    }
    function mb_substr($string, $start, $length = null, $encoding = null): string
    {
        preg_match_all("/./u", (string) $string, $chars);
        $slice = array_slice($chars[0], $start, $length ?? count($chars[0]));
        return implode("", $slice);
    }
    function mb_strtoupper($string, $encoding = null): string
    {
        return strtoupper((string) $string);
    }
}

function clay_now(): string
{
    return (new DateTimeImmutable("now", new DateTimeZone("UTC")))->format("Y-m-d\\TH:i:s.v\\Z");
}

function clay_ms(string $iso): int
{
    try {
        $dt = new DateTimeImmutable($iso);
    } catch (Exception $e) {
        return 0;
    }
    return ((int) $dt->format("U")) * 1000 + (int) $dt->format("v");
}

function clay_iso(int $ms): string
{
    $sec = intdiv($ms, 1000);
    $frac = $ms % 1000;
    if ($frac < 0) {
        $sec -= 1;
        $frac += 1000;
    }
    $dt = (new DateTimeImmutable("@" . $sec))->setTimezone(new DateTimeZone("UTC"));
    return $dt->format("Y-m-d\\TH:i:s") . sprintf(".%03dZ", $frac);
}

function clay_kurus(int $minor): int
{
    return (int) round($minor * 49.3929);
}

function clay_tl(int $kurus): string
{
    $neg = $kurus < 0;
    $abs = abs($kurus);
    $text = number_format(intdiv($abs, 100), 0, ",", ".") . "," . str_pad((string) ($abs % 100), 2, "0", STR_PAD_LEFT);
    return ($neg ? "-" : "") . "₺" . $text;
}

function clay_usd(int $minor): string
{
    $neg = $minor < 0;
    $abs = abs($minor);
    $text = number_format(intdiv($abs, 100), 0, ",", ".") . "," . str_pad((string) ($abs % 100), 2, "0", STR_PAD_LEFT);
    return ($neg ? "-" : "") . $text . " USD";
}

function clay_percent(float $value): string
{
    $text = rtrim(rtrim(number_format($value, 1, ".", ""), "0"), ".");
    if ($text === "") {
        $text = "0";
    }
    return str_replace(".", ",", $text);
}

function clay_load_fee(float $percent, int $amount): int
{
    return (int) round(($amount * (int) round($percent * 100)) / 10000);
}

function clay_xfer_fee(float $percent, int $amount): int
{
    return (int) round(($amount * $percent) / 100);
}

function clay_rid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return substr($hex, 0, 8) . "-" . substr($hex, 8, 4) . "-" . substr($hex, 12, 4) . "-" . substr($hex, 16, 4) . "-" . substr($hex, 20);
}

function clay_in(array $in, string $key): string
{
    $value = $in[$key] ?? "";
    return is_string($value) ? $value : (is_numeric($value) ? (string) $value : "");
}

function clay_cents(string $raw): ?int
{
    $normalized = str_replace(",", ".", str_replace(" ", "", trim($raw)));
    if (!preg_match("/^\\d+(\\.\\d{1,2})?$/", $normalized)) {
        return null;
    }
    $parts = explode(".", $normalized);
    $frac = str_pad($parts[1] ?? "", 2, "0");
    return ((int) $parts[0]) * 100 + (int) substr($frac, 0, 2);
}

function clay_signed_cents(string $raw): ?int
{
    $trimmed = str_replace([" ", "−"], ["", "-"], trim($raw));
    $negative = str_starts_with($trimmed, "-");
    $body = $negative ? substr($trimmed, 1) : (string) preg_replace("/^\\+/", "", $trimmed);
    $amount = clay_cents($body);
    if ($amount === null) {
        return null;
    }
    return $negative ? -$amount : $amount;
}

function clay_username(string $raw): ?string
{
    $username = strtolower(trim($raw));
    if (!preg_match("/^[a-z0-9_]{2,24}$/", $username)) {
        return null;
    }
    return $username;
}

function clay_address(string $raw): ?string
{
    $address = trim((string) preg_replace("/\\s+/u", " ", $raw));
    if ($address === "") {
        return "";
    }
    if (mb_strlen($address) > 120) {
        return null;
    }
    if (!preg_match("/^[\\p{L}\\p{M}\\p{N} .,\\/'#+\\-]+$/u", $address)) {
        return null;
    }
    return $address;
}

function clay_display_name(string $raw): ?string
{
    $name = trim((string) preg_replace("/\\s+/u", " ", $raw));
    if (mb_strlen($name) < 2 || mb_strlen($name) > 40) {
        return null;
    }
    if (!preg_match("/^[\\p{L}][\\p{L}\\p{M} .'\\-]*$/u", $name)) {
        return null;
    }
    return $name;
}

function clay_holder(string $name): string
{
    $name = strtr($name, ["i" => "İ", "ı" => "I"]);
    return mb_substr(mb_strtoupper($name, "UTF-8"), 0, 24, "UTF-8");
}

function clay_istanbul_iso(string $value): ?string
{
    if (!preg_match("/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$/", $value)) {
        return null;
    }
    $dt = DateTimeImmutable::createFromFormat("Y-m-d\\TH:i", $value, new DateTimeZone("Europe/Istanbul"));
    if (!$dt) {
        return null;
    }
    return $dt->setTimezone(new DateTimeZone("UTC"))->format("Y-m-d\\TH:i:s.v\\Z");
}

function clay_luhn_digit(string $payload): string
{
    $sum = 0;
    $double = true;
    for ($i = strlen($payload) - 1; $i >= 0; $i--) {
        $digit = (int) $payload[$i];
        if ($double) {
            $digit *= 2;
            if ($digit > 9) {
                $digit -= 9;
            }
        }
        $sum += $digit;
        $double = !$double;
    }
    return (string) ((10 - ($sum % 10)) % 10);
}

function clay_luhn_ok(string $num): bool
{
    if (!preg_match("/^\\d+$/", $num)) {
        return false;
    }
    $sum = 0;
    $double = false;
    for ($i = strlen($num) - 1; $i >= 0; $i--) {
        $digit = (int) $num[$i];
        if ($double) {
            $digit *= 2;
            if ($digit > 9) {
                $digit -= 9;
            }
        }
        $sum += $digit;
        $double = !$double;
    }
    return $sum % 10 === 0;
}

function clay_pan(int $serial, string $bin): string
{
    $accountLen = 15 - strlen($bin);
    $body = $bin . str_pad((string) ($serial % (10 ** $accountLen)), $accountLen, "0", STR_PAD_LEFT);
    return $body . clay_luhn_digit($body);
}

function clay_cvv(int $serial): string
{
    return (string) (($serial * 97 + 13) % 900 + 100);
}

function clay_expiry(): string
{
    $now = new DateTimeImmutable("now", new DateTimeZone("UTC"));
    $month = ((((int) $now->format("n")) - 1 + 8) % 12) + 1;
    $year = (((int) $now->format("Y")) + 3) % 100;
    return sprintf("%02d/%02d", $month, $year);
}

function clay_is_plan(string $value): bool
{
    return $value === "kivilcim" || $value === "atolye" || $value === "galeri";
}

function clay_is_type(string $value): bool
{
    return in_array($value, ["facebook_ads", "tiktok", "google_ads", "ultima"], true);
}

function clay_merchants(string $type): array
{
    $all = [
        "facebook_ads" => ["Vitrin Akış", "Mavi Sayfa", "Sahne Reklam"],
        "tiktok" => ["Kısa Sahne", "Nota Akış", "Gece Klip"],
        "google_ads" => ["Arama Vitrini", "Kelime Tezgahı", "Harita Vitrin"],
        "ultima" => ["Ultima Salon", "Metal Gece", "Kule Rezerv"],
    ];
    return $all[$type] ?? [];
}

function clay_default_settings(): array
{
    return [
        "issueFeeKurus" => 30000,
        "loadFeePercent" => 7.3,
        "transferFeePercent" => 4.0,
        "plans" => [
            "kivilcim" => [
                "name" => "Clay Bronze",
                "priceUsdMinor" => 1000,
                "cardLimit" => 2,
                "blurb" => "En fazla 2 kart. Her kart 300₺. İkisinden fazlası için plan yükselir.",
            ],
            "atolye" => [
                "name" => "Clay Silver",
                "priceUsdMinor" => 2500,
                "cardLimit" => 8,
                "blurb" => "En fazla 8 kart. Her kart 300₺. Bronze dolunca buraya geçilir.",
            ],
            "galeri" => [
                "name" => "Clay Gold",
                "priceUsdMinor" => 5000,
                "cardLimit" => 25,
                "blurb" => "En fazla 25 kart. Her kart 300₺. Bu sayının üstü açılmaz.",
            ],
        ],
        "telegram" => "",
    ];
}

function clay_admin_record(): array
{
    return [
        "id" => "usr_admin",
        "name" => "CLAY Yönetici",
        "username" => "clayadmin",
        "password" => "clayadmin",
        "balance" => 0,
        "usdMinor" => 0,
        "plan" => "kivilcim",
        "role" => "yonetici",
        "status" => "acik",
        "address" => "",
        "createdAt" => "2026-09-01T08:00:00.000Z",
    ];
}

function clay_user_index(array $db, string $id): int
{
    foreach ($db["users"] as $i => $user) {
        if (($user["id"] ?? "") === $id) {
            return $i;
        }
    }
    return -1;
}

function clay_card_index(array $db, string $id, ?string $userId = null): int
{
    foreach ($db["cards"] as $i => $card) {
        if (($card["id"] ?? "") !== $id) {
            continue;
        }
        if ($userId !== null && ($card["userId"] ?? "") !== $userId) {
            continue;
        }
        return $i;
    }
    return -1;
}

function clay_open_count(array $db, string $userId): int
{
    $count = 0;
    foreach ($db["cards"] as $card) {
        if (($card["userId"] ?? "") === $userId && ($card["status"] ?? "") !== "kapali") {
            $count += 1;
        }
    }
    return $count;
}

function clay_notice(array &$db, string $userId, string $title, string $body, ?string $ref = null): void
{
    if ($ref !== null) {
        foreach ($db["notices"] as $note) {
            if (($note["ref"] ?? null) === $ref) {
                return;
            }
        }
    }
    $db["notices"][] = [
        "id" => "nt_" . clay_rid(),
        "userId" => $userId,
        "batch" => clay_rid(),
        "title" => $title,
        "body" => $body,
        "createdAt" => clay_now(),
        "readAt" => null,
        "ref" => $ref,
    ];
}

function clay_max_balance(): int
{
    return clay_kurus(2000000);
}

function clay_max_limit(): int
{
    return clay_kurus(1000000);
}

function clay_sweep_fees(array &$db): bool
{
    $now = (int) round(microtime(true) * 1000);
    $step = 30 * 86400000;
    $fee = (int) ($db["settings"]["issueFeeKurus"] ?? 30000);
    $dirty = false;
    foreach ($db["cards"] as $i => $card) {
        if (($card["status"] ?? "") === "kapali") {
            continue;
        }
        $start = clay_ms((string) ($card["createdAt"] ?? ""));
        if ($start <= 0) {
            continue;
        }
        $userIndex = clay_user_index($db, (string) $card["userId"]);
        if ($userIndex < 0) {
            continue;
        }
        $due = $start + $step;
        $guard = 0;
        while ($due <= $now && $guard < 36) {
            $guard += 1;
            $ref = "kart-odeme:" . $card["id"] . ":" . $due;
            $paid = false;
            foreach ($db["transactions"] as $entry) {
                if (($entry["ref"] ?? null) === $ref) {
                    $paid = true;
                    break;
                }
            }
            if ($paid || $fee <= 0) {
                $due += $step;
                continue;
            }
            if ($db["users"][$userIndex]["balance"] < $fee) {
                $noticeRef = "kart-odeme-yok:" . $card["id"] . ":" . $due;
                $exists = false;
                foreach ($db["notices"] as $note) {
                    if (($note["ref"] ?? null) === $noticeRef) {
                        $exists = true;
                        break;
                    }
                }
                if (!$exists) {
                    clay_notice(
                        $db,
                        $db["users"][$userIndex]["id"],
                        "Kart ödemesi bekliyor",
                        $card["label"] . " kartının " . clay_tl($fee) . " ödemesi için bakiye yetmedi. Kart açık kaldı.",
                        $noticeRef
                    );
                    $dirty = true;
                }
                break;
            }
            $db["users"][$userIndex]["balance"] -= $fee;
            $db["transactions"][] = [
                "id" => "tx_" . clay_rid(),
                "userId" => $db["users"][$userIndex]["id"],
                "cardId" => $card["id"],
                "kind" => "duzeltme",
                "title" => "Kart ödemesi · " . $card["label"],
                "note" => "30 günlük kart bedeli.",
                "amount" => -$fee,
                "usdMinor" => null,
                "status" => "tamamlandi",
                "createdAt" => clay_now(),
                "ref" => $ref,
            ];
            clay_notice(
                $db,
                $db["users"][$userIndex]["id"],
                "Kart ödemesi düştü",
                $card["label"] . " için " . clay_tl($fee) . " kart bedeli bakiyeden düştü. Kalan bakiye " . clay_tl($db["users"][$userIndex]["balance"]) . ".",
                "note:" . $ref
            );
            $dirty = true;
            $due += $step;
        }
        $iso = clay_iso($due);
        if (($db["cards"][$i]["feeDueAt"] ?? null) !== $iso) {
            $db["cards"][$i]["feeDueAt"] = $iso;
            $dirty = true;
        }
    }
    return $dirty;
}

function clay_normalize(array &$db): bool
{
    $dirty = false;
    foreach (["users", "cards", "transactions", "notices", "tickets", "bins", "orders"] as $key) {
        if (!isset($db[$key]) || !is_array($db[$key])) {
            $db[$key] = [];
            $dirty = true;
        }
    }
    if (!isset($db["settings"]) || !is_array($db["settings"]) || !isset($db["settings"]["plans"])) {
        $db["settings"] = clay_default_settings();
        $dirty = true;
    } else {
        $fresh = clay_default_settings();
        foreach (["issueFeeKurus", "loadFeePercent", "transferFeePercent", "telegram"] as $key) {
            if (!isset($db["settings"][$key]) || ($key !== "telegram" && !is_numeric($db["settings"][$key]))) {
                $db["settings"][$key] = $fresh[$key];
                $dirty = true;
            }
        }
        if (!is_string($db["settings"]["telegram"])) {
            $db["settings"]["telegram"] = "";
            $dirty = true;
        }
        foreach (["kivilcim", "atolye", "galeri"] as $id) {
            $row = $db["settings"]["plans"][$id] ?? null;
            if (!is_array($row) || !isset($row["name"], $row["priceUsdMinor"], $row["cardLimit"], $row["blurb"])) {
                $db["settings"]["plans"][$id] = $fresh["plans"][$id];
                $dirty = true;
            }
        }
    }
    $hasAdmin = false;
    foreach ($db["users"] as $i => $user) {
        $username = (string) ($user["username"] ?? "");
        if (($username === "admin" || ($user["id"] ?? "") === "usr_admin") && ($user["role"] ?? "") === "yonetici") {
            $db["users"][$i]["username"] = "clayadmin";
            if (($user["password"] ?? "") === "admin123") {
                $db["users"][$i]["password"] = "clayadmin";
            }
            $db["users"][$i]["role"] = "yonetici";
            $dirty = true;
            $username = "clayadmin";
        }
        if ($username === "clayadmin") {
            $hasAdmin = true;
            if (($db["users"][$i]["role"] ?? "") !== "yonetici") {
                $db["users"][$i]["role"] = "yonetici";
                $dirty = true;
            }
        }
        if (!is_string($db["users"][$i]["password"] ?? null) || $db["users"][$i]["password"] === "") {
            if ($username === "clayadmin" || $username === "admin") {
                $db["users"][$i]["password"] = "clayadmin";
            } elseif ($username === "demo") {
                $db["users"][$i]["password"] = "demo123";
            }
            $dirty = true;
        }
        if (!isset($db["users"][$i]["address"]) || !is_string($db["users"][$i]["address"])) {
            $db["users"][$i]["address"] = "";
            $dirty = true;
        }
        if (!isset($db["users"][$i]["usdMinor"]) || !is_numeric($db["users"][$i]["usdMinor"]) || $db["users"][$i]["usdMinor"] < 0) {
            $db["users"][$i]["usdMinor"] = 0;
            $dirty = true;
        }
        unset($db["users"][$i]["email"], $db["users"][$i]["passwordHash"]);
    }
    if (!$hasAdmin) {
        $db["users"][] = clay_admin_record();
        $dirty = true;
    }
    $kept = ["facebook_ads" => true, "tiktok" => true, "google_ads" => true, "ultima" => true];
    $cards = [];
    foreach ($db["cards"] as $card) {
        if (!isset($kept[$card["type"] ?? ""])) {
            $dirty = true;
            continue;
        }
        if (!isset($card["readyAt"])) {
            $card["readyAt"] = null;
            $dirty = true;
        }
        if (!isset($card["period"]) || !is_numeric($card["period"]) || $card["period"] < 1) {
            $card["period"] = 1;
            $dirty = true;
        }
        if (!preg_match("/^\\d{4,8}$/", (string) ($card["bin"] ?? ""))) {
            $card["bin"] = substr((string) $card["pan"], 0, 6);
            $dirty = true;
        }
        if (!isset($card["binLabel"]) || !is_string($card["binLabel"])) {
            $card["binLabel"] = "";
            $dirty = true;
        }
        if (($card["status"] ?? "") === "hazirlaniyor") {
            $ready = clay_ms((string) ($card["readyAt"] ?? ""));
            $now = (int) round(microtime(true) * 1000);
            if ($ready <= 0 || $ready <= $now) {
                $card["status"] = "aktif";
                $card["readyAt"] = null;
                $ref = "hazir:" . $card["id"];
                clay_notice($db, (string) $card["userId"], "Kart hazır", "Kartınız tamamlandı. Kartlar bölümünden bakabilirsiniz.", $ref);
                foreach ($db["orders"] as $n => $order) {
                    if (($order["cardId"] ?? "") === $card["id"] && ($order["status"] ?? "") === "hazirlaniyor") {
                        $db["orders"][$n]["status"] = "hazir";
                        $db["orders"][$n]["readyAt"] = null;
                    }
                }
                $dirty = true;
            }
        }
        $cards[] = $card;
    }
    if (count($cards) !== count($db["cards"])) {
        $dirty = true;
    }
    $db["cards"] = $cards;
    $bins = [];
    foreach ($db["bins"] as $row) {
        if (isset($kept[$row["type"] ?? ""])) {
            $bins[] = $row;
        } else {
            $dirty = true;
        }
    }
    $db["bins"] = $bins;
    foreach (array_keys($kept) as $type) {
        $found = false;
        foreach ($db["bins"] as $row) {
            if (($row["type"] ?? "") === $type) {
                $found = true;
                break;
            }
        }
        if (!$found) {
            $db["bins"][] = ["id" => "bin_" . $type, "type" => $type, "label" => "Standart", "digits" => "400000"];
            $dirty = true;
        }
    }
    foreach ($db["transactions"] as $i => $entry) {
        if (!array_key_exists("usdMinor", $entry)) {
            $db["transactions"][$i]["usdMinor"] = null;
            $dirty = true;
        }
        if (!array_key_exists("ref", $entry)) {
            $db["transactions"][$i]["ref"] = null;
            $dirty = true;
        }
    }
    if ($db["orders"] === []) {
        foreach ($db["cards"] as $card) {
            $fee = 30000;
            foreach ($db["transactions"] as $entry) {
                if (($entry["cardId"] ?? "") === $card["id"] && ($entry["kind"] ?? "") === "basim") {
                    $fee = abs((int) $entry["amount"]);
                    break;
                }
            }
            $db["orders"][] = [
                "id" => "ord_" . $card["id"],
                "userId" => $card["userId"],
                "cardId" => $card["id"],
                "type" => $card["type"],
                "label" => $card["label"],
                "limit" => $card["limit"],
                "fee" => $fee,
                "status" => ($card["status"] ?? "") === "hazirlaniyor" ? "hazirlaniyor" : "hazir",
                "createdAt" => $card["createdAt"],
                "readyAt" => ($card["status"] ?? "") === "hazirlaniyor" ? $card["readyAt"] : null,
            ];
        }
        $dirty = true;
    }
    if (clay_sweep_fees($db)) {
        $dirty = true;
    }
    foreach (["users", "cards", "transactions", "notices", "tickets", "bins", "orders"] as $key) {
        $db[$key] = array_values($db[$key]);
    }
    return $dirty;
}

function clay_assert(array $db): bool
{
    foreach ($db["users"] as $user) {
        if (($user["balance"] ?? 0) < 0 || ($user["usdMinor"] ?? 0) < 0) {
            return false;
        }
    }
    foreach ($db["cards"] as $card) {
        $pan = (string) ($card["pan"] ?? "");
        $bin = (string) ($card["bin"] ?? "");
        if (!preg_match("/^\\d{16}$/", $pan) || !clay_luhn_ok($pan) || !str_starts_with($pan, $bin)) {
            return false;
        }
        if (($card["spent"] ?? 0) < 0 || ($card["spent"] ?? 0) > ($card["limit"] ?? 0)) {
            return false;
        }
    }
    return true;
}

function clay_refund_fee(array &$db, int $userIndex, array $card): string
{
    $basim = null;
    foreach ($db["transactions"] as $entry) {
        if (($entry["cardId"] ?? null) === $card["id"] && ($entry["kind"] ?? "") === "basim" && ($entry["status"] ?? "") === "tamamlandi" && ($entry["amount"] ?? 0) < 0) {
            $basim = $entry;
            break;
        }
    }
    if (!$basim) {
        return "yok";
    }
    foreach ($db["transactions"] as $entry) {
        if (($entry["cardId"] ?? null) === $card["id"] && str_starts_with((string) ($entry["title"] ?? ""), "Basım iadesi")) {
            return "yok";
        }
    }
    $fee = -((int) $basim["amount"]);
    if ($db["users"][$userIndex]["balance"] + $fee > clay_max_balance()) {
        return "tavan";
    }
    $db["users"][$userIndex]["balance"] += $fee;
    $db["transactions"][] = [
        "id" => "tx_" . clay_rid(),
        "userId" => $db["users"][$userIndex]["id"],
        "cardId" => $card["id"],
        "kind" => "duzeltme",
        "title" => "Basım iadesi · " . $card["label"],
        "note" => "Basım ücreti bakiyeye geri yazıldı.",
        "amount" => $fee,
        "usdMinor" => null,
        "status" => "tamamlandi",
        "createdAt" => clay_now(),
        "ref" => null,
    ];
    return "ok";
}

function clay_public_user(array $user): array
{
    return [
        "id" => $user["id"],
        "name" => $user["name"],
        "username" => $user["username"],
        "balance" => $user["balance"],
        "usdMinor" => $user["usdMinor"],
        "plan" => $user["plan"],
        "role" => $user["role"],
        "status" => $user["status"],
        "address" => $user["address"] ?? "",
    ];
}

function clay_view(array $db, ?array $me): array
{
    $lists = ["users", "cards", "transactions", "notices", "tickets", "bins", "orders"];
    foreach ($lists as $key) {
        $db[$key] = array_values($db[$key] ?? []);
    }
    if (!$me) {
        return [
            "users" => [],
            "cards" => [],
            "transactions" => [],
            "notices" => [],
            "tickets" => [],
            "bins" => $db["bins"],
            "orders" => [],
            "settings" => $db["settings"],
            "nextSerial" => 0,
        ];
    }
    if (($me["role"] ?? "") === "yonetici") {
        return $db;
    }
    $id = (string) $me["id"];
    $mine = static function (array $rows) use ($id): array {
        $out = [];
        foreach ($rows as $row) {
            if (($row["userId"] ?? "") === $id) {
                $out[] = $row;
            }
        }
        return $out;
    };
    $users = [];
    foreach ($db["users"] as $user) {
        if (($user["id"] ?? "") === $id) {
            $user["password"] = "";
            $users[] = $user;
        }
    }
    return [
        "users" => $users,
        "cards" => $mine($db["cards"]),
        "transactions" => $mine($db["transactions"]),
        "notices" => $mine($db["notices"]),
        "tickets" => $mine($db["tickets"]),
        "bins" => $db["bins"],
        "orders" => $mine($db["orders"]),
        "settings" => $db["settings"],
        "nextSerial" => 0,
    ];
}

function clay_session_user(array $db): ?array
{
    $id = $_SESSION["uid"] ?? "";
    if (!is_string($id) || $id === "") {
        return null;
    }
    $index = clay_user_index($db, $id);
    if ($index < 0 || ($db["users"][$index]["status"] ?? "") === "askida") {
        unset($_SESSION["uid"]);
        return null;
    }
    return $db["users"][$index];
}

function clay_store_path(): string
{
    return __DIR__ . "/clay-ledger.json";
}

function clay_load_raw(): array
{
    $handle = fopen(clay_store_path(), "c+");
    if ($handle === false) {
        return [null, null];
    }
    flock($handle, LOCK_EX);
    $raw = stream_get_contents($handle);
    $db = json_decode($raw ?: "", true);
    if (!is_array($db) || !isset($db["users"]) || !is_array($db["users"])) {
        $seed = json_decode((string) file_get_contents(__DIR__ . "/clay-seed.json"), true);
        if (!is_array($seed)) {
            flock($handle, LOCK_UN);
            fclose($handle);
            return [null, null];
        }
        $db = $seed;
    }
    return [$handle, $db];
}

function clay_commit($handle, array $db): void
{
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($db, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

function clay_release($handle): void
{
    flock($handle, LOCK_UN);
    fclose($handle);
}

function clay_credit_apply(array &$db, string $userId, string $orderId, int $cents): string
{
    if (!preg_match("/^clay-[a-f0-9]{16}$/", $orderId)) {
        return "tutar";
    }
    if ($cents < 100 || $cents > 500000) {
        return "tutar";
    }
    $credit = clay_kurus($cents);
    $ref = "heleket:" . $orderId;
    foreach ($db["transactions"] as $entry) {
        if (($entry["ref"] ?? null) === $ref) {
            return "var";
        }
    }
    $index = clay_user_index($db, $userId);
    if ($index < 0) {
        return "yok";
    }
    if ($db["users"][$index]["balance"] + $credit > clay_max_balance()) {
        return "tavan";
    }
    $db["users"][$index]["balance"] += $credit;
    $db["transactions"][] = [
        "id" => "tx_" . clay_rid(),
        "userId" => $db["users"][$index]["id"],
        "cardId" => null,
        "kind" => "yukleme",
        "title" => "Heleket yüklemesi",
        "note" => clay_usd($cents) . " × 49,3929 = " . clay_tl($credit) . ". Heleket ödemesi, sabit kur 15 Eki 2026.",
        "amount" => $credit,
        "usdMinor" => $cents,
        "status" => "tamamlandi",
        "createdAt" => clay_now(),
        "ref" => $ref,
    ];
    clay_notice(
        $db,
        $db["users"][$index]["id"],
        "Bakiye yüklendi",
        "Bakiyeniz yüklendi. " . clay_usd($cents) . " karşılığı " . clay_tl($credit) . " yazıldı.",
        "note:" . $ref
    );
    return "ok";
}

function clay_credit_heleket(string $userId, string $orderId, int $cents): string
{
    [$handle, $db] = clay_load_raw();
    if (!$handle) {
        return "e-defter";
    }
    clay_normalize($db);
    $code = clay_credit_apply($db, $userId, $orderId, $cents);
    if (!clay_assert($db)) {
        clay_release($handle);
        return "e-defter";
    }
    clay_commit($handle, $db);
    return $code;
}

function clay_payment_row(string $orderId): ?array
{
    $path = __DIR__ . "/heleket-payments.json";
    if (!is_file($path)) {
        return null;
    }
    $handle = fopen($path, "r");
    if ($handle === false) {
        return null;
    }
    flock($handle, LOCK_SH);
    $data = json_decode(stream_get_contents($handle) ?: "", true);
    flock($handle, LOCK_UN);
    fclose($handle);
    if (!is_array($data) || !isset($data[$orderId]) || !is_array($data[$orderId])) {
        return null;
    }
    return $data[$orderId];
}

function clay_fail(string $code): array
{
    return ["code" => $code, "save" => false];
}

function clay_ok(string $code, ?string $id = null): array
{
    $out = ["code" => $code, "save" => true];
    if ($id !== null) {
        $out["id"] = $id;
    }
    return $out;
}

function clay_member(?array $me): ?array
{
    if (!$me) {
        return clay_fail("giris");
    }
    if (($me["role"] ?? "") !== "uye") {
        return clay_fail("e-yonetici");
    }
    return null;
}

function clay_admin(?array $me): ?array
{
    if (!$me) {
        return clay_fail("giris");
    }
    if (($me["role"] ?? "") !== "yonetici") {
        return clay_fail("e-yonetici");
    }
    return null;
}

function clay_bin_draft(array $in): ?array
{
    $label = trim((string) preg_replace("/\\s+/u", " ", clay_in($in, "etiket")));
    $digits = (string) preg_replace("/\\s/", "", clay_in($in, "rakam"));
    if (mb_strlen($label) < 2 || mb_strlen($label) > 40 || !preg_match("/^\\d{4,8}$/", $digits)) {
        return null;
    }
    return ["label" => $label, "digits" => $digits];
}

function clay_paste_line(string $line): ?array
{
    $trimmed = trim($line);
    if ($trimmed === "" || str_starts_with($trimmed, "#")) {
        return null;
    }
    if (str_contains($trimmed, "|")) {
        $parts = explode("|", $trimmed);
        $digits = (string) preg_replace("/\\s/", "", (string) array_pop($parts));
        $label = trim((string) preg_replace("/\\s+/u", " ", implode("|", $parts)));
    } else {
        $bits = preg_split("/\\s+/", $trimmed) ?: [];
        $digits = (string) preg_replace("/\\s/", "", (string) array_pop($bits));
        $label = trim((string) preg_replace("/\\s+/u", " ", substr($trimmed, 0, strlen($trimmed) - strlen($digits))));
    }
    if (mb_strlen($label) < 2 || mb_strlen($label) > 40 || !preg_match("/^\\d{4,8}$/", $digits)) {
        return null;
    }
    return ["label" => $label, "digits" => $digits];
}

function clay_telegram(string $raw): ?string
{
    $value = trim($raw);
    $value = (string) preg_replace("#^https?://#i", "", $value);
    $value = (string) preg_replace("#^(www\\.)?t\\.me/#i", "", $value);
    $value = ltrim($value, "@");
    $parts = preg_split("/[\\/?#]/", $value) ?: [];
    $value = $parts[0] ?? "";
    if (!preg_match("/^[A-Za-z][A-Za-z0-9_]{4,31}$/", $value)) {
        return null;
    }
    return $value;
}

function clay_act(array &$db, ?array $me, string $action, array $in): array
{
    if ($action === "state") {
        return ["code" => "ok", "save" => false];
    }
    if ($action === "login") {
        $username = clay_username(clay_in($in, "kullanici"));
        $password = clay_in($in, "parola");
        if (!$username) {
            return clay_fail("e-giris");
        }
        foreach ($db["users"] as $user) {
            if (($user["username"] ?? "") !== $username) {
                continue;
            }
            if (($user["password"] ?? "") !== $password) {
                return clay_fail("e-giris");
            }
            if (($user["status"] ?? "") === "askida") {
                return clay_fail("e-askida");
            }
            session_regenerate_id(true);
            $_SESSION["uid"] = $user["id"];
            return ["code" => "ok", "save" => false];
        }
        return clay_fail("e-giris");
    }
    if ($action === "logout") {
        unset($_SESSION["uid"]);
        return ["code" => "ok", "save" => false];
    }
    if ($action === "register") {
        $username = clay_username(clay_in($in, "kullanici"));
        $password = clay_in($in, "parola");
        if (!$username) {
            return clay_fail("e-kullanici");
        }
        if (strlen($password) < 6 || strlen($password) > 72) {
            return clay_fail("e-parola");
        }
        foreach ($db["users"] as $user) {
            if (($user["username"] ?? "") === $username) {
                return clay_fail("e-var");
            }
        }
        $bonus = clay_kurus(3000);
        $id = "usr_" . clay_rid();
        $db["users"][] = [
            "id" => $id,
            "name" => $username,
            "username" => $username,
            "password" => $password,
            "balance" => $bonus,
            "usdMinor" => 0,
            "plan" => "kivilcim",
            "role" => "uye",
            "status" => "acik",
            "address" => "",
            "createdAt" => clay_now(),
        ];
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $id,
            "cardId" => null,
            "kind" => "yukleme",
            "title" => "Hoş geldin bakiyesi",
            "note" => "30 USD sabit kur karşılığı.",
            "amount" => $bonus,
            "usdMinor" => 3000,
            "status" => "tamamlandi",
            "createdAt" => clay_now(),
            "ref" => null,
        ];
        clay_notice($db, $id, "Hoş geldin", clay_tl($bonus) . " bakiyen hazır. İlk kartını basabilirsin.");
        session_regenerate_id(true);
        $_SESSION["uid"] = $id;
        return clay_ok("ok");
    }
    if ($action === "heleket") {
        $gate = clay_member($me);
        if ($gate) {
            return $gate;
        }
        $orderId = clay_in($in, "orderId");
        $row = clay_payment_row($orderId);
        if (!$row || ($row["user_id"] ?? "") !== $me["id"]) {
            return clay_fail("yok");
        }
        $status = (string) ($row["status"] ?? "");
        if ($status !== "paid" && $status !== "paid_over") {
            return clay_fail("tutar");
        }
        $cents = (int) round((float) ($row["amount"] ?? "0") * 100);
        $code = clay_credit_apply($db, (string) $me["id"], $orderId, $cents);
        return $code === "ok" || $code === "var" ? clay_ok($code) : clay_fail($code);
    }

    $memberActions = ["issue", "fund", "freeze", "activate", "close", "cancel", "plan", "spend", "ticket", "refund", "renew", "transfer", "address", "name", "password", "notice-read", "notice-read-all"];
    $adminActions = ["admin-balance", "admin-card", "admin-account", "admin-notice", "admin-ticket", "admin-set-balance", "admin-edit-card", "admin-edit-tx", "admin-bin-add", "admin-bin-save", "admin-bin-remove", "admin-bin-paste", "admin-password", "admin-telegram", "admin-fees", "admin-plan", "admin-topup"];
    if (in_array($action, $memberActions, true)) {
        $gate = clay_member($me);
        if ($gate) {
            return $gate;
        }
    } elseif (in_array($action, $adminActions, true)) {
        $gate = clay_admin($me);
        if ($gate) {
            return $gate;
        }
    } else {
        return clay_fail("e-yok");
    }

    $userIndex = clay_user_index($db, (string) $me["id"]);

    if ($action === "plan") {
        $plan = clay_in($in, "plan");
        if (!clay_is_plan($plan)) {
            return clay_fail("e-plan");
        }
        if (($db["users"][$userIndex]["plan"] ?? "") === $plan) {
            return clay_fail("plan-ayni");
        }
        $priced = $db["settings"]["plans"][$plan];
        if (clay_open_count($db, $me["id"]) > (int) $priced["cardLimit"]) {
            return clay_fail("e-plan-dolu");
        }
        $price = clay_kurus((int) $priced["priceUsdMinor"]);
        if ($price > $db["users"][$userIndex]["balance"]) {
            return clay_fail("e-bakiye");
        }
        if ($price > 0) {
            $db["users"][$userIndex]["balance"] -= $price;
            $db["transactions"][] = [
                "id" => "tx_" . clay_rid(),
                "userId" => $me["id"],
                "cardId" => null,
                "kind" => "duzeltme",
                "title" => "Plan · " . $priced["name"],
                "note" => "Plan ücreti bakiyeden düştü.",
                "amount" => -$price,
                "usdMinor" => -((int) $priced["priceUsdMinor"]),
                "status" => "tamamlandi",
                "createdAt" => clay_now(),
                "ref" => null,
            ];
        }
        $db["users"][$userIndex]["plan"] = $plan;
        clay_notice($db, $me["id"], "Plan güncellendi", "Vitrin planın " . $priced["name"] . " oldu. Plan ücreti " . clay_tl($price) . " bakiyeden düştü. Kalan bakiye " . clay_tl($db["users"][$userIndex]["balance"]) . ".");
        return clay_ok("plan");
    }

    if ($action === "issue") {
        $type = clay_in($in, "tur");
        $label = trim((string) preg_replace("/\\s+/u", " ", clay_in($in, "etiket")));
        $limitCents = clay_cents(clay_in($in, "limit"));
        $binId = clay_in($in, "bin");
        $hesap = clay_in($in, "hesap");
        if (!clay_is_type($type)) {
            return clay_fail("e-tur");
        }
        if (mb_strlen($label) < 2 || mb_strlen($label) > 32) {
            return clay_fail("e-etiket");
        }
        if ($limitCents === null || $limitCents < 1000 || $limitCents > 1000000) {
            return clay_fail("e-limit");
        }
        if ($hesap !== $me["id"]) {
            return clay_fail("e-hesap");
        }
        $gross = clay_kurus($limitCents);
        $percent = (float) $db["settings"]["loadFeePercent"];
        $commission = clay_load_fee($percent, $gross);
        $net = $gross - $commission;
        if ($net < 1 || $net > clay_max_limit()) {
            return clay_fail("e-limit");
        }
        $chosen = null;
        foreach ($db["bins"] as $row) {
            if (($row["id"] ?? "") === $binId && ($row["type"] ?? "") === $type) {
                $chosen = $row;
                break;
            }
        }
        if (!$chosen) {
            return clay_fail("e-bin");
        }
        $fee = (int) $db["settings"]["issueFeeKurus"];
        if ($db["users"][$userIndex]["balance"] < $fee + $gross) {
            return clay_fail("e-bakiye");
        }
        if (clay_open_count($db, $me["id"]) >= (int) $db["settings"]["plans"][$db["users"][$userIndex]["plan"]]["cardLimit"]) {
            return clay_fail("e-plan");
        }
        $serial = (int) $db["nextSerial"];
        $db["nextSerial"] = $serial + 1;
        $now = clay_now();
        $readyAt = clay_iso(clay_ms($now) + 15000);
        $cardId = "crd_" . clay_rid();
        $card = [
            "id" => $cardId,
            "userId" => $me["id"],
            "type" => $type,
            "label" => $label,
            "limit" => $net,
            "spent" => 0,
            "pan" => clay_pan($serial, (string) $chosen["digits"]),
            "bin" => (string) $chosen["digits"],
            "binLabel" => (string) $chosen["label"],
            "expiry" => clay_expiry(),
            "cvv" => clay_cvv($serial),
            "holder" => clay_holder($label),
            "status" => "hazirlaniyor",
            "readyAt" => $readyAt,
            "period" => 1,
            "createdAt" => $now,
            "feeDueAt" => null,
        ];
        $db["users"][$userIndex]["balance"] -= $fee + $gross;
        $db["cards"][] = $card;
        $db["orders"][] = [
            "id" => "ord_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $cardId,
            "type" => $type,
            "label" => $label,
            "limit" => $net,
            "fee" => $fee,
            "status" => "hazirlaniyor",
            "createdAt" => $now,
            "readyAt" => $readyAt,
        ];
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $cardId,
            "kind" => "basim",
            "title" => "Basım · " . $label,
            "note" => "Sipariş " . $cardId . ". Kart hazırlanıyor.",
            "amount" => -$fee,
            "usdMinor" => null,
            "status" => "tamamlandi",
            "createdAt" => $now,
            "ref" => null,
        ];
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $cardId,
            "kind" => "yukleme",
            "title" => "Karta yükleme · " . $label,
            "note" => "Hesaptan " . clay_tl($gross) . " ayrıldı. %" . clay_percent($percent) . " komisyon " . clay_tl($commission) . ". Karta " . clay_tl($net) . " yazıldı. Ana bakiye yüklemesine bu kesinti uygulanmaz.",
            "amount" => -$gross,
            "usdMinor" => -$limitCents,
            "status" => "tamamlandi",
            "createdAt" => $now,
            "ref" => null,
        ];
        clay_notice($db, $me["id"], "Kart bedeli düştü", $label . " için hesabından " . clay_tl($fee + $gross) . " düştü. Kart bedeli " . clay_tl($fee) . ". Karta " . clay_tl($net) . " yazıldı, komisyon " . clay_tl($commission) . ". Kalan bakiye " . clay_tl($db["users"][$userIndex]["balance"]) . ".");
        return clay_ok("basildi", $cardId);
    }

    if ($action === "fund") {
        $cents = clay_cents(clay_in($in, "tutar"));
        $cardIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        if ($cents === null || $cents < 100 || $cents > 500000) {
            return clay_fail("e-tutar");
        }
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        $card = $db["cards"][$cardIndex];
        if ($card["status"] === "kapali" || $card["status"] === "hazirlaniyor") {
            return clay_fail("e-durum");
        }
        $gross = clay_kurus($cents);
        $percent = (float) $db["settings"]["loadFeePercent"];
        $commission = clay_load_fee($percent, $gross);
        $net = $gross - $commission;
        if ($net < 1) {
            return clay_fail("e-tutar");
        }
        if ($db["users"][$userIndex]["balance"] < $gross) {
            return clay_fail("e-bakiye");
        }
        if ($card["limit"] + $net > clay_max_limit()) {
            return clay_fail("e-limit");
        }
        $db["users"][$userIndex]["balance"] -= $gross;
        $db["cards"][$cardIndex]["limit"] += $net;
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $card["id"],
            "kind" => "yukleme",
            "title" => "Karta yükleme · " . $card["label"],
            "note" => "Hesaptan " . clay_tl($gross) . " ayrıldı. %" . clay_percent($percent) . " komisyon " . clay_tl($commission) . ". Karta " . clay_tl($net) . " yazıldı.",
            "amount" => -$gross,
            "usdMinor" => -$cents,
            "status" => "tamamlandi",
            "createdAt" => clay_now(),
            "ref" => null,
        ];
        clay_notice($db, $me["id"], "Karta yükleme düştü", $card["label"] . " kartına " . clay_tl($net) . " yazıldı. Hesaptan " . clay_tl($gross) . " düştü, komisyon " . clay_tl($commission) . ". Kalan bakiye " . clay_tl($db["users"][$userIndex]["balance"]) . ".");
        return clay_ok("yuklendi_kart");
    }

    if ($action === "freeze") {
        $cardIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        $mode = clay_in($in, "mod");
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        if ($db["cards"][$cardIndex]["status"] === "kapali") {
            return clay_fail("e-durum");
        }
        if ($mode === "dondur") {
            if ($db["cards"][$cardIndex]["status"] !== "aktif") {
                return clay_fail("e-durum");
            }
            $db["cards"][$cardIndex]["status"] = "donduruldu";
            clay_notice($db, $me["id"], "Kart donduruldu", $db["cards"][$cardIndex]["label"] . " donduruldu. Harcama kapalı. Kartı aktif et dersen yeniden açılır.");
            return clay_ok("donduruldu");
        }
        if ($mode === "coz") {
            if ($db["cards"][$cardIndex]["status"] !== "donduruldu") {
                return clay_fail("e-durum");
            }
            $db["cards"][$cardIndex]["status"] = "aktif";
            clay_notice($db, $me["id"], "Kart aktif", $db["cards"][$cardIndex]["label"] . " yeniden açık. Harcama devam edebilir.");
            return clay_ok("cozuldu");
        }
        return clay_fail("e-durum");
    }

    if ($action === "activate") {
        $cardIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        $status = $db["cards"][$cardIndex]["status"];
        if ($status !== "donduruldu" && $status !== "kapali") {
            return clay_fail("e-durum");
        }
        $fee = (int) $db["settings"]["issueFeeKurus"];
        if ($status === "kapali" && clay_open_count($db, $me["id"]) >= (int) $db["settings"]["plans"][$db["users"][$userIndex]["plan"]]["cardLimit"]) {
            return clay_fail("e-plan");
        }
        if ($db["users"][$userIndex]["balance"] < $fee) {
            return clay_fail("e-bakiye");
        }
        $db["users"][$userIndex]["balance"] -= $fee;
        $db["cards"][$cardIndex]["status"] = "aktif";
        $db["cards"][$cardIndex]["readyAt"] = null;
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $db["cards"][$cardIndex]["id"],
            "kind" => "basim",
            "title" => "Kart bedeli · " . $db["cards"][$cardIndex]["label"],
            "note" => $status === "kapali" ? "Kapanmış kart yeniden açıldı." : "Dondurulmuş kart aktif edildi.",
            "amount" => -$fee,
            "usdMinor" => null,
            "status" => "tamamlandi",
            "createdAt" => clay_now(),
            "ref" => null,
        ];
        clay_notice($db, $me["id"], $status === "kapali" ? "Kart yeniden açıldı" : "Kart aktif", $db["cards"][$cardIndex]["label"] . " açık bölüme alındı. Kart bedeli " . clay_tl($fee) . " bakiyeden düştü. Kalan bakiye " . clay_tl($db["users"][$userIndex]["balance"]) . ".");
        return clay_ok($status === "kapali" ? "kart-acildi" : "cozuldu");
    }

    if ($action === "close" || $action === "cancel") {
        if ($action === "close" && clay_in($in, "onay") !== "on") {
            return clay_fail("e-onay");
        }
        $cardIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        $status = $db["cards"][$cardIndex]["status"];
        if ($action === "close" && ($status === "kapali" || $status === "hazirlaniyor")) {
            return clay_fail("e-durum");
        }
        if ($action === "cancel" && $status !== "hazirlaniyor") {
            return clay_fail("e-durum");
        }
        $refund = clay_refund_fee($db, $userIndex, $db["cards"][$cardIndex]);
        if ($refund === "tavan") {
            return clay_fail("e-tavan");
        }
        $db["cards"][$cardIndex]["status"] = "kapali";
        $db["cards"][$cardIndex]["readyAt"] = null;
        if ($action === "cancel") {
            foreach ($db["orders"] as $n => $order) {
                if (($order["cardId"] ?? "") === $db["cards"][$cardIndex]["id"]) {
                    $db["orders"][$n]["status"] = "iptal";
                    $db["orders"][$n]["readyAt"] = null;
                }
            }
            clay_notice($db, $me["id"], "Sipariş iptal edildi", $db["cards"][$cardIndex]["label"] . " siparişi iptal edildi. Basım ücreti bakiyeye döndü.");
            return clay_ok("iptal");
        }
        clay_notice($db, $me["id"], "Kart kapatıldı", $db["cards"][$cardIndex]["label"] . " kapatıldı. Basım ücreti bakiyeye geri yazıldı.");
        return clay_ok("kapatildi");
    }

    if ($action === "spend") {
        $cents = clay_cents(clay_in($in, "tutar"));
        $merchant = clay_in($in, "isletme");
        $cardIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        if ($cents === null || $cents < 100 || $cents > 200000) {
            return clay_fail("e-tutar");
        }
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        $card = $db["cards"][$cardIndex];
        if (!in_array($merchant, clay_merchants((string) $card["type"]), true)) {
            return clay_fail("e-isletme");
        }
        if ($card["status"] !== "aktif") {
            return clay_fail("e-durum");
        }
        $amount = clay_kurus($cents);
        $now = clay_now();
        $reject = function (string $note, string $body) use (&$db, $me, $card, $merchant, $amount, $cents, $now): array {
            $db["transactions"][] = [
                "id" => "tx_" . clay_rid(),
                "userId" => $me["id"],
                "cardId" => $card["id"],
                "kind" => "harcama",
                "title" => $merchant,
                "note" => $note,
                "amount" => -$amount,
                "usdMinor" => -$cents,
                "status" => "reddedildi",
                "createdAt" => $now,
                "ref" => null,
            ];
            clay_notice($db, $me["id"], "Harcama reddedildi", $body);
            return clay_ok("reddedildi");
        };
        if ($card["spent"] + $amount > $card["limit"]) {
            return $reject("Limit aşıldı", $card["label"] . " kartında " . $merchant . " işlemi kullanılabilir bakiyeyi aştığı için geçmedi.");
        }
        if ($amount > $db["users"][$userIndex]["balance"]) {
            return $reject("Yetersiz bakiye", $card["label"] . " kartında " . $merchant . " işlemi için bakiye yetmedi.");
        }
        $db["users"][$userIndex]["balance"] -= $amount;
        $db["cards"][$cardIndex]["spent"] += $amount;
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $card["id"],
            "kind" => "harcama",
            "title" => $merchant,
            "note" => clay_usd($cents) . " karşılığı " . clay_tl($amount) . " düştü.",
            "amount" => -$amount,
            "usdMinor" => -$cents,
            "status" => "tamamlandi",
            "createdAt" => $now,
            "ref" => null,
        ];
        clay_notice($db, $me["id"], "Harcama işlendi", $card["label"] . " · " . $merchant . ": " . clay_tl($amount) . " düştü.");
        if ($card["limit"] > 0 && ($db["cards"][$cardIndex]["spent"] / $card["limit"]) >= 0.5) {
            clay_notice($db, $me["id"], "Bakiye yarıda", $card["label"] . " kartının kullanılabilir bakiyesinin yarısı kullanıldı.", "tavan50:" . $card["id"] . ":" . $card["period"]);
        }
        return clay_ok("harcama");
    }

    if ($action === "refund") {
        $cents = clay_cents(clay_in($in, "tutar"));
        $cardIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        if ($cents === null || $cents < 1 || $cents > 200000) {
            return clay_fail("e-tutar");
        }
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        $amount = clay_kurus($cents);
        $card = $db["cards"][$cardIndex];
        if ($card["status"] !== "aktif" || $card["spent"] <= 0) {
            return clay_fail("e-durum");
        }
        if ($amount < 1 || $amount > $card["spent"]) {
            return clay_fail("e-tutar");
        }
        if ($db["users"][$userIndex]["balance"] + $amount > clay_max_balance()) {
            return clay_fail("e-tavan");
        }
        $db["users"][$userIndex]["balance"] += $amount;
        $db["cards"][$cardIndex]["spent"] -= $amount;
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $card["id"],
            "kind" => "iade",
            "title" => "İade",
            "note" => clay_usd($cents) . " karşılığı " . clay_tl($amount) . " yazıldı.",
            "amount" => $amount,
            "usdMinor" => $cents,
            "status" => "tamamlandi",
            "createdAt" => clay_now(),
            "ref" => null,
        ];
        clay_notice($db, $me["id"], "İade yazıldı", $card["label"] . " kartına " . clay_tl($amount) . " iade edildi.");
        return clay_ok("iade");
    }

    if ($action === "renew") {
        $cardIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        $card = $db["cards"][$cardIndex];
        if ($card["status"] === "kapali" || $card["status"] === "hazirlaniyor") {
            return clay_fail("e-durum");
        }
        if ($card["spent"] <= 0) {
            return clay_fail("e-yenile");
        }
        $db["cards"][$cardIndex]["spent"] = 0;
        $db["cards"][$cardIndex]["period"] = (int) $card["period"] + 1;
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $card["id"],
            "kind" => "yenileme",
            "title" => "Kullanılabilir bakiye yenilendi · " . $card["label"],
            "note" => "Harcama sayacı sıfırlandı. Önceki harcamalar cüzdandan geri gelmez.",
            "amount" => 0,
            "usdMinor" => null,
            "status" => "tamamlandi",
            "createdAt" => clay_now(),
            "ref" => null,
        ];
        clay_notice($db, $me["id"], "Kullanılabilir bakiye yenilendi", $card["label"] . " harcama sayacı sıfırlandı. Cüzdan tutarı aynı kaldı.");
        return clay_ok("yenilendi");
    }

    if ($action === "transfer") {
        $cents = clay_cents(clay_in($in, "tutar"));
        $sourceIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        $destIndex = clay_card_index($db, clay_in($in, "hedef"), $me["id"]);
        if ($destIndex < 0 || $sourceIndex < 0 || $sourceIndex === $destIndex) {
            return clay_fail("e-transfer-kart");
        }
        if ($cents === null || $cents < 100) {
            return clay_fail("e-transfer");
        }
        $amount = clay_kurus($cents);
        $percent = (float) $db["settings"]["transferFeePercent"];
        $fee = clay_xfer_fee($percent, $amount);
        $credit = $amount - $fee;
        if ($fee < 1 || $credit < 1) {
            return clay_fail("e-transfer");
        }
        $source = $db["cards"][$sourceIndex];
        $dest = $db["cards"][$destIndex];
        $movable = static function (array $card): bool {
            return $card["status"] === "aktif" || $card["status"] === "donduruldu";
        };
        if (!$movable($source) || !$movable($dest)) {
            return clay_fail("e-durum");
        }
        if ($amount > $source["limit"] - $source["spent"]) {
            return clay_fail("e-transfer");
        }
        if ($dest["limit"] + $credit > clay_max_limit()) {
            return clay_fail("e-transfer-tavan");
        }
        $db["cards"][$sourceIndex]["limit"] -= $amount;
        $db["cards"][$destIndex]["limit"] += $credit;
        $now = clay_now();
        $route = substr($source["pan"], -4) . " karttan " . substr($dest["pan"], -4) . " karta";
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $source["id"],
            "kind" => "transfer",
            "title" => $route,
            "note" => $source["label"] . " kartından " . $dest["label"] . " kartına. %" . $percent . " komisyon " . clay_tl($fee) . " kesildi. Karşı karta " . clay_tl($credit) . " yazıldı. Ana bakiye değişmedi.",
            "amount" => -$amount,
            "usdMinor" => null,
            "status" => "tamamlandi",
            "createdAt" => $now,
            "ref" => null,
        ];
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $dest["id"],
            "kind" => "transfer",
            "title" => $route,
            "note" => $source["label"] . " kartından " . $dest["label"] . " kartına geldi. %" . $percent . " komisyon sonrası " . clay_tl($credit) . " yazıldı. Ana bakiye değişmedi.",
            "amount" => $credit,
            "usdMinor" => null,
            "status" => "tamamlandi",
            "createdAt" => $now,
            "ref" => null,
        ];
        clay_notice($db, $me["id"], "Bakiye aktarıldı", $source["label"] . " kartından " . $dest["label"] . " kartına " . clay_tl($credit) . " yazıldı. Komisyon " . clay_tl($fee) . ".");
        $leftLimit = $db["cards"][$sourceIndex]["limit"];
        if ($leftLimit > 0 && $source["spent"] / $leftLimit >= 0.5) {
            clay_notice($db, $me["id"], "Bakiye yarıda", $source["label"] . " kartının kullanılabilir bakiyesinin yarısı kullanıldı.", "tavan50:" . $source["id"] . ":" . $source["period"]);
        }
        return clay_ok("transfer");
    }

    if ($action === "address") {
        $address = clay_address(clay_in($in, "adres"));
        if ($address === null) {
            return clay_fail("e-adres");
        }
        $db["users"][$userIndex]["address"] = $address;
        clay_notice($db, $me["id"], "Adres güncellendi", $address !== "" ? "Kart adresin kaydedildi." : "Kart adresi temizlendi.");
        return clay_ok("adres");
    }

    if ($action === "name") {
        $name = clay_display_name(clay_in($in, "ad"));
        if (!$name) {
            return clay_fail("e-ad");
        }
        $db["users"][$userIndex]["name"] = $name;
        clay_notice($db, $me["id"], "Ad güncellendi", "Görünen adın " . $name . " olarak kaydedildi.");
        return clay_ok("ad");
    }

    if ($action === "password") {
        $next = clay_in($in, "yeni");
        $again = clay_in($in, "yeni2");
        if (strlen($next) < 6 || strlen($next) > 72 || $next !== $again) {
            return clay_fail("e-parola");
        }
        if (($db["users"][$userIndex]["password"] ?? "") !== clay_in($in, "eski")) {
            return clay_fail("e-parola-eski");
        }
        $db["users"][$userIndex]["password"] = $next;
        clay_notice($db, $me["id"], "Parola güncellendi", "Yeni parolan yönetim masasında görünür.");
        return clay_ok("parola");
    }

    if ($action === "ticket") {
        $subject = trim((string) preg_replace("/\\s+/u", " ", clay_in($in, "konu")));
        $body = trim((string) preg_replace("/\\s+/u", " ", clay_in($in, "sikayet")));
        if (mb_strlen($subject) < 2 || mb_strlen($subject) > 80 || mb_strlen($body) < 4 || mb_strlen($body) > 800) {
            return clay_fail("e-talep");
        }
        $db["tickets"][] = [
            "id" => "tkt_" . clay_rid(),
            "userId" => $me["id"],
            "subject" => $subject,
            "body" => $body,
            "status" => "acik",
            "createdAt" => clay_now(),
            "reply" => null,
            "repliedAt" => null,
        ];
        clay_notice($db, $me["id"], "Talebin alındı", $subject . ". Şikayet yönetim masasına düştü.");
        return clay_ok("talep");
    }

    if ($action === "notice-read") {
        $id = clay_in($in, "id");
        foreach ($db["notices"] as $i => $note) {
            if (($note["id"] ?? "") === $id && ($note["userId"] ?? "") === $me["id"] && empty($note["readAt"])) {
                $db["notices"][$i]["readAt"] = clay_now();
            }
        }
        return clay_ok("okundu");
    }

    if ($action === "notice-read-all") {
        $now = clay_now();
        foreach ($db["notices"] as $i => $note) {
            if (($note["userId"] ?? "") === $me["id"] && empty($note["readAt"])) {
                $db["notices"][$i]["readAt"] = $now;
            }
        }
        return clay_ok("okundu");
    }

    if ($action === "admin-balance") {
        $yon = clay_in($in, "yon");
        $cents = clay_cents(clay_in($in, "tutar"));
        $index = clay_user_index($db, clay_in($in, "uye"));
        if ($yon !== "artir" && $yon !== "azalt") {
            return clay_fail("e-tutar");
        }
        if ($cents === null || $cents < 100 || $cents > 500000 || $index < 0) {
            return $index < 0 ? clay_fail("e-yok") : clay_fail("e-tutar");
        }
        $signed = clay_kurus($yon === "artir" ? $cents : -$cents);
        $signedCents = $yon === "artir" ? $cents : -$cents;
        $next = $db["users"][$index]["balance"] + $signed;
        if ($next < 0) {
            return clay_fail("e-bakiye");
        }
        if ($next > clay_max_balance()) {
            return clay_fail("e-tavan");
        }
        $db["users"][$index]["balance"] = $next;
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $db["users"][$index]["id"],
            "cardId" => null,
            "kind" => "duzeltme",
            "title" => $yon === "artir" ? "Yönetici bakiyesi artırdı" : "Yönetici bakiyesi azalttı",
            "note" => clay_usd(abs($signedCents)) . " karşılığı.",
            "amount" => $signed,
            "usdMinor" => $signedCents,
            "status" => "tamamlandi",
            "createdAt" => clay_now(),
            "ref" => null,
        ];
        clay_notice($db, $db["users"][$index]["id"], $yon === "artir" ? "Bakiye arttı" : "Bakiye düştü", clay_tl(abs($signed)) . " bakiyene işlendi.");
        return clay_ok("bakiye");
    }

    if ($action === "admin-card") {
        $cardIndex = clay_card_index($db, clay_in($in, "id"));
        $mode = clay_in($in, "mod");
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        if ($db["cards"][$cardIndex]["status"] === "kapali") {
            return clay_fail("e-durum");
        }
        if ($mode === "dondur") {
            if ($db["cards"][$cardIndex]["status"] !== "aktif") {
                return clay_fail("e-durum");
            }
            $db["cards"][$cardIndex]["status"] = "donduruldu";
            clay_notice($db, $db["cards"][$cardIndex]["userId"], "Kart donduruldu", $db["cards"][$cardIndex]["label"] . " donduruldu. Harcama kapalı. Kartı aktif et dersen yeniden açılır.");
            return clay_ok("donduruldu");
        }
        if ($mode === "coz") {
            if ($db["cards"][$cardIndex]["status"] !== "donduruldu") {
                return clay_fail("e-durum");
            }
            $db["cards"][$cardIndex]["status"] = "aktif";
            clay_notice($db, $db["cards"][$cardIndex]["userId"], "Kart aktif", $db["cards"][$cardIndex]["label"] . " yeniden açık. Harcama devam edebilir.");
            return clay_ok("cozuldu");
        }
        return clay_fail("e-durum");
    }

    if ($action === "admin-account") {
        $index = clay_user_index($db, clay_in($in, "uye"));
        $mode = clay_in($in, "mod");
        if ($index < 0) {
            return clay_fail("e-yok");
        }
        if ($db["users"][$index]["id"] === $me["id"]) {
            return clay_fail("e-kendin");
        }
        if (($db["users"][$index]["role"] ?? "") === "yonetici") {
            return clay_fail("e-yonetici");
        }
        if ($mode === "aski") {
            $db["users"][$index]["status"] = "askida";
            clay_notice($db, $db["users"][$index]["id"], "Hesap askıda", "Girişin kapatıldı. Hesap açılınca buradan haberin olur.");
            return clay_ok("askida");
        }
        if ($mode === "ac") {
            $db["users"][$index]["status"] = "acik";
            clay_notice($db, $db["users"][$index]["id"], "Hesap açıldı", "Girişin yeniden açık.");
            return clay_ok("acildi");
        }
        return clay_fail("e-durum");
    }

    if ($action === "admin-notice") {
        $title = trim(clay_in($in, "baslik"));
        $body = trim(clay_in($in, "mesaj"));
        $hedef = clay_in($in, "hedef");
        if (mb_strlen($title) < 2 || mb_strlen($title) > 80 || mb_strlen($body) < 2 || mb_strlen($body) > 400) {
            return clay_fail("e-mesaj");
        }
        $targets = [];
        foreach ($db["users"] as $user) {
            if (($user["role"] ?? "") !== "uye") {
                continue;
            }
            if ($hedef === "tumu" || $user["id"] === $hedef) {
                $targets[] = $user;
            }
        }
        if ($targets === []) {
            return clay_fail("e-hedef");
        }
        $batch = clay_rid();
        $created = clay_now();
        foreach ($targets as $user) {
            $db["notices"][] = [
                "id" => "nt_" . clay_rid(),
                "userId" => $user["id"],
                "batch" => $batch,
                "title" => $title,
                "body" => $body,
                "createdAt" => $created,
                "readAt" => null,
                "ref" => null,
            ];
        }
        return clay_ok("gonderildi");
    }

    if ($action === "admin-ticket") {
        $reply = trim((string) preg_replace("/\\s+/u", " ", clay_in($in, "yanit")));
        if (mb_strlen($reply) < 2 || mb_strlen($reply) > 400) {
            return clay_fail("e-yanit");
        }
        $found = false;
        foreach ($db["tickets"] as $i => $ticket) {
            if (($ticket["id"] ?? "") !== clay_in($in, "id")) {
                continue;
            }
            $db["tickets"][$i]["reply"] = $reply;
            $db["tickets"][$i]["repliedAt"] = clay_now();
            $db["tickets"][$i]["status"] = "yanitlandi";
            clay_notice($db, $ticket["userId"], "Destek yanıtı", $ticket["subject"] . ": " . $reply);
            $found = true;
            break;
        }
        return $found ? clay_ok("yanit") : clay_fail("e-yok");
    }

    if ($action === "admin-set-balance") {
        $cents = clay_cents(clay_in($in, "bakiye"));
        $index = clay_user_index($db, clay_in($in, "uye"));
        if ($cents === null || $cents > 2000000) {
            return clay_fail("e-tutar");
        }
        if ($index < 0 || ($db["users"][$index]["role"] ?? "") !== "uye") {
            return clay_fail("e-yonetici");
        }
        $next = clay_kurus($cents);
        if ($next > clay_max_balance()) {
            return clay_fail("e-tavan");
        }
        $delta = $next - $db["users"][$index]["balance"];
        $db["users"][$index]["balance"] = $next;
        if ($delta !== 0) {
            $db["transactions"][] = [
                "id" => "tx_" . clay_rid(),
                "userId" => $db["users"][$index]["id"],
                "cardId" => null,
                "kind" => "duzeltme",
                "title" => "Yönetici bakiyeyi yazdı",
                "note" => clay_usd($cents) . " karşılığı.",
                "amount" => $delta,
                "usdMinor" => $cents,
                "status" => "tamamlandi",
                "createdAt" => clay_now(),
                "ref" => null,
            ];
            clay_notice($db, $db["users"][$index]["id"], "Bakiye güncellendi", "Bakiyen " . clay_tl($next) . " olarak yazıldı.");
        }
        return clay_ok("bakiye");
    }

    if ($action === "admin-edit-card") {
        $label = trim(clay_in($in, "etiket"));
        $limitCents = clay_cents(clay_in($in, "limit"));
        $status = clay_in($in, "durum");
        $cardIndex = clay_card_index($db, clay_in($in, "id"), clay_in($in, "uye"));
        if (mb_strlen($label) < 2 || mb_strlen($label) > 32) {
            return clay_fail("e-etiket");
        }
        if ($limitCents === null || $limitCents < 1000 || $limitCents > 1000000) {
            return clay_fail("e-limit");
        }
        if (!in_array($status, ["hazirlaniyor", "aktif", "donduruldu", "kapali"], true)) {
            return clay_fail("e-durum");
        }
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        $limit = clay_kurus($limitCents);
        if ($limit < $db["cards"][$cardIndex]["spent"] || $limit > clay_max_limit()) {
            return clay_fail("e-limit");
        }
        $was = $db["cards"][$cardIndex]["status"];
        $db["cards"][$cardIndex]["label"] = $label;
        $db["cards"][$cardIndex]["holder"] = clay_holder($label);
        $db["cards"][$cardIndex]["limit"] = $limit;
        $db["cards"][$cardIndex]["status"] = $status;
        $db["cards"][$cardIndex]["readyAt"] = $status === "hazirlaniyor" ? clay_iso((int) round(microtime(true) * 1000) + 15000) : null;
        if ($was !== "donduruldu" && $status === "donduruldu") {
            clay_notice($db, $db["cards"][$cardIndex]["userId"], "Kart donduruldu", $label . " donduruldu. Harcama kapalı. Kartı aktif et dersen yeniden açılır.");
        } elseif ($was === "donduruldu" && $status === "aktif") {
            clay_notice($db, $db["cards"][$cardIndex]["userId"], "Kart aktif", $label . " yeniden açık. Harcama devam edebilir.");
        } else {
            clay_notice($db, $db["cards"][$cardIndex]["userId"], "Kart kaydı güncellendi", $label . " kartının kaydı yönetim masasında yenilendi.");
        }
        return clay_ok("kart");
    }

    if ($action === "admin-edit-tx") {
        $cents = clay_signed_cents(clay_in($in, "tutar"));
        $txId = clay_in($in, "islem");
        $uid = clay_in($in, "uye");
        $index = clay_user_index($db, $uid);
        if ($cents === null || abs($cents) > 2000000) {
            return clay_fail("e-tutar");
        }
        if ($index < 0 || ($db["users"][$index]["role"] ?? "") !== "uye") {
            return clay_fail("e-yok");
        }
        $txIndex = -1;
        foreach ($db["transactions"] as $i => $entry) {
            if (($entry["id"] ?? "") === $txId && ($entry["userId"] ?? "") === $uid) {
                $txIndex = $i;
                break;
            }
        }
        if ($txIndex < 0) {
            return clay_fail("e-yok");
        }
        $amount = $cents < 0 ? -clay_kurus(-$cents) : clay_kurus($cents);
        $tx = $db["transactions"][$txIndex];
        $delta = $amount - (int) $tx["amount"];
        $touches = ($tx["status"] ?? "") === "tamamlandi" && (($tx["kind"] ?? "") === "harcama" || ($tx["kind"] ?? "") === "iade");
        $cardIndex = !empty($tx["cardId"]) ? clay_card_index($db, (string) $tx["cardId"]) : -1;
        $nextBalance = ($tx["status"] ?? "") === "tamamlandi" ? $db["users"][$index]["balance"] + $delta : $db["users"][$index]["balance"];
        $nextSpent = null;
        if ($cardIndex >= 0 && $touches) {
            $nextSpent = $db["cards"][$cardIndex]["spent"] - $delta;
        }
        if ($nextBalance < 0 || $nextBalance > clay_max_balance()) {
            return clay_fail("e-bakiye");
        }
        if ($touches && $cardIndex >= 0 && ($nextSpent === null || $nextSpent < 0 || $nextSpent > $db["cards"][$cardIndex]["limit"])) {
            return clay_fail("e-limit");
        }
        if (($tx["status"] ?? "") === "tamamlandi") {
            $db["users"][$index]["balance"] = $nextBalance;
        }
        if ($touches && $cardIndex >= 0 && $nextSpent !== null) {
            $db["cards"][$cardIndex]["spent"] = $nextSpent;
        }
        $db["transactions"][$txIndex]["amount"] = $amount;
        $db["transactions"][$txIndex]["usdMinor"] = $cents;
        clay_notice($db, $uid, "İşlem güncellendi", "Bir hareketinin tutarı yönetim masasında düzeltildi.");
        return clay_ok("islem");
    }

    if ($action === "admin-bin-add") {
        $type = clay_in($in, "tur");
        $draft = clay_bin_draft($in);
        if (!clay_is_type($type) || !$draft) {
            return clay_fail("e-bin-kayit");
        }
        foreach ($db["bins"] as $row) {
            if (($row["type"] ?? "") === $type && ($row["digits"] ?? "") === $draft["digits"]) {
                return clay_fail("e-bin-kayit");
            }
        }
        $db["bins"][] = ["id" => "bin_" . clay_rid(), "type" => $type, "label" => $draft["label"], "digits" => $draft["digits"]];
        return clay_ok("bin");
    }

    if ($action === "admin-bin-save") {
        $draft = clay_bin_draft($in);
        $id = clay_in($in, "id");
        if (!$draft) {
            return clay_fail("e-bin-kayit");
        }
        $index = -1;
        foreach ($db["bins"] as $i => $row) {
            if (($row["id"] ?? "") === $id) {
                $index = $i;
                break;
            }
        }
        if ($index < 0) {
            return clay_fail("e-yok");
        }
        foreach ($db["bins"] as $row) {
            if (($row["id"] ?? "") !== $id && ($row["type"] ?? "") === $db["bins"][$index]["type"] && ($row["digits"] ?? "") === $draft["digits"]) {
                return clay_fail("e-bin-kayit");
            }
        }
        $db["bins"][$index]["label"] = $draft["label"];
        $db["bins"][$index]["digits"] = $draft["digits"];
        return clay_ok("bin");
    }

    if ($action === "admin-bin-remove") {
        $id = clay_in($in, "id");
        $next = [];
        foreach ($db["bins"] as $row) {
            if (($row["id"] ?? "") !== $id) {
                $next[] = $row;
            }
        }
        if (count($next) === count($db["bins"])) {
            return clay_fail("e-yok");
        }
        $db["bins"] = $next;
        return clay_ok("bin");
    }

    if ($action === "admin-bin-paste") {
        $type = clay_in($in, "tur");
        if (!clay_is_type($type)) {
            return clay_fail("e-bin-kayit");
        }
        $seen = [];
        foreach ($db["bins"] as $row) {
            if (($row["type"] ?? "") === $type) {
                $seen[$row["digits"]] = true;
            }
        }
        $added = 0;
        foreach (preg_split("/\\r?\\n/", clay_in($in, "yigin")) ?: [] as $line) {
            $draft = clay_paste_line($line);
            if (!$draft || isset($seen[$draft["digits"]])) {
                continue;
            }
            $seen[$draft["digits"]] = true;
            $db["bins"][] = ["id" => "bin_" . clay_rid(), "type" => $type, "label" => $draft["label"], "digits" => $draft["digits"]];
            $added += 1;
        }
        return $added > 0 ? clay_ok("bin") : clay_fail("e-bin-kayit");
    }

    if ($action === "admin-password") {
        $next = clay_in($in, "yeni");
        $again = clay_in($in, "yeni2");
        if (strlen($next) < 6 || strlen($next) > 72 || $next !== $again) {
            return clay_fail("e-parola");
        }
        if (($db["users"][$userIndex]["password"] ?? "") !== clay_in($in, "eski")) {
            return clay_fail("e-parola-eski");
        }
        $db["users"][$userIndex]["password"] = $next;
        return clay_ok("parola-admin");
    }

    if ($action === "admin-telegram") {
        $raw = clay_in($in, "telegram");
        if (clay_in($in, "sil") === "1" || trim($raw) === "") {
            $db["settings"]["telegram"] = "";
            return clay_ok("telegram");
        }
        $name = clay_telegram($raw);
        if (!$name) {
            return clay_fail("e-telegram");
        }
        $db["settings"]["telegram"] = $name;
        return clay_ok("telegram");
    }

    if ($action === "admin-fees") {
        $issue = (float) str_replace(",", ".", clay_in($in, "bedel"));
        $load = (float) str_replace(",", ".", clay_in($in, "yukleme"));
        $transfer = (float) str_replace(",", ".", clay_in($in, "aktarim"));
        if (!is_finite($issue) || $issue < 0 || $issue > 100000) {
            return clay_fail("e-ayar");
        }
        if (!is_finite($load) || $load < 0 || $load > 40) {
            return clay_fail("e-ayar");
        }
        if (!is_finite($transfer) || $transfer < 0 || $transfer > 40) {
            return clay_fail("e-ayar");
        }
        $db["settings"]["issueFeeKurus"] = (int) round($issue * 100);
        $db["settings"]["loadFeePercent"] = round($load * 10) / 10;
        $db["settings"]["transferFeePercent"] = round($transfer * 10) / 10;
        return clay_ok("ucret");
    }

    if ($action === "admin-plan") {
        $id = clay_in($in, "plan");
        $name = trim((string) preg_replace("/\\s+/u", " ", clay_in($in, "ad")));
        $price = (float) str_replace(",", ".", clay_in($in, "fiyat"));
        $limitRaw = clay_in($in, "adet");
        $blurb = trim((string) preg_replace("/\\s+/u", " ", clay_in($in, "yazi")));
        if (!clay_is_plan($id)) {
            return clay_fail("e-plan");
        }
        if (mb_strlen($name) < 2 || mb_strlen($name) > 40) {
            return clay_fail("e-ayar");
        }
        if (!is_finite($price) || $price < 0 || $price > 100000) {
            return clay_fail("e-ayar");
        }
        if (!preg_match("/^\\d+$/", $limitRaw)) {
            return clay_fail("e-ayar");
        }
        $limit = (int) $limitRaw;
        if ($limit < 1 || $limit > 100) {
            return clay_fail("e-ayar");
        }
        if (mb_strlen($blurb) < 2 || mb_strlen($blurb) > 180) {
            return clay_fail("e-ayar");
        }
        $db["settings"]["plans"][$id] = [
            "name" => $name,
            "priceUsdMinor" => (int) round($price * 100),
            "cardLimit" => $limit,
            "blurb" => $blurb,
        ];
        return clay_ok("planlar");
    }

    if ($action === "admin-topup") {
        $iso = clay_istanbul_iso(clay_in($in, "zaman"));
        $uid = clay_in($in, "uye");
        if (!$iso) {
            return clay_fail("e-zaman");
        }
        $latest = -1;
        foreach ($db["transactions"] as $i => $entry) {
            if (($entry["userId"] ?? "") === $uid && ($entry["kind"] ?? "") === "yukleme" && ($entry["status"] ?? "") === "tamamlandi") {
                if ($latest < 0 || strcmp((string) $entry["createdAt"], (string) $db["transactions"][$latest]["createdAt"]) > 0) {
                    $latest = $i;
                }
            }
        }
        if ($latest < 0) {
            return clay_fail("e-yukleme-yok");
        }
        $db["transactions"][$latest]["createdAt"] = $iso;
        return clay_ok("zaman");
    }

    return clay_fail("e-yok");
}
