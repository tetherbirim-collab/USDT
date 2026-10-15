export function remainLeft(limit: number, spent: number): number {
  if (limit <= 0) return 0;
  const left = ((limit - spent) / limit) * 100;
  return Math.max(0, Math.min(100, Math.round(left)));
}

export function remainInk(left: number): { bar: string; ink: string } {
  const t = Math.min(100, Math.max(0, left)) / 100;
  const hue = t >= 0.5 ? 48 + ((t - 0.5) / 0.5) * 112 : 4 + (t / 0.5) * 44;
  return {
    bar: `linear-gradient(90deg, hsl(${hue} 76% 62%), hsl(${Math.max(0, hue - 14)} 82% 46%))`,
    ink: `hsl(${hue} 72% ${t < 0.35 ? 74 : 86}%)`,
  };
}

export function remainMood(left: number): { line: string; load: boolean; urgent: boolean } {
  if (left <= 0) {
    return { line: "Tavan doldu. Harcamaya devam etmek için bakiye yükle.", load: true, urgent: true };
  }
  if (left <= 10) {
    return { line: "Son dilim. Tavan tükenmeden bakiye yükle.", load: true, urgent: true };
  }
  if (left <= 20) {
    return { line: "Kalan yüzde yirmi. Bir yükleme kampanyayı açık tutar.", load: true, urgent: true };
  }
  if (left <= 30) {
    return { line: "Kalan yüzde otuz. Tempo bozulmasın, bakiye yükle.", load: true, urgent: false };
  }
  if (left <= 50) {
    return { line: "Tavanın yarısı kullanıldı. Cüzdanı şimdiden doldurmak rahat ettirir.", load: false, urgent: false };
  }
  return { line: "", load: false, urgent: false };
}
