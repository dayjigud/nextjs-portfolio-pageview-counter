import 'package:flutter/foundation.dart';

import '../../core/models.dart';
import '../../core/shop_error.dart';

class CartController extends ChangeNotifier {
  final Future<Cart> Function() fetch;
  final Future<Cart> Function(String, int, int) save;
  final Future<void> Function() ensureSession;
  final String? Function() owner;
  Cart cart = const Cart.empty();
  int pendingQuantity = 0;
  ShopError? error;
  bool saving = false;
  bool loading = false;
  bool reviewRequired = false;
  bool _disposed = false;
  int _epoch = 0;
  String? _loadedOwner;
  String? _createdOwner;
  Future<void> _tail = Future.value();
  CartController({
    required this.fetch,
    required this.save,
    required this.ensureSession,
    required this.owner,
  });
  int get badgeQuantity => cart.quantity + pendingQuantity;
  void _notify() {
    if (!_disposed) notifyListeners();
  }

  void reset() {
    _epoch++;
    cart = const Cart.empty();
    pendingQuantity = 0;
    saving = false;
    loading = false;
    error = null;
    reviewRequired = false;
    _loadedOwner = null;
    _createdOwner = null;
    _notify();
  }

  Future<void> flushPending() => _tail;
  Future<void> refresh() async {
    await flushPending();
    final user = owner();
    final epoch = _epoch;
    if (user == null) {
      cart = const Cart.empty();
      _notify();
      return;
    }
    loading = true;
    _notify();
    try {
      final next = await fetch();
      if (!_disposed && epoch == _epoch && owner() == user) {
        cart = next;
        _loadedOwner = user;
        error = null;
      }
    } catch (e) {
      if (!_disposed && epoch == _epoch && owner() == user) {
        error = e is ShopError
            ? e
            : const ShopError(
                'REQUEST_FAILED',
                'Your bag could not load. Please retry.',
              );
      }
      rethrow;
    } finally {
      if (!_disposed && epoch == _epoch && owner() == user) {
        loading = false;
        _notify();
      }
    }
  }

  void acknowledgeReview() {
    reviewRequired = false;
    error = null;
    _notify();
  }

  Future<void> add(String id, {int quantity = 1}) =>
      _mutate(id, quantity, additive: true);
  Future<void> setQuantity(String id, int quantity) =>
      _mutate(id, quantity, additive: false);
  Future<void> _mutate(String id, int quantity, {required bool additive}) {
    if (quantity < 0 || quantity > 10 || (additive && quantity == 0)) {
      return Future.error(
        const ShopError('VALIDATION_FAILED', 'Choose a quantity from 1 to 10.'),
      );
    }
    final epoch = _epoch;
    final initialOwner = owner();
    final pending = additive ? quantity : 0;
    pendingQuantity += pending;
    saving = true;
    _notify();
    final operation = _tail
        .then((_) async {
          if (_disposed ||
              epoch != _epoch ||
              owner() != initialOwner &&
                  !(initialOwner == null && owner() == _createdOwner)) {
            throw const ShopError(
              'SESSION_CHANGED',
              'Your account changed. Please review your bag.',
            );
          }
          if (reviewRequired) {
            throw const ShopError(
              'REVIEW_REQUIRED',
              'Review your latest bag before editing again.',
            );
          }
          await ensureSession();
          final user = owner();
          if (initialOwner == null) _createdOwner = user;
          if (epoch != _epoch) {
            throw const ShopError('SESSION_CHANGED', 'Your account changed.');
          }
          final operationEpoch = _epoch;
          try {
            if (_loadedOwner != user) {
              final initialCart = await fetch();
              if (owner() != user || _epoch != operationEpoch || _disposed) {
                return;
              }
              cart = initialCart;
              _loadedOwner = user;
            }
            final matching = cart.lines.where((l) => l.variantId == id);
            final existing = matching.isEmpty ? 0 : matching.first.quantity;
            final target = additive ? existing + quantity : quantity;
            if (target > 10 ||
                (existing == 0 && target > 0 && cart.lines.length >= 20)) {
              throw const ShopError(
                'VALIDATION_FAILED',
                'Bag limit: 10 per item and 20 different items.',
              );
            }
            final next = await save(id, target, cart.revision);
            if (owner() == user && _epoch == operationEpoch) {
              cart = next;
              error = null;
            }
          } catch (e) {
            if (owner() == user && _epoch == operationEpoch) {
              error = e is ShopError
                  ? e
                  : const ShopError(
                      'REQUEST_FAILED',
                      'Unable to save your bag.',
                    );
              reviewRequired = true;
              try {
                final latest = await fetch();
                if (owner() == user && _epoch == operationEpoch) cart = latest;
              } catch (_) {}
            }
            rethrow;
          }
        })
        .whenComplete(() {
          if (epoch == _epoch) {
            pendingQuantity -= pending;
            saving = pendingQuantity > 0;
          }
          _notify();
        });
    _tail = operation.catchError((_) {});
    return operation;
  }

  @override
  void dispose() {
    _disposed = true;
    _epoch++;
    super.dispose();
  }
}
