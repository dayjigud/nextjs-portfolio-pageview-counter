import { renderEmail } from "../_shared/domain.ts";

function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const order = {
  id: "00000000-0000-4000-8000-000000000001",
  reference: "LUMA-123456789ABC",
  recipient_email: "owner@example.com",
  subtotal_kobo: "1500050",
  delivery_kobo: "250000",
  total_kobo: "1750050",
  delivery: { recipientName: "Private Name", address: "Private Address" },
  items: [
    { productName: "Everyday speaker", quantity: 2, priceKobo: 500025 },
    { productName: "Desk charger", quantity: 1, priceKobo: 500000 },
  ],
};

Deno.test("email presents saved line amounts and the full demo cost breakdown in both alternatives", () => {
  const mail = renderEmail(order, "https://example.com");
  for (const content of [mail.html, mail.text]) {
    for (
      const amount of [
        "10,000.50",
        "5,000.00",
        "15,000.50",
        "2,500.00",
        "17,500.50",
      ]
    ) {
      assert(
        content.includes(`NGN ${amount}`),
        `Missing exact amount ${amount}`,
      );
    }
    assert(content.includes("Everyday speaker"), "Missing item");
    assert(content.includes("no payment or shipment"), "Missing demo notice");
    assert(!content.includes("Private Address"), "Delivery address leaked");
    assert(!content.includes("Private Name"), "Recipient name leaked");
  }
  assert(mail.to === "owner@example.com", "Recipient changed");
});

Deno.test("HTML receipt button links to the encoded private order and explains sign-in", () => {
  const mail = renderEmail({ ...order, id: 'a&b"<c>' }, "https://example.com");
  assert(
    mail.html.includes(
      'href="https://example.com/projects/shop/confirmation/?order=a%26b%22%3Cc%3E"',
    ),
    "Missing safe receipt link",
  );
  assert(
    mail.html.includes("sign-in required"),
    "Missing private receipt guidance",
  );
});

Deno.test("HTML escapes order references and item names instead of creating markup", () => {
  const mail = renderEmail({
    ...order,
    reference: '<img src=x onerror="alert(1)">',
    items: [{
      productName: '<script>alert("x")</script> & earbuds',
      quantity: 1,
      priceKobo: 1500050,
    }],
  }, "https://example.com");
  assert(
    mail.html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"),
    "Unsafe reference",
  );
  assert(
    mail.html.includes(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; earbuds",
    ),
    "Unsafe product name",
  );
  assert(!mail.html.includes("<script>"), "Executable markup leaked");
  assert(!mail.html.includes("<img"), "Injected image markup leaked");
});
