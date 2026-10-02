import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers.dart';
import 'runtime.dart';
import 'theme.dart';
import '../features/screens.dart';

class LumaApp extends ConsumerStatefulWidget {
  const LumaApp({super.key});
  @override
  ConsumerState<LumaApp> createState() => _LumaAppState();
}

class _LumaAppState extends ConsumerState<LumaApp> with WidgetsBindingObserver {
  late AppRuntime runtime;
  late GoRouter router;
  int _completion = 0;
  bool _navigating = false;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    runtime = ref.read(appRuntimeProvider);
    router = GoRouter(
      routes: [
        ShellRoute(
          builder: (context, state, child) => _live(
            () => LumaShell(
              runtime: runtime,
              route: state.uri.path,
              child: child,
            ),
          ),
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => _live(() => CatalogScreen(runtime)),
            ),
            GoRoute(
              path: '/product/:slug',
              builder: (context, state) => _live(
                () => ProductScreen(runtime, state.pathParameters['slug']!),
              ),
            ),
            GoRoute(
              path: '/cart',
              builder: (context, state) => _live(() => CartScreen(runtime)),
            ),
            GoRoute(
              path: '/signin',
              builder: (context, state) => _live(
                () => SignInScreen(
                  runtime,
                  returnTo: state.uri.queryParameters['returnTo'] ?? '/account',
                ),
              ),
            ),
            GoRoute(
              path: '/auth/callback',
              builder: (context, state) => _live(() => SignInScreen(runtime)),
            ),
            GoRoute(
              path: '/transfer',
              builder: (context, state) => _live(() => TransferScreen(runtime)),
            ),
            GoRoute(
              path: '/checkout',
              builder: (context, state) => _live(() => CheckoutScreen(runtime)),
            ),
            GoRoute(
              path: '/account',
              builder: (context, state) => _live(() => OrdersScreen(runtime)),
            ),
            GoRoute(
              path: '/receipt/:id',
              builder: (context, state) => _live(
                () => ReceiptScreen(runtime, state.pathParameters['id']!),
              ),
            ),
          ],
        ),
      ],
    );
    runtime.addListener(_changed);
  }

  // Router-owned pages are cached independently of MaterialApp rebuilds.
  // Listen at each live boundary while preserving each screen's State/drafts.
  Widget _live(Widget Function() build) =>
      AnimatedBuilder(animation: runtime, builder: (context, child) => build());

  void _changed() {
    if (!mounted) return;
    setState(() {});
    final auth = runtime.auth;
    if (auth == null || _navigating) return;
    String? destination;
    if (auth.needsTransferReview) {
      destination = '/transfer';
    } else if (auth.completionCount > _completion) {
      _completion = auth.completionCount;
      destination = auth.destination;
    }
    if (destination != null &&
        router.routeInformationProvider.value.uri.path != destination) {
      _navigating = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) router.go(destination!);
        _navigating = false;
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(runtime.resume().catchError((_) {}));
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    runtime.removeListener(_changed);
    router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MaterialApp.router(
    title: 'Luma Shop',
    theme: lumaTheme(),
    routerConfig: router,
  );
}
