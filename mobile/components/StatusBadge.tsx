import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Theme';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'error'
  | 'primary'
  | 'info'
  | 'neutral'
  | 'default'
  | string;

export interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  status?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant,
  status,
  size = 'md',
}) => {
  const getBadgeStyle = () => {
    const v = (variant || status || 'neutral').toLowerCase();
    switch (v) {
      case 'success':
        return { bg: Colors.successLight, text: Colors.successDark };
      case 'warning':
        return { bg: Colors.warningLight, text: Colors.warningDark };
      case 'danger':
      case 'error':
        return { bg: Colors.errorLight, text: Colors.errorDark };
      case 'primary':
      case 'info':
        return { bg: Colors.primaryLight, text: Colors.primary };
      default:
        return { bg: Colors.surfaceSecondary, text: Colors.textSecondary };
    }
  };

  const colors = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          size === 'sm' && styles.textSm,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
