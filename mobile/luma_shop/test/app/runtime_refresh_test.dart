import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luma_shop/app/luma_app.dart';
import 'package:luma_shop/app/providers.dart';

import '../fixtures/runtime_fixture.dart';

void main() {
  testWidgets('Google completion replaces visible sign-in without navigation', (
    tester,
  ) async {
    final fixture = (await tester.runAsync(
      () => RuntimeFixture.create(account: false),
    ))!;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [appRuntimeProvider.overrideWithValue(fixture.runtime)],
        child: const LumaApp(),
      ),
    );
    await tester.tap(find.text('Account').last);
    await tester.pump();
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 100)),
    );
    await tester.pumpAndSettle();
    expect(find.text('Continue with Google'), findsOneWidget);
    await tester.runAsync(() async {
      final data = fixture.client.auth.currentSession!.toJson();
      data['user']['id'] = '55555555-5555-4555-8555-555555555555';
      data['user']['is_anonymous'] = false;
      data['user']['email'] = 'demo@example.test';
      data['user']['app_metadata'] = {'provider': 'google'};
      await fixture.client.auth.recoverSession(jsonEncode(data));
      await Future<void>.delayed(const Duration(milliseconds: 100));
    });
    await tester.pumpAndSettle();
    expect(find.text('Continue with Google'), findsNothing);
    expect(find.text('Sign out on this phone'), findsOneWidget);
    expect(find.byTooltip('Refresh from the shop'), findsNothing);
    await tester.pumpWidget(const SizedBox());
    await tester.runAsync(fixture.dispose);
  });

  testWidgets(
    'startup completion updates the current route without navigation',
    (tester) async {
      final fixture = (await tester.runAsync(() => RuntimeFixture.create()))!;
      fixture.runtime.ready = false;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [appRuntimeProvider.overrideWithValue(fixture.runtime)],
          child: const LumaApp(),
        ),
      );
      expect(find.text('Connecting your good things…'), findsOneWidget);
      fixture.runtime.ready = true;
      fixture.runtime.notifyRefresh();
      await tester.pumpAndSettle();
      expect(find.text('Connecting your good things…'), findsNothing);
      expect(find.text('Search the collection'), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
      await tester.runAsync(fixture.dispose);
    },
  );

  testWidgets(
    'sign-out updates the visible Account route without a tab switch',
    (tester) async {
      final fixture = (await tester.runAsync(() => RuntimeFixture.create()))!;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [appRuntimeProvider.overrideWithValue(fixture.runtime)],
          child: const LumaApp(),
        ),
      );
      await tester.tap(find.text('Account').last);
      await tester.pump();
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 100)),
      );
      await tester.pumpAndSettle();
      expect(find.text('Sign out on this phone'), findsOneWidget);
      await tester.runAsync(fixture.runtime.auth!.signOut);
      await tester.pumpAndSettle();
      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.text('Sign out on this phone'), findsNothing);
      await tester.pumpWidget(const SizedBox());
      await tester.runAsync(fixture.dispose);
    },
  );
}
