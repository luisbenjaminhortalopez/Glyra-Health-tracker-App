import React from 'react';
import { TouchableOpacity, Text, ViewStyle, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../theme';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  variant?: 'default' | 'gradient' | 'danger';
}

const GlassButton: React.FC<GlassButtonProps> = ({ title, onPress, style, disabled, variant = 'default' }) => {
  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        style={[styles.shadow, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4A90D9', '#3B78C0', '#2C60A7', '#1E4A8E', '#0F4580', '#053d72']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientInner}
        >
          <Text style={[styles.gradientText, disabled && styles.disabledText]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const bgStyle = variant === 'danger' ? { backgroundColor: colors.error } : styles.defaultBg;

  return (
    <TouchableOpacity
      style={[styles.button, bgStyle, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[variant === 'danger' ? styles.gradientText : styles.text, disabled && styles.disabledText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
  },
  defaultBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  shadow: {
    borderRadius: borderRadius.medium,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#053d72',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  gradientInner: {
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.text.primary,
  },
  gradientText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.text.secondary,
  },
});

export default GlassButton;
