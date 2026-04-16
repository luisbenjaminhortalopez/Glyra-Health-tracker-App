import { StyleSheet, Platform } from 'react-native';

// --- Colors ---
export const colors = {
  primary: '#4A90D9',
  secondary: '#7B61FF',
  background: '#E8EFF9',
  surface: '#FFFFFF',
  text: {
    primary: '#1A1A2E',
    secondary: '#6B7280',
    inverse: '#FFFFFF',
  },
  error: '#DC2626',
  alert: {
    red: '#EF4444',
    yellow: '#F59E0B',
  },
  glass: {
    background: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.55)',
    border: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  classification: {
    normal: '#22C55E',
    prediabetes: '#F59E0B',
    diabetes: '#EF4444',
    elevado: '#F97316',
    hipoglucemia: '#8B5CF6',
  },
};

// --- Spacing ---
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// --- Font Sizes ---
export const fontSize = {
  small: 12,
  body: 14,
  subtitle: 16,
  title: 20,
  header: 28,
};

// --- Font Family ---
export const fontFamily = {
  regular: 'NunitoSans-Regular',
  bold: 'NunitoSans-Bold',
};

// --- Border Radius ---
export const borderRadius = {
  small: 8,
  medium: 12,
  large: 20,
};

// --- Glassmorphism Styles ---
export const glassmorphism = StyleSheet.create({
  card: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
    }),
    overflow: 'hidden',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
    }),
    overflow: 'visible',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },
});

// --- Blur config for expo-blur ---
export const blurConfig = {
  blurType: 'light' as const,
  blurAmount: 15,
};

// --- Theme object (convenience export) ---
const theme = {
  colors,
  spacing,
  fontSize,
  fontFamily,
  borderRadius,
  glassmorphism,
  blurConfig,
};

export default theme;
