import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import '../core/models.dart';
import '../core/secure_store.dart';
import '../core/shop_api.dart';
import '../core/shop_error.dart';
import '../core/shop_sync.dart';
import '../features/catalog/catalog_repository.dart';
import '../features/auth/auth_controller.dart';
import '../features/cart/cart_controller.dart';
import '../features/checkout/checkout_controller.dart';

class AppRuntime extends ChangeNotifier {
  final AppConfig config;
  final Future<SupabaseClient> Function()? connect;
  final SecureStore? providedStore;
  final Future<Unsubscribe> Function(String, void Function(ShopInvalidation))?
  subscribeOverride;
  AppRuntime(
    this.config, {
    this.connect,
    SecureStore? store,
    http.Client? transport,
    this.subscribeOverride,
  }) : providedStore = store,
       _http = transport ?? http.Client();
  SupabaseClient? client;
  ShopApi? api;
  CatalogRepository? catalog;
  AuthController? auth;
  CartController? cart;
  CheckoutController? checkout;
  ShopSync? sync;
  final http.Client _http;
  StreamSubscription<AuthState>? _authEvents;
  bool ready = false, _disposed = false, _initializing = false;
  String? error;
  String? _previousOwner;
  int ordersGeneration = 0;
  int catalogGeneration = 0;
  void notifyRefresh() => _notify();
  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> initialize() async {
    if (_initializing || ready || !config.isConfigured) return;
    _initializing = true;
    error = null;
    _notify();
    try {
      final store =
          providedStore ?? DeviceSecureStore(config.supabaseUrl!.host);
      client = connect != null
          ? await connect!()
          : (await Supabase.initialize(
              url: config.url,
              publishableKey: config.publishableKey,
              debug: false,
              authOptions: FlutterAuthClientOptions(
                authFlowType: AuthFlowType.pkce,
                localStorage: EncryptedSessionStorage(store),
                pkceAsyncStorage: EncryptedPkceStorage(store),
                detectSessionInUriPredicate: (uri) =>
                    uri.scheme == 'xyz.ayodeji.luma' &&
                    uri.host == 'auth' &&
                    uri.path == '/callback',
              ),
            )).client;
      if (_disposed) return;
      api = ShopApi(config, _http, () async {
        final current = client!.auth.currentSession;
        if (current != null && current.isExpired) {
          return (await client!.auth.refreshSession()).session;
        }
        return current;
      });
      catalog = CatalogRepository(
        project: config.url,
        fetch: () async => List<Json>.from(
          await client!
              .from('products')
              .select(
                '*, categories(slug), product_images(*), product_variants(*)',
              )
              .eq('active', true)
              .order('name'),
        ),
      );
      auth = AuthController(
        store: store,
        gateway: SupabaseAuthGateway(client!, config),
        flushPending: () async => cart?.flushPending(),
        getCart: ({sessionOverride}) =>
            api!.getCart(sessionOverride: sessionOverride),
        prepare: (s) => api!.prepareHandoff(guestSession: s),
        redeem: api!.redeemHandoff,
      );
      cart = CartController(
        fetch: () => api!.getCart(),
        save: (id, q, r) =>
            api!.updateCart(variantId: id, quantity: q, expectedRevision: r),
        ensureSession: () async {
          await auth!.ensureGuestSession();
        },
        owner: () => auth!.userId,
      );
      checkout = CheckoutController(
        store: store,
        owner: () => auth!.isGoogle ? auth!.userId : null,
        quote: () => api!.getQuote(),
        place: api!.placeOrder,
        find: api!.findOrderByRequest,
      );
      sync = ShopSync(
        subscribe: subscribeOverride ?? _subscribe,
        waitForWrites: cart!.flushPending,
        refresh: (kind) async {
          final generation = auth!.sessionGeneration;
          final before = cart!.cart.revision;
          await cart!.refresh();
          if (generation != auth!.sessionGeneration) return;
          if (cart!.cart.revision != before) checkout!.invalidateQuote();
          if (kind != ShopInvalidation.cart) {
            ordersGeneration++;
            _notify();
          }
        },
      );
      auth!.addListener(_notify);
      cart!.addListener(_notify);
      checkout!.addListener(_notify);
      _previousOwner = auth!.userId;
      _authEvents = client!.auth.onAuthStateChange.listen(
        (state) {
          unawaited(
            _sessionChanged().catchError((e) {
              error = 'Sign-in could not finish. Your saved bag is preserved.';
              _notify();
            }),
          );
        },
        onError: (Object e) {
          error = 'Google sign-in could not finish. Restore your guest bag or try again.';
          _notify();
        },
      );
      ready = true;
      await auth!.restorePendingAuth();
      _notify();
      if (auth!.userId != null) {
        unawaited(sync!.start(auth!.userId!).catchError((_) {}));
      }
    } catch (e) {
      error = 'The shop could not connect. Please retry.';
      _notify();
    } finally {
      _initializing = false;
    }
  }

  Future<void> _sessionChanged() async {
    if (_disposed || auth == null) return;
    final old = _previousOwner;
    auth!.syncIdentity();
    final user = auth!.userId;
    _previousOwner = user;
    if (old != user) {
      await sync!.stop();
      if (old != null || auth!.isGoogle) {
        cart!.reset();
        checkout!.reset();
        ordersGeneration++;
      }
      await auth!.restorePendingAuth();
      if (_disposed) return;
      if (user != null) await sync!.start(user);
      _notify();
    }
  }

  Future<Unsubscribe> _subscribe(
    String user,
    void Function(ShopInvalidation) emit,
  ) async {
    final channel = client!.channel(
      'luma-mobile:$user:${auth!.sessionGeneration}',
    );
    final ready = Completer<void>();
    for (final event in [
      PostgresChangeEvent.insert,
      PostgresChangeEvent.update,
    ]) {
      channel.onPostgresChanges(
        event: event,
        schema: 'public',
        table: 'carts',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: user,
        ),
        callback: (_) => emit(ShopInvalidation.cart),
      );
    }
    if (auth!.isGoogle) {
      channel.onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'orders',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: user,
        ),
        callback: (_) => emit(ShopInvalidation.orders),
      );
    }
    channel.subscribe((status, [error]) {
      if (status == RealtimeSubscribeStatus.subscribed) {
        if (!ready.isCompleted) {
          ready.complete();
        } else {
          emit(ShopInvalidation.reconnected);
        }
      } else if (status == RealtimeSubscribeStatus.channelError ||
          status == RealtimeSubscribeStatus.timedOut) {
        if (!ready.isCompleted) {
          ready.completeError(StateError('Subscription unavailable'));
        }
      }
    });
    try {
      await ready.future.timeout(const Duration(seconds: 12));
      return () async {
        await client!.removeChannel(channel);
      };
    } catch (_) {
      await client!.removeChannel(channel);
      rethrow;
    }
  }

  Future<List<DemoOrder>> orders() async {
    final generation = auth!.sessionGeneration;
    final result = await api!.listOrders();
    if (generation != auth!.sessionGeneration) {
      throw const ShopError('SESSION_CHANGED', 'Your account changed.');
    }
    return result;
  }

  Future<DemoOrder> order(String id) async {
    final generation = auth!.sessionGeneration;
    final result = await api!.getOrder(id);
    if (generation != auth!.sessionGeneration) {
      throw const ShopError('SESSION_CHANGED', 'Your account changed.');
    }
    return result;
  }

  Future<void> resume() async {
    if (auth != null) {
      await auth!.restorePendingAuth();
      await sync?.resume();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    unawaited(_authEvents?.cancel());
    unawaited(sync?.stop());
    auth?.dispose();
    cart?.dispose();
    checkout?.dispose();
    _http.close();
    super.dispose();
  }
}
