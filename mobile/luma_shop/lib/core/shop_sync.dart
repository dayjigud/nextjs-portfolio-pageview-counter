import 'dart:async';

enum ShopInvalidation { cart, orders, reconnected }

typedef Unsubscribe = Future<void> Function();

class ShopSync {
  final Future<Unsubscribe> Function(String, void Function(ShopInvalidation))
  subscribe;
  final Future<void> Function() waitForWrites;
  final Future<void> Function(ShopInvalidation) refresh;
  int _generation = 0;
  Timer? _timer;
  Timer? _fallback;
  Unsubscribe? _close;
  String? _user;
  Future<void> _queue = Future.value();
  ShopSync({
    required this.subscribe,
    required this.waitForWrites,
    required this.refresh,
  });
  Future<void> start(String user) async {
    await stop();
    _user = user;
    final generation = _generation;
    try {
      final close = await subscribe(user, (kind) {
        if (generation != _generation) return;
        _timer?.cancel();
        _timer = Timer(const Duration(milliseconds: 250), () {
          _enqueue(kind, generation);
        });
      });
      if (generation != _generation) {
        await close();
        return;
      }
      _close = close;
    } catch (_) {
      if (generation != _generation) return;
    }
    _fallback = Timer.periodic(const Duration(seconds: 30), (_) {
      _enqueue(ShopInvalidation.reconnected, generation);
    });
    await _enqueue(ShopInvalidation.reconnected, generation);
  }

  Future<void> _enqueue(ShopInvalidation kind, int generation) {
    final operation = _queue.then((_) async {
      if (generation != _generation) return;
      await waitForWrites();
      if (generation != _generation) return;
      await refresh(kind);
    });
    _queue = operation.catchError((_) {});
    return operation;
  }

  Future<void> resume() async {
    if (_user != null) {
      await _enqueue(ShopInvalidation.reconnected, _generation);
    }
  }

  Future<void> stop() async {
    _generation++;
    _timer?.cancel();
    _fallback?.cancel();
    _timer = null;
    _fallback = null;
    _user = null;
    final close = _close;
    _close = null;
    if (close != null) await close();
  }
}
