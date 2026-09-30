import { takeRateLimit } from "./limits.ts";
import { db, type SQL } from "./db.ts";
import { type Identity, permanent } from "./auth.ts";
import {
  calculateQuote,
  type Cart,
  hash,
  type Line,
  mergeLines,
  ShopError,
  strict,
  uuid,
  validateCheckout,
  validateMutation,
} from "./domain.ts";
async function cartRow(sql: SQL, userId: string) {
  await sql`insert into public.carts(user_id) values(${userId}) on conflict(user_id) do nothing`;
  return (await sql`select * from public.carts where user_id=${userId} for update`)[
    0
  ];
}
export async function loadCart(sql: SQL, row: any): Promise<Cart> {
  const result =
    await sql`select v.id as variant_id,p.name,v.label,v.price_kobo,i.quantity,(v.active and p.active) as active from public.cart_items i join public.product_variants v on v.id=i.variant_id join public.products p on p.id=v.product_id where i.cart_id=${row.id} order by v.id`;
  const lines: Line[] = result.map((l: any) => ({
    variantId: l.variant_id,
    productName: l.name,
    variantLabel: l.label,
    priceKobo: Number(l.price_kobo),
    quantity: l.quantity,
    active: l.active,
  }));
  return {
    id: row.id,
    revision: row.revision,
    lines,
    subtotalKobo: lines.reduce((s, l) => s + l.priceKobo * l.quantity, 0),
  };
}
export async function cart(u: Identity, input?: unknown) {
  await takeRateLimit(u.userId, "cart", 60);
  return await db().begin(async (sql: any) => {
    const row = await cartRow(sql, u.userId);
    if (input !== undefined) {
      const v = validateMutation(input);
      if (row.revision !== v.expectedRevision) {
        throw new ShopError(
          "CART_CONFLICT",
          "Your cart changed. Refresh it and retry.",
          409,
        );
      }
      if (v.quantity) {
        const variants =
          await sql`select v.id from public.product_variants v join public.products p on p.id=v.product_id where v.id=${v.variantId} and v.active and p.active for share of v,p`;
        if (!variants.length) {
          throw new ShopError(
            "ITEM_UNAVAILABLE",
            "This item is unavailable.",
            409,
          );
        }
        const count =
          await sql`select count(*)::int as n from public.cart_items where cart_id=${row.id} and variant_id<>${v.variantId}`;
        if (count[0].n >= 20) {
          throw new ShopError(
            "VALIDATION_FAILED",
            "Your cart can contain up to 20 different items.",
          );
        }
        await sql`insert into public.cart_items(cart_id,variant_id,quantity) values(${row.id},${v.variantId},${v.quantity}) on conflict(cart_id,variant_id) do update set quantity=excluded.quantity`;
      } else {await sql`delete from public.cart_items where cart_id=${row.id} and variant_id=${v.variantId}`;}
      row.revision++;
      await sql`update public.carts set revision=${row.revision},updated_at=now() where id=${row.id}`;
    }
    return await loadCart(sql, row);
  });
}
export async function handoff(u: Identity, input: unknown) {
  await takeRateLimit(u.userId, "handoff", 10);
  const v = strict(input, ["action", "token"]);
  if (v.action === "prepare") {
    if (!u.isAnonymous) {
      throw new ShopError(
        "VALIDATION_FAILED",
        "Only guest carts require transfer.",
      );
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(
      (x) => x.toString(16).padStart(2, "0"),
    ).join("");
    const digest = await hash(token);
    return await db().begin(async (sql: any) => {
      const row = await cartRow(sql, u.userId);
      await sql`delete from luma_private.cart_handoffs where source_user_id=${u.userId} and redeemed_at is null`;
      const [h] =
        await sql`insert into luma_private.cart_handoffs(token_hash,source_user_id,source_cart_id,source_revision,expires_at) values(${digest},${u.userId},${row.id},${row.revision},now()+interval '15 minutes') returning expires_at`;
      return { token, expiresAt: h.expires_at };
    });
  }
  if (v.action !== "redeem" || !/^[a-f0-9]{64}$/.test(v.token || "")) {
    throw new ShopError("VALIDATION_FAILED", "Invalid cart transfer.");
  }
  permanent(u);
  const digest = await hash(v.token);
  return await db().begin(async (sql: any) => {
    const [h] =
      await sql`select * from luma_private.cart_handoffs where token_hash=${digest}`;
    if (!h) {
      throw new ShopError(
        "HANDOFF_EXPIRED",
        "The transfer expired. Your guest cart is preserved.",
        409,
      );
    }
    if (h.redeemed_by) {
      if (h.redeemed_by !== u.userId) {
        throw new ShopError(
          "HANDOFF_USED",
          "This transfer was already used.",
          409,
        );
      }
      return h.result;
    }
    if (new Date(h.expires_at).getTime() < Date.now()) {
      throw new ShopError(
        "HANDOFF_EXPIRED",
        "The transfer expired. Your guest cart is preserved.",
        409,
      );
    }
    await sql`insert into public.carts(user_id) values(${u.userId}) on conflict(user_id) do nothing`;
    const rows =
      await sql`select * from public.carts where user_id in(${u.userId},${h.source_user_id}) order by id for update`;
    // All transfer paths lock carts before handoff rows, preventing prepare/redeem deadlocks.
    const [lockedHandoff] =
      await sql`select * from luma_private.cart_handoffs where token_hash=${digest} for update`;
    if (!lockedHandoff) {
      throw new ShopError(
        "HANDOFF_EXPIRED",
        "The transfer expired. Your guest cart is preserved.",
        409,
      );
    }
    if (lockedHandoff.redeemed_by) {
      if (lockedHandoff.redeemed_by !== u.userId) {
        throw new ShopError(
          "HANDOFF_USED",
          "This transfer was already used.",
          409,
        );
      }
      return lockedHandoff.result;
    }
    if (new Date(lockedHandoff.expires_at).getTime() < Date.now()) {
      throw new ShopError(
        "HANDOFF_EXPIRED",
        "The transfer expired. Your guest cart is preserved.",
        409,
      );
    }
    const source = rows.find((r: any) =>
      r.user_id === lockedHandoff.source_user_id
    );
    const dest = rows.find((r: any) => r.user_id === u.userId);
    if (!source || source.revision !== lockedHandoff.source_revision) {
      throw new ShopError(
        "CART_CONFLICT",
        "The guest cart changed. Prepare a fresh transfer.",
        409,
      );
    }
    const merged = mergeLines(
      (await loadCart(sql, source)).lines,
      (await loadCart(sql, dest)).lines,
    );
    await sql`delete from public.cart_items where cart_id=${dest.id}`;
    for (const l of merged) {
      await sql`insert into public.cart_items(cart_id,variant_id,quantity) values(${dest.id},${l.variantId},${l.quantity})`;
    }
    await sql`delete from public.cart_items where cart_id=${source.id}`;
    await sql`update public.carts set revision=revision+1,updated_at=now() where id in(${source.id},${dest.id})`;
    dest.revision++;
    const result = await loadCart(sql, dest);
    await sql`update luma_private.cart_handoffs set redeemed_by=${u.userId},redeemed_at=now(),result=${
      sql.json(result)
    } where token_hash=${digest}`;
    return result;
  });
}
export async function quote(u: Identity) {
  permanent(u);
  await takeRateLimit(u.userId, "quote", 30);
  return await db().begin(async (sql: any) => {
    return await calculateQuote(
      await loadCart(sql, await cartRow(sql, u.userId)),
    );
  });
}
export async function orderJSON(sql: SQL, row: any) {
  const items =
    await sql`select variant_id,product_name,variant_label,price_kobo,quantity from public.order_items where order_id=${row.id}`;
  const [job] =
    await sql`select status from luma_private.email_jobs where order_id=${row.id}`;
  return {
    id: row.id,
    reference: row.reference,
    createdAt: row.created_at,
    demo: true,
    status: "confirmed",
    items: items.map((i: any) => ({
      variantId: i.variant_id,
      productName: i.product_name,
      variantLabel: i.variant_label,
      priceKobo: Number(i.price_kobo),
      quantity: i.quantity,
    })),
    subtotalKobo: Number(row.subtotal_kobo),
    deliveryKobo: Number(row.delivery_kobo),
    totalKobo: Number(row.total_kobo),
    currency: "NGN",
    emailStatus: job?.status || "pending",
  };
}
export async function orders(
  u: Identity,
  id: string | null,
  requestKey: string | null = null,
) {
  permanent(u);
  if ((id && !uuid.test(id)) || (requestKey && !uuid.test(requestKey))) {
    throw new ShopError("VALIDATION_FAILED", "Invalid order reference.");
  }
  const sql = db();
  const rows = requestKey
    ? await sql`select * from public.orders where user_id=${u.userId} and idempotency_key=${requestKey}`
    : id
    ? await sql`select * from public.orders where user_id=${u.userId} and id=${id}`
    : await sql`select * from public.orders where user_id=${u.userId} order by created_at desc limit 100`;
  if ((id || requestKey) && !rows.length) {
    throw new ShopError("NOT_FOUND", "Order not found.", 404);
  }
  const result = [];
  for (const row of rows) result.push(await orderJSON(sql, row));
  return (id || requestKey) ? result[0] : result;
}
export async function checkout(u: Identity, input: unknown) {
  permanent(u);
  await takeRateLimit(u.userId, "checkout", 30);
  const v = validateCheckout(input);
  const fingerprint = await hash(JSON.stringify(v));
  return await db().begin(async (sql: any) => {
    const row = await cartRow(sql, u.userId);
    const [prior] =
      await sql`select * from public.orders where user_id=${u.userId} and idempotency_key=${v.idempotencyKey}`;
    if (prior) {
      if (prior.request_fingerprint !== fingerprint) {
        throw new ShopError(
          "IDEMPOTENCY_CONFLICT",
          "This checkout key was used with different details.",
          409,
        );
      }
      return await orderJSON(sql, prior);
    }
    if (row.revision !== v.cartRevision) {
      throw new ShopError(
        "CART_CONFLICT",
        "Your cart changed. Review it before ordering.",
        409,
      );
    }
    // Lock catalog rows for the complete quote/order transaction: catalog edits cannot race checkout.
    await sql`select v.id from public.cart_items i join public.product_variants v on v.id=i.variant_id join public.products p on p.id=v.product_id where i.cart_id=${row.id} order by v.id for share of v,p`;
    const c = await loadCart(sql, row);
    const q = await calculateQuote(c);
    if (q.fingerprint !== v.quoteFingerprint) {
      throw new ShopError(
        "QUOTE_CHANGED",
        "Prices changed. Review the updated total before placing your order.",
        409,
        { quote: q },
      );
    }
    const [counts] =
      await sql`select count(*) filter(where created_at>now()-interval '1 hour')::int as hour,count(*) filter(where created_at>now()-interval '1 day')::int as day from public.orders where user_id=${u.userId}`;
    if (counts.hour >= 3 || counts.day >= 10) {
      throw new ShopError(
        "RATE_LIMITED",
        "Demo order limit reached. Please try later.",
        429,
      );
    }
    const id = crypto.randomUUID();
    const reference = `LUMA-${
      id.replaceAll("-", "").slice(0, 12).toUpperCase()
    }`;
    const [o] =
      await sql`insert into public.orders(id,reference,user_id,subtotal_kobo,delivery_kobo,total_kobo,recipient_email,delivery,idempotency_key,request_fingerprint) values(${id},${reference},${u.userId},${q.subtotalKobo},${q.deliveryKobo},${q.totalKobo},${u.email},${
        sql.json(v.delivery)
      },${v.idempotencyKey},${fingerprint}) returning *`;
    for (const l of c.lines) {
      await sql`insert into public.order_items(order_id,variant_id,product_name,variant_label,price_kobo,quantity) values(${id},${l.variantId},${l.productName},${l.variantLabel},${l.priceKobo},${l.quantity})`;
    }
    await sql`insert into luma_private.email_jobs(order_id) values(${id})`;
    await sql`delete from public.cart_items where cart_id=${row.id}`;
    await sql`update public.carts set revision=revision+1,updated_at=now() where id=${row.id}`;
    await sql`insert into public.profiles(user_id) values(${u.userId}) on conflict(user_id) do nothing`;
    return await orderJSON(sql, o);
  });
}
