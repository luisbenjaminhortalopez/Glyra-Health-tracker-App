import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import LiquidGlassButton from '../components/LiquidGlassButton';
import { useUser } from '../hooks/useUser';
import { colors, spacing, fontSize, fontFamily } from '../theme';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { getUser } = useUser();
  const [userName, setUserName] = useState('');

  useFocusEffect(
    useCallback(() => {
      const user = getUser();
      if (user?.name) {
        setUserName(user.name.split(' ')[0]);
      }
    }, [])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.settingsIcon}
        onPress={() => navigation.navigate('Settings')}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-outline" size={24} color={colors.text.secondary} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.greeting}>Hola, {userName}</Text>
        <Text style={styles.subtitle}>¿Qué deseas registrar?</Text>

        <View style={styles.buttonsColumn}>
          <LiquidGlassButton
            title="Glucosa"
            subtitle="Registro de glucosa en sangre"
            icon={<Ionicons name="water" size={24} color="#FFFFFF" />}
            onPress={() => navigation.navigate('Glucose')}
          />
          <LiquidGlassButton
            title="Presión"
            subtitle="Presión arterial y pulso"
            icon={<MaterialCommunityIcons name="heart-pulse" size={24} color="#FFFFFF" />}
            onPress={() => navigation.navigate('BloodPressure')}
          />
          <LiquidGlassButton
            title="Peso"
            subtitle="Peso corporal e IMC"
            icon={<MaterialCommunityIcons name="scale-bathroom" size={24} color="#FFFFFF" />}
            onPress={() => navigation.navigate('Weight')}
          />
          <LiquidGlassButton
            title="Ejercicio"
            subtitle="Registro de actividad física"
            icon={<MaterialCommunityIcons name="run" size={24} color="#FFFFFF" />}
            onPress={() => navigation.navigate('Exercise')}
          />
          <LiquidGlassButton
            title="Medicamentos"
            subtitle="Recordatorios de medicación"
            icon={<MaterialCommunityIcons name="pill" size={24} color="#FFFFFF" />}
            onPress={() => navigation.navigate('Medications')}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  greeting: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.header,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.subtitle,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonsColumn: {
    gap: spacing.md,
  },
  settingsIcon: {
    position: 'absolute',
    top: spacing.xl + spacing.md,
    right: spacing.lg,
    zIndex: 1,
    padding: spacing.sm,
  },
});

export default HomeScreen;
