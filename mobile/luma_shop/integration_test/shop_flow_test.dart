import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luma_shop/app/luma_app.dart';
import 'package:luma_shop/app/providers.dart';

import '../test/fixtures/runtime_fixture.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('device browses catalog and edits a server-backed demo bag', (
    tester,
  ) async {
    final fixture = await RuntimeFixture.create();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [appRuntimeProvider.overrideWithValue(fixture.runtime)],
        child: const LumaApp(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Luma Shop'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Halo Headphones'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Halo Headphones'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Add to bag'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add to bag'));
    await tester.pumpAndSettle();
    expect(fixture.runtime.cart!.cart.quantity, 2);
    await tester.tap(find.text('Bag').last);
    await tester.pumpAndSettle();
    expect(find.text('Your good things.'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
    await fixture.dispose();
  });
}
