import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luma_shop/app/luma_app.dart';

void main() {
  testWidgets(
    'unconfigured app shows navigation and demo disclosure immediately',
    (tester) async {
      await tester.pumpWidget(const ProviderScope(child: LumaApp()));
      expect(find.text('Luma Shop'), findsOneWidget);
      expect(
        find.text('Portfolio demo — no payment or shipment.'),
        findsOneWidget,
      );
      expect(find.text('Bag'), findsWidgets);
      expect(find.textContaining('not connected'), findsOneWidget);
    },
  );
}
