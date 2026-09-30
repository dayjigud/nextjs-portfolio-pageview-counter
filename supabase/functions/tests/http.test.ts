import { createHandler } from "../_shared/http.ts";
function assert(v: unknown) {
  if (!v) throw new Error("Assertion failed");
}
Deno.test("all browser handlers reject missing auth before database lookup", async () => {
  for (const name of ["cart", "cart-handoff", "quote", "checkout", "orders"]) {
    const req = new Request(`https://shop.invalid/${name}`, {
      method: name === "checkout" || name === "cart-handoff" ? "POST" : "GET",
      ...(name === "checkout" || name === "cart-handoff" ? { body: "{}" } : {}),
    });
    const response = await createHandler(name)(req);
    assert(response.status === 401);
    assert((await response.json()).error.code === "AUTH_REQUIRED");
  }
});
Deno.test("invalid user JWT rejected by Auth before database; not accepted as publishable bearer", async () => {
  const original = globalThis.fetch;
  Deno.env.set("SUPABASE_URL", "https://auth.invalid");
  Deno.env.set(
    "SUPABASE_PUBLISHABLE_KEYS",
    JSON.stringify({ default: "sb_publishable_test" }),
  );
  let fetched = 0;
  globalThis.fetch = (_url, init) => {
    fetched++;
    assert(
      ((init as any)?.headers as Record<string, string>).apikey ===
        "sb_publishable_test",
    );
    return Promise.resolve(new Response("{}", { status: 401 }));
  };
  try {
    for (const name of ["cart", "quote", "orders"]) {
      const response = await createHandler(name)(
        new Request("https://shop.invalid", {
          headers: { authorization: "Bearer invalid" },
        }),
      );
      assert(response.status === 401);
    }
    assert(fetched === 3);
  } finally {
    globalThis.fetch = original;
    Deno.env.delete("SUPABASE_URL");
    Deno.env.delete("SUPABASE_PUBLISHABLE_KEYS");
  }
});
