import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import GlucoseScreen from '../screens/GlucoseScreen';
import BloodPressureScreen from '../screens/BloodPressureScreen';
import WeightScreen from '../screens/WeightScreen';
import ExerciseScreen from '../screens/ExerciseScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import { colors, fontFamily, fontSize, spacing } from '../theme';

export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Glucose: undefined;
  BloodPressure: undefined;
  Weight: undefined;
  Exercise: undefined;
  Medications: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: fontFamily.bold, fontSize: fontSize.title },
          headerTintColor: colors.text.primary,
          headerShadowVisible: false,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.xs }}>
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        })}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Glucose" component={GlucoseScreen} options={{ title: '', headerTitle: '' }} />
        <Stack.Screen name="BloodPressure" component={BloodPressureScreen} options={{ title: '', headerTitle: '' }} />
        <Stack.Screen name="Weight" component={WeightScreen} options={{ title: '', headerTitle: '' }} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} options={{ title: '', headerTitle: '' }} />
        <Stack.Screen name="Medications" component={MedicationsScreen} options={{ title: '', headerTitle: '' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '', headerTitle: '' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
