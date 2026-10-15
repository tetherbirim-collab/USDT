export type HeleketPayment = {
  status: string;
  amount: string;
  final: boolean;
  cents: number;
};

async function post(body: Record<string, string>): Promise<Response> {
  return fetch("/api/heleket.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function openHeleketPayment(cents: number, userId: string): Promise<void> {
  const response = await post({
    action: "create",
    amount: (cents / 100).toFixed(2),
    userId,
  });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error || "heleket");
  }
  window.location.assign(data.url);
}

export async function readHeleketPayment(orderId: string, userId: string): Promise<HeleketPayment> {
  const response = await post({ action: "status", orderId, userId });
  const data = (await response.json().catch(() => ({}))) as { status?: string; amount?: string; final?: boolean; error?: string };
  if (!response.ok || !data.amount) {
    throw new Error(data.error || "heleket");
  }
  const cents = Math.round(Number(data.amount) * 100);
  return {
    status: data.status || "check",
    amount: data.amount,
    final: Boolean(data.final),
    cents,
  };
}
