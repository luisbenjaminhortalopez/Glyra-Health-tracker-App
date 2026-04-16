import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerNative, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import { useUser } from '../hooks/useUser';
import { useAuth } from '../hooks/useAuth';
import { getDatabase } from '../db/database';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';

type Sex = 'male' | 'female';

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { getUser, saveUser } = useUser();
  const { signOut } = useAuth();
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [sex, setSex] = useState<Sex | null>(null);
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setName(user.name ?? '');
      setHeight(user.heightCm ? String(user.heightCm) : '');
      if (user.birthdate) setBirthdate(new Date(user.birthdate));
      if (user.sex) setSex(user.sex);
    }
    try {
      const db = getDatabase();
      const row = db.getFirstSync<{ weight_kg: number }>(
        'SELECT weight_kg FROM weight_records ORDER BY date DESC, created_at DESC LIMIT 1'
      );
      if (row) setLastWeight(row.weight_kg);
    } catch {}
  }, []);

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setBirthdate(selected);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 50) return;
    const h = parseFloat(height) || undefined;
    const bd = birthdate ? formatDate(birthdate) : undefined;
    const success = saveUser(trimmed, undefined, h, bd, sex ?? undefined);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Ionicons name="settings-outline" size={28} color={colors.primary} />
        <Text style={styles.title}>Configuración</Text>
      </View>

      <GlassCard style={styles.section}>
        <Text style={styles.fieldLabel}>Nombre</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName}
          placeholder="Tu nombre" placeholderTextColor={colors.text.secondary} maxLength={50} />

        <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
        {Platform.OS === 'ios' ? (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
            <DateTimePickerNative value={birthdate ?? new Date(2000, 0, 1)} mode="date"
              display="compact" onChange={handleDateChange} maximumDate={new Date()}
              style={styles.iosDatePicker} accentColor={colors.primary} />
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.primary }}>
                {birthdate ? formatDate(birthdate) : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePickerNative value={birthdate ?? new Date(2000, 0, 1)} mode="date"
                display="calendar" onChange={handleDateChange} maximumDate={new Date()} />
            )}
          </>
        )}

        <Text style={styles.fieldLabel}>Sexo</Text>
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyText}>
            {sex === 'male' ? 'Hombre' : sex === 'female' ? 'Mujer' : 'No registrado'}
          </Text>
        </View>

        <Text style={styles.fieldLabel}>Estatura (cm)</Text>
        <TextInput style={styles.input} value={height} onChangeText={setHeight}
          placeholder="Ej: 170" placeholderTextColor={colors.text.secondary} keyboardType="numeric" />

        <Text style={styles.fieldLabel}>Último peso registrado</Text>
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyText}>{lastWeight != null ? `${lastWeight} kg` : 'Sin registros'}</Text>
        </View>

        <GlassButton title={saved ? '✓ Guardado' : 'Guardar cambios'} onPress={handleSave}
          style={styles.saveButton} variant="gradient" disabled={!name.trim()} />
      </GlassCard>

      <GlassButton title="Cerrar sesión" onPress={signOut}
        style={styles.logoutButton} variant="default" />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Benjamin Horta © 2026</Text>
        <Text style={styles.footerVersion}>Glyra Health  V 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: Platform.OS === 'android' ? spacing.lg + 60 : spacing.lg + 80, paddingBottom: spacing.xl * 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.header, color: colors.text.primary },
  section: { marginBottom: spacing.lg },
  fieldLabel: { fontFamily: fontFamily.bold, fontSize: fontSize.body, color: colors.text.primary, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.primary,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: borderRadius.small, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iosDatePicker: { height: 36, backgroundColor: 'transparent' },
  sexRow: { flexDirection: 'row', gap: spacing.sm },
  sexOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 2, borderRadius: borderRadius.small,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB',
  },
  sexActive: { backgroundColor: 'rgba(74,144,217,0.1)', borderColor: colors.primary },
  sexText: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.secondary },
  sexTextActive: { fontFamily: fontFamily.bold, color: colors.primary },
  readonlyField: {
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: borderRadius.small, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 2,
  },
  readonlyText: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.secondary },
  saveButton: { marginTop: spacing.lg },
  logoutButton: { marginTop: spacing.md },
  footer: { marginTop: spacing.xl * 2, alignItems: 'center' },
  footerText: { fontFamily: fontFamily.regular, fontSize: fontSize.small, color: colors.text.secondary },
  footerVersion: { fontFamily: fontFamily.regular, fontSize: fontSize.small, color: colors.text.secondary, marginTop: spacing.xs },
});

export default SettingsScreen;
