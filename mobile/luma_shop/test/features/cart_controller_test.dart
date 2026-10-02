import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:luma_shop/core/models.dart';
import 'package:luma_shop/core/shop_error.dart';
import 'package:luma_shop/features/cart/cart_controller.dart';

import '../fixtures/shop_fixtures.dart';

void main() {
  test(
    'offline refresh surfaces failure rather than an authoritative empty bag',
    () async {
      final c = CartController(
        fetch: () async => throw const ShopError('UNCERTAIN_RESULT', 'Offline'),
        save: (a, b, r) async => const Cart.empty(),
        ensureSession: () async {},
        owner: () => 'one',
      );
      await expectLater(c.refresh(), throwsA(isA<ShopError>()));
      expect(c.error?.message, 'Offline');
      c.dispose();
    },
  );

  test('late mutation bootstrap cannot restore old owner cart', () async {
    String? user = 'one';
    final response = Completer<Cart>();
    var writes = 0;
    final c = CartController(
      fetch: () => response.future,
      save: (a, b, r) async {
        writes++;
        return const Cart.empty();
      },
      ensureSession: () async {},
      owner: () => user,
    );
    final add = c.add(variantId);
    await Future<void>.delayed(Duration.zero);
    user = 'two';
    c.reset();
    response.complete(Cart.fromJson(cartJson()));
    await add;
    expect(c.cart.quantity, 0);
    expect(writes, 0);
    c.dispose();
  });

  test('rapid adds serialize revisions and pending badge', () async {
    var server = Cart.fromJson(cartJson(quantity: 0, revision: 0));
    final revisions = <int>[];
    final barrier = Completer<void>();
    final cart = CartController(
      fetch: () async => server,
      save: (id, q, r) async {
        revisions.add(r);
        if (revisions.length == 1) await barrier.future;
        server = Cart.fromJson(cartJson(quantity: q, revision: r + 1));
        return server;
      },
      ensureSession: () async {},
      owner: () => 'one',
    );
    final a = cart.add(variantId);
    final b = cart.add(variantId);
    expect(cart.badgeQuantity, 2);
    await Future<void>.delayed(Duration.zero);
    barrier.complete();
    await Future.wait([a, b]);
    expect(revisions, [0, 1]);
    expect(cart.cart.quantity, 2);
    expect(cart.pendingQuantity, 0);
    cart.dispose();
  });
  test('lost response reconciles committed addition without replay', () async {
    var server = Cart.fromJson(cartJson(quantity: 0, revision: 0));
    var writes = 0;
    final cart = CartController(
      fetch: () async => server,
      save: (id, q, r) async {
        writes++;
        server = Cart.fromJson(cartJson(quantity: q, revision: 1));
        throw const ShopError('UNCERTAIN_RESULT', 'Lost response');
      },
      ensureSession: () async {},
      owner: () => 'one',
    );
    await expectLater(cart.add(variantId), throwsA(isA<ShopError>()));
    expect(writes, 1);
    expect(cart.cart.quantity, 1);
    expect(cart.pendingQuantity, 0);
    cart.dispose();
  });
  test('account switch drops outstanding private response', () async {
    String? owner = 'one';
    final result = Completer<Cart>();
    final cart = CartController(
      fetch: () => result.future,
      save: (a, b, c) async => const Cart.empty(),
      ensureSession: () async {},
      owner: () => owner,
    );
    final request = cart.refresh();
    await Future<void>.delayed(Duration.zero);
    owner = 'two';
    cart.reset();
    result.complete(Cart.fromJson(cartJson()));
    await request;
    expect(cart.cart.quantity, 0);
    cart.dispose();
  });
  test('queued additions share newly created anonymous session', () async {
    String? user;
    var server = Cart.fromJson(cartJson(quantity: 0, revision: 0));
    final c = CartController(
      fetch: () async => server,
      save: (id, q, r) async {
        server = Cart.fromJson(cartJson(quantity: q, revision: r + 1));
        return server;
      },
      ensureSession: () async {
        user ??= 'guest';
      },
      owner: () => user,
    );
    await Future.wait([c.add(variantId), c.add(variantId)]);
    expect(c.cart.quantity, 2);
    c.dispose();
  });
}
