# Luma Shop for Android

Portfolio demo sharing the existing Luma Supabase catalog, Google accounts, bag and demo orders. No payment or shipment.

See [mobile development](../../docs/luma-mobile-development.md) for setup, recovery guarantees, signing and the verification checklist.

From this folder:

```sh
flutter pub get
flutter analyze
flutter test
flutter run --dart-define-from-file=config/luma.local.json
flutter build apk --release --dart-define-from-file=config/luma.local.json
```

Copy `config/luma.example.json` to ignored `config/luma.local.json`, supplying only the existing public URL and publishable key. Use a stable local release signing key through ignored `android/key.properties`. Never add server credentials.
