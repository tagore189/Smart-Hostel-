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
  label?: string;
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
    const raw = (status || variant || 'neutral').toUpperCase();

    // Map known business statuses
    switch (raw) {
      case 'PAID':
      case 'ACTIVE':
      case 'RESOLVED':
      case 'APPROVED':
      case 'SUCCESS':
        return { bg: Colors.successLight, text: Colors.successDark };

      case 'PENDING':
      case 'SUBMITTED':
      case 'WARNING':
        return { bg: Colors.warningLight, text: Colors.warningDark };

      case 'IN_PROGRESS':
      case 'ASSIGNED':
      case 'PRIMARY':
      case 'OCCUPIED':
        return { bg: Colors.primaryLight, text: Colors.primary };

      case 'OVERDUE':
      case 'REJECTED':
      case 'TRIGGERED':
      case 'DANGER':
      case 'ERROR':
      case 'FAILED':
        return { bg: Colors.errorLight, text: Colors.errorDark };

      case 'AVAILABLE':
      case 'VACANT':
        return { bg: '#D1FAE5', text: '#065F46' };

      case 'CLOSED':
      case 'INACTIVE':
      case 'MAINTENANCE':
      default:
        return { bg: Colors.surfaceSecondary, text: Colors.textSecondary };
    }
  };

  const colors = getBadgeStyle();
  const textLabel = label || status || variant || 'STATUS';

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
        {textLabel}
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
