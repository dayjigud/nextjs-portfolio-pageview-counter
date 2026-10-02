import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:luma_shop/app/config.dart';
import 'package:luma_shop/app/providers.dart';
import 'package:luma_shop/app/runtime.dart';
import 'package:luma_shop/app/luma_app.dart';

import '../fixtures/fakes.dart';
import '../fixtures/shop_fixtures.dart';

void main() {
  testWidgets('navigation renders before catalog response and product opens', (
    tester,
  ) async {
    final response = Completer<http.Response>();
    late final SupabaseClient client;
    await tester.runAsync(() async {
      client = SupabaseClient(
        'https://example.supabase.co',
        'sb_publishable_demo',
        httpClient: MockClient((r) async {
          final value = await response.future;
          return http.Response(
            value.body,
            value.statusCode,
            headers: value.headers,
            request: r,
          );
        }),
        authOptions: const AuthClientOptions(autoRefreshToken: false),
      );
      await Future<void>.delayed(const Duration(milliseconds: 100));
    });
    final runtime = AppRuntime(
      const AppConfig('https://example.supabase.co', 'sb_publishable_demo'),
      connect: () async => client,
      store: MemoryStore(),
    );
    unawaited(runtime.initialize());
    await tester.pumpWidget(
      ProviderScope(
        overrides: [appRuntimeProvider.overrideWithValue(runtime)],
        child: const LumaApp(),
      ),
    );
    await tester.pump();
    expect(find.text('Luma Shop'), findsOneWidget);
    expect(find.text('Bag'), findsWidgets);
    response.complete(
      http.Response(
        jsonEncode([productJson()]),
        200,
        headers: {'content-type': 'application/json'},
      ),
    );
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Halo Headphones'),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Halo Headphones'), findsOneWidget);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Halo Headphones'));
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Add to bag'),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(find.text('Add to bag'), findsOneWidget);
    runtime.dispose();
    await tester.runAsync(client.dispose);
  });
  testWidgets('large text keeps unconfigured navigation usable', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(720, 1280);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ProviderScope(child: LumaApp()));
    await tester.tap(find.text('Bag').last);
    await tester.pumpAndSettle();
    expect(find.textContaining('not connected'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
