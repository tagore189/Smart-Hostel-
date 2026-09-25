import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Shadows } from '../constants/Theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined' | 'lavender';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return [styles.card, Shadows.elevated, styles.elevated];
      case 'outlined':
        return [styles.card, styles.outlined];
      case 'lavender':
        return [styles.card, styles.lavender];
      default:
        return [styles.card, Shadows.card];
    }
  };

  return <View style={[getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  elevated: {
    borderColor: 'transparent',
  },
  outlined: {
    borderColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  lavender: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#DDD6FE',
    elevation: 0,
    shadowOpacity: 0,
  },
});
