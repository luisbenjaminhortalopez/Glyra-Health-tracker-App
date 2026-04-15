import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerNative, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import GlassButton from '../components/GlassButton';
import { useUser } from '../hooks/useUser';
import { getDatabase } from '../db/database';
import { syncUserProfile, syncRecord } from '../services/cloudSync';
import { syncFromCloud } from '../services/syncService';
import { spacing, fontSize, fontFamily, borderRadius } from '../theme';

type Sex = 'male' | 'female';

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [sex, setSex] = useState<Sex | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [syncing, setSyncing] = useState(true);
  const { getUser, saveUser, loading } = useUser();

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Check local DB first
      const localUser = getUser();
      if (localUser?.name) {
        if (mounted) navigation.replace('Home');
        return;
      }
      // No local data → try to pull from Firebase (returning user on new device)
      try {
        const synced = await syncFromCloud();
        if (synced && mounted) {
          const cloudUser = getUser();
          if (cloudUser?.name) {
            navigation.replace('Home');
            return;
          }
        }
      } catch {}
      // No data anywhere → show the registration form
      if (mounted) setSyncing(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setBirthdate(selected);
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setErrorMessage('El nombre es obligatorio'); return; }
    if (trimmed.length > 50) { setErrorMessage('Máximo 50 caracteres'); return; }
    setErrorMessage('');
    const w = parseFloat(weight) || undefined;
    const h = parseFloat(height) || undefined;
    const bd = birthdate ? formatDate(birthdate) : undefined;
    const success = saveUser(trimmed, w, h, bd, sex ?? undefined);
    if (success) {
      if (w && w > 0) {
        try {
          const db = getDatabase();
          db.runSync('INSERT INTO weight_records (date, weight_kg, comments) VALUES (?, ?, ?)',
            [formatDate(new Date()), w, 'Registro inicial']);
          syncRecord('weight_records', 'add', { date: formatDate(new Date()), weightKg: w, comments: 'Registro inicial' });
        } catch {}
      }
      syncUserProfile({ name: trimmed, weightKg: w ?? null, heightCm: h ?? null, birthdate: bd ?? null, sex: sex ?? null });
      navigation.replace('Home');
    }
  };

  if (syncing) {
    return (
      <LinearGradient colors={['#0c5d94', '#004c85', '#002f63', '#001544']} style={styles.gradient}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ fontFamily: fontFamily.regular, fontSize: fontSize.body, color: 'rgba(255,255,255,0.7)', marginTop: spacing.md }}>
            Cargando tu información...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0c5d94', '#004c85', '#002f63', '#001544']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.iconCircle}>
            <Ionicons name="pulse" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>Glyra Health</Text>
          <Text style={styles.subtitle}>Tu salud, en tus manos</Text>

          <View style={styles.cardOuter}>
            <BlurView style={StyleSheet.absoluteFill} tint="dark" intensity={40} />
            <View style={styles.cardInner}>
              <Text style={styles.cardTitle}>Comencemos</Text>
              <Text style={styles.cardDesc}>Ingresa tus datos para personalizar tu experiencia</Text>

              <Text style={styles.fieldLabel}>Nombre</Text>
              <TextInput style={styles.input} placeholder="Tu nombre" placeholderTextColor="rgba(255,255,255,0.4)"
                value={name} onChangeText={(t) => { setName(t); if (errorMessage) setErrorMessage(''); }}
                maxLength={50} autoCapitalize="words" />

              <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
              {Platform.OS === 'ios' ? (
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.6)" />
                  <DateTimePickerNative value={birthdate ?? new Date(2000, 0, 1)} mode="date"
                    display="compact" onChange={handleDateChange}
                    maximumDate={new Date()} style={styles.iosDatePicker}
                    accentColor="#FFFFFF" />
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.inputText}>
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
              <View style={styles.sexRow}>
                <TouchableOpacity style={[styles.sexOption, sex === 'male' && styles.sexActive]}
                  onPress={() => setSex('male')}>
                  <Ionicons name="male" size={18} color={sex === 'male' ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
                  <Text style={[styles.sexText, sex === 'male' && styles.sexTextActive]}>Hombre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sexOption, sex === 'female' && styles.sexActive]}
                  onPress={() => setSex('female')}>
                  <Ionicons name="female" size={18} color={sex === 'female' ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
                  <Text style={[styles.sexText, sex === 'female' && styles.sexTextActive]}>Mujer</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Peso (kg)</Text>
              <TextInput style={styles.input} placeholder="Ej: 72.5" placeholderTextColor="rgba(255,255,255,0.4)"
                value={weight} onChangeText={setWeight} keyboardType="numeric" />

              <Text style={styles.fieldLabel}>Estatura (cm)</Text>
              <TextInput style={styles.input} placeholder="Ej: 170" placeholderTextColor="rgba(255,255,255,0.4)"
                value={height} onChangeText={setHeight} keyboardType="numeric" />

              {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}
            </View>
          </View>

          <GlassButton title="Continuar" onPress={handleSubmit} disabled={loading}
            style={styles.button} variant="default" />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl * 2 },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.md,
  },
  appName: { fontFamily: fontFamily.bold, fontSize: 32, color: '#FFFFFF', textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.subtitle, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: spacing.xl },
  cardOuter: { borderRadius: borderRadius.large, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginBottom: spacing.lg },
  cardInner: { padding: spacing.lg },
  cardTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.title, color: '#FFFFFF', marginBottom: spacing.xs },
  cardDesc: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: 'rgba(255,255,255,0.6)', marginBottom: spacing.md },
  fieldLabel: { fontFamily: fontFamily.bold, fontSize: fontSize.body, color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    fontFamily: fontFamily.regular, fontSize: fontSize.body, color: '#FFFFFF',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: borderRadius.small,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  inputText: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: 'rgba(255,255,255,0.7)' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iosDatePicker: { height: 36, backgroundColor: 'transparent' },
  sexRow: { flexDirection: 'row', gap: spacing.sm },
  sexOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 2, borderRadius: borderRadius.small,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  sexActive: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' },
  sexText: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: 'rgba(255,255,255,0.5)' },
  sexTextActive: { fontFamily: fontFamily.bold, color: '#FFFFFF' },
  error: { fontFamily: fontFamily.regular, fontSize: fontSize.small, color: '#FF6B6B', marginTop: spacing.sm },
  button: {
    alignSelf: 'center', minWidth: 220, backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(255,255,255,0.6)', paddingVertical: 14, borderRadius: 16,
  },
});

export default WelcomeScreen;
