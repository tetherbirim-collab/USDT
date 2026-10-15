import { Mark, Wordmark } from "./mark";

const LINES = ["KYC GEREKMEZ", "ANONİM SANAL KART", "OLUŞTUR", "HEMEN REKLAMINA BAŞLA"];

const FACES = [
  ["facebook_ads", "Facebook Ads", "reg-card-a"],
  ["tiktok", "TikTok", "reg-card-b"],
  ["google_ads", "Google Ads", "reg-card-c"],
] as const;

export function RegisterStage() {
  return (
    <div className="reg-stage relative min-h-[340px] overflow-hidden lg:min-h-full">
      <div className="relative z-10 flex h-full min-h-[340px] flex-col justify-between gap-8 px-7 py-9 sm:px-10 lg:min-h-full">
        <div className="flex items-center gap-3">
          <Mark className="h-11 w-11" />
          <Wordmark />
        </div>
        <div className="reg-fan" aria-hidden>
          {FACES.map(([type, name, place]) => (
            <span key={type} className={`launch-card launch-card-${type} reg-card ${place}`}>
              <span className="launch-chip" />
              <span className="launch-brand">{name}</span>
            </span>
          ))}
        </div>
        <div>
          <div className="reg-lines">
            {LINES.map((line) => (
              <p key={line} className="reg-line">
                {line}
              </p>
            ))}
          </div>
          <p className="sr-only">KYC gerekmez. Anonim sanal kart oluştur. Hemen reklamına başla.</p>
        </div>
      </div>
    </div>
  );
}
