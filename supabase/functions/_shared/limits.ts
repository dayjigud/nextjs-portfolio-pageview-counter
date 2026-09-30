import { db } from "./db.ts";
import { ShopError } from "./domain.ts";
// Accounting commits independently from any following cart/order transaction.
// Check the limit AFTER commit so rejected requests are counted as well.
export async function takeRateLimit(
  userId: string,
  action: string,
  max: number,
  connection: any = db(),
) {
  const counter = await connection.begin(async (sql: any) => {
    const [row] =
      await sql`insert into luma_private.request_limits(user_id,action,window_start,counter) values(${userId},${action},date_trunc('minute',now()),1) on conflict(user_id,action,window_start) do update set counter=request_limits.counter+1 returning counter`;
    return row.counter;
  });
  if (counter > max) {
    throw new ShopError(
      "RATE_LIMITED",
      "Please wait a minute before trying again.",
      429,
    );
  }
}
