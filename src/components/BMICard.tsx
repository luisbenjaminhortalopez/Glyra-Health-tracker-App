import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from './GlassCard';
import { fontFamily, fontSize, spacing, colors, borderRadius } from '../theme';

interface BMICardProps {
  weightKg: number;
  heightCm: number;
}

function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Bajo peso', color: '#3B82F6' };
  if (bmi < 25) return { label: 'Normal', color: '#22C55E' };
  if (bmi < 30) return { label: 'Sobrepeso', color: '#F59E0B' };
  if (bmi < 35) return { label: 'Obesidad I', color: '#F97316' };
  if (bmi < 40) return { label: 'Obesidad II', color: '#EF4444' };
  return { label: 'Obesidad III', color: '#991B1B' };
}

const BMICard: React.FC<BMICardProps> = ({ weightKg, heightCm }) => {
  if (!weightKg || !heightCm || heightCm <= 0) return null;

  const bmi = calculateBMI(weightKg, heightCm);
  const { label, color } = getBMICategory(bmi);

  // Position indicator on bar (BMI 15-45 range mapped to 0-100%)
  const barPercent = Math.min(Math.max(((bmi - 15) / 30) * 100, 0), 100);

  return (
    <GlassCard style={styles.container}>
      <Text style={styles.title}>Índice de Masa Corporal</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.bmiValue, { color }]}>{bmi.toFixed(1)}</Text>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      </View>

      {/* Color bar */}
      <View style={styles.barContainer}>
        <View style={[styles.barSegment, { flex: 1, backgroundColor: '#3B82F6' }]} />
        <View style={[styles.barSegment, { flex: 2, backgroundColor: '#22C55E' }]} />
        <View style={[styles.barSegment, { flex: 1.5, backgroundColor: '#F59E0B' }]} />
        <View style={[styles.barSegment, { flex: 1.5, backgroundColor: '#F97316' }]} />
        <View style={[styles.barSegment, { flex: 1.5, backgroundColor: '#EF4444' }]} />
        <View style={[styles.barSegment, { flex: 1.5, backgroundColor: '#991B1B' }]} />
      </View>
      {/* Indicator */}
      <View style={[styles.indicator, { left: `${barPercent}%` }]}>
        <View style={styles.indicatorDot} />
      </View>

      <View style={styles.labelsRow}>
        <Text style={styles.labelText}>15</Text>
        <Text style={styles.labelText}>18.5</Text>
        <Text style={styles.labelText}>25</Text>
        <Text style={styles.labelText}>30</Text>
        <Text style={styles.labelText}>35</Text>
        <Text style={styles.labelText}>40+</Text>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.subtitle,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bmiValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.header,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  badgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.small,
    color: '#FFFFFF',
  },
  barContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barSegment: {
    height: 10,
  },
  indicator: {
    position: 'absolute',
    bottom: 38,
    marginLeft: -6,
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  labelText: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.text.secondary,
  },
});

export default BMICard;
