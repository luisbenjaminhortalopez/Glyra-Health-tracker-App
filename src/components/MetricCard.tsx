import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'ascending' | 'descending' | 'stable';
}

const trendArrows: Record<string, string> = {
  ascending: '↑',
  descending: '↓',
  stable: '→',
};

const trendColors: Record<string, string> = {
  ascending: colors.alert.red,
  descending: colors.classification.normal,
  stable: colors.text.secondary,
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, trend }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        {trend ? (
          <Text style={[styles.trend, { color: trendColors[trend] }]}>
            {trendArrows[trend]}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    minWidth: 100,
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.small,
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    color: colors.text.primary,
  },
  unit: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  trend: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    marginLeft: spacing.sm,
  },
});

export default MetricCard;
