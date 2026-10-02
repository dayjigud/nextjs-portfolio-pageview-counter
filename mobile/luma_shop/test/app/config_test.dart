import 'package:flutter_test/flutter_test.dart';
import 'package:luma_shop/app/config.dart';

void main() {
  test('configuration accepts public HTTPS service only', () {
    expect(AppConfig('', '').isConfigured, isFalse);
    expect(
      AppConfig('http://example.test', 'sb_publishable_demo').isConfigured,
      isFalse,
    );
    expect(
      AppConfig('https://example.supabase.co', 'sb_secret_bad').isConfigured,
      isFalse,
    );
    expect(
      AppConfig(
        'https://example.supabase.co',
        'sb_publishable_demo',
      ).isConfigured,
      isTrue,
    );
  });
}
