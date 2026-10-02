import 'package:flutter_test/flutter_test.dart';
import 'package:luma_shop/features/catalog/catalog_repository.dart';

import '../fixtures/shop_fixtures.dart';

void main() {
  test(
    'catalog caches public records for two minutes and refreshes at boundary',
    () async {
      var calls = 0;
      var now = DateTime.utc(2026, 10, 2);
      final repo = CatalogRepository(
        project: 'one',
        fetch: () async {
          calls++;
          return [productJson()];
        },
        clock: () => now,
      );
      await repo.load();
      now = now.add(const Duration(seconds: 119));
      await repo.load();
      expect(calls, 1);
      now = now.add(const Duration(seconds: 1));
      await repo.load();
      expect(calls, 2);
    },
  );
  test('search matches description and filters category', () async {
    final repo = CatalogRepository(
      project: 'one',
      fetch: () async => [productJson()],
    );
    final products = await repo.load();
    expect(
      repo
          .search(products: products, query: 'WIRELESS', category: 'audio')
          .single
          .slug,
      'halo-headphones',
    );
    expect(repo.search(products: products, category: 'charging'), isEmpty);
    expect(await repo.findBySlug('missing'), isNull);
  });
  test('failed or malformed load does not poison later retry', () async {
    var calls = 0;
    final repo = CatalogRepository(
      project: 'one',
      fetch: () async {
        if (calls++ == 0) {
          return [
            {'name': 'broken'},
          ];
        }
        return [productJson()];
      },
    );
    await expectLater(repo.load(), throwsFormatException);
    expect((await repo.load()).length, 1);
  });
}
