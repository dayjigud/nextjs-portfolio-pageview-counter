import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:luma_shop/core/models.dart';
import 'package:luma_shop/core/shop_api.dart';
import 'package:luma_shop/core/shop_error.dart';
import 'package:luma_shop/features/auth/auth_controller.dart';

import '../fixtures/fakes.dart';
import '../fixtures/shop_fixtures.dart';

Session session(bool guest) => Session.fromJson(
  jsonDecode(
    jsonEncode({
      'access_token': guest ? 'guest' : 'account',
      'refresh_token': guest ? 'guest-refresh' : 'account-refresh',
      'token_type': 'bearer',
      'expires_in': 3600,
      'user': {
        'id': guest
            ? '33333333-3333-4333-8333-333333333333'
            : '44444444-4444-4444-8444-444444444444',
        'is_anonymous': guest,
        'app_metadata': {},
        'user_metadata': {},
        'aud': 'authenticated',
        'created_at': '2026-10-02T12:00:00Z',
      },
    }),
  ),
)!;

class FakeGateway implements AuthGateway {
  Session? value = session(true);
  int launches = 0, restores = 0;
  @override
  Session? get current => value;
  @override
  Future<Session> guest() async => value ??= session(true);
  @override
  Future<void> launchGoogle() async {
    launches++;
  }

  @override
  Future<Session> refreshGuest(Session guest) async => guest;
  @override
  Future<void> restore(Session guest) async {
    restores++;
    value = guest;
  }

  @override
  Future<void> signOut() async {
    value = null;
  }
}

void main() {
  test('rapid Google taps launch one handoff and one browser', () async {
    final gate = FakeGateway();
    var prepared = 0;
    final auth = AuthController(
      store: MemoryStore(),
      gateway: gate,
      flushPending: () async {},
      getCart: ({sessionOverride}) async => Cart.fromJson(cartJson()),
      prepare: (s) async {
        prepared++;
        return HandoffToken.fromJson({
          'token': 'a' * 64,
          'expiresAt': '2099-01-01T00:00:00Z',
        });
      },
      redeem: (t) async => const Cart.empty(),
    );
    await Future.wait([
      auth.beginGoogle('/checkout'),
      auth.beginGoogle('/checkout'),
    ]);
    expect(prepared, 1);
    expect(gate.launches, 1);
    auth.dispose();
  });

  test('guest transfer persists before OAuth and duplicate completion redeems once', () async {
    final store = MemoryStore();
    final gate = FakeGateway();
    var redeemed = 0;
    final auth = AuthController(
      store: store,
      gateway: gate,
      flushPending: () async {},
      getCart: ({sessionOverride}) async => Cart.fromJson(cartJson()),
      prepare: (s) async => HandoffToken.fromJson({
        'token': 'a' * 64,
        'expiresAt': '2099-01-01T00:00:00Z',
      }),
      redeem: (token) async {
        redeemed++;
        return Cart.fromJson(cartJson());
      },
    );
    await auth.beginGoogle('/checkout');
    expect(store.values, isNotEmpty);
    gate.value = session(false);
    await auth.restorePendingAuth();
    await auth.restorePendingAuth();
    expect(redeemed, 1);
    expect(auth.destination, '/checkout');
    expect(store.values, isEmpty);
    auth.dispose();
  });
  test(
    'canceled OAuth restores guest bag and clears recovery only after success',
    () async {
      final store = MemoryStore();
      final gate = FakeGateway();
      final auth = AuthController(
        store: store,
        gateway: gate,
        flushPending: () async {},
        getCart: ({sessionOverride}) async => Cart.fromJson(cartJson()),
        prepare: (s) async => HandoffToken.fromJson({
          'token': 'a' * 64,
          'expiresAt': '2099-01-01T00:00:00Z',
        }),
        redeem: (t) async => throw const ShopError('MERGE_CONFLICT', 'Review'),
      );
      await auth.beginGoogle('/cart');
      await auth.cancelGoogle();
      expect(gate.restores, 1);
      expect(gate.current!.user.isAnonymous, isTrue);
      expect(store.values, isEmpty);
      auth.dispose();
    },
  );
  test('merge conflict and expired handoff preserve guest recovery', () async {
    final store = MemoryStore();
    final gate = FakeGateway();
    final auth = AuthController(
      store: store,
      gateway: gate,
      flushPending: () async {},
      getCart: ({sessionOverride}) async => Cart.fromJson(cartJson()),
      prepare: (s) async => HandoffToken.fromJson({
        'token': 'a' * 64,
        'expiresAt': '2099-01-01T00:00:00Z',
      }),
      redeem: (t) async =>
          throw const ShopError('MERGE_CONFLICT', 'Both bags saved'),
    );
    await auth.beginGoogle('/checkout');
    gate.value = session(false);
    await auth.restorePendingAuth();
    expect(auth.needsTransferReview, isTrue);
    expect(store.values, isNotEmpty);
    expect(gate.current!.user.isAnonymous, isFalse);
    auth.dispose();
  });
}
