import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { glassmorphism, blurConfig, spacing } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
  return (
    <View style={[glassmorphism.card, styles.container, style]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        tint={blurConfig.blurType}
        intensity={blurConfig.blurAmount * 4}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  content: {
    padding: spacing.md,
  },
});

export default GlassCard;
