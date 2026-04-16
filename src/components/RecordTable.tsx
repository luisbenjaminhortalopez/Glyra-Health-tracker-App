import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';

export interface ColumnDef {
  key: string;
  label: string;
  width?: number;
  isIcon?: boolean;
  renderCell?: (value: unknown) => React.ReactNode;
}

interface RecordTableProps {
  columns: ColumnDef[];
  data: Record<string, unknown>[];
  onRowPress?: (row: Record<string, unknown>) => void;
}

const RecordTable: React.FC<RecordTableProps> = ({ columns, data, onRowPress }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          {columns.map((col) => (
            <View key={col.key} style={[styles.headerCell, col.width ? { flex: 0, width: col.width } : { flex: 0, minWidth: 110 }]}>
              <Text style={styles.headerText} numberOfLines={1}>{col.label}</Text>
            </View>
          ))}
        </View>
        <ScrollView style={styles.body} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {data.map((row, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dataRow, index % 2 === 0 && styles.dataRowEven]}
              onPress={() => onRowPress?.(row)}
              activeOpacity={0.6}
            >
              {columns.map((col) => (
                <View key={col.key} style={[styles.dataCell, col.width ? { flex: 0, width: col.width } : { flex: 0, minWidth: 110 }]}>
                  {col.renderCell ? (
                    col.renderCell(row[col.key])
                  ) : col.isIcon ? (
                    <Ionicons name={String(row[col.key] ?? '') as any} size={20} color={colors.primary} />
                  ) : (
                    <Text style={styles.dataText} numberOfLines={1}>{String(row[col.key] ?? '')}</Text>
                  )}
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 144, 217, 0.12)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
  },
  headerText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.small,
    color: colors.text.primary,
  },
  body: {
    maxHeight: 400,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  dataRowEven: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  dataCell: {
    paddingHorizontal: spacing.sm,
  },
  dataText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.text.primary,
  },
});

export default RecordTable;
