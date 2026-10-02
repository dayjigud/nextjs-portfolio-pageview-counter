import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:luma_shop/core/models.dart';
import 'package:luma_shop/core/secure_store.dart';
import 'package:luma_shop/core/shop_error.dart';
import 'package:luma_shop/features/checkout/checkout_controller.dart';

import '../test/fixtures/shop_fixtures.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('device encrypted checkout record survives a new controller', (
    tester,
  ) async {
    const store = DeviceSecureStore('isolated-integration-fixture');
    const owner = 'isolated-device-user';
    var writes = 0;
    var saved = false;
    CheckoutController controller() => CheckoutController(
      store: store,
      owner: () => owner,
      quote: () async => Quote.fromJson(quoteJson()),
      place: (request) async {
        writes++;
        saved = true;
        throw const ShopError('UNCERTAIN_RESULT', 'Lost response');
      },
      find: (key) async {
        if (saved) return DemoOrder.fromJson(orderJson());
        throw const ShopError('ORDER_NOT_FOUND', 'Missing');
      },
    );
    await store.delete('checkout:$owner');
    final first = controller();
    await first.loadQuote();
    await expectLater(
      first.submit(
        Delivery('Demo Shopper', 'Demo City', '12 Example Street'),
        demoConsent: true,
      ),
      throwsA(isA<ShopError>()),
    );
    first.dispose();
    final next = controller();
    expect((await next.recoverPending())!.reference, 'LUMA-DEMO');
    expect(writes, 1);
    expect(await store.read('checkout:$owner'), isNull);
    next.dispose();
  });
}
