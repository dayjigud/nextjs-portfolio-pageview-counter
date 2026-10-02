import 'package:flutter_test/flutter_test.dart';
import 'package:luma_shop/core/models.dart';

import '../fixtures/shop_fixtures.dart';

void main() {
  test('server cart and quote preserve integer kobo totals', () {
    expect(Cart.fromJson(cartJson()).subtotalKobo, 29000000);
    expect(Quote.fromJson(quoteJson()).deliveryKobo, 250000);
  });
  test('historical order needs no active field', () {
    expect(DemoOrder.fromJson(orderJson()).demo, isTrue);
    expect(DemoOrder.fromJson(orderJson()).items.single.quantity, 2);
  });
  test('rejects negative prices and invalid quantities', () {
    expect(
      () => Variant.fromJson(variantJson(price: -1)),
      throwsFormatException,
    );
    expect(() => Cart.fromJson(cartJson(quantity: 11)), throwsFormatException);
  });
  test('quote rejects malformed fingerprint and inconsistent totals', () {
    expect(
      () => Quote.fromJson({...quoteJson(), 'fingerprint': 'short'}),
      throwsFormatException,
    );
    expect(
      () => Quote.fromJson({...quoteJson(), 'totalKobo': 1}),
      throwsFormatException,
    );
  });
}
