import 'dart:convert';

class AppConfig {
  final String url, publishableKey;
  const AppConfig(this.url, this.publishableKey);
  factory AppConfig.fromEnvironment() => const AppConfig(
    String.fromEnvironment('SUPABASE_URL'),
    String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY'),
  );
  Uri? get supabaseUrl => Uri.tryParse(url);
  bool get isConfigured {
    final uri = supabaseUrl;
    if (uri == null ||
        uri.scheme != 'https' ||
        uri.host.isEmpty ||
        uri.userInfo.isNotEmpty ||
        uri.query.isNotEmpty ||
        uri.fragment.isNotEmpty) {
      return false;
    }
    if (publishableKey.startsWith('sb_publishable_')) return true;
    try {
      final parts = publishableKey.split('.');
      return parts.length == 3 &&
          jsonDecode(
                utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
              )['role'] ==
              'anon';
    } catch (_) {
      return false;
    }
  }
}
