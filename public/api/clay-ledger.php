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

function clay_fx_rate(): float
{
    global $CLAY_FX_RATE;
    $rate = isset($CLAY_FX_RATE) ? (float) $CLAY_FX_RATE : 49.3929;
    if ($rate <= 1 || $rate >= 500) {
        return 49.3929;
    }
    return $rate;
}

function clay_fx_asof(): string
{
    global $CLAY_FX_ASOF;
    return is_string($CLAY_FX_ASOF ?? null) ? $CLAY_FX_ASOF : "";
}

function clay_fx_apply(array $db): void
{
    global $CLAY_FX_RATE, $CLAY_FX_ASOF;
    $fx = $db["settings"]["fx"] ?? null;
    $rate = 49.3929;
    $asOf = "";
    if (is_array($fx) && isset($fx["rate"]) && is_numeric($fx["rate"])) {
        $candidate = (float) $fx["rate"];
        if ($candidate > 1 && $candidate < 500) {
            $rate = $candidate;
            $asOf = is_string($fx["asOf"] ?? null) ? $fx["asOf"] : "";
        }
    }
    $CLAY_FX_RATE = $rate;
    $CLAY_FX_ASOF = $asOf;
}

function clay_fx_http(string $url): ?string
{
    if (function_exists("curl_init")) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 4,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT => "clay-ledger",
        ]);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if (!is_string($raw) || $raw === "" || $code < 200 || $code >= 300) {
            return null;
        }
        return $raw;
    }
    $context = stream_context_create([
        "http" => ["timeout" => 4, "header" => "User-Agent: clay-ledger\r\n", "ignore_errors" => true],
    ]);
    $raw = @file_get_contents($url, false, $context);
    return is_string($raw) && $raw !== "" ? $raw : null;
}

function clay_fx_frankfurter(): ?array
{
    $raw = clay_fx_http("https://api.frankfurter.app/latest?from=USD&to=TRY");
    if ($raw === null) {
        return null;
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data["rates"]["TRY"]) || !is_numeric($data["rates"]["TRY"])) {
        return null;
    }
    $rate = (float) $data["rates"]["TRY"];
    if ($rate <= 1 || $rate >= 500) {
        return null;
    }
    $date = is_string($data["date"] ?? null) ? $data["date"] : "";
    $asOf = preg_match("/^\\d{4}-\\d{2}-\\d{2}$/", $date) ? $date . "T15:30:00.000Z" : clay_now();
    return ["rate" => $rate, "asOf" => $asOf, "source" => "frankfurter"];
}

function clay_fx_tcmb(): ?array
{
    $raw = clay_fx_http("https://www.tcmb.gov.tr/kurlar/today.xml");
    if ($raw === null || !preg_match('/CurrencyCode="USD"[\\s\\S]*?<ForexSelling>([0-9.]+)<\\/ForexSelling>/', $raw, $match)) {
        return null;
    }
    $rate = (float) $match[1];
    if ($rate <= 1 || $rate >= 500) {
        return null;
    }
    $asOf = clay_now();
    if (preg_match('/Tarih="(\\d{2})\\.(\\d{2})\\.(\\d{4})"/', $raw, $date)) {
        $asOf = $date[3] . "-" . $date[2] . "-" . $date[1] . "T15:30:00.000Z";
    }
    return ["rate" => $rate, "asOf" => $asOf, "source" => "tcmb"];
}

function clay_fx_sync(array &$db): bool
{
    $dirty = false;
    if (!isset($db["settings"]["fx"]) || !is_array($db["settings"]["fx"])) {
        $db["settings"]["fx"] = ["rate" => 49.3929, "asOf" => "", "source" => "yedek", "fetchedAt" => ""];
        $dirty = true;
    }
    clay_fx_apply($db);
    $fx = $db["settings"]["fx"];
    $fetchedRaw = (string) ($fx["fetchedAt"] ?? "");
    $fetched = preg_match("/^\\d{4}-\\d{2}-\\d{2}T/", $fetchedRaw) ? clay_ms($fetchedRaw) : 0;
    $now = (int) round(microtime(true) * 1000);
    if ($fetched > 0 && ($now - $fetched) < 20 * 60 * 1000 && (float) ($fx["rate"] ?? 0) > 1) {
        return $dirty;
    }
    $quote = clay_fx_frankfurter();
    if ($quote === null) {
        $quote = clay_fx_tcmb();
    }
    if ($quote === null) {
        if (!isset($fx["rate"]) || !is_numeric($fx["rate"]) || (float) $fx["rate"] <= 1) {
            $db["settings"]["fx"]["rate"] = 49.3929;
            $db["settings"]["fx"]["asOf"] = "";
            $db["settings"]["fx"]["source"] = "yedek";
            $dirty = true;
        }
        $db["settings"]["fx"]["fetchedAt"] = clay_now();
        clay_fx_apply($db);
        return true;
    }
    $db["settings"]["fx"] = [
        "rate" => $quote["rate"],
        "asOf" => $quote["asOf"],
        "source" => $quote["source"],
        "fetchedAt" => clay_now(),
    ];
    clay_fx_apply($db);
    return true;
}

function clay_kurus(int $minor): int
{
    return (int) round($minor * clay_fx_rate());
}

function clay_fx_note(): string
{
    $rate = number_format(clay_fx_rate(), 4, ",", ".");
    $asOf = clay_fx_asof();
    return $asOf !== "" ? $rate . " · " . $asOf : $rate . " · yedek";
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

function clay_digest(string $secret, string $salt): string
{
    return hash("sha256", $salt . "\n" . $secret);
}

function clay_hash_eq(string $known, string $given): bool
{
    if ($known === "" || strlen($known) !== strlen($given)) {
        return false;
    }
    return hash_equals($known, $given);
}

function clay_fold_seed(string $raw): string
{
    $value = strtolower(trim($raw));
    $value = preg_replace("/[^a-z\\s]+/", " ", $value);
    $value = preg_replace("/\\s+/", " ", (string) $value);
    return trim((string) $value);
}

function clay_seed_phrase(string $raw): ?string
{
    $value = clay_fold_seed($raw);
    if (!preg_match("/^[a-z]{2,16}(?: [a-z]{2,16}){7,15}$/", $value)) {
        return null;
    }
    return $value;
}

function clay_password_shape(string $password): bool
{
    return (bool) preg_match("/^[A-Za-z0-9]{6,72}$/", $password);
}

function clay_password_ok(array $user, string $password): bool
{
    $hash = (string) ($user["passHash"] ?? "");
    $salt = (string) ($user["passSalt"] ?? "");
    if ($hash !== "" && $salt !== "") {
        return clay_hash_eq($hash, clay_digest($password, $salt));
    }
    $stored = (string) ($user["password"] ?? "");
    if ($stored === "" || $password === "") {
        return false;
    }
    return clay_hash_eq($stored, $password);
}

function clay_seed_ok(array $user, string $seed): bool
{
    $hash = (string) ($user["seedHash"] ?? "");
    $salt = (string) ($user["seedSalt"] ?? "");
    if ($hash === "" || $salt === "" || $seed === "") {
        return false;
    }
    return clay_hash_eq($hash, clay_digest($seed, $salt));
}

function clay_hide_secrets(array $user, bool $desk): array
{
    $hasSeed = is_string($user["seedHash"] ?? null) && $user["seedHash"] !== "";
    $hasAnswer = (is_string($user["answerHash"] ?? null) && $user["answerHash"] !== "")
        || (is_string($user["securityAnswer"] ?? null) && $user["securityAnswer"] !== "");
    unset($user["passSalt"], $user["passHash"], $user["seedSalt"], $user["seedHash"], $user["passwordHash"], $user["email"], $user["seed"], $user["answerSalt"], $user["answerHash"], $user["securityAnswer"]);
    if ($hasSeed) {
        $user["hasSeed"] = true;
    }
    if ($hasAnswer) {
        $user["hasAnswer"] = true;
    }
    if (!$desk) {
        $user["password"] = "";
    }
    return $user;
}

function clay_has_answer(array $user): bool
{
    $hash = (string) ($user["answerHash"] ?? "");
    $plain = (string) ($user["securityAnswer"] ?? "");
    return ($hash !== "" && (string) ($user["answerSalt"] ?? "") !== "") || $plain !== "";
}

function clay_answer_ok(array $user, string $folded): bool
{
    $hash = (string) ($user["answerHash"] ?? "");
    $salt = (string) ($user["answerSalt"] ?? "");
    if ($hash !== "" && $salt !== "") {
        return clay_hash_eq($hash, clay_digest($folded, $salt));
    }
    $plain = (string) ($user["securityAnswer"] ?? "");
    return $plain !== "" && clay_hash_eq($plain, $folded);
}

function clay_answer_put(array &$user, string $folded): void
{
    $salt = bin2hex(random_bytes(16));
    $user["answerSalt"] = $salt;
    $user["answerHash"] = clay_digest($folded, $salt);
    unset($user["securityAnswer"]);
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
        "announcement" => ["title" => "", "body" => "", "on" => false],
        "copy" => [],
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

function clay_plan_until(array $user): string
{
    $step = 30 * 86400000;
    $now = (int) round(microtime(true) * 1000);
    $stored = clay_ms((string) ($user["planUntil"] ?? ""));
    $anchor = $stored > 0 ? $stored : clay_ms((string) ($user["createdAt"] ?? ""));
    if ($anchor <= 0) {
        return clay_iso($now + $step);
    }
    if ($stored > 0 && $now < $stored) {
        return clay_iso($stored);
    }
    if ($now <= $anchor) {
        return clay_iso($anchor + $step);
    }
    $cycles = intdiv($now - $anchor, $step) + 1;
    return clay_iso($anchor + ($cycles * $step));
}

function clay_sweep_spend(array &$db): bool
{
    $day = (new DateTimeImmutable("now", new DateTimeZone("Europe/Istanbul")))->format("Y-m-d");
    $cents = 100;
    $amount = clay_kurus($cents);
    if ($amount < 1) {
        return false;
    }
    $dirty = false;
    foreach ($db["cards"] as $i => $card) {
        if (($card["status"] ?? "") !== "aktif") {
            continue;
        }
        $userIndex = clay_user_index($db, (string) ($card["userId"] ?? ""));
        if ($userIndex < 0) {
            continue;
        }
        $merchants = clay_merchants((string) ($card["type"] ?? ""));
        $merchant = $merchants[0] ?? "";
        if ($merchant === "") {
            continue;
        }
        $ref = "oto-harcama:" . $card["id"] . ":" . $day;
        $seen = false;
        foreach ($db["transactions"] as $entry) {
            if (($entry["ref"] ?? null) === $ref) {
                $seen = true;
                break;
            }
        }
        if ($seen) {
            continue;
        }
        if (clay_issuer_id($card) !== "") {
            continue;
        }
        $spent = (int) ($card["spent"] ?? 0);
        $limit = (int) ($card["limit"] ?? 0);
        if ($spent + $amount > $limit || $amount > (int) $db["users"][$userIndex]["balance"]) {
            continue;
        }
        $db["users"][$userIndex]["balance"] -= $amount;
        $db["cards"][$i]["spent"] = $spent + $amount;
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $db["users"][$userIndex]["id"],
            "cardId" => $card["id"],
            "kind" => "harcama",
            "title" => $merchant,
            "note" => clay_usd($cents) . " karşılığı " . clay_tl($amount) . " kendiliğinden düştü.",
            "amount" => -$amount,
            "usdMinor" => -$cents,
            "status" => "tamamlandi",
            "createdAt" => clay_now(),
            "ref" => $ref,
        ];
        clay_notice(
            $db,
            $db["users"][$userIndex]["id"],
            "Harcama düştü",
            $card["label"] . " kartından " . $merchant . " kendiliğinden işlendi. " . clay_tl($amount) . " işlem geçmişine yazıldı.",
            "note:" . $ref
        );
        if ($limit > 0 && (($spent + $amount) / $limit) >= 0.5) {
            clay_notice(
                $db,
                $db["users"][$userIndex]["id"],
                "Bakiye yarıda",
                $card["label"] . " kartının kullanılabilir bakiyesinin yarısı kullanıldı.",
                "tavan50:" . $card["id"] . ":" . ($card["period"] ?? 1)
            );
        }
        $dirty = true;
    }
    return $dirty;
}

function clay_drop_imported(array &$db): bool
{
    $dirty = false;
    if (isset($db["settings"]["pst"])) {
        unset($db["settings"]["pst"]);
        $dirty = true;
    }
    if (!isset($db["cards"]) || !is_array($db["cards"])) {
        $db["cards"] = [];
    }
    foreach (["orders", "transactions", "notices"] as $key) {
        if (!isset($db[$key]) || !is_array($db[$key])) {
            $db[$key] = [];
        }
    }
    $drop = [];
    foreach ($db["cards"] as $card) {
        $id = (string) ($card["id"] ?? "");
        $pan = (string) ($card["pan"] ?? "");
        if ($id !== "" && (str_starts_with($id, "crd_pst_") || preg_match("/^\\d{6}\\*{6}\\d{4}$/", $pan))) {
            $drop[$id] = true;
        }
    }
    if ($drop) {
        $db["cards"] = array_values(array_filter(
            $db["cards"],
            static function ($card) use ($drop): bool {
                return !isset($drop[(string) ($card["id"] ?? "")]);
            }
        ));
        $dirty = true;
    }
    $orderCount = count($db["orders"]);
    $db["orders"] = array_values(array_filter(
        $db["orders"],
        static function ($order) use ($drop): bool {
            $id = (string) ($order["id"] ?? "");
            $cardId = (string) ($order["cardId"] ?? "");
            return !str_starts_with($id, "ord_pst_") && !isset($drop[$cardId]);
        }
    ));
    if (count($db["orders"]) !== $orderCount) {
        $dirty = true;
    }
    $txCount = count($db["transactions"]);
    $db["transactions"] = array_values(array_filter(
        $db["transactions"],
        static function ($entry) use ($drop): bool {
            $cardId = (string) ($entry["cardId"] ?? "");
            $ref = (string) ($entry["ref"] ?? "");
            $title = (string) ($entry["title"] ?? "");
            $note = (string) ($entry["note"] ?? "");
            if ($cardId !== "" && isset($drop[$cardId])) {
                return false;
            }
            if (str_starts_with($ref, "pst:")) {
                return false;
            }
            if (str_contains($title, "PST") || str_contains($note, "PST")) {
                return false;
            }
            return true;
        }
    ));
    if (count($db["transactions"]) !== $txCount) {
        $dirty = true;
    }
    $noteCount = count($db["notices"]);
    $db["notices"] = array_values(array_filter(
        $db["notices"],
        static function ($note) : bool {
            $title = (string) ($note["title"] ?? "");
            $ref = (string) ($note["ref"] ?? "");
            return !str_contains($title, "PST") && !str_contains($ref, "pst");
        }
    ));
    if (count($db["notices"]) !== $noteCount) {
        $dirty = true;
    }
    return $dirty;
}

function clay_payout_coin($value): string
{
    $coin = strtolower(trim((string) $value));
    if ($coin === "btc" || $coin === "usdt" || $coin === "xmr") {
        return $coin;
    }
    return "";
}

function clay_payout_tag(string $coin): string
{
    if ($coin === "btc") {
        return "BTC";
    }
    if ($coin === "usdt") {
        return "USDT";
    }
    if ($coin === "xmr") {
        return "XMR";
    }
    return "";
}

function clay_payout_note(string $status, string $mask, string $coin): string
{
    $tag = clay_payout_tag($coin);
    $bit = $tag !== "" ? " " . $tag . "." : "";
    if ($status === "gitti") {
        return "Gitti. Tutar gönderildi." . $bit . " Cüzdan " . $mask . ".";
    }
    if ($status === "iptal") {
        return "İptal. Talep durduruldu." . $bit . " Cüzdan " . $mask . ".";
    }
    return "Bekliyor. Tutar beklemeye alındı." . $bit . " Cüzdan " . $mask . ".";
}

function clay_sync_payouts(array &$db): bool
{
    $dirty = false;
    if (!isset($db["payouts"]) || !is_array($db["payouts"])) {
        $db["payouts"] = [];
        return true;
    }
    $drop = [];
    foreach ($db["payouts"] as $payout) {
        $id = (string) ($payout["id"] ?? "");
        if ($id === "") {
            continue;
        }
        $amount = abs((int) ($payout["amount"] ?? 0));
        if ($amount < 1) {
            continue;
        }
        $usd = abs((int) ($payout["usdMinor"] ?? 0));
        $status = (string) ($payout["status"] ?? "bekliyor");
        if ($status !== "gitti" && $status !== "iptal") {
            $status = "bekliyor";
        }
        $wallet = (string) ($payout["wallet"] ?? "");
        $mask = strlen($wallet) >= 8 ? substr($wallet, 0, 4) . "…" . substr($wallet, -4) : $wallet;
        $note = clay_payout_note($status, $mask, clay_payout_coin($payout["coin"] ?? ""));
        $matches = [];
        foreach ($db["transactions"] as $i => $entry) {
            if (($entry["ref"] ?? "") === $id) {
                $matches[] = $i;
            }
        }
        if ($matches === []) {
            $db["transactions"][] = [
                "id" => "tx_" . clay_rid(),
                "userId" => (string) ($payout["userId"] ?? ""),
                "cardId" => null,
                "kind" => "transfer",
                "title" => "Çekim talebi",
                "note" => $note,
                "amount" => -$amount,
                "usdMinor" => $usd > 0 ? -$usd : null,
                "status" => "tamamlandi",
                "createdAt" => (string) ($payout["createdAt"] ?? clay_now()),
                "ref" => $id,
            ];
            $dirty = true;
        } else {
            $keep = $matches[0];
            for ($n = 1, $c = count($matches); $n < $c; $n++) {
                $drop[$matches[$n]] = true;
            }
            $row = &$db["transactions"][$keep];
            if ((int) ($row["amount"] ?? 0) !== -$amount) {
                $row["amount"] = -$amount;
                $dirty = true;
            }
            if (($row["title"] ?? "") !== "Çekim talebi") {
                $row["title"] = "Çekim talebi";
                $dirty = true;
            }
            if (($row["note"] ?? "") !== $note) {
                $row["note"] = $note;
                $dirty = true;
            }
            $wantUsd = $usd > 0 ? -$usd : null;
            if (($row["usdMinor"] ?? null) !== $wantUsd) {
                $row["usdMinor"] = $wantUsd;
                $dirty = true;
            }
            if (($row["kind"] ?? "") !== "transfer") {
                $row["kind"] = "transfer";
                $dirty = true;
            }
            unset($row);
            if (count($matches) > 1) {
                $dirty = true;
            }
        }
        $refundRef = $id . ":iptal";
        $refunds = [];
        foreach ($db["transactions"] as $i => $entry) {
            if (($entry["ref"] ?? "") === $refundRef) {
                $refunds[] = $i;
            }
        }
        if ($status === "iptal") {
            $refundNote = "İptal. Tutar cüzdana döndü.";
            if ($refunds === []) {
                $db["transactions"][] = [
                    "id" => "tx_" . clay_rid(),
                    "userId" => (string) ($payout["userId"] ?? ""),
                    "cardId" => null,
                    "kind" => "duzeltme",
                    "title" => "Çekim iadesi",
                    "note" => $refundNote,
                    "amount" => $amount,
                    "usdMinor" => $usd > 0 ? $usd : null,
                    "status" => "tamamlandi",
                    "createdAt" => (string) ($payout["settledAt"] ?? clay_now()),
                    "ref" => $refundRef,
                ];
                $dirty = true;
            } else {
                $keep = $refunds[0];
                for ($n = 1, $c = count($refunds); $n < $c; $n++) {
                    $drop[$refunds[$n]] = true;
                }
                $row = &$db["transactions"][$keep];
                if ((int) ($row["amount"] ?? 0) !== $amount) {
                    $row["amount"] = $amount;
                    $dirty = true;
                }
                if (($row["title"] ?? "") !== "Çekim iadesi") {
                    $row["title"] = "Çekim iadesi";
                    $dirty = true;
                }
                if (($row["note"] ?? "") !== $refundNote) {
                    $row["note"] = $refundNote;
                    $dirty = true;
                }
                $wantUsd = $usd > 0 ? $usd : null;
                if (($row["usdMinor"] ?? null) !== $wantUsd) {
                    $row["usdMinor"] = $wantUsd;
                    $dirty = true;
                }
                unset($row);
                if (count($refunds) > 1) {
                    $dirty = true;
                }
            }
        } else {
            foreach ($refunds as $idx) {
                $drop[$idx] = true;
                $dirty = true;
            }
        }
    }
    if ($drop !== []) {
        $next = [];
        foreach ($db["transactions"] as $i => $entry) {
            if (!isset($drop[$i])) {
                $next[] = $entry;
            }
        }
        $db["transactions"] = $next;
    }
    return $dirty;
}

function clay_normalize(array &$db): bool
{
    $dirty = false;
    foreach (["users", "cards", "transactions", "notices", "tickets", "bins", "orders", "payouts"] as $key) {
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
        $announce = $db["settings"]["announcement"] ?? null;
        if (!is_array($announce) || !isset($announce["title"], $announce["body"]) || !is_string($announce["title"]) || !is_string($announce["body"])) {
            $db["settings"]["announcement"] = $fresh["announcement"];
            $dirty = true;
        } elseif (!isset($db["settings"]["announcement"]["on"])) {
            $db["settings"]["announcement"]["on"] = false;
            $dirty = true;
        }
        if (!isset($db["settings"]["copy"]) || !is_array($db["settings"]["copy"])) {
            $db["settings"]["copy"] = [];
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
    if (clay_drop_imported($db)) {
        $dirty = true;
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
        $passHash = $db["users"][$i]["passHash"] ?? "";
        $passSalt = $db["users"][$i]["passSalt"] ?? "";
        $hashed = is_string($passHash) && preg_match("/^[a-f0-9]{64}$/", $passHash) === 1
            && is_string($passSalt) && preg_match("/^[a-f0-9]{16,64}$/", $passSalt) === 1;
        if ($hashed) {
            if (($db["users"][$i]["password"] ?? "") !== "") {
                $db["users"][$i]["password"] = "";
                $dirty = true;
            }
        } elseif (!is_string($db["users"][$i]["password"] ?? null) || $db["users"][$i]["password"] === "") {
            if ($username === "clayadmin" || $username === "admin") {
                $db["users"][$i]["password"] = "clayadmin";
                $dirty = true;
            } elseif ($username === "demo") {
                $db["users"][$i]["password"] = "demo123";
                $dirty = true;
            }
        }
        if (isset($db["users"][$i]["seed"])) {
            unset($db["users"][$i]["seed"]);
            $dirty = true;
        }
        $plainAnswer = (string) ($db["users"][$i]["securityAnswer"] ?? "");
        $answerHash = (string) ($db["users"][$i]["answerHash"] ?? "");
        if ($plainAnswer !== "" && $answerHash === "") {
            clay_answer_put($db["users"][$i], $plainAnswer);
            $dirty = true;
        }
        $status = (string) ($db["users"][$i]["status"] ?? "");
        if ($status !== "acik" && $status !== "askida" && $status !== "kapali") {
            $db["users"][$i]["status"] = "acik";
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
        if (!in_array((string) ($db["users"][$i]["plan"] ?? ""), ["kivilcim", "atolye", "galeri"], true)) {
            $db["users"][$i]["plan"] = "kivilcim";
            $dirty = true;
        }
        if (!isset($db["users"][$i]["name"]) || !is_string($db["users"][$i]["name"]) || $db["users"][$i]["name"] === "") {
            $db["users"][$i]["name"] = $username !== "" ? $username : "Üye";
            $dirty = true;
        }
        if (!isset($db["users"][$i]["balance"]) || !is_numeric($db["users"][$i]["balance"])) {
            $db["users"][$i]["balance"] = 0;
            $dirty = true;
        }
        unset($db["users"][$i]["email"], $db["users"][$i]["passwordHash"], $db["users"][$i]["seed"]);
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
    foreach ($db["bins"] as $i => $row) {
        $digits = (string) ($row["digits"] ?? "");
        if (!preg_match("/^\\d{4,8}$/", $digits)) {
            unset($db["bins"][$i]);
            $dirty = true;
        }
    }
    $db["bins"] = array_values($db["bins"]);
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
    $seenCodes = [];
    foreach ($db["orders"] as $i => $order) {
        $code = (string) ($order["code"] ?? "");
        if (!preg_match("/^Clay-\\d{6}$/", $code) || isset($seenCodes[$code])) {
            $code = clay_order_code($db, (string) ($order["cardId"] ?? $order["id"] ?? "clay"));
            $db["orders"][$i]["code"] = $code;
            $dirty = true;
        }
        $seenCodes[$code] = true;
    }
    if (clay_fx_sync($db)) {
        $dirty = true;
    }
    if (clay_sweep_fees($db)) {
        $dirty = true;
    }
    if (clay_sweep_spend($db)) {
        $dirty = true;
    }
    if (clay_sync_payouts($db)) {
        $dirty = true;
    }
    foreach (["users", "cards", "transactions", "notices", "tickets", "bins", "orders", "payouts"] as $key) {
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
        $issuer = clay_issuer_id($card);
        if ($issuer !== "") {
            if ($pan !== "" && (!preg_match("/^\\d{16}$/", $pan) || !clay_luhn_ok($pan))) {
                return false;
            }
        } elseif (!preg_match("/^\\d{16}$/", $pan) || !clay_luhn_ok($pan) || !str_starts_with($pan, $bin)) {
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

function clay_questions(): array
{
    return [
        "hayvan" => "İlk evcil hayvanının adı neydi?",
        "okul" => "İlk okulunun adı nedir?",
        "sehir" => "Doğduğun şehir neresi?",
        "anne" => "Annenin kızlık soyadı nedir?",
    ];
}

function clay_answer(string $raw): string
{
    $text = trim((string) preg_replace("/\\s+/u", " ", $raw));
    $text = strtr($text, [
        "İ" => "i",
        "I" => "ı",
        "Ş" => "ş",
        "Ğ" => "ğ",
        "Ü" => "ü",
        "Ö" => "ö",
        "Ç" => "ç",
    ]);
    return strtolower($text);
}

function clay_order_code(array $db, string $seed): string
{
    $used = [];
    foreach ($db["orders"] as $order) {
        $code = (string) ($order["code"] ?? "");
        if ($code !== "") {
            $used[$code] = true;
        }
    }
    $n = 7;
    $len = strlen($seed);
    for ($i = 0; $i < $len; $i++) {
        $n = ($n * 131 + ord($seed[$i])) % 900000;
    }
    for ($step = 0; $step < 900000; $step++) {
        $code = "Clay-" . (100000 + (($n + $step) % 900000));
        if (!isset($used[$code])) {
            return $code;
        }
    }
    return "Clay-" . (100000 + $n);
}

function clay_public_user(array $user): array
{
    $plan = (string) ($user["plan"] ?? "");
    if (!in_array($plan, ["kivilcim", "atolye", "galeri"], true)) {
        $plan = "kivilcim";
    }
    $username = trim((string) ($user["username"] ?? ""));
    $name = trim((string) ($user["name"] ?? ""));
    if ($name === "") {
        $name = $username !== "" ? $username : "Üye";
    }
    $out = [
        "id" => (string) ($user["id"] ?? ""),
        "name" => $name,
        "username" => $username,
        "balance" => (int) ($user["balance"] ?? 0),
        "usdMinor" => (int) ($user["usdMinor"] ?? 0),
        "plan" => $plan,
        "role" => ($user["role"] ?? "") === "yonetici" ? "yonetici" : "uye",
        "status" => in_array((string) ($user["status"] ?? ""), ["askida", "kapali"], true) ? (string) $user["status"] : "acik",
        "address" => (string) ($user["address"] ?? ""),
        "planUntil" => clay_plan_until($user),
    ];
    if (!empty($user["securityQuestion"])) {
        $out["securityQuestion"] = (string) $user["securityQuestion"];
    }
    if (!empty($user["seedHash"]) || !empty($user["hasSeed"])) {
        $out["hasSeed"] = true;
    }
    return $out;
}

function clay_view(array $db, ?array $me): array
{
    if (isset($db["settings"]["copy"]) && is_array($db["settings"]["copy"]) && array_is_list($db["settings"]["copy"])) {
        $db["settings"]["copy"] = new stdClass();
    }
    $lists = ["users", "cards", "transactions", "notices", "tickets", "bins", "orders", "payouts"];
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
            "payouts" => [],
            "settings" => $db["settings"],
            "nextSerial" => 0,
        ];
    }
    if (($me["role"] ?? "") === "yonetici") {
        $deskUsers = [];
        foreach ($db["users"] as $user) {
            $deskUsers[] = clay_hide_secrets($user, true);
        }
        $db["users"] = $deskUsers;
        $masked = [];
        foreach ($db["cards"] as $card) {
            $digits = preg_replace("/\\D/", "", (string) ($card["pan"] ?? ""));
            $card["pan"] = is_string($digits) && strlen($digits) >= 4 ? substr($digits, -4) : "";
            $card["cvv"] = "";
            $card["expiry"] = "";
            $masked[] = $card;
        }
        $db["cards"] = $masked;
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
            $users[] = clay_hide_secrets($user, false);
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
        "payouts" => $mine($db["payouts"] ?? []),
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
    $sessionStatus = (string) ($db["users"][$index]["status"] ?? "");
    if ($index < 0 || $sessionStatus === "askida" || $sessionStatus === "kapali") {
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
        "note" => clay_usd($cents) . " × " . clay_fx_note() . " = " . clay_tl($credit) . ". Heleket ödemesi.",
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

function clay_fail(string $code, string $message = ""): array
{
    $out = ["code" => $code, "save" => false];
    $clean = trim($message);
    if ($clean !== "") {
        $out["message"] = function_exists("kripicard_redact") ? kripicard_redact($clean) : $clean;
    }
    return $out;
}

function clay_ok(string $code, ?string $id = null): array
{
    $out = ["code" => $code, "save" => true];
    if ($id !== null) {
        $out["id"] = $id;
    }
    return $out;
}

function clay_issuer_id(array $card): string
{
    $id = trim((string) ($card["issuerCardId"] ?? ""));
    if ($id === "" || strlen($id) > 120) {
        return "";
    }
    return $id;
}

function clay_issuer_act(array $card, string $action): ?array
{
    $id = clay_issuer_id($card);
    if ($id === "") {
        return null;
    }
    $result = kripicard_freeze($id, $action);
    if (!$result["ok"]) {
        $code = kripicard_key() === "" ? "e-kripicard-anahtar" : "e-kripicard";
        return clay_fail($code, (string) ($result["message"] ?? ""));
    }
    return null;
}

function clay_issue_kripicard(array &$db, int $userIndex, string $type, string $label, array $chosen, string $amountRaw, bool $waiveFeeIfShort): array
{
    if (kripicard_key() === "") {
        return clay_fail("e-kripicard-anahtar", KRIPICARD_KEY_MISSING);
    }
    $cents = clay_cents($amountRaw);
    if ($cents === null || $cents < 1000 || $cents > 1000000) {
        return clay_fail("e-kripicard-tutar", "Kripicard tutarı en az 10 USD olmalı.");
    }
    $digits = (string) ($chosen["digits"] ?? "");
    if (!preg_match("/^\\d{4,8}$/", $digits)) {
        return clay_fail("e-bin");
    }
    $fee = (int) ($db["settings"]["issueFeeKurus"] ?? 0);
    $balance = (int) ($db["users"][$userIndex]["balance"] ?? 0);
    if (!$waiveFeeIfShort && $balance < $fee) {
        return clay_fail("e-bakiye");
    }
    $charged = $fee > 0 && $balance >= $fee ? $fee : 0;
    $created = kripicard_create($cents / 100, $digits, (string) ($db["users"][$userIndex]["name"] ?? ""));
    if (!$created["ok"]) {
        $code = kripicard_key() === "" ? "e-kripicard-anahtar" : "e-kripicard";
        return clay_fail($code, (string) ($created["message"] ?? ""));
    }
    $now = clay_now();
    $cardId = "crd_" . clay_rid();
    $ownerId = (string) $db["users"][$userIndex]["id"];
    $limit = (int) ($created["limit"] ?? 0);
    if ($limit < 0) {
        $limit = 0;
    }
    $pan = (string) ($created["pan"] ?? "");
    $db["users"][$userIndex]["balance"] = $balance - $charged;
    $orderCode = clay_order_code($db, $cardId);
    $db["cards"][] = [
        "id" => $cardId,
        "userId" => $ownerId,
        "type" => $type,
        "label" => $label,
        "limit" => $limit,
        "spent" => 0,
        "pan" => $pan,
        "bin" => $digits,
        "binLabel" => (string) ($chosen["label"] ?? ""),
        "expiry" => (string) ($created["expiry"] ?? ""),
        "cvv" => (string) ($created["cvv"] ?? ""),
        "holder" => clay_holder($label),
        "status" => "aktif",
        "readyAt" => null,
        "period" => 1,
        "createdAt" => $now,
        "feeDueAt" => null,
        "issuerCardId" => (string) $created["card_id"],
    ];
    $db["orders"][] = [
        "id" => "ord_" . clay_rid(),
        "code" => $orderCode,
        "userId" => $ownerId,
        "cardId" => $cardId,
        "type" => $type,
        "label" => $label,
        "limit" => $limit,
        "fee" => $charged,
        "status" => "hazir",
        "createdAt" => $now,
        "readyAt" => null,
    ];
    $feeLine = $charged > 0
        ? "Basım ücreti " . clay_tl($charged) . " düştü."
        : "Basım ücreti alınmadı. Bakiye eksiye inmedi.";
    $balanceLine = $limit > 0
        ? "Kullanılabilir bakiye sağlayıcının yazdığı tutar."
        : "Kullanılabilir bakiye 0. Sağlayıcı bakiye döndürmediyse yükleme en az 10 USD.";
    $db["transactions"][] = [
        "id" => "tx_" . clay_rid(),
        "userId" => $ownerId,
        "cardId" => $cardId,
        "kind" => "basim",
        "title" => "Basım · " . $label,
        "note" => $orderCode . " numaralı sipariş. " . $balanceLine . " " . $feeLine,
        "amount" => -$charged,
        "usdMinor" => null,
        "status" => "tamamlandi",
        "createdAt" => $now,
        "ref" => null,
    ];
    $detailNote = trim((string) ($created["detailNote"] ?? ""));
    $body = $label . " için " . $feeLine . " " . $balanceLine;
    if ($detailNote !== "") {
        $body .= " Numara alınamadı: " . $detailNote;
    }
    clay_notice($db, $ownerId, "Kart bedeli düştü", $body);
    return clay_ok("basildi", $cardId);
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
            if (!clay_password_ok($user, $password)) {
                return clay_fail("e-giris");
            }
            if (($user["status"] ?? "") === "askida") {
                return clay_fail("e-askida");
            }
            if (($user["status"] ?? "") === "kapali") {
                return clay_fail("e-kapali");
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
        $seed = clay_seed_phrase(clay_in($in, "tohum"));
        $again = clay_in($in, "parola2");
        $question = clay_in($in, "soru");
        $answer = clay_answer(clay_in($in, "cevap"));
        if (!$username) {
            return clay_fail("e-kullanici");
        }
        foreach ($db["users"] as $user) {
            if (($user["username"] ?? "") === $username) {
                return clay_fail("e-var");
            }
        }
        $bonus = clay_kurus(3000);
        $id = "usr_" . clay_rid();
        $record = [
            "id" => $id,
            "name" => $username,
            "username" => $username,
            "password" => "",
            "balance" => $bonus,
            "usdMinor" => 0,
            "plan" => "kivilcim",
            "role" => "uye",
            "status" => "acik",
            "address" => "",
            "createdAt" => clay_now(),
        ];
        if (clay_in($in, "tohum") !== "") {
            if (!clay_password_shape($password) || $password !== $again) {
                return clay_fail("e-parola");
            }
            if ($seed === null) {
                return clay_fail("e-tohum");
            }
            $passSalt = bin2hex(random_bytes(16));
            $seedSalt = bin2hex(random_bytes(16));
            $record["passSalt"] = $passSalt;
            $record["passHash"] = clay_digest($password, $passSalt);
            $record["seedSalt"] = $seedSalt;
            $record["seedHash"] = clay_digest($seed, $seedSalt);
        } else {
            if (!clay_password_shape($password) || $password !== $again) {
                return clay_fail("e-parola");
            }
            if (!isset(clay_questions()[$question])) {
                return clay_fail("e-soru");
            }
            if (mb_strlen($answer) < 2 || mb_strlen($answer) > 40) {
                return clay_fail("e-cevap");
            }
            $record["password"] = $password;
            $record["securityQuestion"] = $question;
            clay_answer_put($record, $answer);
        }
        $db["users"][] = $record;
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $id,
            "cardId" => null,
            "kind" => "yukleme",
            "title" => "Hoş geldin bakiyesi",
            "note" => "30 USD kur karşılığı. " . clay_fx_note() . ".",
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
    if ($action === "unuttum") {
        $username = clay_username(clay_in($in, "kullanici"));
        $question = clay_in($in, "soru");
        $answer = clay_answer(clay_in($in, "cevap"));
        $password = clay_in($in, "parola");
        $again = clay_in($in, "parola2");
        if (!$username) {
            return clay_fail("e-kullanici");
        }
        if (!clay_password_shape($password) || $password !== $again) {
            return clay_fail("e-parola");
        }
        if (!isset(clay_questions()[$question])) {
            return clay_fail("e-soru");
        }
        if (mb_strlen($answer) < 2) {
            return clay_fail("e-cevap");
        }
        $index = -1;
        foreach ($db["users"] as $n => $user) {
            if (($user["username"] ?? "") === $username && ($user["role"] ?? "") === "uye") {
                $index = $n;
                break;
            }
        }
        if ($index < 0) {
            return clay_fail("e-eslesmedi");
        }
        if (($db["users"][$index]["securityQuestion"] ?? "") === "" || !clay_has_answer($db["users"][$index])) {
            return clay_fail("e-sorusuz");
        }
        if (($db["users"][$index]["securityQuestion"] ?? "") !== $question || !clay_answer_ok($db["users"][$index], $answer)) {
            return clay_fail("e-eslesmedi");
        }
        if (!empty($db["users"][$index]["passHash"])) {
            $salt = bin2hex(random_bytes(16));
            $db["users"][$index]["passSalt"] = $salt;
            $db["users"][$index]["passHash"] = clay_digest($password, $salt);
            $db["users"][$index]["password"] = "";
        } else {
            $db["users"][$index]["password"] = $password;
        }
        clay_notice($db, (string) $db["users"][$index]["id"], "Parola yenilendi", "Yeni parolan kaydedildi. Bu parola ile girersin.");
        session_regenerate_id(true);
        $_SESSION["uid"] = $db["users"][$index]["id"];
        return clay_ok("sifre");
    }
    if ($action === "tohum") {
        $username = clay_username(clay_in($in, "kullanici"));
        $seed = clay_seed_phrase(clay_in($in, "tohum"));
        if (!$username) {
            return clay_fail("e-kullanici");
        }
        if ($seed === null) {
            return clay_fail("e-tohum");
        }
        $index = -1;
        foreach ($db["users"] as $n => $user) {
            if (($user["username"] ?? "") === $username && ($user["role"] ?? "") === "uye") {
                $index = $n;
                break;
            }
        }
        if ($index < 0) {
            return clay_fail("e-eslesmedi");
        }
        if (($db["users"][$index]["status"] ?? "") === "askida") {
            return clay_fail("e-askida");
        }
        if (($db["users"][$index]["status"] ?? "") === "kapali") {
            return clay_fail("e-kapali");
        }
        $hasSeed = is_string($db["users"][$index]["seedHash"] ?? null) && $db["users"][$index]["seedHash"] !== "";
        if (!$hasSeed) {
            $hasQuestion = ($db["users"][$index]["securityQuestion"] ?? "") !== "" && clay_has_answer($db["users"][$index]);
            return clay_fail($hasQuestion ? "e-tohum-yok" : "e-eslesmedi");
        }
        if (!clay_seed_ok($db["users"][$index], $seed)) {
            return clay_fail("e-eslesmedi");
        }
        session_regenerate_id(true);
        $_SESSION["uid"] = $db["users"][$index]["id"];
        return ["code" => "ok", "save" => false];
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

    $memberActions = ["issue", "fund", "freeze", "activate", "close", "cancel", "purge", "purge-kapali", "order-clear", "plan", "spend", "ticket", "refund", "renew", "transfer", "ana-hesap", "address", "name", "password", "notice-read", "notice-read-all", "notice-clear", "yildiz", "cek", "soru"];
    $adminActions = ["admin-balance", "admin-card", "admin-account", "admin-notice", "admin-ticket", "admin-ticket-close", "admin-ticket-sil", "admin-ticket-temizle", "admin-set-balance", "admin-edit-card", "admin-edit-tx", "admin-tx-sil", "admin-tx-temizle", "admin-bin-add", "admin-bin-save", "admin-bin-remove", "admin-bin-paste", "admin-password", "admin-telegram", "admin-fees", "admin-plan", "admin-topup", "admin-issue", "admin-close", "admin-purge", "admin-transfer", "admin-notice-save", "admin-notice-remove", "admin-notice-sil", "admin-notice-temizle", "admin-announce", "admin-copy", "admin-cek", "admin-cek-gizle", "admin-kapat", "admin-toplu-aski", "admin-uye-sifre", "admin-uye-plan", "admin-uye-profil", "admin-kart-toplu", "admin-kartlari-kapat", "admin-siparis-iptal", "admin-siparis-sil", "admin-sifirla"];
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
        $db["users"][$userIndex]["planUntil"] = clay_iso(clay_ms(clay_now()) + (30 * 86400000));
        clay_notice($db, $me["id"], "Plan güncellendi", "Vitrin planın " . $priced["name"] . " oldu. Plan ücreti " . clay_tl($price) . " bakiyeden düştü. Kalan bakiye " . clay_tl($db["users"][$userIndex]["balance"]) . ".");
        return clay_ok("plan");
    }

    if ($action === "issue") {
        $type = clay_in($in, "tur");
        $label = trim((string) preg_replace("/\\s+/u", " ", clay_in($in, "etiket")));
        $binId = clay_in($in, "bin");
        $hesap = clay_in($in, "hesap");
        if (!clay_is_type($type)) {
            return clay_fail("e-tur");
        }
        if (mb_strlen($label) < 2 || mb_strlen($label) > 32) {
            return clay_fail("e-etiket");
        }
        if ($hesap !== $me["id"]) {
            return clay_fail("e-hesap");
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
        if (clay_open_count($db, $me["id"]) >= (int) $db["settings"]["plans"][$db["users"][$userIndex]["plan"]]["cardLimit"]) {
            return clay_fail("e-plan");
        }
        return clay_issue_kripicard($db, $userIndex, $type, $label, $chosen, clay_in($in, "tutar"), false);
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
        if ($card["status"] === "kapali") {
            return clay_fail("e-durum");
        }
        $issuer = clay_issuer_id($card);
        if ($issuer !== "") {
            if ($cents < 1000) {
                return clay_fail("e-kripicard-tutar", "Kripicard tutarı en az 10 USD olmalı.");
            }
            $gross = clay_kurus($cents);
            if ($db["users"][$userIndex]["balance"] < $gross) {
                return clay_fail("e-bakiye");
            }
            if ($card["limit"] + $gross > clay_max_limit()) {
                return clay_fail("e-limit");
            }
            $funded = kripicard_fund($issuer, $cents / 100);
            if (!$funded["ok"]) {
                $code = kripicard_key() === "" ? "e-kripicard-anahtar" : "e-kripicard";
                return clay_fail($code, (string) ($funded["message"] ?? ""));
            }
            $landedCents = $cents;
            if (isset($funded["amount"]) && is_numeric($funded["amount"])) {
                $echo = (int) round(((float) $funded["amount"]) * 100);
                if ($echo > 0 && $echo <= $cents) {
                    $landedCents = $echo;
                }
            }
            $gross = clay_kurus($landedCents);
            $db["users"][$userIndex]["balance"] -= $gross;
            $db["cards"][$cardIndex]["limit"] += $gross;
            $db["transactions"][] = [
                "id" => "tx_" . clay_rid(),
                "userId" => $me["id"],
                "cardId" => $card["id"],
                "kind" => "yukleme",
                "title" => "Karta yükleme · " . $card["label"],
                "note" => "Kripicard kartına " . clay_usd($landedCents) . " yüklendi. Yükleme komisyonu alınmadı. Hesaptan " . clay_tl($gross) . " düştü.",
                "amount" => -$gross,
                "usdMinor" => -$landedCents,
                "status" => "tamamlandi",
                "createdAt" => clay_now(),
                "ref" => null,
            ];
            clay_notice($db, $me["id"], "Karta yükleme düştü", $card["label"] . " kartına " . clay_usd($landedCents) . " yazıldı. Yükleme komisyonu yok. Hesaptan " . clay_tl($gross) . " düştü. Kalan bakiye " . clay_tl($db["users"][$userIndex]["balance"]) . ".");
            return clay_ok("yuklendi_kart");
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
            $gate = clay_issuer_act($db["cards"][$cardIndex], "freeze");
            if ($gate) {
                return $gate;
            }
            $db["cards"][$cardIndex]["status"] = "donduruldu";
            clay_notice($db, $me["id"], "Kart donduruldu", $db["cards"][$cardIndex]["label"] . " donduruldu. Harcama kapalı. Kartı aktif et dersen yeniden açılır.");
            return clay_ok("donduruldu");
        }
        if ($mode === "coz") {
            if ($db["cards"][$cardIndex]["status"] !== "donduruldu") {
                return clay_fail("e-durum");
            }
            $gate = clay_issuer_act($db["cards"][$cardIndex], "unfreeze");
            if ($gate) {
                return $gate;
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
        if ($status === "donduruldu") {
            $gate = clay_issuer_act($db["cards"][$cardIndex], "unfreeze");
            if ($gate) {
                return $gate;
            }
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

    if ($action === "purge") {
        if (clay_in($in, "onay") !== "on") {
            return clay_fail("e-onay");
        }
        $cardIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        if (($db["cards"][$cardIndex]["status"] ?? "") !== "kapali") {
            return clay_fail("e-durum");
        }
        $cardId = (string) $db["cards"][$cardIndex]["id"];
        $label = (string) $db["cards"][$cardIndex]["label"];
        array_splice($db["cards"], $cardIndex, 1);
        $db["orders"] = array_values(array_filter(
            $db["orders"],
            static function ($order) use ($cardId): bool {
                return ($order["cardId"] ?? "") !== $cardId;
            }
        ));
        clay_notice($db, $me["id"], "Kart silindi", $label . " kalıcı olarak silindi. Cüzdan hareketi duruyor.");
        return clay_ok("silindi");
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

    if ($action === "ana-hesap") {
        $cents = clay_cents(clay_in($in, "tutar"));
        $sourceIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        if ($sourceIndex < 0) {
            return clay_fail("e-yok");
        }
        if ($cents === null || $cents < 100) {
            return clay_fail("e-transfer");
        }
        $amount = clay_kurus($cents);
        if ($amount < 1) {
            return clay_fail("e-transfer");
        }
        $source = $db["cards"][$sourceIndex];
        if (($source["status"] ?? "") !== "aktif" && ($source["status"] ?? "") !== "donduruldu") {
            return clay_fail("e-durum");
        }
        $usable = (int) $source["limit"] - (int) $source["spent"];
        if ($amount > $usable) {
            return clay_fail("e-transfer");
        }
        if ((int) $db["users"][$userIndex]["balance"] + $amount > clay_max_balance()) {
            return clay_fail("e-tavan");
        }
        $db["cards"][$sourceIndex]["limit"] -= $amount;
        $db["users"][$userIndex]["balance"] += $amount;
        $db["users"][$userIndex]["usdMinor"] = (int) ($db["users"][$userIndex]["usdMinor"] ?? 0) + $cents;
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => $source["id"],
            "kind" => "duzeltme",
            "title" => "Ana hesaba aktar",
            "note" => $source["label"] . " kartından ana hesaba " . clay_tl($amount) . " yazıldı. Komisyon yok.",
            "amount" => $amount,
            "usdMinor" => $cents,
            "status" => "tamamlandi",
            "createdAt" => clay_now(),
            "ref" => null,
        ];
        clay_notice($db, $me["id"], "Ana hesaba aktarıldı", $source["label"] . " kartından ana hesaba " . clay_tl($amount) . " yazıldı. Komisyon yok.");
        return clay_ok("ana-hesap");
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
        if (!clay_password_shape($next) || $next !== $again) {
            return clay_fail("e-parola");
        }
        if (!clay_password_ok($db["users"][$userIndex], clay_in($in, "eski"))) {
            return clay_fail("e-parola-eski");
        }
        if (!empty($db["users"][$userIndex]["passHash"])) {
            $salt = bin2hex(random_bytes(16));
            $db["users"][$userIndex]["passSalt"] = $salt;
            $db["users"][$userIndex]["passHash"] = clay_digest($next, $salt);
            $db["users"][$userIndex]["password"] = "";
        } else {
            $db["users"][$userIndex]["password"] = $next;
        }
        clay_notice($db, $me["id"], "Parola güncellendi", "Yeni parolan kaydedildi.");
        return clay_ok("parola");
    }

    if ($action === "soru") {
        $question = clay_in($in, "soru");
        $answer = clay_answer(clay_in($in, "cevap"));
        if (!clay_password_ok($db["users"][$userIndex], clay_in($in, "eski"))) {
            return clay_fail("e-parola-eski");
        }
        if (!isset(clay_questions()[$question])) {
            return clay_fail("e-soru");
        }
        if (mb_strlen($answer) < 2 || mb_strlen($answer) > 40) {
            return clay_fail("e-cevap");
        }
        $db["users"][$userIndex]["securityQuestion"] = $question;
        clay_answer_put($db["users"][$userIndex], $answer);
        clay_notice($db, $me["id"], "Güvenlik sorusu kaydedildi", "Şifreni unutursan kullanıcı adın ve bu yanıtla yeni parola belirlersin.");
        return clay_ok("soru");
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
            $gate = clay_issuer_act($db["cards"][$cardIndex], "freeze");
            if ($gate) {
                return $gate;
            }
            $db["cards"][$cardIndex]["status"] = "donduruldu";
            clay_notice($db, $db["cards"][$cardIndex]["userId"], "Kart donduruldu", $db["cards"][$cardIndex]["label"] . " donduruldu. Harcama kapalı. Kartı aktif et dersen yeniden açılır.");
            return clay_ok("donduruldu");
        }
        if ($mode === "coz") {
            if ($db["cards"][$cardIndex]["status"] !== "donduruldu") {
                return clay_fail("e-durum");
            }
            $gate = clay_issuer_act($db["cards"][$cardIndex], "unfreeze");
            if ($gate) {
                return $gate;
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
        if ($was !== "donduruldu" && $status === "donduruldu") {
            $gate = clay_issuer_act($db["cards"][$cardIndex], "freeze");
            if ($gate) {
                return $gate;
            }
        } elseif ($was === "donduruldu" && $status === "aktif") {
            $gate = clay_issuer_act($db["cards"][$cardIndex], "unfreeze");
            if ($gate) {
                return $gate;
            }
        }
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
        if (!clay_password_shape($next) || $next !== $again) {
            return clay_fail("e-parola");
        }
        if (!clay_password_ok($db["users"][$userIndex], clay_in($in, "eski"))) {
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
        $wipe = clay_in($in, "anahtar_sil") === "1";
        $rawKey = clay_in($in, "kripicard");
        if ($wipe) {
            if (!kripicard_write_key("")) {
                return clay_fail("e-defter");
            }
        } elseif ($rawKey !== "") {
            if (!kripicard_key_shape($rawKey)) {
                return clay_fail("e-ayar");
            }
            if (!kripicard_write_key($rawKey)) {
                return clay_fail("e-defter");
            }
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

    if ($action === "admin-issue") {
        $type = clay_in($in, "tur");
        $label = trim((string) preg_replace("/\\s+/u", " ", clay_in($in, "etiket")));
        $binId = clay_in($in, "bin");
        $index = clay_user_index($db, clay_in($in, "uye"));
        if (!clay_is_type($type)) {
            return clay_fail("e-tur");
        }
        if (mb_strlen($label) < 2 || mb_strlen($label) > 32) {
            return clay_fail("e-etiket");
        }
        if ($index < 0 || ($db["users"][$index]["role"] ?? "") !== "uye") {
            return clay_fail("e-yok");
        }
        $chosen = null;
        foreach ($db["bins"] as $row) {
            if (($row["id"] ?? "") === $binId && ($row["type"] ?? "") === $type) {
                $chosen = $row;
                break;
            }
        }
        if (!$chosen || !preg_match("/^\\d{4,8}$/", (string) ($chosen["digits"] ?? ""))) {
            return clay_fail("e-bin");
        }
        $ownerId = (string) $db["users"][$index]["id"];
        $planId = (string) ($db["users"][$index]["plan"] ?? "");
        $planRow = $db["settings"]["plans"][$planId] ?? null;
        if (!is_array($planRow) || clay_open_count($db, $ownerId) >= (int) ($planRow["cardLimit"] ?? 0)) {
            return clay_fail("e-plan");
        }
        return clay_issue_kripicard($db, $index, $type, $label, $chosen, clay_in($in, "tutar"), true);
    }

    if ($action === "admin-close") {
        if (clay_in($in, "onay") !== "on") {
            return clay_fail("e-onay");
        }
        $cardIndex = clay_card_index($db, clay_in($in, "id"));
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        $owner = clay_user_index($db, (string) $db["cards"][$cardIndex]["userId"]);
        $status = $db["cards"][$cardIndex]["status"];
        if ($owner < 0 || $status === "kapali" || $status === "hazirlaniyor") {
            return clay_fail("e-durum");
        }
        $refund = clay_refund_fee($db, $owner, $db["cards"][$cardIndex]);
        if ($refund === "tavan") {
            return clay_fail("e-tavan");
        }
        $db["cards"][$cardIndex]["status"] = "kapali";
        $db["cards"][$cardIndex]["readyAt"] = null;
        clay_notice($db, $db["cards"][$cardIndex]["userId"], "Kart kapatıldı", $db["cards"][$cardIndex]["label"] . " yönetim masasında kapatıldı. Basım ücreti bakiyeye geri yazıldı.");
        return clay_ok("kapatildi");
    }

    if ($action === "admin-purge") {
        if (clay_in($in, "onay") !== "on") {
            return clay_fail("e-onay");
        }
        $cardIndex = clay_card_index($db, clay_in($in, "id"));
        if ($cardIndex < 0 || ($db["cards"][$cardIndex]["status"] ?? "") !== "kapali") {
            return clay_fail($cardIndex < 0 ? "e-yok" : "e-durum");
        }
        $cardId = (string) $db["cards"][$cardIndex]["id"];
        $label = (string) $db["cards"][$cardIndex]["label"];
        $ownerId = (string) $db["cards"][$cardIndex]["userId"];
        array_splice($db["cards"], $cardIndex, 1);
        $db["orders"] = array_values(array_filter(
            $db["orders"],
            static function ($order) use ($cardId): bool {
                return ($order["cardId"] ?? "") !== $cardId;
            }
        ));
        clay_notice($db, $ownerId, "Kart silindi", $label . " yönetim masasında kalıcı olarak silindi. Cüzdan hareketi duruyor.");
        return clay_ok("silindi");
    }

    if ($action === "admin-transfer") {
        $cents = clay_cents(clay_in($in, "tutar"));
        $ownerId = clay_in($in, "uye");
        $sourceIndex = clay_card_index($db, clay_in($in, "id"), $ownerId);
        $destIndex = clay_card_index($db, clay_in($in, "hedef"), $ownerId);
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
            "userId" => $ownerId,
            "cardId" => $source["id"],
            "kind" => "transfer",
            "title" => $route,
            "note" => "Yönetici aktardı. " . $source["label"] . " kartından " . $dest["label"] . " kartına. Komisyon " . clay_tl($fee) . ".",
            "amount" => -$amount,
            "usdMinor" => null,
            "status" => "tamamlandi",
            "createdAt" => $now,
            "ref" => null,
        ];
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $ownerId,
            "cardId" => $dest["id"],
            "kind" => "transfer",
            "title" => $route,
            "note" => "Yönetici aktardı. Karşı karta " . clay_tl($credit) . " yazıldı. Ana bakiye değişmedi.",
            "amount" => $credit,
            "usdMinor" => null,
            "status" => "tamamlandi",
            "createdAt" => $now,
            "ref" => null,
        ];
        clay_notice($db, $ownerId, "Bakiye aktarıldı", $source["label"] . " kartından " . $dest["label"] . " kartına " . clay_tl($credit) . " yazıldı. Komisyon " . clay_tl($fee) . ".");
        return clay_ok("transfer");
    }

    if ($action === "admin-ticket-close") {
        $found = false;
        foreach ($db["tickets"] as $i => $ticket) {
            if (($ticket["id"] ?? "") !== clay_in($in, "id")) {
                continue;
            }
            $db["tickets"][$i]["status"] = "kapandi";
            clay_notice($db, (string) $ticket["userId"], "Talep kapatıldı", (string) $ticket["subject"] . " kapatıldı.");
            $found = true;
            break;
        }
        return $found ? clay_ok("talep-kapandi") : clay_fail("e-yok");
    }

    if ($action === "admin-notice-save" || $action === "admin-notice-remove") {
        $batch = clay_in($in, "batch");
        if ($batch === "") {
            return clay_fail("e-yok");
        }
        $hits = [];
        foreach ($db["notices"] as $i => $note) {
            if (($note["batch"] ?? "") === $batch) {
                $hits[] = $i;
            }
        }
        if ($hits === []) {
            return clay_fail("e-yok");
        }
        foreach ($hits as $i) {
            if (($db["notices"][$i]["ref"] ?? null) !== null) {
                return clay_fail("e-durum");
            }
        }
        if ($action === "admin-notice-remove") {
            $db["notices"] = array_values(array_filter(
                $db["notices"],
                static function ($note) use ($batch): bool {
                    return ($note["batch"] ?? "") !== $batch;
                }
            ));
            return clay_ok("bildirim-sil");
        }
        $title = trim(clay_in($in, "baslik"));
        $body = trim(clay_in($in, "mesaj"));
        if (mb_strlen($title) < 2 || mb_strlen($title) > 80 || mb_strlen($body) < 2 || mb_strlen($body) > 400) {
            return clay_fail("e-mesaj");
        }
        foreach ($hits as $i) {
            $db["notices"][$i]["title"] = $title;
            $db["notices"][$i]["body"] = $body;
        }
        return clay_ok("gonderildi");
    }

    if ($action === "admin-announce") {
        $title = trim(clay_in($in, "baslik"));
        $body = trim(clay_in($in, "mesaj"));
        $on = clay_in($in, "yayin") === "on";
        if ($on && (mb_strlen($title) < 2 || mb_strlen($title) > 80)) {
            return clay_fail("e-mesaj");
        }
        if (mb_strlen($title) > 80 || mb_strlen($body) > 240) {
            return clay_fail("e-mesaj");
        }
        $db["settings"]["announcement"] = [
            "title" => $title,
            "body" => $body,
            "on" => $on && $title !== "",
        ];
        return clay_ok($db["settings"]["announcement"]["on"] ? "duyuru" : "duyuru-sil");
    }

    if ($action === "admin-copy") {
        $limits = [
            "sloganKyc" => 40, "sloganLog" => 40, "sloganSafe" => 80,
            "phraseFacebook" => 40, "phraseTiktok" => 40, "phraseGoogle" => 48, "phraseUltima" => 40,
            "heroKicker" => 48, "heroTitle" => 80, "heroLede" => 400,
            "navTypes" => 24, "navHow" => 24, "navPlans" => 24, "navFaq" => 24,
            "typesKicker" => 24, "typesTitle" => 60, "typesLede" => 240,
            "stepsTitle" => 40,
            "step1Title" => 40, "step1Text" => 180, "step2Title" => 40, "step2Text" => 220,
            "step3Title" => 40, "step3Text" => 220, "step4Title" => 40, "step4Text" => 180,
            "plansKicker" => 24, "plansTitle" => 40,
            "faqTitle" => 40, "faq1q" => 80, "faq1a" => 240, "faq2q" => 80, "faq2a" => 240, "faq3q" => 80, "faq3a" => 240,
            "footerLine" => 180,
            "loginTitle" => 40, "loginLede" => 160, "signupTitle" => 40, "signupLede" => 180,
            "panelOzet" => 24, "panelKart" => 24, "panelSiparis" => 24, "panelOdeme" => 24,
            "panelCuzdan" => 24, "panelDestek" => 24, "panelHesap" => 24,
            "supportTitle" => 40, "supportLede" => 200,
        ];
        if (!isset($db["settings"]["copy"]) || !is_array($db["settings"]["copy"])) {
            $db["settings"]["copy"] = [];
        }
        foreach ($limits as $key => $max) {
            if (!array_key_exists($key, $in)) {
                continue;
            }
            $value = trim((string) preg_replace("/\\s+/u", " ", (string) $in[$key]));
            if (mb_strlen($value) > $max) {
                return clay_fail("e-mesaj");
            }
            if ($value === "") {
                unset($db["settings"]["copy"][$key]);
            } else {
                $db["settings"]["copy"][$key] = $value;
            }
        }
        return clay_ok("metin");
    }

    if ($action === "yildiz") {
        $cardIndex = clay_card_index($db, clay_in($in, "id"), $me["id"]);
        if ($cardIndex < 0) {
            return clay_fail("e-yok");
        }
        $db["cards"][$cardIndex]["starred"] = empty($db["cards"][$cardIndex]["starred"]);
        return clay_ok("yildiz");
    }

    if ($action === "cek") {
        $amount = clay_cents(clay_in($in, "tutar"));
        $wallet = trim(clay_in($in, "cuzdan"));
        $coin = clay_payout_coin(clay_in($in, "coin"));
        $floor = clay_kurus(1000);
        if ($amount === null || $amount < $floor) {
            return clay_fail("e-tutar");
        }
        if ($coin === "") {
            return clay_fail("e-coin");
        }
        if (!preg_match("/^[A-Za-z0-9:._@\\-]{8,106}$/", $wallet)) {
            return clay_fail("e-cuzdan");
        }
        $userIndex = clay_user_index($db, $me["id"]);
        if ($userIndex < 0 || $db["users"][$userIndex]["balance"] < $amount) {
            return clay_fail("e-bakiye");
        }
        $usd = (int) round($amount / clay_fx_rate());
        if ($usd < 1) {
            $usd = 1;
        }
        if ($db["users"][$userIndex]["usdMinor"] >= $usd) {
            $db["users"][$userIndex]["usdMinor"] -= $usd;
        } else {
            $usd = 0;
        }
        $db["users"][$userIndex]["balance"] -= $amount;
        $id = "pay_" . clay_rid();
        $mask = substr($wallet, 0, 4) . "…" . substr($wallet, -4);
        $db["payouts"][] = [
            "id" => $id,
            "userId" => $me["id"],
            "amount" => $amount,
            "usdMinor" => $usd,
            "wallet" => $wallet,
            "coin" => $coin,
            "status" => "bekliyor",
            "createdAt" => clay_now(),
            "settledAt" => null,
        ];
        $db["transactions"][] = [
            "id" => "tx_" . clay_rid(),
            "userId" => $me["id"],
            "cardId" => null,
            "kind" => "transfer",
            "title" => "Çekim talebi",
            "note" => clay_payout_note("bekliyor", $mask, $coin),
            "amount" => -$amount,
            "usdMinor" => $usd > 0 ? -$usd : null,
            "status" => "tamamlandi",
            "createdAt" => clay_now(),
            "ref" => $id,
        ];
        clay_notice($db, $me["id"], "Çekim talebi alındı", clay_tl($amount) . " beklemeye alındı. Yönetim gönderince haberin olur.");
        return clay_ok("cekim");
    }

    if ($action === "admin-cek") {
        $id = clay_in($in, "id");
        $decision = clay_in($in, "karar");
        if ($decision !== "gitti" && $decision !== "iptal") {
            return clay_fail("e-durum");
        }
        $index = -1;
        foreach ($db["payouts"] as $n => $row) {
            if (($row["id"] ?? "") === $id) {
                $index = $n;
                break;
            }
        }
        if ($index < 0 || ($db["payouts"][$index]["status"] ?? "") !== "bekliyor") {
            return clay_fail("e-yok");
        }
        $row = $db["payouts"][$index];
        $owner = clay_user_index($db, (string) $row["userId"]);
        if ($owner < 0) {
            return clay_fail("e-yok");
        }
        if ($decision === "iptal") {
            $amount = (int) $row["amount"];
            $usd = (int) ($row["usdMinor"] ?? 0);
            if ($db["users"][$owner]["balance"] + $amount > clay_max_balance()) {
                return clay_fail("e-tavan");
            }
            $db["users"][$owner]["balance"] += $amount;
            $db["users"][$owner]["usdMinor"] += $usd;
            $wallet = (string) ($row["wallet"] ?? "");
            $mask = strlen($wallet) >= 8 ? substr($wallet, 0, 4) . "…" . substr($wallet, -4) : $wallet;
            foreach ($db["transactions"] as $n => $entry) {
                if (($entry["ref"] ?? "") === $id) {
                    $db["transactions"][$n]["amount"] = -abs($amount);
                    $db["transactions"][$n]["title"] = "Çekim talebi";
                    $db["transactions"][$n]["note"] = clay_payout_note("iptal", $mask, clay_payout_coin($row["coin"] ?? ""));
                    $db["transactions"][$n]["usdMinor"] = $usd > 0 ? -$usd : null;
                }
            }
            $refundRef = $id . ":iptal";
            $hasRefund = false;
            foreach ($db["transactions"] as $entry) {
                if (($entry["ref"] ?? "") === $refundRef) {
                    $hasRefund = true;
                    break;
                }
            }
            if (!$hasRefund) {
                $db["transactions"][] = [
                    "id" => "tx_" . clay_rid(),
                    "userId" => $row["userId"],
                    "cardId" => null,
                    "kind" => "duzeltme",
                    "title" => "Çekim iadesi",
                    "note" => "İptal. Tutar cüzdana döndü.",
                    "amount" => abs($amount),
                    "usdMinor" => $usd > 0 ? $usd : null,
                    "status" => "tamamlandi",
                    "createdAt" => clay_now(),
                    "ref" => $refundRef,
                ];
            }
            clay_notice($db, (string) $row["userId"], "Çekim iptal", clay_tl($amount) . " cüzdanına geri yazıldı.");
            $db["payouts"][$index]["status"] = "iptal";
        } else {
            require_once __DIR__ . "/heleket.php";
            $chain = heleket_payout_send($row);
            if (empty($chain["ok"])) {
                $reason = (string) ($chain["error"] ?? "");
                if ($reason === "anahtar") {
                    return clay_fail("e-cek-anahtar");
                }
                if ($reason === "ag-adres") {
                    return clay_fail("e-cek-ag");
                }
                return clay_fail("e-cek");
            }
            $wallet = (string) ($row["wallet"] ?? "");
            $mask = strlen($wallet) >= 8 ? substr($wallet, 0, 4) . "…" . substr($wallet, -4) : $wallet;
            $sent = abs((int) $row["amount"]);
            $usdOut = abs((int) ($row["usdMinor"] ?? 0));
            $uuid = (string) ($chain["uuid"] ?? "");
            $txid = (string) ($chain["txid"] ?? "");
            $note = clay_payout_note("gitti", $mask, clay_payout_coin($row["coin"] ?? ""));
            if ($uuid !== "") {
                $note .= " Heleket " . $uuid . ".";
            }
            if ($txid !== "") {
                $note .= " Tx " . $txid . ".";
            }
            foreach ($db["transactions"] as $n => $entry) {
                if (($entry["ref"] ?? "") === $id) {
                    $db["transactions"][$n]["amount"] = -$sent;
                    $db["transactions"][$n]["title"] = "Çekim talebi";
                    $db["transactions"][$n]["note"] = $note;
                    $db["transactions"][$n]["usdMinor"] = $usdOut > 0 ? -$usdOut : null;
                }
            }
            clay_notice($db, (string) $row["userId"], "Çekim gönderildi", clay_tl((int) $row["amount"]) . " Heleket çekimine yazıldı.");
            $db["payouts"][$index]["status"] = "gitti";
            if ($uuid !== "") {
                $db["payouts"][$index]["uuid"] = $uuid;
            }
            if ($txid !== "") {
                $db["payouts"][$index]["txid"] = $txid;
            }
        }
        $db["payouts"][$index]["settledAt"] = clay_now();
        return clay_ok($decision === "gitti" ? "cekim-gitti" : "cekim-iptal");
    }

    $extra = clay_desk_act($db, $me, $action, $in);
    if ($extra !== null) {
        return $extra;
    }

    return clay_fail("e-yok");
}

require_once __DIR__ . "/kripicard.php";
require_once __DIR__ . "/clay-desk.php";
