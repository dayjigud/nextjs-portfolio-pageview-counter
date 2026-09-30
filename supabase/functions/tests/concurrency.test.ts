import { runBounded } from "../_shared/concurrency.ts";
Deno.test("outbox processes full batch while bounding provider requests", async () => {
  let active = 0;
  let peak = 0;
  let done = 0;
  await runBounded(Array.from({ length: 20 }, (_, i) => i), 4, async () => {
    active++;
    peak = Math.max(active, peak);
    await new Promise((resolve) => setTimeout(resolve, 0));
    active--;
    done++;
  });
  if (done !== 20 || peak > 4 || peak < 2) {
    throw new Error("Batch concurrency failed");
  }
});
