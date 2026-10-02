typedef Json = Map<String, dynamic>;
String text(Json j, String key) {
  final x = j[key];
  if (x is! String || x.trim().isEmpty) throw FormatException('Invalid $key');
  return x;
}

int number(Json j, String key, {int min = 0, int? max}) {
  final x = j[key];
  if (x is! int || x < min || (max != null && x > max)) {
    throw FormatException('Invalid $key');
  }
  return x;
}

List<Json> rows(Json j, String key) {
  final x = j[key];
  if (x is! List) throw FormatException('Invalid $key');
  return x.map((e) => Map<String, dynamic>.from(e as Map)).toList();
}

bool flag(Json j, String key) {
  final x = j[key];
  if (x is! bool) throw FormatException('Invalid $key');
  return x;
}

String identifier(Json j, String key) {
  final s = text(j, key);
  if (!RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  ).hasMatch(s)) {
    throw FormatException('Invalid $key');
  }
  return s;
}

void currency(Json j) {
  if (j['currency'] != 'NGN') {
    throw const FormatException('Unsupported currency');
  }
}

class Variant {
  final String id, label;
  final int priceKobo;
  final bool active;
  Variant.fromJson(Json j)
    : id = identifier(j, 'id'),
      label = text(j, 'label'),
      priceKobo = number(j, 'price_kobo'),
      active = flag(j, 'active') {
    currency(j);
  }
}

class ProductImage {
  final String path, alt;
  ProductImage.fromJson(Json j)
    : path = text(j, 'storage_path'),
      alt = j['alt'] as String? ?? j['alt_text'] as String? ?? '';
}

class Product {
  final String id, slug, name, description, categorySlug;
  final List<Variant> variants;
  final List<ProductImage> images;
  final Json specifications;
  Product.fromJson(Json j)
    : id = identifier(j, 'id'),
      slug = text(j, 'slug'),
      name = text(j, 'name'),
      description = text(j, 'description'),
      categorySlug = (j['categories'] as Map?)?['slug'] as String? ?? '',
      specifications = Map<String, dynamic>.from(
        j['specifications'] as Map? ?? {},
      ),
      variants = rows(
        j,
        'product_variants',
      ).map(Variant.fromJson).where((v) => v.active).toList(),
      images =
          (rows(j, 'product_images')..sort(
                (a, b) => (a['sort_order'] as int? ?? 0).compareTo(
                  b['sort_order'] as int? ?? 0,
                ),
              ))
              .map(ProductImage.fromJson)
              .toList();
}

class OrderLine {
  final String variantId, productName, variantLabel;
  final int priceKobo, quantity;
  OrderLine.fromJson(Json j)
    : variantId = identifier(j, 'variantId'),
      productName = text(j, 'productName'),
      variantLabel = text(j, 'variantLabel'),
      priceKobo = number(j, 'priceKobo'),
      quantity = number(j, 'quantity', min: 1, max: 10);
  int get totalKobo => priceKobo * quantity;
}

class CartLine extends OrderLine {
  final bool active;
  CartLine.fromJson(super.j) : active = flag(j, 'active'), super.fromJson();
}

class Cart {
  final String? id;
  final int revision, subtotalKobo;
  final List<CartLine> lines;
  const Cart.empty()
    : id = null,
      revision = 0,
      subtotalKobo = 0,
      lines = const [];
  Cart.fromJson(Json j)
    : id = identifier(j, 'id'),
      revision = number(j, 'revision'),
      subtotalKobo = number(j, 'subtotalKobo'),
      lines = rows(j, 'lines').map(CartLine.fromJson).toList() {
    if (lines.length > 20 ||
        lines.map((l) => l.variantId).toSet().length != lines.length ||
        lines.fold<int>(0, (s, l) => s + l.totalKobo) != subtotalKobo) {
      throw const FormatException('Invalid cart total or lines');
    }
  }
  int get quantity => lines.fold(0, (s, l) => s + l.quantity);
}

class Quote {
  final String cartId, fingerprint;
  final int cartRevision, subtotalKobo, deliveryKobo, totalKobo;
  Quote.fromJson(Json j)
    : cartId = identifier(j, 'cartId'),
      fingerprint = text(j, 'fingerprint'),
      cartRevision = number(j, 'cartRevision'),
      subtotalKobo = number(j, 'subtotalKobo'),
      deliveryKobo = number(j, 'deliveryKobo'),
      totalKobo = number(j, 'totalKobo') {
    currency(j);
    if (!RegExp(r'^[0-9a-f]{64}$').hasMatch(fingerprint) ||
        subtotalKobo + deliveryKobo != totalKobo) {
      throw const FormatException('Invalid quote');
    }
  }
}

class DemoOrder {
  final String id, reference, emailStatus;
  final DateTime createdAt;
  final bool demo;
  final List<OrderLine> items;
  final int subtotalKobo, deliveryKobo, totalKobo;
  DemoOrder.fromJson(Json j)
    : id = identifier(j, 'id'),
      reference = text(j, 'reference'),
      emailStatus = text(j, 'emailStatus'),
      createdAt = DateTime.parse(text(j, 'createdAt')),
      demo = flag(j, 'demo'),
      items = rows(j, 'items').map(OrderLine.fromJson).toList(),
      subtotalKobo = number(j, 'subtotalKobo'),
      deliveryKobo = number(j, 'deliveryKobo'),
      totalKobo = number(j, 'totalKobo') {
    currency(j);
    if (!demo ||
        j['status'] != 'confirmed' ||
        subtotalKobo + deliveryKobo != totalKobo ||
        items.fold<int>(0, (s, l) => s + l.totalKobo) != subtotalKobo) {
      throw const FormatException('Invalid demo order');
    }
  }
}

class Delivery {
  final String recipientName, city, address;
  Delivery(String name, String city, String address)
    : recipientName = name.trim(),
      city = city.trim(),
      address = address.trim() {
    if (recipientName.length < 2 ||
        recipientName.length > 100 ||
        this.city.length < 2 ||
        this.city.length > 100 ||
        this.address.length < 5 ||
        this.address.length > 300) {
      throw const FormatException('Use valid fictional delivery details.');
    }
  }
  Json toJson() => {
    'recipientName': recipientName,
    'city': city,
    'address': address,
  };
  factory Delivery.fromJson(Json j) =>
      Delivery(text(j, 'recipientName'), text(j, 'city'), text(j, 'address'));
}

class CheckoutRequest {
  final String idempotencyKey, quoteFingerprint;
  final int cartRevision;
  final Delivery delivery;
  const CheckoutRequest({
    required this.idempotencyKey,
    required this.quoteFingerprint,
    required this.cartRevision,
    required this.delivery,
  });
  Json toJson() => {
    'idempotencyKey': idempotencyKey,
    'quoteFingerprint': quoteFingerprint,
    'cartRevision': cartRevision,
    'delivery': delivery.toJson(),
  };
  factory CheckoutRequest.fromJson(Json j) => CheckoutRequest(
    idempotencyKey: identifier(j, 'idempotencyKey'),
    quoteFingerprint: text(j, 'quoteFingerprint'),
    cartRevision: number(j, 'cartRevision'),
    delivery: Delivery.fromJson(Map<String, dynamic>.from(j['delivery'])),
  );
}
