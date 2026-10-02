import 'package:intl/intl.dart';

String money(int kobo) => '₦${NumberFormat('#,##0.00').format(kobo / 100)}';
