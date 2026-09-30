import { identity, permanent, scheduler } from "../_shared/auth.ts";
function assert(v: unknown) {
  if (!v) throw new Error("Assertion failed");
}
Deno.test("checkout rejects anonymous, missing Google or unconfirmed email", () => {
  for (
    const u of [{
      userId: "a",
      isAnonymous: true,
      email: "a@example.com",
      hasGoogleIdentity: true,
    }, {
      userId: "a",
      isAnonymous: false,
      email: "a@example.com",
      hasGoogleIdentity: false,
    }, { userId: "a", isAnonymous: false, email: "", hasGoogleIdentity: true }]
  ) {
    let rejected = false;
    try {
      permanent(u);
    } catch {
      rejected = true;
    }
    assert(rejected);
  }
  permanent({
    userId: "a",
    isAnonymous: false,
    email: "a@example.com",
    hasGoogleIdentity: true,
  });
});
Deno.test("server auth ignores user-editable metadata and verifies Auth response", async () => {
  const original = globalThis.fetch;
  Deno.env.set("SUPABASE_URL", "https://example.invalid");
  Deno.env.set("SUPABASE_ANON_KEY", "public-test-key");
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          id: "a",
          is_anonymous: false,
          email: "a@example.com",
          email_confirmed_at: "now",
          user_metadata: { provider: "google" },
          identities: [{ provider: "email" }],
        }),
        { status: 200 },
      ),
    );
  try {
    const u = await identity(
      new Request("https://shop.invalid", {
        headers: { authorization: "Bearer test" },
      }),
    );
    assert(u.hasGoogleIdentity === false);
    assert(u.email === "a@example.com");
  } finally {
    globalThis.fetch = original;
    Deno.env.delete("SUPABASE_URL");
    Deno.env.delete("SUPABASE_ANON_KEY");
  }
});
Deno.test("scheduler rejects missing or wrong dedicated credential", () => {
  Deno.env.set("LUMA_SCHEDULER_SECRET", "test-only");
  try {
    for (const token of ["", "wrong"]) {
      let rejected = false;
      try {
        scheduler(
          new Request("https://shop.invalid", {
            headers: { authorization: `Bearer ${token}` },
          }),
        );
      } catch {
        rejected = true;
      }
      assert(rejected);
    }
    scheduler(
      new Request("https://shop.invalid", {
        headers: { authorization: "Bearer test-only" },
      }),
    );
  } finally {
    Deno.env.delete("LUMA_SCHEDULER_SECRET");
  }
});
