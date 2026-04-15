import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from './GlassCard';
import { fontFamily, fontSize, spacing, colors, borderRadius } from '../theme';

interface TMBCardProps {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'male' | 'female';
}

function calculateTMB(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return sex === 'male' ? base + 5 : base - 161;
}

const TMBCard: React.FC<TMBCardProps> = ({ weightKg, heightCm, age, sex }) => {
  if (!weightKg || !heightCm || !age) return null;

  const tmb = calculateTMB(weightKg, heightCm, age, sex);

  return (
    <GlassCard style={styles.container}>
      <Text style={styles.title}>Metabolismo Basal</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{Math.round(tmb)}</Text>
        <Text style={styles.unit}>kcal/día</Text>
      </View>
      <Text style={styles.desc}>
        Calorías que tu cuerpo necesita en reposo para mantener funciones vitales.
      </Text>
      <View style={styles.infoRow}>
        <View style={styles.infoPill}>
          <Text style={styles.infoText}>{sex === 'male' ? 'Hombre' : 'Mujer'}</Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoText}>{age} años</Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoText}>{heightCm} cm</Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: spacing.md },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.subtitle, color: colors.text.primary, marginBottom: spacing.sm },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginBottom: spacing.xs },
  value: { fontFamily: fontFamily.bold, fontSize: fontSize.header, color: colors.primary },
  unit: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.secondary },
  desc: { fontFamily: fontFamily.regular, fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  infoPill: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.small, backgroundColor: 'rgba(74,144,217,0.1)',
  },
  infoText: { fontFamily: fontFamily.regular, fontSize: fontSize.small, color: colors.primary },
});

export default TMBCard;
