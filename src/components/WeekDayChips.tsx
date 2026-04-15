import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontFamily, borderRadius, glassmorphism } from '../theme';

interface WeekDayChipsProps {
  days: Record<string, boolean>;
  onToggle: (dayKey: string) => void;
}

const DAY_LABELS: { key: string; label: string }[] = [
  { key: 'monday', label: 'L' },
  { key: 'tuesday', label: 'M' },
  { key: 'wednesday', label: 'X' },
  { key: 'thursday', label: 'J' },
  { key: 'friday', label: 'V' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'D' },
];

const WeekDayChips: React.FC<WeekDayChipsProps> = ({ days, onToggle }) => {
  return (
    <View style={styles.container}>
      {DAY_LABELS.map(({ key, label }) => {
        const selected = !!days[key];
        return (
          <TouchableOpacity
            key={key}
            style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
            onPress={() => onToggle(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipUnselected: {
    ...glassmorphism.button,
  },
  chipText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.text.primary,
  },
  chipTextSelected: {
    color: colors.text.inverse,
  },
});

export default WeekDayChips;
