const variantId = '22222222-2222-4222-8222-222222222222';
Map<String, dynamic> variantJson({int price = 14500000}) => {
  'id': variantId,
  'label': 'Lavender',
  'price_kobo': price,
  'currency': 'NGN',
  'active': true,
};
Map<String, dynamic> cartJson({int quantity = 2, int revision = 1}) => {
  'id': '55555555-5555-4555-8555-555555555555',
  'revision': revision,
  'lines': quantity == 0
      ? []
      : [
          {
            'variantId': variantId,
            'productName': 'Halo Headphones',
            'variantLabel': 'Lavender',
            'priceKobo': 14500000,
            'quantity': quantity,
            'active': true,
          },
        ],
  'subtotalKobo': 14500000 * quantity,
};
Map<String, dynamic> quoteJson() => {
  'cartId': '55555555-5555-4555-8555-555555555555',
  'cartRevision': 1,
  'fingerprint': 'a' * 64,
  'subtotalKobo': 29000000,
  'deliveryKobo': 250000,
  'totalKobo': 29250000,
  'currency': 'NGN',
};
Map<String, dynamic> orderJson() => {
  'id': '66666666-6666-4666-8666-666666666666',
  'reference': 'LUMA-DEMO',
  'createdAt': '2026-10-02T12:00:00Z',
  'demo': true,
  'status': 'confirmed',
  'items': [
    {
      'variantId': variantId,
      'productName': 'Halo Headphones',
      'variantLabel': 'Lavender',
      'priceKobo': 14500000,
      'quantity': 2,
    },
  ],
  'subtotalKobo': 29000000,
  'deliveryKobo': 250000,
  'totalKobo': 29250000,
  'currency': 'NGN',
  'emailStatus': 'pending',
};
Map<String, dynamic> productJson() => {
  'id': '11111111-1111-4111-8111-111111111111',
  'slug': 'halo-headphones',
  'name': 'Halo Headphones',
  'description': 'Wireless headphones for your everyday.',
  'categories': {'slug': 'audio'},
  'specifications': {'Battery': '40 hours'},
  'product_images': [],
  'product_variants': [variantJson()],
};
