<?php
/**
 * VPS watcher. Reads PST every few seconds even when no browser is open.
 *
 * cPanel Cron, every minute:
 *   php /home/KULLANICI/public_html/api/pst-watch.php
 *
 * A VPS can keep one process up:
 *   php /home/KULLANICI/public_html/api/pst-watch.php --daemon
 *
 * The web server must not run this file. .htaccess denies it.
 */

if (PHP_SAPI !== "cli") {
    http_response_code(404);
    exit;
}

require_once __DIR__ . "/clay-ledger.php";

$daemon = in_array("--daemon", $argv ?? [], true);
$once = in_array("--once", $argv ?? [], true);
$lockPath = dirname(__DIR__) . "/pst-watch.lock";
$lock = fopen($lockPath, "c");
if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
    exit(0);
}

$stop = microtime(true) + ($daemon ? 86400 * 30 : 50);
do {
    $started = microtime(true);
    [$handle, $db] = clay_load_raw();
    if (!$handle || !is_array($db)) {
        fwrite(STDERR, "defter acilamadi\n");
        break;
    }
    clay_normalize($db);
    clay_pst_sync($db, false, 4000);
    clay_pst_ensure($db["settings"]);
    $db["settings"]["pst"]["watchedAt"] = clay_now();
    if (!clay_assert($db)) {
        fwrite(STDERR, "defter dogrulanamadi\n");
        clay_release($handle);
    } else {
        clay_commit($handle, $db);
    }
    if ($once || microtime(true) >= $stop) {
        break;
    }
    $wait = 5 - (microtime(true) - $started);
    if ($wait > 0) {
        usleep((int) round($wait * 1000000));
    }
} while (microtime(true) < $stop);

flock($lock, LOCK_UN);
fclose($lock);
