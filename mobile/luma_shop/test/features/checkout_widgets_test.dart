import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:luma_shop/core/models.dart';

import 'package:flutter_test/flutter_test.dart';
import 'package:luma_shop/features/screens.dart';

import '../fixtures/runtime_fixture.dart';

void main() {
  testWidgets('remote quote invalidation preserves delivery draft and focus', (
    tester,
  ) async {
    final fixture = (await tester.runAsync(() => RuntimeFixture.create()))!;
    // Keep route/network bootstrapping outside Flutter's fake clock.
    await tester.runAsync(() async {
      await fixture.runtime.checkout!.loadQuote();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AnimatedBuilder(
              animation: fixture.runtime,
              builder: (_, _) => CheckoutScreen(fixture.runtime),
            ),
          ),
        ),
      );
      await tester.pump();
      await Future<void>.delayed(const Duration(milliseconds: 100));
      await tester.pump();
    });
    final city = find.widgetWithText(TextFormField, 'Demo city');
    await tester.scrollUntilVisible(
      city,
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.enterText(city, 'Demo City');
    await tester.tap(city);
    await tester.pump();
    final focused = FocusManager.instance.primaryFocus;
    fixture.runtime.checkout!.invalidateQuote();
    await tester.pump();
    expect(find.text('Demo City'), findsOneWidget);
    expect((tester.widget<TextFormField>(city)).controller!.text, 'Demo City');
    expect(FocusManager.instance.primaryFocus, same(focused));
    expect(tester.takeException(), isNull);
    final user = fixture.runtime.auth!.userId!;
    await fixture.store.write(
      'checkout:$user',
      jsonEncode({
        'owner': user,
        'request': CheckoutRequest(
          idempotencyKey: '77777777-7777-4777-8777-777777777777',
          quoteFingerprint: 'a' * 64,
          cartRevision: 1,
          delivery: Delivery('Saved recipient', 'Saved city', 'Saved address'),
        ).toJson(),
      }),
    );
    await fixture.runtime.checkout!.recoverPending();
    fixture.runtime.checkout!.invalidateQuote();
    await tester.pump();
    final consent = find.byType(CheckboxListTile);
    await tester.scrollUntilVisible(
      consent,
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.tap(consent);
    await tester.pump();
    final retry = find.widgetWithText(
      FilledButton,
      'Recover or retry saved request',
    );
    await tester.scrollUntilVisible(
      retry,
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(tester.widget<FilledButton>(retry).onPressed, isNotNull);
    await tester.pumpWidget(const SizedBox());
    await tester.runAsync(fixture.dispose);
  });
}
