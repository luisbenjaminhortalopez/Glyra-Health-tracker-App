import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '../components/DateTimePicker';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import GlassModal from '../components/GlassModal';
import RecordTable, { ColumnDef } from '../components/RecordTable';
import SimpleChart from '../components/SimpleChart';
import { useExerciseRecords } from '../hooks/useExerciseRecords';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';
import { EXERCISE_TYPES, ExerciseType, ExerciseInput } from '../types';

const EXERCISE_ICONS: Record<ExerciseType, string> = {
  Caminata: 'walk',
  Carrera: 'run',
  Bicicleta: 'bike',
  Fuerza: 'dumbbell',
  Estiramientos: 'yoga',
};

function ExerciseIcon({ type, size, color }: { type: ExerciseType; size: number; color: string }) {
  return <MaterialCommunityIcons name={EXERCISE_ICONS[type] as any} size={size} color={color} />;
}

const columns: ColumnDef[] = [
  { key: 'date', label: 'Fecha', width: 100 },
  {
    key: 'exerciseType',
    label: 'Tipo',
    width: 60,
    renderCell: (value) => <ExerciseIcon type={value as ExerciseType} size={20} color={colors.primary} />,
  },
  { key: 'duration', label: 'Tiempo (min)' },
];

const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getCurrentMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[(m || 1) - 1]} ${y}`;
}

const emptyForm = () => ({
  date: getToday(),
  exerciseType: 'Caminata' as ExerciseType,
  durationMinutes: '',
});

const ExerciseScreen: React.FC<{ navigation?: any }> = () => {
  const {
    records, loading, fetchRecords, fetchById,
    createRecord, updateRecord, deleteRecord, getDailyTotals,
  } = useExerciseRecords();

  const [registerVisible, setRegisterVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [activePicker, setActivePicker] = useState<'date' | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());

  useEffect(() => { fetchRecords(); }, []);

  const refreshAll = useCallback(() => { fetchRecords(); }, [fetchRecords]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const navigateMonth = (delta: number) => {
    const [y, m] = monthFilter.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonthFilter(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const openRegister = () => {
    setForm(emptyForm());
    setDropdownOpen(false);
    setRegisterVisible(true);
  };

  const handleRowPress = (row: Record<string, unknown>) => {
    const id = row.id as number;
    const record = fetchById(id);
    if (record) {
      setEditId(record.id);
      setForm({
        date: record.date,
        exerciseType: record.exerciseType,
        durationMinutes: String(record.durationMinutes),
      });
      setDropdownOpen(false);
      setEditVisible(true);
    }
  };

  const buildInput = (): ExerciseInput | null => {
    const dur = parseFloat(form.durationMinutes);
    if (isNaN(dur) || dur <= 0) return null;
    return { date: form.date, exerciseType: form.exerciseType, durationMinutes: dur };
  };

  const handleCreate = () => {
    const input = buildInput();
    if (!input) return;
    createRecord(input);
    setRegisterVisible(false);
    refreshAll();
  };

  const handleUpdate = () => {
    if (editId == null) return;
    const input = buildInput();
    if (!input) return;
    updateRecord(editId, input);
    setEditVisible(false);
    setEditId(null);
    refreshAll();
  };

  const handleDelete = () => {
    if (editId == null) return;
    deleteRecord(editId);
    setEditVisible(false);
    setEditId(null);
    refreshAll();
  };

  const tableData = records.filter((r) => r.date.startsWith(monthFilter)).map((r) => ({
    id: r.id,
    date: r.date,
    exerciseType: r.exerciseType,
    duration: `${r.durationMinutes}`,
  }));

  const filteredForChart = records.filter((r) => r.date.startsWith(monthFilter));
  const dailyTotals = getDailyTotals(60).filter((d) => d.date.startsWith(monthFilter));
  const chartData = dailyTotals.map((d) => d.total);
  const chartLabels = dailyTotals.map((d) => d.date.slice(5));

  const renderDropdown = () => (
    <View>
      <Text style={styles.fieldLabel}>Tipo de ejercicio</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => { setDropdownOpen(!dropdownOpen); setActivePicker(null); }}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownSelected}>
          <ExerciseIcon type={form.exerciseType} size={18} color={colors.primary} />
          <Text style={styles.dropdownText}>{form.exerciseType}</Text>
        </View>
        <Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.secondary} />
      </TouchableOpacity>
      {dropdownOpen && (
        <View style={styles.dropdownList}>
          {EXERCISE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.dropdownItem, form.exerciseType === type && styles.dropdownItemActive]}
              onPress={() => { setForm({ ...form, exerciseType: type }); setDropdownOpen(false); }}
            >
              <ExerciseIcon type={type} size={18} color={form.exerciseType === type ? colors.primary : colors.text.secondary} />
              <Text style={[styles.dropdownItemText, form.exerciseType === type && styles.dropdownItemTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderFormFields = () => (
    <View>
      <DateTimePicker
        label="Fecha"
        value={form.date}
        mode="date"
        onChange={(v) => { setForm({ ...form, date: v }); setActivePicker(null); }}
        isOpen={activePicker === 'date'}
        onOpen={() => { setActivePicker(activePicker === 'date' ? null : 'date'); setDropdownOpen(false); }}
      />
      {renderDropdown()}
      <Text style={styles.fieldLabel}>Duración (minutos)</Text>
      <TextInput
        style={styles.input}
        value={form.durationMinutes}
        onChangeText={(v) => setForm({ ...form, durationMinutes: v })}
        placeholder="Ej: 30"
        placeholderTextColor={colors.text.secondary}
        keyboardType="numeric"
        onFocus={() => { setDropdownOpen(false); setActivePicker(null); }}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <View style={styles.titleRow}>
        <Ionicons name="barbell" size={28} color={colors.primary} />
        <Text style={styles.title}>Ejercicio</Text>
      </View>

      <GlassButton
        title="Registrar ejercicio"
        onPress={openRegister}
        style={styles.registerButton}
        variant="gradient"
      />

      {loading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

      {/* Month filter */}
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Período</Text>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthLabel(monthFilter)}</Text>
          <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Registros</Text>
        <RecordTable columns={columns} data={tableData} onRowPress={handleRowPress} />
      </GlassCard>

      {chartData.length > 0 && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad diaria</Text>
          <SimpleChart data={chartData} labels={chartLabels} />
        </GlassCard>
      )}

      <GlassModal visible={registerVisible} onClose={() => setRegisterVisible(false)} title="Registrar ejercicio">
        {renderFormFields()}
        <GlassButton title="Guardar" onPress={handleCreate} style={styles.modalButton} disabled={!form.durationMinutes} variant="gradient" />
      </GlassModal>

      <GlassModal visible={editVisible} onClose={() => { setEditVisible(false); setEditId(null); }} title="Editar registro">
        {renderFormFields()}
        <View style={styles.editActions}>
          <GlassButton title="Guardar cambios" onPress={handleUpdate} style={styles.modalButton} disabled={!form.durationMinutes} variant="gradient" />
          <GlassButton title="Eliminar" onPress={handleDelete} style={styles.deleteButton} variant="danger" />
        </View>
      </GlassModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.header, color: colors.text.primary },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  registerButton: { marginBottom: spacing.md },
  loader: { marginVertical: spacing.md },
  section: { marginTop: spacing.md },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.subtitle, color: colors.text.primary, marginBottom: spacing.sm },
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
  dropdownText: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.primary },
  dropdownSelected: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dropdownList: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: borderRadius.small, marginTop: spacing.xs,
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
    }),
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  dropdownItemActive: { backgroundColor: 'rgba(74, 144, 217, 0.1)' },
  dropdownItemText: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text.primary },
  dropdownItemTextActive: { fontFamily: fontFamily.bold, color: colors.primary },
  modalButton: { marginTop: spacing.md },
  editActions: { marginTop: spacing.md, gap: spacing.sm },
  deleteButton: { backgroundColor: colors.error },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthArrow: { padding: spacing.sm },
  monthLabel: { fontFamily: fontFamily.bold, fontSize: fontSize.subtitle, color: colors.text.primary },
});

export default ExerciseScreen;
