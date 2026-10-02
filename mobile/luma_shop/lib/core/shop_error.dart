class ShopError implements Exception {
  final String code, message;
  final int? status;
  final Map<String, dynamic>? details;
  const ShopError(this.code, this.message, {this.status, this.details});
  @override
  String toString() => message;
}
