export class ShopError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 422,
    public details?: unknown,
  ) {
    super(message);
  }
}
export type Line = {
  variantId: string;
  productName: string;
  variantLabel: string;
  priceKobo: number;
  quantity: number;
  active: boolean;
};
export type Cart = {
  id: string;
  revision: number;
  lines: Line[];
  subtotalKobo?: number;
};
export const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function strict(value: unknown, keys: string[]): Record<string, any> {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    Object.keys(value).some((k) => !keys.includes(k))
  ) throw new ShopError("VALIDATION_FAILED", "Invalid request fields.");
  return value as Record<string, any>;
}
export function validateMutation(value: unknown) {
  const v = strict(value, ["variantId", "quantity", "expectedRevision"]);
  if (
    !uuid.test(v.variantId) || !Number.isInteger(v.quantity) ||
    v.quantity < 0 || v.quantity > 10 ||
    !Number.isInteger(v.expectedRevision) || v.expectedRevision < 0
  ) {
    throw new ShopError(
      "VALIDATION_FAILED",
      "Choose a valid item, quantity and cart revision.",
    );
  }
  return v;
}
export function validateCheckout(value: unknown): Record<string, any> {
  const v = strict(value, [
    "idempotencyKey",
    "cartRevision",
    "quoteFingerprint",
    "delivery",
  ]);
  const d = strict(v.delivery, ["recipientName", "city", "address"]);
  if (
    !uuid.test(v.idempotencyKey) || !Number.isInteger(v.cartRevision) ||
    v.cartRevision < 0 || !/^[a-f0-9]{64}$/.test(v.quoteFingerprint || "")
  ) throw new ShopError("VALIDATION_FAILED", "Invalid checkout reference.");
  for (
    const [key, max] of [["recipientName", 100], ["city", 100], [
      "address",
      300,
    ]] as const
  ) {
    if (
      typeof d[key] !== "string" || d[key].trim().length < 2 ||
      d[key].trim().length > max
    ) {
      throw new ShopError(
        "VALIDATION_FAILED",
        "Enter fictional delivery details.",
      );
    }
    d[key] = d[key].trim();
  }
  return {
    idempotencyKey: v.idempotencyKey,
    cartRevision: v.cartRevision,
    quoteFingerprint: v.quoteFingerprint,
    delivery: {
      recipientName: d.recipientName,
      city: d.city,
      address: d.address,
    },
  };
}
export async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  ).map((x) => x.toString(16).padStart(2, "0")).join("");
}
export async function calculateQuote(cart: Cart) {
  if (!cart.lines.length) {
    throw new ShopError("EMPTY_CART", "Your cart is empty.");
  }
  if (cart.lines.some((l) => !l.active)) {
    throw new ShopError(
      "ITEM_UNAVAILABLE",
      "Review unavailable cart items.",
      409,
    );
  }
  let subtotalKobo = 0;
  for (const l of cart.lines) {
    if (
      !Number.isSafeInteger(l.priceKobo) || l.priceKobo < 0 ||
      !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 10
    ) throw new ShopError("VALIDATION_FAILED", "Invalid cart values.");
    subtotalKobo += l.priceKobo * l.quantity;
  }
  const totalKobo = subtotalKobo + 250000;
  if (!Number.isSafeInteger(totalKobo)) {
    throw new ShopError(
      "VALIDATION_FAILED",
      "Cart total exceeds the supported range.",
    );
  }
  const normalized = cart.lines.map(
    (l) => [l.variantId, l.quantity, l.priceKobo],
  ).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return {
    cartId: cart.id,
    cartRevision: cart.revision,
    fingerprint: await hash(
      JSON.stringify([cart.id, cart.revision, normalized, 250000]),
    ),
    subtotalKobo,
    deliveryKobo: 250000,
    totalKobo,
    currency: "NGN",
  };
}
export function mergeLines(a: Line[], b: Line[]) {
  const result = new Map<string, Line>();
  for (const l of [...a, ...b]) {
    const previous = result.get(l.variantId);
    result.set(l.variantId, {
      ...l,
      quantity: l.quantity + (previous?.quantity || 0),
    });
  }
  const lines = [...result.values()];
  if (lines.length > 20 || lines.some((l) => l.quantity > 10 || !l.active)) {
    throw new ShopError(
      "MERGE_CONFLICT",
      "Review unavailable items or reduce quantities before transferring.",
      409,
      { lines },
    );
  }
  return lines;
}
export function retryDelay(attempt: number) {
  return [60000, 300000, 1800000][attempt - 1] ?? null;
}
export function escape(value: unknown) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]!),
  );
}
export function renderEmail(order: any, site: string) {
  const url = new URL("/projects/shop/confirmation/", site);
  url.searchParams.set("order", order.id);
  const items = order.items.map((i: any) =>
    `${i.quantity} × ${i.productName} — NGN ${
      (i.priceKobo * i.quantity / 100).toLocaleString("en-NG")
    }`
  ).join("\n");
  const text =
    `Portfolio demo — no payment or shipment.\nOrder ${order.reference}\n${items}\nDemo total: NGN ${
      (order.total_kobo / 100).toLocaleString("en-NG")
    }\nView your receipt (sign-in required): ${url}`;
  return {
    to: order.recipient_email,
    subject: `Luma demo order confirmed — ${order.reference}`,
    text,
    html: `<p>${escape(text).replace(/\n/g, "<br>")}</p>`,
  };
}
