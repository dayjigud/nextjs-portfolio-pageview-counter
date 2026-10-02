import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../app/config.dart';
import '../../core/models.dart';
import '../../core/secure_store.dart';
import '../../core/shop_api.dart';
import '../../core/shop_error.dart';

abstract interface class AuthGateway {
  Session? get current;
  Future<Session> guest();
  Future<void> launchGoogle();
  Future<Session> refreshGuest(Session guest);
  Future<void> restore(Session guest);
  Future<void> signOut();
}

class SupabaseAuthGateway implements AuthGateway {
  final SupabaseClient client;
  final AppConfig config;
  SupabaseAuthGateway(this.client, this.config);
  @override
  Session? get current => client.auth.currentSession;
  @override
  Future<Session> guest() async =>
      current ?? (await client.auth.signInAnonymously()).session!;
  @override
  Future<void> launchGoogle() async {
    final launched = await client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'xyz.ayodeji.luma://auth/callback',
      authScreenLaunchMode: LaunchMode.externalApplication,
    );
    if (!launched) {
      throw const ShopError('OAUTH_FAILED', 'Google sign-in could not open.');
    }
  }

  @override
  Future<Session> refreshGuest(Session session) async {
    final recovery = SupabaseClient(
      config.url,
      config.publishableKey,
      authOptions: const AuthClientOptions(autoRefreshToken: false),
    );
    try {
      return (await recovery.auth.refreshSession(session.refreshToken))
          .session!;
    } finally {
      await recovery.dispose();
    }
  }

  @override
  Future<void> restore(Session guest) async {
    await client.auth.recoverSession(jsonEncode(guest.toJson()));
  }

  @override
  Future<void> signOut() => client.auth.signOut(scope: SignOutScope.local);
}

typedef CartReader = Future<Cart> Function({Session? sessionOverride});

class TransferReview {
  final Cart guest, account;
  const TransferReview(this.guest, this.account);
}

class AuthController extends ChangeNotifier {
  final SecureStore store;
  final AuthGateway gateway;
  final Future<void> Function() flushPending;
  final CartReader getCart;
  final Future<HandoffToken> Function(Session) prepare;
  final Future<Cart> Function(String) redeem;
  int sessionGeneration = 0;
  int completionCount = 0;
  String? _identity;
  String destination = '/';
  bool waitingForGoogle = false, needsTransferReview = false;
  ShopError? error;
  Future<void>? _completion;
  bool _disposed = false;
  AuthController({
    required this.store,
    required this.gateway,
    required this.flushPending,
    required this.getCart,
    required this.prepare,
    required this.redeem,
  }) : _identity = gateway.current?.user.id;
  Session? get session => gateway.current;
  String? get userId => session?.user.id;
  bool get isGoogle => session != null && session!.user.isAnonymous != true;
  void _notify() {
    if (!_disposed) notifyListeners();
  }

  void syncIdentity() {
    if (_identity != userId) {
      _identity = userId;
      sessionGeneration++;
    }
    _notify();
  }

  Future<Session> ensureGuestSession() async {
    final result = await gateway.guest();
    syncIdentity();
    return result;
  }

  Future<void> beginGoogle(String returnTo) async {
    if (waitingForGoogle) return;
    waitingForGoogle = true;
    error = null;
    _notify();
    var wrotePending = false;
    try {
      await flushPending();
      if (await store.read('auth-pending') != null) {
        throw const ShopError(
          'TRANSFER_PENDING',
          'Finish or restore your saved guest bag first.',
        );
      }
      final guest = session;
      HandoffToken? token;
      if (guest != null && guest.user.isAnonymous == true) {
        final bag = await getCart(sessionOverride: guest);
        if (bag.lines.isNotEmpty) token = await prepare(guest);
      }
      destination = _safeDestination(returnTo);
      await store.write(
        'auth-pending',
        jsonEncode({
          'guest': token == null ? null : guest!.toJson(),
          'token': token?.token,
          'expiresAt': token?.expiresAt.toUtc().toIso8601String(),
          'destination': destination,
        }),
      );
      wrotePending = true;
      await gateway.launchGoogle();
    } catch (e) {
      waitingForGoogle = false;
      _notify();
      if (wrotePending) await cancelGoogle();
      rethrow;
    }
  }

  String _safeDestination(String path) =>
      RegExp(r'^/(cart|checkout|account|receipt/[0-9a-fA-F-]+)?$')
          .hasMatch(path)
      ? path
      : '/';
  Future<void> restorePendingAuth() =>
      _completion ??= _restore().whenComplete(() => _completion = null);
  Future<void> _restore() async {
    final raw = await store.read('auth-pending');
    syncIdentity();
    if (raw == null) return;
    final data = Map<String, dynamic>.from(jsonDecode(raw));
    destination = _safeDestination(data['destination'] as String? ?? '/');
    if (!isGoogle) {
      waitingForGoogle = true;
      _notify();
      return;
    }
    waitingForGoogle = false;
    if (data['targetUser'] != null && data['targetUser'] != userId) {
      needsTransferReview = true;
      error = const ShopError(
        'SESSION_CHANGED',
        'Sign in to the account that started this transfer, or restore your guest bag.',
      );
      _notify();
      return;
    }
    data['targetUser'] = userId;
    await store.write('auth-pending', jsonEncode(data));
    if (data['guest'] == null) {
      await store.delete('auth-pending');
      completionCount++;
      needsTransferReview = false;
      _notify();
      return;
    }
    try {
      final expires = DateTime.parse(data['expiresAt']);
      if (!expires.isAfter(DateTime.now())) {
        throw const ShopError(
          'HANDOFF_EXPIRED',
          'Your guest bag is saved. Review it and retry the transfer.',
        );
      }
      await redeem(data['token']);
      await store.delete('auth-pending');
      completionCount++;
      needsTransferReview = false;
      error = null;
    } catch (e) {
      needsTransferReview = true;
      error = e is ShopError
          ? e
          : const ShopError(
              'TRANSFER_PENDING',
              'Both bags are saved. Review and retry the transfer.',
            );
    }
    _notify();
  }

  Future<Session> _pendingGuest(Json data) async {
    final saved = Session.fromJson(Map<String, dynamic>.from(data['guest']));
    if (saved == null) {
      throw const ShopError('TRANSFER_MISSING', 'No guest recovery exists.');
    }
    final fresh = await gateway.refreshGuest(saved);
    data['guest'] = fresh.toJson();
    await store.write('auth-pending', jsonEncode(data));
    return fresh;
  }

  Future<TransferReview> reviewTransfer() async {
    final raw = await store.read('auth-pending');
    if (raw == null) {
      throw const ShopError(
        'TRANSFER_MISSING',
        'No guest transfer is pending.',
      );
    }
    final data = Map<String, dynamic>.from(jsonDecode(raw));
    if (data['guest'] == null) {
      throw const ShopError('TRANSFER_MISSING', 'No guest bag is pending.');
    }
    final guest = await _pendingGuest(data);
    return TransferReview(
      await getCart(sessionOverride: guest),
      await getCart(),
    );
  }

  Future<void> reviseGuest(
    String id,
    int quantity,
    int revision,
    Future<Cart> Function(Session, String, int, int) save,
  ) async {
    final data = Map<String, dynamic>.from(
      jsonDecode((await store.read('auth-pending'))!),
    );
    final guest = await _pendingGuest(data);
    await save(guest, id, quantity, revision);
  }

  Future<void> retryTransfer() async {
    final raw = await store.read('auth-pending');
    if (raw == null) return;
    final data = Map<String, dynamic>.from(jsonDecode(raw));
    if (data['targetUser'] != null && data['targetUser'] != userId) {
      throw const ShopError(
        'SESSION_CHANGED',
        'Return to the original account first.',
      );
    }
    if (error?.code == 'CART_CONFLICT' || error?.code == 'HANDOFF_EXPIRED') {
      final fresh = await _pendingGuest(data);
      final token = await prepare(fresh);
      data['token'] = token.token;
      data['expiresAt'] = token.expiresAt.toUtc().toIso8601String();
      await store.write('auth-pending', jsonEncode(data));
    }
    await restorePendingAuth();
  }

  Future<void> cancelGoogle() async {
    final raw = await store.read('auth-pending');
    if (raw == null) return;
    final data = Map<String, dynamic>.from(jsonDecode(raw));
    if (data['guest'] != null) {
      final guest = await _pendingGuest(data);
      await gateway.restore(guest);
    }
    await store.delete('auth-pending');
    waitingForGoogle = false;
    needsTransferReview = false;
    error = null;
    syncIdentity();
  }

  Future<void> signOut() async {
    if (await store.read('auth-pending') != null) {
      await cancelGoogle();
      return;
    }
    await gateway.signOut();
    waitingForGoogle = false;
    needsTransferReview = false;
    syncIdentity();
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}
