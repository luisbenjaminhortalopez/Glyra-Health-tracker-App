import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '../components/DateTimePicker';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';
import GlassModal from '../components/GlassModal';
import RecordTable, { ColumnDef } from '../components/RecordTable';
import MetricCard from '../components/MetricCard';
import AlertBanner from '../components/AlertBanner';
import SimpleChart from '../components/SimpleChart';
import { useGlucose } from '../hooks/useGlucose';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';
import type { GlucoseInput } from '../types';

const columns: ColumnDef[] = [
  { key: 'date', label: 'Fecha', width: 90 },
  { key: 'valor', label: 'mg/dL', width: 50 },
  { key: 'classification', label: 'Clasificación' },
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[(m || 1) - 1]} ${y}`;
}

const emptyForm = () => ({
  date: getToday(),
  time: getNow(),
  hadMeal: false,
  hoursSinceMeal: '',
  valueMgdl: '',
});

const GlucoseScreen: React.FC<{ navigation?: any }> = () => {
  const {
    records,
    metrics,
    alerts,
    loading,
    fetchRecords,
    fetchById,
    createRecord,
    updateRecord,
    deleteRecord,
    fetchMetrics,
    fetchAlerts,
  } = useGlucose();

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
    fetchMetrics();
    fetchAlerts();
  }, []);

  // Refresh metrics and alerts after records change
  const refreshAll = useCallback(() => {
    fetchRecords();
    fetchMetrics();
    fetchAlerts();
  }, [fetchRecords, fetchMetrics, fetchAlerts]);

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
        time: record.time,
        hadMeal: record.hadMeal,
        hoursSinceMeal: record.hoursSinceMeal != null ? String(record.hoursSinceMeal) : '',
        valueMgdl: String(record.valueMgdl),
      });
      setEditVisible(true);
    }
  };

  // Build input from form state (max 600 mg/dL)
  const buildInput = (): GlucoseInput | null => {
    const valueMgdl = parseFloat(form.valueMgdl);
    if (isNaN(valueMgdl) || valueMgdl <= 0) {
      setFormError('Ingresa un valor de glucosa válido');
      return null;
    }
    if (valueMgdl > 600) {
      setFormError('El valor máximo es 600 mg/dL');
      return null;
    }
    setFormError(null);
    const input: GlucoseInput = {
      date: form.date,
      time: form.time,
      hadMeal: form.hadMeal,
      valueMgdl,
    };
    if (form.hadMeal && form.hoursSinceMeal) {
      const hours = parseFloat(form.hoursSinceMeal);
      if (!isNaN(hours)) {
        if (hours > 24) {
          setFormError('Las horas desde la comida no pueden superar 24');
          return null;
        }
        input.hoursSinceMeal = hours;
      }
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

  // Filter records by month
  const filteredRecords = records.filter((r) => r.date.startsWith(monthFilter));

  // Prepare table data
  const tableData = filteredRecords.map((r) => ({
    id: r.id,
    date: `${r.date.slice(8,10)}-${r.date.slice(5,7)}-${r.date.slice(2,4)}`,
    valor: `${Math.round(r.valueMgdl)}`,
    classification: r.classification,
  }));

  // Chart data
  const chartData = filteredRecords.map((r) => r.valueMgdl);
  const rawLabels = filteredRecords.map((r) => r.date.slice(8)); // DD only
  // Show label every 3rd day when more than 10 records
  const chartLabels = chartData.length > 10
    ? rawLabels.map((l, i) => i % 3 === 0 ? l : '')
    : rawLabels;
  // Y axis: default 50-225, expand if data exceeds
  const dataMin = chartData.length > 0 ? Math.min(...chartData) : 50;
  const dataMax = chartData.length > 0 ? Math.max(...chartData) : 225;
  const chartYMin = Math.min(50, dataMin);
  const chartYMax = Math.max(225, dataMax);

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

      <View style={styles.switchRow}>
        <Text style={styles.fieldLabel}>Comida previa</Text>
        <View style={styles.switchShadow}>
          <Switch
            value={form.hadMeal}
            onValueChange={(v) => setForm({ ...form, hadMeal: v })}
            trackColor={{ false: colors.text.secondary, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
        <Text style={styles.switchLabel}>{form.hadMeal ? 'Sí' : 'No'}</Text>
      </View>

      {form.hadMeal && (
        <>
          <Text style={styles.fieldLabel}>Horas desde comida</Text>
          <TextInput
            style={styles.input}
            value={form.hoursSinceMeal}
            onChangeText={(v) => setForm({ ...form, hoursSinceMeal: v })}
            placeholder="Ej: 1.5"
            placeholderTextColor={colors.text.secondary}
            keyboardType="numeric"
          />
        </>
      )}

      <Text style={styles.fieldLabel}>Valor (mg/dL)</Text>
      <TextInput
        style={styles.input}
        value={form.valueMgdl}
        onChangeText={(v) => setForm({ ...form, valueMgdl: v })}
        placeholder="Ej: 100"
        placeholderTextColor={colors.text.secondary}
        keyboardType="numeric"
      />
      {formError && <Text style={styles.errorText}>{formError}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <View style={styles.titleRow}>
        <Ionicons name="water" size={28} color={colors.error} />
        <Text style={styles.title}>Glucosa</Text>
      </View>

      {/* Register button */}
      <GlassButton
        title="Registrar toma de glucosa"
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

      {/* Alerts */}
      {alerts.map((alert, i) => (
        <AlertBanner key={i} message={alert.message} severity={alert.severity} />
      ))}

      {/* Records table */}
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Registros</Text>
        <RecordTable columns={columns} data={tableData} onRowPress={handleRowPress} />
      </GlassCard>

      {/* Metrics */}
      {filteredRecords.length > 0 && (() => {
        const values = filteredRecords.map((r) => r.valueMgdl);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        return (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Métricas del período</Text>
            <View style={styles.metricsRow}>
              <MetricCard label="Promedio" value={avg.toFixed(1)} unit="mg/dL" />
              <MetricCard label="Valor máximo" value={max.toFixed(1)} unit="mg/dL" />
              <MetricCard label="Registros" value={String(filteredRecords.length)} unit="" />
            </View>
          </GlassCard>
        );
      })()}

      {/* Chart */}
      {chartData.length > 0 && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Picos de glucosa</Text>
          <SimpleChart data={chartData} labels={chartLabels} yMin={chartYMin} yMax={chartYMax} />
        </GlassCard>
      )}

      {/* Register Modal */}
      <GlassModal
        visible={registerVisible}
        onClose={() => setRegisterVisible(false)}
        title="Registrar toma de glucosa"
      >
        {renderFormFields()}
        <GlassButton
          title="Guardar"
          onPress={handleCreate}
          style={styles.modalButton}
          disabled={!form.valueMgdl}
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
            disabled={!form.valueMgdl}
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  switchShadow: {
    borderRadius: 16,
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  switchLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.text.primary,
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
  },
});

export default GlucoseScreen;
