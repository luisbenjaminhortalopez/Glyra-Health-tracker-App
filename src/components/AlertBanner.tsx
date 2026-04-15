import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';
import type { AlertSeverity } from '../types';

interface AlertBannerProps {
  message: string;
  severity: AlertSeverity;
}

const severityConfig: Record<AlertSeverity, { bg: string; icon: string }> = {
  red: { bg: colors.alert.red, icon: '⚠️' },
  yellow: { bg: colors.alert.yellow, icon: '⚡' },
};

const AlertBanner: React.FC<AlertBannerProps> = ({ message, severity }) => {
  const config = severityConfig[severity];

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.small,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  icon: {
    fontSize: fontSize.subtitle,
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.text.inverse,
  },
});

export default AlertBanner;
