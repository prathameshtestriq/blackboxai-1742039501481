import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';

// Loading Spinner
export const LoadingSpinner = ({ size = 'large' }) => {
  const theme = useTheme();
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
    </View>
  );
};

// Error Display
export const ErrorView = ({ message, onRetry }) => {
  const theme = useTheme();
  return (
    <View style={styles.centerContainer}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        {message || 'Something went wrong'}
      </Text>
      {onRetry && (
        <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
          Retry
        </Button>
      )}
    </View>
  );
};

// Empty State
export const EmptyState = ({ icon, message, action }) => {
  const theme = useTheme();
  return (
    <View style={styles.centerContainer}>
      {icon}
      <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
        {message}
      </Text>
      {action}
    </View>
  );
};

// Section Header
export const SectionHeader = ({ title, action }) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
};

// Card Container
export const CardContainer = ({ children, style }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          ...theme.shadows.small,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Price Display
export const PriceDisplay = ({ value, change, size = 'normal' }) => {
  const theme = useTheme();
  const isPositive = change >= 0;
  const textSize = size === 'large' ? styles.largePrice : styles.normalPrice;

  return (
    <View>
      <Text style={[textSize, { color: theme.colors.text }]}>
        ₹{value.toFixed(2)}
      </Text>
      {change !== undefined && (
        <Text
          style={[
            styles.priceChange,
            {
              color: isPositive ? theme.colors.success : theme.colors.error,
            },
          ]}
        >
          {isPositive ? '+' : ''}
          {change.toFixed(2)}%
        </Text>
      )}
    </View>
  );
};

// Status Badge
export const StatusBadge = ({ status, style }) => {
  const theme = useTheme();
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'live':
        return theme.colors.live;
      case 'upcoming':
        return theme.colors.upcoming;
      case 'completed':
        return theme.colors.completed;
      default:
        return theme.colors.disabled;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getStatusColor(),
        },
        style,
      ]}
    >
      <Text style={styles.badgeText}>{status.toUpperCase()}</Text>
    </View>
  );
};

// Divider with optional label
export const LabeledDivider = ({ label }) => {
  const theme = useTheme();
  return (
    <View style={styles.dividerContainer}>
      <View
        style={[
          styles.divider,
          {
            backgroundColor: theme.colors.disabled,
          },
        ]}
      />
      {label && <Text style={styles.dividerLabel}>{label}</Text>}
      <View
        style={[
          styles.divider,
          {
            backgroundColor: theme.colors.disabled,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  normalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  largePrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    marginHorizontal: 8,
    color: '#666',
  },
});

export default {
  LoadingSpinner,
  ErrorView,
  EmptyState,
  SectionHeader,
  CardContainer,
  PriceDisplay,
  StatusBadge,
  LabeledDivider,
};
