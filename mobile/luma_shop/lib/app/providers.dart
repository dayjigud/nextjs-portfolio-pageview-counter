import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config.dart';
import 'runtime.dart';

final appRuntimeProvider = Provider<AppRuntime>((ref) {
  final runtime = AppRuntime(AppConfig.fromEnvironment());
  ref.onDispose(runtime.dispose);
  unawaited(runtime.initialize());
  return runtime;
});
