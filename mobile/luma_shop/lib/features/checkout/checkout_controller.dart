import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../../core/models.dart';
import '../../core/secure_store.dart';
import '../../core/shop_error.dart';

class CheckoutController extends ChangeNotifier {
  final SecureStore store;
  final String? Function() owner;
  final Future<Quote> Function() quote;
  final Future<DemoOrder> Function(CheckoutRequest) place;
  final Future<DemoOrder> Function(String) find;
  Quote? currentQuote;
  bool stale = false;
  bool busy = false;
  bool hasPending = false;
  bool rejectedPending = false;
  bool _disposed = false;
  int _epoch = 0;
  Future<DemoOrder>? _submission;
  CheckoutController({
    required this.store,
    required this.owner,
    required this.quote,
    required this.place,
    required this.find,
  });
  void _notify() {
    if (!_disposed) notifyListeners();
  }

  void reset() {
    _epoch++;
    currentQuote = null;
    stale = false;
    hasPending = false;
    rejectedPending = false;
    _notify();
  }

  void invalidateQuote() {
    stale = true;
    _notify();
  }

  Future<void> loadQuote() async {
    final user = owner();
    final epoch = _epoch;
    if (user == null) {
      throw const ShopError('AUTH_REQUIRED', 'Sign in with Google.');
    }
    final q = await quote();
    if (user == owner() && epoch == _epoch && !_disposed) {
      currentQuote = q;
      stale = false;
      hasPending = await store.read('checkout:$user') != null;
      _notify();
    }
  }

  Future<DemoOrder?> recoverPending() async {
    final user = owner();
    final epoch = _epoch;
    if (user == null) return null;
    final raw = await store.read('checkout:$user');
    if (raw == null) {
      hasPending = false;
      return null;
    }
    hasPending = true;
    _notify();
    final data = Map<String, dynamic>.from(jsonDecode(raw));
    rejectedPending = data['rejected'] != null;
    if (data['owner'] != user) {
      throw const ShopError(
        'SESSION_CHANGED',
        'This recovery belongs to another account.',
      );
    }
    final request = CheckoutRequest.fromJson(
      Map<String, dynamic>.from(data['request']),
    );
    try {
      final order = await find(request.idempotencyKey);
      if (user != owner() || epoch != _epoch) {
        throw const ShopError('SESSION_CHANGED', 'Your account changed.');
      }
      await store.delete('checkout:$user');
      hasPending = false;
      _notify();
      return order;
    } on ShopError catch (e) {
      if (e.code == 'ORDER_NOT_FOUND' ||
          (e.code == 'NOT_FOUND' && e.status == 404)) {
        return null;
      }
      rethrow;
    }
  }

  Future<DemoOrder> submit(Delivery delivery, {required bool demoConsent}) {
    if (!demoConsent) {
      return Future.error(
        const ShopError(
          'CONSENT_REQUIRED',
          'Confirm this is a demo with no payment or shipment.',
        ),
      );
    }
    return _submission ??= _submit(delivery)
        .whenComplete(() => _submission = null);
  }

  Future<DemoOrder> _submit(Delivery delivery) async {
    final user = owner();
    final epoch = _epoch;
    if (user == null) {
      throw const ShopError('AUTH_REQUIRED', 'Sign in with Google.');
    }
    busy = true;
    _notify();
    try {
      final recovered = await recoverPending();
      if (recovered != null) return recovered;
      if (user != owner() || epoch != _epoch) {
        throw const ShopError('SESSION_CHANGED', 'Your account changed.');
      }
      final raw = await store.read('checkout:$user');
      CheckoutRequest request;
      if (raw != null) {
        final data = Map<String, dynamic>.from(jsonDecode(raw));
        if (data['owner'] != user) {
          throw const ShopError(
            'SESSION_CHANGED',
            'Recovery account mismatch.',
          );
        }
        request = CheckoutRequest.fromJson(
          Map<String, dynamic>.from(data['request']),
        );
      } else {
        if (currentQuote == null || stale) {
          throw const ShopError(
            'QUOTE_CHANGED',
            'Review the latest quote first.',
          );
        }
        request = CheckoutRequest(
          idempotencyKey: const Uuid().v4(),
          quoteFingerprint: currentQuote!.fingerprint,
          cartRevision: currentQuote!.cartRevision,
          delivery: delivery,
        );
        await store.write(
          'checkout:$user',
          jsonEncode({
            'owner': user,
            'request': request.toJson(),
            'createdAt': DateTime.now().toUtc().toIso8601String(),
          }),
        );
        hasPending = true;
      }
      if (user != owner() || epoch != _epoch) {
        throw const ShopError('SESSION_CHANGED', 'Your account changed.');
      }
      try {
        final order = await place(request);
        if (user != owner() || epoch != _epoch) {
          throw const ShopError('SESSION_CHANGED', 'Your account changed.');
        }
        await store.delete('checkout:$user');
        hasPending = false;
        currentQuote = null;
        return order;
      } on ShopError catch (e) {
        if ([
          'QUOTE_CHANGED',
          'CART_CONFLICT',
          'ITEM_UNAVAILABLE',
          'CART_EMPTY',
          'VALIDATION_FAILED',
        ].contains(e.code)) {
          stale = true;
          rejectedPending = true;
          final saved = await store.read('checkout:$user');
          if (saved != null) {
            final record = Map<String, dynamic>.from(jsonDecode(saved));
            record['rejected'] = e.code;
            await store.write('checkout:$user', jsonEncode(record));
          }
        }
        rethrow;
      }
    } finally {
      busy = false;
      _notify();
    }
  }

  Future<void> resolveRejectedPending() async {
    final user = owner();
    if (user == null) return;
    if (!rejectedPending) {
      throw const ShopError(
        'REVIEW_REQUIRED',
        'Only resolve a definitively rejected request.',
      );
    }
    if (await recoverPending() != null) return;
    await store.delete('checkout:$user');
    hasPending = false;
    currentQuote = null;
    _notify();
  }

  @override
  void dispose() {
    _disposed = true;
    _epoch++;
    super.dispose();
  }
}
