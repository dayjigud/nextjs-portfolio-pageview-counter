import '../../core/models.dart';

class CatalogRepository {
  final String project;
  final Future<List<Json>> Function() fetch;
  final DateTime Function() clock;
  List<Product>? _cache;
  DateTime? _cachedAt;
  Future<List<Product>>? _loading;
  CatalogRepository({
    required this.project,
    required this.fetch,
    DateTime Function()? clock,
  }) : clock = clock ?? DateTime.now;
  Future<List<Product>> load({bool forceRefresh = false}) {
    if (!forceRefresh &&
        _cache != null &&
        clock().difference(_cachedAt!) < const Duration(seconds: 120)) {
      return Future.value(_cache);
    }
    return _loading ??= fetch()
        .then((rows) {
          final parsed = List<Product>.unmodifiable(rows.map(Product.fromJson));
          _cache = parsed;
          _cachedAt = clock();
          return parsed;
        })
        .whenComplete(() => _loading = null);
  }

  List<Product> search({
    required List<Product> products,
    String query = '',
    String? category,
  }) => products
      .where(
        (p) =>
            (category == null ||
                category.isEmpty ||
                p.categorySlug == category) &&
            '${p.name} ${p.description}'.toLowerCase().contains(
              query.toLowerCase().trim(),
            ),
      )
      .toList();
  Future<Product?> findBySlug(String slug) async {
    for (final p in await load()) {
      if (p.slug == slug) return p;
    }
    return null;
  }
}
