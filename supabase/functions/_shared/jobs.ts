import { runBounded } from "./concurrency.ts";
import { db } from "./db.ts";
import { renderEmail, retryDelay } from "./domain.ts";
export async function emailWorker() {
  const sql = db();
  const jobs = await sql.begin(async (tx: any) => {
    return await tx`update luma_private.email_jobs j set status='processing',attempts=attempts+1,lease_until=now()+interval '5 minutes',lease_token=gen_random_uuid() where id in(select id from luma_private.email_jobs where ((status in('pending','retrying') and next_attempt<=now()) or (status='processing' and lease_until<now())) and attempts<4 order by next_attempt for update skip locked limit 20) returning *`;
  });
  let accepted = 0;
  // Four concurrent sends bound a 20-job batch below the five-minute lease.
  await runBounded(jobs, 4, async (job: any) => {
    try {
      const [order] =
        await sql`select * from public.orders where id=${job.order_id}`;
      order.items =
        (await sql`select product_name,price_kobo,quantity from public.order_items where order_id=${order.id}`)
          .map((i: any) => ({
            productName: i.product_name,
            priceKobo: Number(i.price_kobo),
            quantity: i.quantity,
          }));
      const mail = renderEmail(order, Deno.env.get("LUMA_SITE_URL")!);
      const key = Deno.env.get("MAILGUN_API_KEY");
      const domain = Deno.env.get("MAILGUN_DOMAIN");
      const from = Deno.env.get("MAILGUN_FROM");
      if (!key || !domain || !from) throw new Error("sender_unconfigured");
      const body = new URLSearchParams({
        ...mail,
        from,
        "o:tracking": "no",
        "o:tracking-clicks": "no",
        "o:tracking-opens": "no",
      });
      const host = Deno.env.get("MAILGUN_REGION") === "EU"
        ? "api.eu.mailgun.net"
        : "api.mailgun.net";
      const response = await fetch(
        `https://${host}/v3/${encodeURIComponent(domain)}/messages`,
        {
          method: "POST",
          headers: { Authorization: `Basic ${btoa(`api:${key}`)}` },
          body,
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!response.ok) throw new Error("provider_rejected");
      const data = await response.json();
      if (typeof data.id !== "string") throw new Error("provider_invalid");
      await sql`update luma_private.email_jobs set status='accepted',message_id=${data.id},lease_until=null,last_error=null where id=${job.id} and lease_token=${job.lease_token}`;
      accepted++;
    } catch {
      const delay = retryDelay(job.attempts);
      await sql`update luma_private.email_jobs set status=${
        delay === null ? "failed" : "retrying"
      },next_attempt=now()+${
        delay ?? 0
      }*interval '1 millisecond',lease_until=null,last_error='Confirmation email could not be requested.' where id=${job.id} and lease_token=${job.lease_token}`;
    }
  });
  // A fourth-attempt crash must eventually leave processing state.
  await sql`update luma_private.email_jobs set status='failed',last_error='Confirmation email could not be requested.',lease_until=null where status='processing' and lease_until<now() and attempts>=4`;
  return { processed: jobs.length, accepted };
}
export async function cleanupGuests() {
  const sql = db();
  const [{ deleted }] =
    await sql`select luma_private.cleanup_guests() as deleted`;
  const old =
    await sql`delete from luma_private.cart_handoffs where expires_at<now()-interval '24 hours' returning token_hash`;
  await sql`delete from luma_private.request_limits where window_start<now()-interval '1 day'`;
  return { deletedUsers: deleted, deletedHandoffs: old.length };
}
