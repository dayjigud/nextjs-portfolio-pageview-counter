import 'package:flutter/material.dart';

ThemeData lumaTheme() => ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF7658D9),
    surface: const Color(0xFFFAF7FF),
  ),
  scaffoldBackgroundColor: const Color(0xFFFAF7FF),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xFFFAF7FF),
    foregroundColor: Color(0xFF292339),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(18)),
  ),
  cardTheme: CardThemeData(
    elevation: 0,
    color: Colors.white,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
  ),
);
