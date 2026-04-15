import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '../components/DateTimePicker';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import GlassModal from '../components/GlassModal';
import RecordTable, { ColumnDef } from '../components/RecordTable';
import MetricCard from '../components/MetricCard';
import SimpleChart from '../components/SimpleChart';
import { useBloodPressure } from '../hooks/useBloodPressure';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';
import type { BloodPressureInput } from '../types';

const columns: ColumnDef[] = [
  { key: 'date', label: 'Fecha', width: 100 },
  { key: 'bp', label: 'Sistólica/Diastólica', width: 120 },
  { key: 'pulse', label: 'Pulso' },
];

const getToday = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getNow = (): string => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
};

const getCurrentMonth = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[(m || 1) - 1]} ${y}`;
}

const emptyForm = () => ({
  date: getToday(),
  time: getNow(),
  systolic: '',
  diastolic: '',
  pulse: '',
});

const BloodPressureScreen: React.FC<{ navigation?: any }> = () => {
  const {
    records,
    metrics,
    loading,
    fetchRecords,
    fetchById,
    createRecord,
    updateRecord,
    deleteRecord,
    fetchMetrics,
  } = useBloodPressure();

  const [registerVisible, setRegisterVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());

  // Load data on mount
  useEffect(() => {
    fetchRecords();
    fetchMetrics(monthFilter);
  }, []);

  // Refresh all data
  const refreshAll = useCallback(() => {
    fetchRecords();
    fetchMetrics(monthFilter);
  }, [fetchRecords, fetchMetrics, monthFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  // Refresh metrics when month filter changes
  const handleMonthChange = (month: string) => {
    setMonthFilter(month);
    fetchMetrics(month);
  };

  const navigateMonth = (delta: number) => {
    const [y, m] = monthFilter.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    handleMonthChange(newMonth);
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
        time: record.time,
        systolic: String(record.systolic),
        diastolic: String(record.diastolic),
        pulse: String(record.pulse),
      });
      setEditVisible(true);
    }
  };

  // Build input from form state
  const buildInput = (): BloodPressureInput | null => {
    const systolic = parseInt(form.systolic, 10);
    const diastolic = parseInt(form.diastolic, 10);
    const pulse = parseInt(form.pulse, 10);
    if (isNaN(systolic) || isNaN(diastolic) || isNaN(pulse)) {
      setFormError('Completa todos los campos');
      return null;
    }
    if (systolic <= 0 || diastolic <= 0 || pulse <= 0) {
      setFormError('Los valores deben ser mayores a 0');
      return null;
    }
    if (systolic > 250) { setFormError('Sistólica máxima: 250 mmHg'); return null; }
    if (diastolic > 150) { setFormError('Diastólica máxima: 150 mmHg'); return null; }
    if (pulse > 220) { setFormError('Pulso máximo: 220 bpm'); return null; }
    setFormError(null);
    return { date: form.date, time: form.time, systolic, diastolic, pulse };
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

  // Filter records by month
  const filteredRecords = records.filter((r) => r.date.startsWith(monthFilter));

  // Prepare table data
  const tableData = filteredRecords.map((r) => ({
    id: r.id,
    date: r.date,
    bp: `${r.systolic}/${r.diastolic}`,
    pulse: `${r.pulse} bpm`,
  }));

  // Chart data (systolic trend)
  const chartData = filteredRecords.map((r) => r.systolic);
  const chartLabels = filteredRecords.map((r) => r.date.slice(5)); // MM-DD

  const isFormValid = form.systolic && form.diastolic && form.pulse;

  // Form fields renderer (shared between register and edit modals)
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

      <DateTimePicker
        label="Hora"
        value={form.time}
        mode="time"
        onChange={(v) => { setForm({ ...form, time: v }); setActivePicker(null); }}
        isOpen={activePicker === 'time'}
        onOpen={() => setActivePicker(activePicker === 'time' ? null : 'time')}
      />

      <Text style={styles.fieldLabel}>Sistólica (mmHg)</Text>
      <TextInput
        style={styles.input}
        value={form.systolic}
        onChangeText={(v) => setForm({ ...form, systolic: v.replace(/[^0-9]/g, '') })}
        placeholder="Ej: 120"
        placeholderTextColor={colors.text.secondary}
        keyboardType="numeric"
      />

      <Text style={styles.fieldLabel}>Diastólica (mmHg)</Text>
      <TextInput
        style={styles.input}
        value={form.diastolic}
        onChangeText={(v) => setForm({ ...form, diastolic: v.replace(/[^0-9]/g, '') })}
        placeholder="Ej: 80"
        placeholderTextColor={colors.text.secondary}
        keyboardType="numeric"
      />

      <Text style={styles.fieldLabel}>Pulso (bpm)</Text>
      <TextInput
        style={styles.input}
        value={form.pulse}
        onChangeText={(v) => setForm({ ...form, pulse: v.replace(/[^0-9]/g, '') })}
        placeholder="Ej: 72"
        placeholderTextColor={colors.text.secondary}
        keyboardType="numeric"
      />
      {formError && <Text style={styles.errorText}>{formError}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="heart-pulse" size={28} color={colors.primary} />
        <Text style={styles.title}>Presión Arterial</Text>
      </View>

      {/* Register button */}
      <GlassButton
        title="Registrar presión arterial"
        onPress={openRegister}
        style={styles.registerButton}
        variant="gradient"
      />

      {/* Loading indicator */}
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

      {/* Records table */}
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Registros</Text>
        <RecordTable columns={columns} data={tableData} onRowPress={handleRowPress} />
      </GlassCard>

      {/* Metrics */}
      {metrics && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas mensuales</Text>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Prom. Sistólica"
              value={metrics.avgSystolic.toFixed(0)}
              unit="mmHg"
            />
            <MetricCard
              label="Prom. Diastólica"
              value={metrics.avgDiastolic.toFixed(0)}
              unit="mmHg"
            />
            <MetricCard
              label="Prom. Pulso"
              value={metrics.avgPulse.toFixed(0)}
              unit="bpm"
            />
          </View>
        </GlassCard>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Tendencia de presión sistólica</Text>
          <SimpleChart data={chartData} labels={chartLabels} />
        </GlassCard>
      )}

      {/* Register Modal */}
      <GlassModal
        visible={registerVisible}
        onClose={() => setRegisterVisible(false)}
        title="Registrar presión arterial"
      >
        {renderFormFields()}
        <GlassButton
          title="Guardar"
          onPress={handleCreate}
          style={styles.modalButton}
          disabled={!isFormValid}
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
            disabled={!isFormValid}
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
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  modalButton: {
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
    textTransform: 'capitalize',
  },
});

export default BloodPressureScreen;
