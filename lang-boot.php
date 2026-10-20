<?php
if (defined("CLAY_LANG_BOOTED")) {
    return;
}
define("CLAY_LANG_BOOTED", 1);

function clay_client_ip()
{
    $candidates = array();
    if (!empty($_SERVER["HTTP_CF_CONNECTING_IP"])) {
        $candidates[] = $_SERVER["HTTP_CF_CONNECTING_IP"];
    }
    if (!empty($_SERVER["REMOTE_ADDR"])) {
        $candidates[] = $_SERVER["REMOTE_ADDR"];
    }
    foreach ($candidates as $raw) {
        $ip = trim(explode(",", $raw)[0]);
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }
    }
    return "";
}

function clay_lookup_country($ip)
{
    return null;
    if ($ip === "" || !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return null;
    }
    if (!function_exists("curl_init")) {
        return null;
    }
    $ch = curl_init("https://ipwho.is/" . rawurlencode($ip) . "?fields=success,country_code");
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT_MS => 800,
        CURLOPT_CONNECTTIMEOUT_MS => 400,
        CURLOPT_USERAGENT => "ClayVirtualCard",
    ));
    $raw = curl_exec($ch);
    curl_close($ch);
    if (!is_string($raw) || $raw === "") {
        return null;
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || empty($data["success"])) {
        return null;
    }
    $code = strtoupper((string) (isset($data["country_code"]) ? $data["country_code"] : ""));
    return preg_match("/^[A-Z]{2}$/", $code) ? $code : null;
}

function clay_remember($code)
{
    if (headers_sent()) {
        return;
    }
    setcookie("clay-lang", $code, array(
        "expires" => time() + 31536000,
        "path" => "/",
        "samesite" => "Lax",
    ));
}

function clay_pick_lang()
{
    static $lang = null;
    if ($lang !== null) {
        return $lang;
    }
    $cookie = isset($_COOKIE["clay-lang"]) ? $_COOKIE["clay-lang"] : "";
    if ($cookie === "tr" || $cookie === "en" || $cookie === "ru") {
        $lang = $cookie;
        return $lang;
    }
    $lang = "tr";
    return $lang;
}

function clay_pairs($lang)
{
    $en = array(
        "ClayVirtualCard ile Anında Sanal Kartını Oluştur." => "Create Your Virtual Card Instantly with ClayVirtualCard.",
        "Kart oluşturmak sadece 1 blok zincir onayına bakar. Bakiyeni yükle, anında kartını oluştur ve dilediğin gibi harca." => "Card creation takes just 1 blockchain confirmation. Top up your balance, generate your card instantly, and spend worldwide.",
        "⚡ 100'den Fazla Token Desteği ile Sınırsız Esneklik" => "⚡ Supported by 100+ Tokens for Wide Flexibility",
        "Kripto ile Güvenli Ödeme" => "Secure Crypto Payments",
        "Sanal kartını kripto varlıklarınla güvenle finanse et ve hemen harcamaya başla." => "Fund your virtual card securely with digital assets and start spending immediately.",
        "Güvenlik Uyarısı" => "Security Warning",
        "Kart bilgilerinizi, kullanıcı adınızı ve şifrenizi kimseyle paylaşmayınız. ClayVirtualCard ekibi sizden asla şifre talep etmez." => "Never share your card details, username, or password with anyone. Our team will never ask for your password.",
        "7/24 Kesintisiz Canlı Destek" => "24/7 Live Support",
        "Sorularınız veya işlemleriniz için uzman destek ekibimiz her an yanınızda." => "Our expert support team is always here to assist you with any questions or transactions.",
        "Şeffaf ve Anlık Onaylar" => "Transparent & Instant Confirmations",
        "Bakiyeniz blok zinciri ağı üzerinde 1 onay aldığı anda kartınız kullanıma hazır hale gelir." => "Your card is ready to use as soon as your deposit receives 1 blockchain confirmation.",
    );
    $ru = array(
        "ClayVirtualCard ile Anında Sanal Kartını Oluştur." => "Создайте виртуальную карту мгновенно с ClayVirtualCard.",
        "Kart oluşturmak sadece 1 blok zincir onayına bakar. Bakiyeni yükle, anında kartını oluştur ve dilediğin gibi harca." => "Создание карты занимает всего 1 подтверждение блокчейна. Пополните баланс, мгновенно выпустите карту и тратьте по всему миру.",
        "⚡ 100'den Fazla Token Desteği ile Sınırsız Esneklik" => "⚡ Поддержка более 100 токенов для полной гибкости",
        "Kripto ile Güvenli Ödeme" => "Безопасная оплата криптовалютой",
        "Sanal kartını kripto varlıklarınla güvenle finanse et ve hemen harcamaya başla." => "Безопасно пополните виртуальную карту цифровыми активами и сразу начните тратить.",
        "Güvenlik Uyarısı" => "Предупреждение о безопасности",
        "Kart bilgilerinizi, kullanıcı adınızı ve şifrenizi kimseyle paylaşmayınız. ClayVirtualCard ekibi sizden asla şifre talep etmez." => "Никому не сообщайте данные карты, имя пользователя и пароль. Команда ClayVirtualCard никогда не запрашивает пароль.",
        "7/24 Kesintisiz Canlı Destek" => "Круглосуточная поддержка",
        "Sorularınız veya işlemleriniz için uzman destek ekibimiz her an yanınızda." => "Наша команда поддержки всегда рядом, чтобы помочь с вопросами и операциями.",
        "Şeffaf ve Anlık Onaylar" => "Прозрачные и мгновенные подтверждения",
        "Bakiyeniz blok zinciri ağı üzerinde 1 onay aldığı anda kartınız kullanıma hazır hale gelir." => "Карта готова к использованию, как только депозит получит 1 подтверждение блокчейна.",
    );
    if ($lang === "ru") {
        return $ru;
    }
    if ($lang === "en") {
        return $en;
    }
    return array();
}

function clay_prepare($html)
{
    if (!is_string($html) || stripos($html, "<html") === false) {
        return $html;
    }
    $lang = clay_pick_lang();
    $pairs = clay_pairs($lang);
    if ($pairs) {
        $html = strtr($html, $pairs);
    }
    $html = preg_replace('/<html\b([^>]*?)\blang="[^"]*"/i', '<html$1lang="' . $lang . '"', $html, 1);
    if (strpos($html, 'localStorage.setItem("clay-lang"') === false) {
        $script = '<script>try{var L=' . json_encode($lang) . ';var k="clay-lang";var c=localStorage.getItem(k);if(c!=="tr"&&c!=="en"&&c!=="ru"){localStorage.setItem(k,L);c=L}document.documentElement.lang=c}catch(e){}</script>';
        $html = preg_replace('/<head\b[^>]*>/i', '$0' . $script, $html, 1);
    }
    if (strpos($html, "/clay-v14.js") === false) {
        $html = preg_replace('/<\/head>/i', '<link rel="stylesheet" href="/clay-v14.css"><script src="/clay-v14.js"></script></head>', $html, 1);
    }
    return $html;
}

function clay_emit($path)
{
    $html = file_get_contents($path);
    echo clay_prepare($html === false ? "" : $html);
}
