import {
  calculateQuote,
  mergeLines,
  renderEmail,
  retryDelay,
  validateCheckout,
  validateMutation,
} from "../_shared/domain.ts";
function assert(v: unknown) {
  if (!v) throw new Error("Assertion failed");
}
function rejects(fn: () => unknown, code: string) {
  try {
    fn();
  } catch (e) {
    assert((e as { code: string }).code === code);
    return;
  }
  throw new Error("Expected rejection");
}
const lines = [{
  variantId: "00000000-0000-4000-8000-000000000001",
  productName: "Headphones",
  variantLabel: "Pearl",
  priceKobo: 14500000,
  quantity: 1,
  active: true,
}];
Deno.test("quote exact kobo and price fingerprint inputs", async () => {
  const q = await calculateQuote({ id: "cart", revision: 2, lines });
  assert(q.totalKobo === 14750000);
  const changed = await calculateQuote({
    id: "cart",
    revision: 2,
    lines: [{ ...lines[0], priceKobo: 15000000 }],
  });
  assert(changed.fingerprint !== q.fingerprint);
});
Deno.test("bounds and strict trusted fields", () => {
  rejects(
    () =>
      validateMutation({
        variantId: lines[0].variantId,
        quantity: 11,
        expectedRevision: 1,
      }),
    "VALIDATION_FAILED",
  );
  rejects(() => validateCheckout({ email: "attacker" }), "VALIDATION_FAILED");
});
Deno.test("merge adds matching quantities and rejects overflowing or inactive lines", () => {
  assert(mergeLines(lines, lines)[0].quantity === 2);
  rejects(
    () => mergeLines([{ ...lines[0], quantity: 10 }], lines),
    "MERGE_CONFLICT",
  );
  rejects(
    () => mergeLines([{ ...lines[0], active: false }], []),
    "MERGE_CONFLICT",
  );
});
Deno.test("retry schedule and escaped mail; no address in receipt", () => {
  assert(retryDelay(1) === 60000);
  assert(retryDelay(2) === 300000);
  assert(retryDelay(3) === 1800000);
  assert(retryDelay(4) === null);
  const m = renderEmail({
    id: "a",
    reference: "LUMA-1",
    recipient_email: "owner@example.com",
    total_kobo: 14750000,
    items: [{ productName: "<script>", quantity: 1, priceKobo: 14500000 }],
  }, "https://example.com");
  assert(m.html.includes("&lt;script&gt;"));
  assert(m.to === "owner@example.com");
  assert(m.text.includes("no payment or shipment"));
});
Deno.test("empty and inactive carts require review; unsafe money rejected", async () => {
  let n = 0;
  for (
    const c of [{ id: "c", revision: 1, lines: [] }, {
      id: "c",
      revision: 1,
      lines: [{ ...lines[0], active: false }],
    }, {
      id: "c",
      revision: 1,
      lines: [{
        ...lines[0],
        priceKobo: Number.MAX_SAFE_INTEGER,
        quantity: 10,
      }],
    }]
  ) {
    try {
      await calculateQuote(c);
    } catch {
      n++;
    }
  }
  assert(n === 3);
});
Deno.test("mutation validates integer quantities, removal and client ownership fields", () => {
  assert(
    validateMutation({
      variantId: lines[0].variantId,
      quantity: 0,
      expectedRevision: 1,
    }).quantity === 0,
  );
  for (const quantity of [-1, 1.5, NaN]) {
    rejects(() =>
      validateMutation({
        variantId: lines[0].variantId,
        quantity,
        expectedRevision: 1,
      }), "VALIDATION_FAILED");
  }
  rejects(
    () =>
      validateMutation({
        variantId: lines[0].variantId,
        quantity: 1,
        expectedRevision: 1,
        userId: "someone",
      }),
    "VALIDATION_FAILED",
  );
});
Deno.test("merge maximum line count preserves input", () => {
  const source = Array.from(
    { length: 21 },
    (_, i) => ({ ...lines[0], variantId: String(i) }),
  );
  rejects(() => mergeLines(source, []), "MERGE_CONFLICT");
  assert(source.length === 21);
});
Deno.test("checkout canonicalizes key order and normalizes fictional details", () => {
  const a = {
    idempotencyKey: lines[0].variantId,
    cartRevision: 1,
    quoteFingerprint: "a".repeat(64),
    delivery: {
      address: " Demo road ",
      recipientName: " Demo ",
      city: " Lagos ",
    },
  };
  const b = {
    delivery: { city: "Lagos", recipientName: "Demo", address: "Demo road" },
    quoteFingerprint: "a".repeat(64),
    cartRevision: 1,
    idempotencyKey: lines[0].variantId,
  };
  assert(
    JSON.stringify(validateCheckout(a)) === JSON.stringify(validateCheckout(b)),
  );
});
