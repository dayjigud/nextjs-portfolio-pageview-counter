import { takeRateLimit } from "../_shared/limits.ts";
function assert(v: unknown) {
  if (!v) throw new Error("Assertion failed");
}
Deno.test("failed business requests and over-limit requests retain committed accounting", async () => {
  let persisted = 0;
  const connection = {
    begin: async (callback: any) => {
      let counter = persisted;
      const sql = () => Promise.resolve([{ counter: ++counter }]);
      const result = await callback(sql);
      persisted = counter;
      return result;
    },
  };
  for (let i = 0; i < 3; i++) {
    await takeRateLimit("fixture", "cart", 3, connection);
    try {
      throw new Error("subsequent business transaction fails");
    } catch { /* independent rollback cannot undo limit */ }
  }
  assert(persisted === 3);
  for (let i = 0; i < 2; i++) {
    let rejected = false;
    try {
      await takeRateLimit("fixture", "cart", 3, connection);
    } catch (e) {
      assert((e as any).code === "RATE_LIMITED");
      rejected = true;
    }
    assert(rejected);
  }
  assert(persisted === 5);
});
