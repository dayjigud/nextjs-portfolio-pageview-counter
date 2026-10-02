import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:luma_shop/core/shop_sync.dart';

void main() {
  test(
    'subscribes before snapshot and coalesces burst after pending writes',
    () async {
      final events = <String>[];
      late void Function(ShopInvalidation) emit;
      final barrier = Completer<void>();
      final sync = ShopSync(
        subscribe: (user, callback) async {
          events.add('subscribe');
          emit = callback;
          return () async {
            events.add('close');
          };
        },
        waitForWrites: () => barrier.future,
        refresh: (kind) async {
          events.add('refresh');
        },
      );
      final start = sync.start('one');
      await Future<void>.delayed(Duration.zero);
      expect(events, ['subscribe']);
      barrier.complete();
      await start;
      for (var i = 0; i < 20; i++) {
        emit(ShopInvalidation.cart);
      }
      await Future<void>.delayed(const Duration(milliseconds: 300));
      expect(events, ['subscribe', 'refresh', 'refresh']);
      await sync.stop();
      expect(events.last, 'close');
    },
  );
  test('late prior-user event does not refresh next account', () async {
    final callbacks = <void Function(ShopInvalidation)>[];
    var refreshes = 0;
    final sync = ShopSync(
      subscribe: (user, callback) async {
        callbacks.add(callback);
        return () async {};
      },
      waitForWrites: () async {},
      refresh: (kind) async {
        refreshes++;
      },
    );
    await sync.start('one');
    await sync.start('two');
    callbacks[0](ShopInvalidation.cart);
    await Future<void>.delayed(const Duration(milliseconds: 300));
    expect(refreshes, 2);
    await sync.stop();
  });
}
