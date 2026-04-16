import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '../components/DateTimePicker';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import GlassModal from '../components/GlassModal';
import RecordTable, { ColumnDef } from '../components/RecordTable';
import SimpleChart from '../components/SimpleChart';
import BMICard from '../components/BMICard';
import TMBCard from '../components/TMBCard';
import { useWeight } from '../hooks/useWeight';
import { useUser, UserConfig } from '../hooks/useUser';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';
import type { WeightInput } from '../types';

const columns: ColumnDef[] = [
  { key: 'date', label: 'Fecha', width: 100 },
  { key: 'weightKg', label: 'Peso (kg)', width: 90 },
  { key: 'comments', label: 'Comentarios' },
];

const getToday = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
  weightKg: '',
  comments: '',
});

const WeightScreen: React.FC<{ navigation?: any }> = () => {
  const {
    records,
    loading,
    fetchRecords,
    fetchById,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useWeight();

  const { getUser } = useUser();
  const [userData, setUserData] = useState<UserConfig | null>(null);

  const [registerVisible, setRegisterVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [activePicker, setActivePicker] = useState<'date' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());

  // Load data on mount
  useEffect(() => {
    fetchRecords();
    const u = getUser();
    if (u) setUserData(u);
  }, []);

  const refreshAll = useCallback(() => {
    fetchRecords();
  }, [fetchRecords]);

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

  // Open register modal
  const openRegister = () => {
    setForm(emptyForm());
    setFormError(null);
    setRegisterVisible(true);
  };

  // Handle row press → fetch by ID and open edit modal
  const handleRowPress = (row: Record<string, unknown>) => {
    const id = row.id as number;
    const record = fetchById(id);
    if (record) {
      setEditId(record.id);
      setForm({
        date: record.date,
        weightKg: String(record.weightKg),
        comments: record.comments ?? '',
      });
      setEditVisible(true);
    }
  };

  // Build input from form state (max 300 kg)
  const buildInput = (): WeightInput | null => {
    const weightKg = parseFloat(form.weightKg);
    if (isNaN(weightKg) || weightKg <= 0) {
      setFormError('Ingresa un peso válido');
      return null;
    }
    if (weightKg > 300) {
      setFormError('El peso máximo es 300 kg');
      return null;
    }
    setFormError(null);
    const input: WeightInput = {
      date: form.date,
      weightKg,
    };
    if (form.comments.trim()) {
      input.comments = form.comments.trim();
    }
    return input;
  };

  // Submit new record
  const handleCreate = () => {
    const input = buildInput();
    if (!input) return;
    createRecord(input);
    setRegisterVisible(false);
    refreshAll();
  };

  // Submit edit
  const handleUpdate = () => {
    if (editId == null) return;
    const input = buildInput();
    if (!input) return;
    updateRecord(editId, input);
    setEditVisible(false);
    setEditId(null);
    refreshAll();
  };

  // Delete record
  const handleDelete = () => {
    if (editId == null) return;
    deleteRecord(editId);
    setEditVisible(false);
    setEditId(null);
    refreshAll();
  };

  const hasSelectedDays = false; // Exercise moved to separate screen

  // Filter records by month
  const filteredRecords = records.filter((r) => r.date.startsWith(monthFilter));

  // Prepare table data
  const tableData = filteredRecords.map((r) => {
    const raw = r.comments ?? '';
    return {
      id: r.id,
      date: `${r.date.slice(8,10)}-${r.date.slice(5,7)}-${r.date.slice(2,4)}`,
      weightKg: `${r.weightKg}`,
      comments: raw.length > 20 ? raw.slice(0, 20) + '…' : raw,
    };
  });

  // Chart data
  const chartData = filteredRecords.map((r) => r.weightKg);
  const rawWeightLabels = filteredRecords.map((r) => r.date.slice(8));
  const chartLabels = chartData.length > 10
    ? rawWeightLabels.map((l, i) => i % 3 === 0 ? l : '')
    : rawWeightLabels;

  // Form fields renderer
  const renderFormFields = () => (
    <View>
      <DateTimePicker
        label="Fecha"
        value={form.date}
        mode="date"
        onChange={(v) => { setForm({ ...form, date: v }); setActivePicker(null); }}
        isOpen={activePicker === 'date'}
        onOpen={() => setActivePicker(activePicker === 'date' ? null : 'date')}
      />

      <Text style={styles.fieldLabel}>Peso (kg)</Text>
      <TextInput
        style={styles.input}
        value={form.weightKg}
        onChangeText={(v) => setForm({ ...form, weightKg: v })}
        placeholder="Ej: 72.5"
        placeholderTextColor={colors.text.secondary}
        keyboardType="numeric"
      />

      <Text style={styles.fieldLabel}>Comentarios (opcional)</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={form.comments}
        onChangeText={(v) => setForm({ ...form, comments: v })}
        placeholder="Notas adicionales..."
        placeholderTextColor={colors.text.secondary}
        multiline
        scrollEnabled={false}
      />
      {formError && <Text style={styles.errorText}>{formError}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <View style={styles.titleRow}>
        <Ionicons name="fitness" size={28} color={colors.primary} />
        <Text style={styles.title}>Peso</Text>
      </View>

      {/* Register button */}
      <GlassButton
        title="Registrar peso"
        onPress={openRegister}
        style={styles.registerButton}
        variant="gradient"
      />

      {/* Loading indicator */}
      {loading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

      {/* Month filter */}
      <GlassCard style={styles.section}>
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

      {/* Records table */}
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Registros</Text>
        <RecordTable columns={columns} data={tableData} onRowPress={handleRowPress} />
      </GlassCard>

      {/* BMI */}
      {filteredRecords.length > 0 && userData?.heightCm && (
        <BMICard weightKg={filteredRecords[0].weightKg} heightCm={userData.heightCm} />
      )}

      {/* TMB */}
      {filteredRecords.length > 0 && userData?.heightCm && userData?.sex && userData?.birthdate && (
        <TMBCard
          weightKg={filteredRecords[0].weightKg}
          heightCm={userData.heightCm}
          age={Math.floor((Date.now() - new Date(userData.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
          sex={userData.sex}
        />
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Tendencia de peso</Text>
          <SimpleChart data={chartData} labels={chartLabels} />
        </GlassCard>
      )}

      {/* Register Modal */}
      <GlassModal
        visible={registerVisible}
        onClose={() => setRegisterVisible(false)}
        title="Registrar peso"
      >
        {renderFormFields()}
        <GlassButton
          title="Guardar"
          onPress={handleCreate}
          style={styles.modalButton}
          disabled={!form.weightKg}
          variant="gradient"
        />
      </GlassModal>

      {/* Edit Modal */}
      <GlassModal
        visible={editVisible}
        onClose={() => { setEditVisible(false); setEditId(null); }}
        title="Editar registro"
      >
        {renderFormFields()}
        <View style={styles.editActions}>
          <GlassButton
            title="Guardar cambios"
            onPress={handleUpdate}
            style={styles.modalButton}
            disabled={!form.weightKg}
            variant="gradient"
          />
          <GlassButton
            title="Eliminar"
            onPress={handleDelete}
            style={styles.deleteButton}
            variant="danger"
          />
        </View>
      </GlassModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.lg + 44 : spacing.lg + 80,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.header,
    color: colors.text.primary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  registerButton: {
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.md,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.subtitle,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.text.primary,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 60,
    maxHeight: 200,
  },
  avgMinutesContainer: {
    marginTop: spacing.sm,
  },  modalButton: {
    marginTop: spacing.md,
  },
  editActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    color: colors.error,
    marginTop: spacing.xs,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthArrow: {
    padding: spacing.sm,
  },
  monthLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.subtitle,
    color: colors.text.primary,
  },
});

export default WeightScreen;
