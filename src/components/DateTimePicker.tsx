import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePickerNative, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { fontFamily, fontSize, spacing, borderRadius, colors } from '../theme';

interface DateTimePickerProps {
  label: string;
  value: string;
  mode: 'date' | 'time';
  onChange: (value: string) => void;
  isOpen?: boolean;
  onOpen?: () => void;
  allowFuture?: boolean;
}

function parseDate(str: string): Date {
  if (!str || str.length < 8) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d || y < 1970) return new Date();
  return new Date(y, m - 1, d);
}

function parseTime(str: string): Date {
  const d = new Date();
  if (!str || !str.includes(':')) return d;
  const h = parseInt(str.split(':')[0], 10);
  const m = parseInt(str.split(':')[1], 10);
  if (isNaN(h) || isNaN(m)) return d;
  d.setHours(h, m, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ label, value, mode, onChange, isOpen, onOpen, allowFuture }) => {
  const currentValue = mode === 'date' ? parseDate(value) : parseTime(value);
  const show = isOpen ?? false;
  const maxDate = mode === 'date' && !allowFuture ? new Date() : undefined;

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android' && show) {
      onOpen?.();
    }
    if (selected) {
      onChange(mode === 'date' ? formatDate(selected) : formatTime(selected));
    }
  };

  if (Platform.OS === 'ios') {
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.iosRow}>
          <Ionicons
            name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
            size={18}
            color={colors.text.secondary}
            style={styles.icon}
          />
          <DateTimePickerNative
            value={currentValue}
            mode={mode}
            display="compact"
            onChange={handleChange}
            maximumDate={maxDate}
            style={styles.iosCompactPicker}
            accentColor={colors.primary}
          />
        </View>
      </View>
    );
  }

  // Android
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => onOpen?.()} activeOpacity={0.7}>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={colors.text.secondary} style={styles.icon} />
        <Text style={styles.fieldText}>{value || (mode === 'date' ? formatDate(new Date()) : formatTime(new Date()))}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePickerNative
          value={currentValue}
          mode={mode}
          is24Hour
          display={mode === 'date' ? 'calendar' : 'clock'}
          onChange={handleChange}
          maximumDate={maxDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  icon: {
    marginRight: spacing.sm,
  },
  fieldText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.text.primary,
  },
  iosRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iosCompactPicker: {
    height: 40,
    minWidth: 80,
  },
});

export default DateTimePicker;
