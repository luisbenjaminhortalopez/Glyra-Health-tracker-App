import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing, borderRadius } from '../theme';

interface SimpleChartProps {
  data: number[];
  labels?: string[];
  yMin?: number;
  yMax?: number;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, labels, yMin, yMax }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 2;

  if (data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels: labels ?? data.map(() => ''),
          datasets: [
            { data },
            ...(yMin !== undefined ? [{ data: [yMin], withDots: false }] : []),
            ...(yMax !== undefined ? [{ data: [yMax], withDots: false }] : []),
          ],
        }}
        width={chartWidth}
        height={180}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: 'rgba(255,255,255,0.1)',
          backgroundGradientTo: 'rgba(255,255,255,0.05)',
          decimalCount: 0,
          color: (opacity = 1) => `rgba(74, 144, 217, ${opacity})`,
          labelColor: () => colors.text.secondary,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.primary,
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: borderRadius.medium,
  },
});

export default SimpleChart;
