import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

abstract interface class SecureStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

class DeviceSecureStore implements SecureStore {
  final String scope;
  final FlutterSecureStorage storage;
  const DeviceSecureStore(
    this.scope, {
    this.storage = const FlutterSecureStorage(),
  });
  String _key(String key) => 'luma:$scope:$key';
  @override
  Future<String?> read(String key) => storage.read(key: _key(key));
  @override
  Future<void> write(String key, String value) =>
      storage.write(key: _key(key), value: value);
  @override
  Future<void> delete(String key) => storage.delete(key: _key(key));
}

class EncryptedSessionStorage extends LocalStorage {
  final SecureStore store;
  const EncryptedSessionStorage(this.store);
  @override
  Future<void> initialize() async {}
  @override
  Future<bool> hasAccessToken() async => await store.read('session') != null;
  @override
  Future<String?> accessToken() => store.read('session');
  @override
  Future<void> persistSession(String value) => store.write('session', value);
  @override
  Future<void> removePersistedSession() => store.delete('session');
}

class EncryptedPkceStorage extends GotrueAsyncStorage {
  final SecureStore store;
  const EncryptedPkceStorage(this.store);
  @override
  Future<String?> getItem({required String key}) => store.read('pkce:$key');
  @override
  Future<void> setItem({required String key, required String value}) =>
      store.write('pkce:$key', value);
  @override
  Future<void> removeItem({required String key}) => store.delete('pkce:$key');
}
