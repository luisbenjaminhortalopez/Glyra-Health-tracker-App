import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, ActivityIndicator,
  TouchableOpacity, Platform, Switch, RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '../components/DateTimePicker';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import GlassModal from '../components/GlassModal';
import WeekDayChips from '../components/WeekDayChips';
import { useMedications } from '../hooks/useMedications';
import { requestPermissions, configureNotifications } from '../services/notifications';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';
import {
  MEDICATION_TYPES, MedicationType, MEDICATION_FREQUENCIES,
  MedicationFrequency, MedicationInput,
} from '../types';

const MED_ICONS: Record<MedicationType, string> = {
  Pastilla: 'pill', Inyección: 'needle', Jarabe: 'bottle-tonic',
  Gotas: 'eyedropper', Otro: 'medical-bag',
};

const getNow = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const emptyDays = (): Record<string, boolean> => ({
  monday: false, tuesday: false, wednesday: false, thursday: false,
  friday: false, saturday: false, sunday: false,
});

const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyForm = () => ({
  name: '', type: 'Pastilla' as MedicationType,
  frequency: 'each_8h' as MedicationFrequency,
  startTime: getNow(), endDate: '' as string, days: emptyDays(),
});

const MedicationsScreen: React.FC<{ navigation?: any }> = () => {
  const { records, loading, fetchRecords, fetchById, createRecord, updateRecord, deleteRecord, toggleActive } = useMedications();
  const [registerVisible, setRegisterVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [activePicker, setActivePicker] = useState<'time' | 'endDate' | null>(null);
  const [typeDropdown, setTypeDropdown] = useState(false);
  const [freqDropdown, setFreqDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    configureNotifications();
    requestPermissions();
    fetchRecords();
  }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchRecords(); setRefreshing(false); }, [fetchRecords]);

  const openRegister = () => { setForm(emptyForm()); setRegisterVisible(true); };

  const handleMedPress = (med: any) => {
    const record = fetchById(med.id);
    if (record) {
      setEditId(record.id);
      setForm({
        name: record.name, type: record.type, frequency: record.frequency,
        startTime: record.startTime, endDate: record.endDate ?? '', days: { ...record.days },
      });
      setEditVisible(true);
    }
  };

  const buildInput = (): MedicationInput | null => {
    if (!form.name.trim()) return null;
    const freq = MEDICATION_FREQUENCIES.find(f => f.value === form.frequency);
    return {
      name: form.name.trim(), type: form.type, frequency: form.frequency,
      frequencyHours: freq?.hours ?? 24, startTime: form.startTime,
      endDate: form.endDate || undefined, days: form.days,
    };
  };

  const handleCreate = async () => {
    const input = buildInput();
    if (!input) return;
    await createRecord(input);
    setRegisterVisible(false);
    fetchRecords();
  };

  const handleUpdate = async () => {
    if (editId == null) return;
    const input = buildInput();
    if (!input) return;
    await updateRecord(editId, input);
    setEditVisible(false); setEditId(null);
    fetchRecords();
  };

  const handleDelete = async () => {
    if (editId == null) return;
    await deleteRecord(editId);
    setEditVisible(false); setEditId(null);
    fetchRecords();
  };

  const handleToggle = async (id: number) => {
    await toggleActive(id);
    fetchRecords();
  };

  const closeDropdowns = () => { setTypeDropdown(false); setFreqDropdown(false); setActivePicker(null); };

  const renderFormFields = () => (
    <View>
      <Text style={styles.fieldLabel}>Nombre del medicamento</Text>
      <TextInput style={styles.input} value={form.name}
        onChangeText={(v) => setForm({ ...form, name: v })}
        placeholder="Ej: Metformina" placeholderTextColor={colors.text.secondary}
        onFocus={closeDropdowns} />

      <Text style={styles.fieldLabel}>Tipo</Text>
      <TouchableOpacity style={styles.dropdown}
        onPress={() => { setTypeDropdown(!typeDropdown); setFreqDropdown(false); setActivePicker(null); }}>
        <View style={styles.dropdownSelected}>
          <MaterialCommunityIcons name={MED_ICONS[form.type] as any} size={18} color={colors.primary} />
          <Text style={styles.dropdownText}>{form.type}</Text>
        </View>
        <Ionicons name={typeDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.secondary} />
      </TouchableOpacity>
      {typeDropdown && (
        <View style={styles.dropdownList}>
          {MEDICATION_TYPES.map(t => (
            <TouchableOpacity key={t} style={[styles.dropdownItem, form.type === t && styles.dropdownItemActive]}
              onPress={() => { setForm({ ...form, type: t }); setTypeDropdown(false); }}>
              <MaterialCommunityIcons name={MED_ICONS[t] as any} size={18}
                color={form.type === t ? colors.primary : colors.text.secondary} />
              <Text style={[styles.dropdownItemText, form.type === t && styles.dropdownItemTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.fieldLabel}>Frecuencia</Text>
      <TouchableOpacity style={styles.dropdown}
        onPress={() => { setFreqDropdown(!freqDropdown); setTypeDropdown(false); setActivePicker(null); }}>
        <Text style={styles.dropdownText}>{MEDICATION_FREQUENCIES.find(f => f.value === form.frequency)?.label}</Text>
        <Ionicons name={freqDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.secondary} />
      </TouchableOpacity>
      {freqDropdown && (
        <View style={styles.dropdownList}>
          {MEDICATION_FREQUENCIES.map(f => (
            <TouchableOpacity key={f.value}
              style={[styles.dropdownItem, form.frequency === f.value && styles.dropdownItemActive]}
              onPress={() => { setForm({ ...form, frequency: f.value }); setFreqDropdown(false); }}>
              <Text style={[styles.dropdownItemText, form.frequency === f.value && styles.dropdownItemTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <DateTimePicker label="Hora de inicio" value={form.startTime} mode="time"
        onChange={(v) => { setForm({ ...form, startTime: v }); setActivePicker(null); }}
        isOpen={activePicker === 'time'}
        onOpen={() => { setActivePicker(activePicker === 'time' ? null : 'time'); setTypeDropdown(false); setFreqDropdown(false); }} />

      <Text style={styles.fieldLabel}>Días de la semana</Text>
      <WeekDayChips days={form.days} onToggle={(k) => setForm({ ...form, days: { ...form.days, [k]: !form.days[k] } })} />

      <DateTimePicker
        label="Fin del tratamiento (opcional)"
        value={form.endDate || getToday()}
        mode="date"
        allowFuture
        onChange={(v) => { setForm({ ...form, endDate: v }); setActivePicker(null); }}
        isOpen={activePicker === 'endDate'}
        onOpen={() => { setActivePicker(activePicker === 'endDate' ? null : 'endDate'); setTypeDropdown(false); setFreqDropdown(false); }}
      />
      {form.endDate ? (
        <TouchableOpacity onPress={() => setForm({ ...form, endDate: '' })} style={{ marginTop: 4 }}>
          <Text style={{ fontFamily: fontFamily.regular, fontSize: fontSize.small, color: colors.primary }}>Quitar fecha de fin</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="pill" size={28} color={colors.primary} />
        <Text style={styles.title}>Medicamentos</Text>
      </View>

      <GlassButton title="Agregar medicamento" onPress={openRegister}
        style={styles.registerButton} variant="gradient" />

      {loading && <ActivityIndicator size="large" color={colors.primary} />}

      {records.map(med => (
        <TouchableOpacity key={med.id} onPress={() => handleMedPress(med)} activeOpacity={0.7}>
          <GlassCard style={styles.medCard}>
            <View style={styles.medRow}>
              <MaterialCommunityIcons name={MED_ICONS[med.type] as any} size={28} color={colors.primary} />
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDetail}>
                  {med.type} · {MEDICATION_FREQUENCIES.find(f => f.value === med.frequency)?.label}
                </Text>
                <Text style={styles.medDetail}>Inicio: {med.startTime}</Text>
                <Text style={styles.medDetail}>Hasta: {med.endDate ?? 'Indefinido'}</Text>
              </View>
              <Switch value={med.active} onValueChange={() => handleToggle(med.id)}
                trackColor={{ false: colors.text.secondary, true: colors.primary }}
                thumbColor={colors.surface} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}

      <GlassModal visible={registerVisible} onClose={() => setRegisterVisible(false)} title="Agregar medicamento">
        {renderFormFields()}
        <GlassButton title="Guardar" onPress={handleCreate} style={styles.modalButton}
          disabled={!form.name.trim()} variant="gradient" />
      </GlassModal>

      <GlassModal visible={editVisible} onClose={() => { setEditVisible(false); setEditId(null); }} title="Editar medicamento">
        {renderFormFields()}
        <View style={styles.editActions}>
          <GlassButton title="Guardar cambios" onPress={handleUpdate} style={styles.modalButton}
            disabled={!form.name.trim()} variant="gradient" />
          <GlassButton title="Eliminar" onPress={handleDelete} style={styles.deleteButton} variant="danger" />
        </View>
      </GlassModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: spacing.lg, paddingTop: Platform.OS === 'android' ? spacing.lg + 44 : spacing.lg + 80, paddingBottom: spacing.xl * 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.header, color: colors.text.primary },
  registerButton: { marginBottom: spacing.md },
  medCard: { marginBottom: spacing.sm },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  medInfo: { flex: 1 },
  medName: { fontFamily: fontFamily.bold, fontSize: fontSize.subtitle, color: colors.text.primary },
  medDetail: { fontFamily: fontFamily.regular, fontSize: fontSize.small, color: colors.text.secondary },
  fieldLabel: { fontFamily: fontFamily.bold, fontSize: fontSize.body, color: colors.text.primary, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.primary,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: borderRadius.small, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
  },
  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: borderRadius.small, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 2,
  },
  dropdownSelected: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dropdownText: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.primary },
  dropdownList: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: borderRadius.small, marginTop: spacing.xs,
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
    }),
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  dropdownItemActive: { backgroundColor: 'rgba(74,144,217,0.1)' },
  dropdownItemText: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.primary },
  dropdownItemTextActive: { fontFamily: fontFamily.bold, color: colors.primary },
  modalButton: { marginTop: spacing.md },
  editActions: { marginTop: spacing.md, gap: spacing.sm },
  deleteButton: { backgroundColor: colors.error },
});

export default MedicationsScreen;
