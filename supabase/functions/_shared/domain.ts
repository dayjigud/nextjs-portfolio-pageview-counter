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
  const money = (kobo: number | string) => `NGN ${
    (Number(kobo) / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }`;
  const subtotal = order.subtotal_kobo ?? order.items.reduce(
    (sum: number, i: any) => sum + i.priceKobo * i.quantity,
    0,
  );
  const delivery = order.delivery_kobo ?? Number(order.total_kobo) - Number(subtotal);
  const items = order.items.map((i: any) =>
    `${i.quantity} × ${i.productName} — ${money(i.priceKobo * i.quantity)}`
  ).join("\n");
  const text =
    `Portfolio demo — no payment or shipment.\nOrder ${order.reference}\n${items}\nSubtotal: ${money(subtotal)}\nDemo delivery: ${money(delivery)}\nDemo total: ${money(order.total_kobo)}\nView your receipt (sign-in required): ${url}`;
  // Inline essentials and presentation tables keep the receipt readable when
  // clients strip stylesheets, web fonts, gradients, or rounded corners.
  const rows = order.items.map((i: any) => `
                    <tr>
                      <td style="padding:20px 12px 20px 0;border-bottom:1px solid #e3dfe7;vertical-align:top;overflow-wrap:anywhere;word-break:break-word;">
                        <p style="margin:0 0 6px;font-size:15px;line-height:22px;font-weight:700;">${escape(i.productName)}</p>
                        <p style="margin:0;color:#69616f;font-size:13px;line-height:20px;">Qty ${escape(i.quantity)} &middot; ${money(i.priceKobo)} each</p>
                      </td>
                      <td class="email-line-total" width="130" align="right" style="padding:20px 0;border-bottom:1px solid #e3dfe7;vertical-align:top;font-size:14px;line-height:22px;font-weight:700;">${money(i.priceKobo * i.quantity)}</td>
                    </tr>`).join("");
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Your Luma demo receipt</title>
    <style>
      @media only screen and (max-width:480px) {
        .email-shell { padding:16px 12px !important; }
        .email-pad { padding:28px 20px !important; }
        .email-title { font-size:34px !important; line-height:36px !important; letter-spacing:-1.5px !important; }
        .email-line-total { width:120px !important; font-size:13px !important; }
        .email-total-label { font-size:14px !important; white-space:nowrap !important; }
        .email-total { font-size:16px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f4eef9;color:#202027;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
    <div style="display:none;font-size:1px;line-height:1px;color:#f4eef9;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Your Luma demo order is confirmed. Your picks, your total, and your private receipt. No payment or shipment.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4eef9" style="width:100%;background-color:#f4eef9;">
      <tr>
        <td class="email-shell" align="center" style="padding:40px 16px;">
          <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:0 8px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:28px;line-height:32px;font-weight:900;letter-spacing:-1.8px;">LUMA<span aria-hidden="true" style="color:#7452c4;letter-spacing:0;"> ✳</span></td>
                    <td align="right" style="color:#615969;font-family:'Courier New',monospace;font-size:10px;line-height:16px;letter-spacing:1.2px;">A LITTLE LESS<br>ORDINARY</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad" bgcolor="#e8e0f3" style="padding:40px 36px;background-color:#e8e0f3;background-image:linear-gradient(120deg,#e4f3f0,#e8e0f3 65%,#f5e2d9);border:1px solid #ffffff;border-radius:28px 28px 0 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr><td bgcolor="#d4ebe1" style="padding:8px 12px;border-radius:30px;color:#215645;font-family:'Courier New',monospace;font-size:11px;line-height:16px;letter-spacing:1px;">DEMO ORDER CONFIRMED</td></tr>
                </table>
                <h1 class="email-title" style="margin:24px 0 18px;font-size:44px;line-height:46px;font-weight:900;letter-spacing:-2px;">Your next good thing<br><span style="color:#61479a;">is confirmed.</span></h1>
                <p style="margin:0;color:#595761;font-size:15px;line-height:25px;">Good tech. Great energy. Your demo order is saved.<br>Here&rsquo;s a little recap of your picks.</p>
              </td>
            </tr>
            <tr>
              <td class="email-pad" bgcolor="#ffffff" style="padding:32px 36px 36px;background-color:#ffffff;border:1px solid #ffffff;border-top:0;border-radius:0 0 28px 28px;">
                <p style="margin:0 0 8px;color:#69616f;font-family:'Courier New',monospace;font-size:11px;line-height:18px;letter-spacing:1px;">YOUR ORDER</p>
                <h2 style="margin:0 0 12px;font-size:17px;line-height:25px;font-weight:700;overflow-wrap:anywhere;word-break:break-word;">${escape(order.reference)}</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;">
                  ${rows}
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:18px;font-size:14px;line-height:22px;">
                  <tr><td style="padding:6px 12px 6px 0;color:#69616f;">Subtotal</td><td align="right" style="padding:6px 0;">${money(subtotal)}</td></tr>
                  <tr><td style="padding:6px 12px 6px 0;color:#69616f;">Demo delivery</td><td align="right" style="padding:6px 0;">${money(delivery)}</td></tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f2f8" style="width:100%;background-color:#f5f2f8;border-radius:14px;margin-top:14px;">
                  <tr><td class="email-total-label" style="padding:18px 8px 18px 16px;font-size:15px;line-height:24px;font-weight:700;">Demo total</td><td class="email-total" align="right" style="padding:18px 16px 18px 0;font-size:20px;line-height:26px;font-weight:700;color:#61479a;">${money(order.total_kobo)}</td></tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                  <tr><td align="center" bgcolor="#202027" style="background-color:#202027;border-radius:50px;mso-padding-alt:16px 24px;"><a href="${escape(url.toString())}" style="display:inline-block;padding:16px 24px;border:1px solid #202027;border-radius:50px;font-size:14px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;">View your receipt <span aria-hidden="true">&nbsp;↗</span></a></td></tr>
                </table>
                <p style="margin:12px 0 0;color:#69616f;font-size:12px;line-height:20px;">Your receipt is private &mdash; sign-in required with the Google account used at checkout.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:26px 16px 0;">
                <p style="margin:0 0 8px;color:#615969;font-size:12px;line-height:20px;">Thoughtfully picked. Playfully put together.</p>
                <p style="margin:0;color:#615969;font-size:12px;line-height:20px;">Portfolio demo &mdash; no payment or shipment.</p>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return {
    to: order.recipient_email,
    subject: `Luma demo order confirmed — ${order.reference}`,
    text,
    html,
  };
}
