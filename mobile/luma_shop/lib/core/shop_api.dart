import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../app/config.dart';
import 'models.dart';
import 'shop_error.dart';

class HandoffToken {
  final String token;
  final DateTime expiresAt;
  HandoffToken.fromJson(Json j)
    : token = text(j, 'token'),
      expiresAt = DateTime.parse(text(j, 'expiresAt')) {
    if (!RegExp(r'^[0-9a-f]{64}$').hasMatch(token)) {
      throw const FormatException('Invalid handoff');
    }
  }
}

class ShopApi {
  final AppConfig config;
  final http.Client client;
  final Future<Session?> Function() currentSession;
  ShopApi(this.config, this.client, this.currentSession);
  Future<dynamic> request(
    String name, {
    String method = 'GET',
    Json? body,
    Session? sessionOverride,
    Map<String, String>? query,
  }) async {
    if (!config.isConfigured) {
      throw const ShopError('UNCONFIGURED', 'The shop is not connected yet.');
    }
    final session = sessionOverride ?? await currentSession();
    if (session == null) {
      throw const ShopError('AUTH_REQUIRED', 'Please sign in to continue.');
    }
    final uri = config.supabaseUrl!.replace(
      path: '/functions/v1/$name',
      queryParameters: query,
    );
    http.Response response;
    try {
      final headers = {
        'Content-Type': 'application/json',
        'apikey': config.publishableKey,
        'Authorization': 'Bearer ${session.accessToken}',
      };
      response =
          await (method == 'POST'
                  ? client.post(uri, headers: headers, body: jsonEncode(body))
                  : client.get(uri, headers: headers))
              .timeout(const Duration(seconds: 20));
    } on TimeoutException {
      throw const ShopError(
        'UNCERTAIN_RESULT',
        'The connection timed out. Refresh to check what was saved.',
      );
    } on http.ClientException {
      throw const ShopError(
        'UNCERTAIN_RESULT',
        'Connection interrupted. Refresh to check what was saved.',
      );
    }
    dynamic data;
    try {
      data = jsonDecode(response.body);
    } catch (_) {
      throw const ShopError(
        'SERVICE_UNAVAILABLE',
        'The shop could not respond. Please retry.',
      );
    }
    if (response.statusCode >= 400 || (data is Map && data['error'] != null)) {
      final error = data is Map ? data['error'] : null;
      throw ShopError(
        error is Map
            ? error['code'] as String? ?? 'REQUEST_FAILED'
            : 'REQUEST_FAILED',
        error is Map
            ? error['message'] as String? ?? 'Unable to complete this action.'
            : 'Unable to complete this action.',
        status: response.statusCode,
        details: error is Map && error['details'] is Map
            ? Map<String, dynamic>.from(error['details'])
            : null,
      );
    }
    return data;
  }

  Future<Cart> getCart({Session? sessionOverride}) async =>
      Cart.fromJson(await request('cart', sessionOverride: sessionOverride));
  Future<Cart> updateCart({
    required String variantId,
    required int quantity,
    required int expectedRevision,
    Session? sessionOverride,
  }) async => Cart.fromJson(
    await request(
      'cart',
      method: 'POST',
      body: {
        'variantId': variantId,
        'quantity': quantity,
        'expectedRevision': expectedRevision,
      },
      sessionOverride: sessionOverride,
    ),
  );
  Future<HandoffToken> prepareHandoff({required Session guestSession}) async =>
      HandoffToken.fromJson(
        await request(
          'cart-handoff',
          method: 'POST',
          body: {'action': 'prepare'},
          sessionOverride: guestSession,
        ),
      );
  Future<Cart> redeemHandoff(String token) async => Cart.fromJson(
    await request(
      'cart-handoff',
      method: 'POST',
      body: {'action': 'redeem', 'token': token},
    ),
  );
  Future<Quote> getQuote() async => Quote.fromJson(await request('quote'));
  Future<DemoOrder> placeOrder(CheckoutRequest requestBody) async =>
      DemoOrder.fromJson(
        await request('checkout', method: 'POST', body: requestBody.toJson()),
      );
  Future<DemoOrder> getOrder(String id) async =>
      DemoOrder.fromJson(await request('orders', query: {'id': id}));
  Future<DemoOrder> findOrderByRequest(String key) async =>
      DemoOrder.fromJson(await request('orders', query: {'requestKey': key}));
  Future<List<DemoOrder>> listOrders() async =>
      (await request('orders') as List)
          .map((j) => DemoOrder.fromJson(Map<String, dynamic>.from(j)))
          .toList();
}
