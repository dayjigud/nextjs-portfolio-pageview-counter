import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:luma_shop/app/config.dart';
import 'package:luma_shop/app/runtime.dart';
import 'package:luma_shop/core/shop_sync.dart';

import 'fakes.dart';
import 'shop_fixtures.dart';

class RuntimeFixture {
  final AppRuntime runtime;
  final SupabaseClient client;
  final MemoryStore store;
  void Function(ShopInvalidation)? emit;
  RuntimeFixture(this.runtime, this.client, this.store);
  static Future<RuntimeFixture> create({bool account = true}) async {
    final session = <String, dynamic>{
      'access_token': 'fixture-token',
      'refresh_token': 'fixture-refresh',
      'token_type': 'bearer',
      'expires_in': 3600,
      'expires_at': DateTime.now().millisecondsSinceEpoch ~/ 1000 + 3600,
      'user': {
        'id': '44444444-4444-4444-8444-444444444444',
        'is_anonymous': !account,
        'app_metadata': {'provider': account ? 'google' : 'anonymous'},
        'user_metadata': {},
        'aud': 'authenticated',
        'created_at': '2026-10-02T12:00:00Z',
        'email': account ? 'demo@example.test' : '',
      },
    };
    var cart = cartJson(quantity: 1);
    final orders = <Map<String, dynamic>>[];
    final transport = MockClient((request) async {
      dynamic value;
      final path = request.url.path;
      if (path.endsWith('/products')) {
        value = [productJson()];
      } else if (path.endsWith('/cart')) {
        if (request.method == 'POST') {
          final body = jsonDecode(request.body);
          cart = cartJson(
            quantity: body['quantity'],
            revision: cart['revision'] + 1,
          );
        }
        value = cart;
      } else if (path.endsWith('/quote')) {
        value = {
          ...quoteJson(),
          'cartRevision': cart['revision'],
          'subtotalKobo': cart['subtotalKobo'],
          'totalKobo': cart['subtotalKobo'] + 250000,
        };
      } else if (path.endsWith('/checkout')) {
        value = {
          ...orderJson(),
          'items': (cart['lines'] as List)
              .map((line) => Map<String, dynamic>.from(line)..remove('active'))
              .toList(),
          'subtotalKobo': cart['subtotalKobo'],
          'totalKobo': cart['subtotalKobo'] + 250000,
        };
        orders.add(value);
        cart = cartJson(quantity: 0, revision: cart['revision'] + 1);
      } else if (path.endsWith('/orders')) {
        value = request.url.hasQuery ? orders.firstOrNull : orders;
        if (value == null) {
          return http.Response(
            jsonEncode({
              'error': {'code': 'ORDER_NOT_FOUND', 'message': 'Missing'},
            }),
            404,
            request: request,
            headers: {'content-type': 'application/json'},
          );
        }
      } else {
        throw StateError('Unmocked request: $path');
      }
      return http.Response(
        jsonEncode(value),
        200,
        request: request,
        headers: {'content-type': 'application/json'},
      );
    });
    final client = SupabaseClient(
      'https://example.supabase.co',
      'sb_publishable_demo',
      httpClient: transport,
      authOptions: const AuthClientOptions(autoRefreshToken: false),
    );
    await client.auth.recoverSession(jsonEncode(session));
    final store = MemoryStore();
    late RuntimeFixture fixture;
    final runtime = AppRuntime(
      const AppConfig('https://example.supabase.co', 'sb_publishable_demo'),
      connect: () async => client,
      store: store,
      transport: transport,
      subscribeOverride: (user, callback) async {
        fixture.emit = callback;
        return () async {};
      },
    );
    fixture = RuntimeFixture(runtime, client, store);
    await runtime.initialize();
    await Future<void>.delayed(const Duration(milliseconds: 100));
    await runtime.cart!.refresh();
    return fixture;
  }

  Future<void> dispose() async {
    runtime.dispose();
    await client.dispose();
  }
}
