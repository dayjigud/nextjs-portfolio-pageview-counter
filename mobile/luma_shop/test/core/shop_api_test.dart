import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:luma_shop/app/config.dart';
import 'package:luma_shop/core/shop_api.dart';
import 'package:luma_shop/core/shop_error.dart';

import '../fixtures/shop_fixtures.dart';

Session session() => Session.fromJson({
  'access_token': 'account-token',
  'refresh_token': 'refresh',
  'token_type': 'bearer',
  'expires_in': 3600,
  'user': {
    'id': '44444444-4444-4444-8444-444444444444',
    'app_metadata': <String, dynamic>{},
    'user_metadata': <String, dynamic>{},
    'aud': 'authenticated',
    'created_at': '2026-10-02T12:00:00Z',
  },
})!;
void main() {
  test(
    'cart removal keeps zero and uses authoritative revision and bearer',
    () async {
      final api = ShopApi(
        const AppConfig('https://example.supabase.co', 'sb_publishable_demo'),
        MockClient((r) async {
          expect(r.url.path, '/functions/v1/cart');
          expect(r.method, 'POST');
          expect(r.headers['Authorization'], 'Bearer account-token');
          expect(jsonDecode(r.body), {
            'variantId': variantId,
            'quantity': 0,
            'expectedRevision': 7,
          });
          return http.Response(
            jsonEncode(cartJson(quantity: 0, revision: 8)),
            200,
          );
        }),
        () async => session(),
      );
      expect(
        (await api.updateCart(
          variantId: variantId,
          quantity: 0,
          expectedRevision: 7,
        )).revision,
        8,
      );
    },
  );
  test('HTML response becomes recoverable service error', () async {
    final api = ShopApi(
      const AppConfig('https://example.supabase.co', 'sb_publishable_demo'),
      MockClient((r) async => http.Response('<html>Down</html>', 502)),
      () async => session(),
    );
    await expectLater(
      api.getCart(),
      throwsA(
        isA<ShopError>().having((e) => e.code, 'code', 'SERVICE_UNAVAILABLE'),
      ),
    );
  });
  test('missing session sends no private request', () async {
    var requests = 0;
    final api = ShopApi(
      const AppConfig('https://example.supabase.co', 'sb_publishable_demo'),
      MockClient((r) async {
        requests++;
        return http.Response('{}', 200);
      }),
      () async => null,
    );
    await expectLater(api.getQuote(), throwsA(isA<ShopError>()));
    expect(requests, 0);
  });
  test('structured conflict retains details without retrying', () async {
    var requests = 0;
    final api = ShopApi(
      const AppConfig('https://example.supabase.co', 'sb_publishable_demo'),
      MockClient((r) async {
        requests++;
        return http.Response(
          jsonEncode({
            'error': {
              'code': 'CART_CONFLICT',
              'message': 'Review',
              'details': {'revision': 8},
            },
          }),
          409,
        );
      }),
      () async => session(),
    );
    await expectLater(
      api.updateCart(variantId: variantId, quantity: 1, expectedRevision: 7),
      throwsA(
        isA<ShopError>().having((e) => e.details?['revision'], 'revision', 8),
      ),
    );
    expect(requests, 1);
  });
  test('order recovery encodes request key query', () async {
    final api = ShopApi(
      const AppConfig('https://example.supabase.co', 'sb_publishable_demo'),
      MockClient((r) async {
        expect(r.url.queryParameters['requestKey'], 'a&b');
        return http.Response(jsonEncode(orderJson()), 200);
      }),
      () async => session(),
    );
    expect((await api.findOrderByRequest('a&b')).demo, isTrue);
  });
}
