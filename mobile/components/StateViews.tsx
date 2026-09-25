import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/Theme';
import { ApiError } from '../services/api';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = 'Loading details...' }: LoadingViewProps) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

interface EmptyViewProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyView({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyViewProps) {
  return (
    <View style={styles.centerContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptySubtitle}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface ErrorViewProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorView({ error, onRetry, title }: ErrorViewProps) {
  let displayTitle = title || 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';
  let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle-outline';

  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      displayTitle = 'Session Expired';
      message = 'Please log in again to continue accessing this service.';
      iconName = 'lock-closed-outline';
    } else if (error.statusCode === 403) {
      displayTitle = 'Access Restricted';
      message = 'You do not have permission to view or manage this resource.';
      iconName = 'shield-outline';
    } else if (error.statusCode === 404) {
      displayTitle = 'Not Found';
      message = error.message || 'The requested resource could not be found.';
      iconName = 'search-outline';
    } else if (error.statusCode === 408 || error.statusCode === 0) {
      displayTitle = 'Connection Issue';
      message = 'Unable to reach SLG Hostel servers. Check your internet connection.';
      iconName = 'wifi-outline';
    } else if (error.statusCode >= 500) {
      displayTitle = 'Server Unavailable';
      message = error.message || 'Hostel backend encountered a temporary error. Please retry.';
      iconName = 'cloud-offline-outline';
    } else {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <View style={styles.centerContainer}>
      <View style={[styles.iconCircle, styles.errorIconCircle]}>
        <Ionicons name={iconName} size={36} color={Colors.error} />
      </View>
      <Text style={styles.errorTitle}>{displayTitle}</Text>
      <Text style={styles.errorSubtitle}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconCircle: {
    backgroundColor: Colors.errorLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
