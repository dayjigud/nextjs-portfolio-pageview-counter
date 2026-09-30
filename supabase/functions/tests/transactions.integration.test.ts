// Opt-in only: requires dedicated disposable database URLs. Never use a public demo/production DB.
import postgres from "npm:postgres@3.4.7";
import { cart, checkout, handoff, orders, quote } from "../_shared/service.ts";
import type { Identity } from "../_shared/auth.ts";
function assert(v: unknown, message = "Assertion failed") {
  if (!v) throw new Error(message);
}
const configured = Deno.env.get("LUMA_TEST_ISOLATED") === "true" &&
  Boolean(Deno.env.get("LUMA_TEST_DATABASE_URL")) &&
  Boolean(Deno.env.get("LUMA_TEST_ADMIN_DATABASE_URL"));
Deno.test({
  name:
    "real service transactions: revisions, transfer replay, quote review, order idempotency and committed limits",
  ignore: !configured,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    Deno.env.set("LUMA_DATABASE_URL", Deno.env.get("LUMA_TEST_DATABASE_URL")!);
    const admin = postgres(Deno.env.get("LUMA_TEST_ADMIN_DATABASE_URL")!, {
      max: 1,
      prepare: false,
      ssl: "require",
    });
    const guest: Identity = {
      userId: crypto.randomUUID(),
      isAnonymous: true,
      email: "",
      hasGoogleIdentity: false,
    };
    const owner: Identity = {
      userId: crypto.randomUUID(),
      isAnonymous: false,
      email: "fixture@example.invalid",
      hasGoogleIdentity: true,
    };
    const outsider: Identity = { ...owner, userId: crypto.randomUUID() };
    const ids = [guest.userId, owner.userId, outsider.userId];
    let variant: any;
    try {
      for (const u of [guest, owner, outsider]) {
        await admin`insert into auth.users(id,is_anonymous) values(${u.userId},${u.isAnonymous})`;
      }
      [variant] =
        await admin`select v.id,v.price_kobo from public.product_variants v join public.products p on p.id=v.product_id where p.slug='luma-a1'`;
      const initial = await cart(guest);
      const outcomes = await Promise.allSettled([
        cart(guest, {
          variantId: variant.id,
          quantity: 1,
          expectedRevision: initial.revision,
        }),
        cart(guest, {
          variantId: variant.id,
          quantity: 2,
          expectedRevision: initial.revision,
        }),
      ]);
      assert(
        outcomes.filter((r) => r.status === "fulfilled").length === 1,
        "stale mutation must reject",
      );
      const source = await cart(guest);
      const prepared: any = await handoff(guest, { action: "prepare" });
      const transfer: any = await handoff(owner, {
        action: "redeem",
        token: prepared.token,
      });
      const replay: any = await handoff(owner, {
        action: "redeem",
        token: prepared.token,
      });
      assert(
        transfer.lines[0].quantity === source.lines[0].quantity &&
          JSON.stringify(transfer) === JSON.stringify(replay),
        "transfer replay must not add twice",
      );
      assert((await cart(guest)).lines.length === 0);
      const before = await quote(owner);
      await admin`update public.product_variants set price_kobo=price_kobo+100 where id=${variant.id}`;
      const input = {
        idempotencyKey: crypto.randomUUID(),
        cartRevision: before.cartRevision,
        quoteFingerprint: before.fingerprint,
        delivery: {
          recipientName: "Demo person",
          city: "Demo city",
          address: "Fictional street",
        },
      };
      let changed = false;
      try {
        await checkout(owner, input);
      } catch (e) {
        changed = (e as any).code === "QUOTE_CHANGED";
      }
      assert(changed);
      assert(
        (await cart(owner)).lines.length === 1,
        "price conflict preserves cart",
      );
      await admin`update public.product_variants set price_kobo=${variant.price_kobo} where id=${variant.id}`;
      const q = await quote(owner);
      input.quoteFingerprint = q.fingerprint;
      const results: any[] = await Promise.all([
        checkout(owner, input),
        checkout(owner, input),
      ]);
      assert(results[0].id === results[1].id);
      const [jobs] =
        await admin`select count(*)::int as n from luma_private.email_jobs where order_id=${
          results[0].id
        }`;
      assert(jobs.n === 1);
      assert(
        (await checkout(owner, input)).id === results[0].id,
        "retry after clear returns order",
      );
      assert(
        (await orders(owner, null, input.idempotencyKey) as any).id ===
          results[0].id,
      );
      let privateOrder = false;
      try {
        await orders(outsider, results[0].id);
      } catch (e) {
        privateOrder = (e as any).code === "NOT_FOUND";
      }
      assert(privateOrder);
      // These errors occur inside real business transactions; request counting must survive rollback.
      for (let i = 0; i < 10; i++) {
        try {
          await handoff(owner, { action: "redeem", token: "a".repeat(64) });
        } catch { /* expected unknown/limit failures */ }
      }
      const [counter] =
        await admin`select sum(counter)::int as counter from luma_private.request_limits where user_id=${owner.userId} and action='handoff'`;
      assert(
        counter.counter >= 12,
        "failed requests retained by independent committed rate transaction",
      );
    } finally {
      if (variant) {
        await admin`update public.product_variants set price_kobo=${variant.price_kobo} where id=${variant.id}`;
      }
      await admin`delete from luma_private.email_jobs where order_id in(select id from public.orders where user_id in(${
        ids[0]
      },${ids[1]},${ids[2]}))`;
      await admin`delete from public.order_items where order_id in(select id from public.orders where user_id in(${
        ids[0]
      },${ids[1]},${ids[2]}))`;
      await admin`delete from public.orders where user_id in(${ids[0]},${
        ids[1]
      },${ids[2]})`;
      await admin`delete from auth.users where id in(${ids[0]},${ids[1]},${
        ids[2]
      })`;
      await admin.end();
    }
  },
});
