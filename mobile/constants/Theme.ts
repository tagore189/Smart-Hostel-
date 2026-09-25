import { StyleSheet, Platform } from 'react-native';

export const Colors = {
  primary: '#7C3AED', // Royal Violet
  primaryHover: '#6D28D9',
  primaryLight: '#EDE9FE', // Soft Lavender
  primaryDark: '#5B21B6',

  secondary: '#F43F5E', // Rose Blush
  secondaryLight: '#FFE4E6',
  secondaryDark: '#BE123C',

  background: '#FBFBFE', // Soft Canvas
  surface: '#FFFFFF', // Card Surface
  surfaceSecondary: '#F4F3F8',
  surfaceHighlight: '#F8F7FC',

  border: '#E5E2F0',
  borderLight: '#F1EBFF',

  text: '#1E1B2E', // Deep Charcoal Navy
  textSecondary: '#6B6684',
  textMuted: '#9E9AA8',
  textLight: '#FFFFFF',

  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#065F46',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',

  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#991B1B',
  errorContainer: '#FFDAD6',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  gutter: 16,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = StyleSheet.create({
  sm: {
    ...Platform.select({
      ios: {
        shadowColor: '#1E1B2E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  md: {
    ...Platform.select({
      ios: {
        shadowColor: '#1E1B2E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  lg: {
    ...Platform.select({
      ios: {
        shadowColor: '#1E1B2E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#1E1B2E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export const Typography = StyleSheet.create({
  displayLarge: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headlineLarge: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  headlineMedium: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headlineSmall: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  currencyDisplay: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
});
