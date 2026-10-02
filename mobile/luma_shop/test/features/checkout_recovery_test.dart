import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:luma_shop/core/models.dart';
import 'package:luma_shop/core/shop_error.dart';
import 'package:luma_shop/features/checkout/checkout_controller.dart';

import '../fixtures/fakes.dart';
import '../fixtures/shop_fixtures.dart';

void main() {
  test('consent false never sends an order', () async {
    var sent = 0;
    final c = CheckoutController(
      store: MemoryStore(),
      owner: () => 'one',
      quote: () async => Quote.fromJson(quoteJson()),
      place: (r) async {
        sent++;
        return DemoOrder.fromJson(orderJson());
      },
      find: (key) async => throw const ShopError('ORDER_NOT_FOUND', 'Missing'),
    );
    await c.loadQuote();
    await expectLater(
      c.submit(
        Delivery('Demo Shopper', 'Demo City', '12 Example Street'),
        demoConsent: false,
      ),
      throwsA(isA<ShopError>()),
    );
    expect(sent, 0);
    c.dispose();
  });
  test('lost success response and restart recovers one saved order', () async {
    final store = MemoryStore();
    var sent = 0;
    var exists = false;
    final bodies = <Map<String, dynamic>>[];
    CheckoutController controller() => CheckoutController(
      store: store,
      owner: () => 'one',
      quote: () async => Quote.fromJson(quoteJson()),
      place: (r) async {
        sent++;
        bodies.add(r.toJson());
        exists = true;
        throw const ShopError('UNCERTAIN_RESULT', 'Lost');
      },
      find: (key) async {
        if (exists) return DemoOrder.fromJson(orderJson());
        throw const ShopError('ORDER_NOT_FOUND', 'Missing');
      },
    );
    final c = controller();
    await c.loadQuote();
    await expectLater(
      c.submit(
        Delivery('Demo Shopper', 'Demo City', '12 Example Street'),
        demoConsent: true,
      ),
      throwsA(isA<ShopError>()),
    );
    c.dispose();
    final next = controller();
    expect((await next.recoverPending())!.reference, 'LUMA-DEMO');
    expect(sent, 1);
    expect(store.values, isEmpty);
    next.dispose();
  });
  test(
    'same-key retry preserves exact payload and failed lookup keeps recovery',
    () async {
      final store = MemoryStore();
      final bodies = <Map<String, dynamic>>[];
      var lookupDown = false;
      final c = CheckoutController(
        store: store,
        owner: () => 'one',
        quote: () async => Quote.fromJson(quoteJson()),
        place: (r) async {
          bodies.add(r.toJson());
          throw const ShopError('UNCERTAIN_RESULT', 'Lost');
        },
        find: (key) async => throw ShopError(
          lookupDown ? 'SERVICE_UNAVAILABLE' : 'ORDER_NOT_FOUND',
          'Missing',
        ),
      );
      await c.loadQuote();
      await expectLater(
        c.submit(
          Delivery('First Shopper', 'Demo City', '12 Example Street'),
          demoConsent: true,
        ),
        throwsA(isA<ShopError>()),
      );
      lookupDown = true;
      await expectLater(c.recoverPending(), throwsA(isA<ShopError>()));
      expect(store.values, isNotEmpty);
      lookupDown = false;
      await expectLater(
        c.submit(
          Delivery('Changed Shopper', 'Other City', '99 Different Street'),
          demoConsent: true,
        ),
        throwsA(isA<ShopError>()),
      );
      expect(bodies[1], bodies[0]);
      c.dispose();
    },
  );
  test('double tap submits one operation', () async {
    final barrier = Completer<DemoOrder>();
    var sent = 0;
    final c = CheckoutController(
      store: MemoryStore(),
      owner: () => 'one',
      quote: () async => Quote.fromJson(quoteJson()),
      place: (r) {
        sent++;
        return barrier.future;
      },
      find: (k) async => throw const ShopError('ORDER_NOT_FOUND', 'Missing'),
    );
    await c.loadQuote();
    final d = Delivery('Demo Shopper', 'Demo City', '12 Example Street');
    final a = c.submit(d, demoConsent: true);
    final b = c.submit(d, demoConsent: true);
    await Future<void>.delayed(Duration.zero);
    barrier.complete(DemoOrder.fromJson(orderJson()));
    await Future.wait([a, b]);
    expect(sent, 1);
    c.dispose();
  });
  test('remote invalidation cannot discard an uncertain checkout', () async {
    final store = MemoryStore();
    final c = CheckoutController(
      store: store,
      owner: () => 'one',
      quote: () async => Quote.fromJson(quoteJson()),
      place: (r) async => throw const ShopError('UNCERTAIN_RESULT', 'Lost'),
      find: (k) async => throw const ShopError('ORDER_NOT_FOUND', 'Missing'),
    );
    await c.loadQuote();
    await expectLater(
      c.submit(
        Delivery('Demo Shopper', 'Demo City', '12 Example Street'),
        demoConsent: true,
      ),
      throwsA(isA<ShopError>()),
    );
    c.invalidateQuote();
    await expectLater(c.resolveRejectedPending(), throwsA(isA<ShopError>()));
    expect(store.values, isNotEmpty);
    c.dispose();
  });
}
