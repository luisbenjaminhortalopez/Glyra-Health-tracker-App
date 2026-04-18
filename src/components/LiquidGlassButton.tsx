import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamily, fontSize, borderRadius, spacing } from '../theme';

interface LiquidGlassButtonProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.shadow, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#4A90D9', '#3B78C0', '#2C60A7', '#1E4A8E', '#0F4580', '#053d72']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>{icon}</View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderRadius: borderRadius.large,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#053d72',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
    }),
  },
  gradient: {
    height: 105,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
});

export default LiquidGlassButton;
