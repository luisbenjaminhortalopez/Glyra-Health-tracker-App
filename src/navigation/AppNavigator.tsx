import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import GlucoseScreen from '../screens/GlucoseScreen';
import BloodPressureScreen from '../screens/BloodPressureScreen';
import WeightScreen from '../screens/WeightScreen';
import ExerciseScreen from '../screens/ExerciseScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import FadeHeader from '../components/FadeHeader';
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
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        })}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Glucose">{(props) => (<View style={{flex:1}}><FadeHeader onBack={() => props.navigation.goBack()} /><GlucoseScreen {...props} /></View>)}</Stack.Screen>
        <Stack.Screen name="BloodPressure">{(props) => (<View style={{flex:1}}><FadeHeader onBack={() => props.navigation.goBack()} /><BloodPressureScreen {...props} /></View>)}</Stack.Screen>
        <Stack.Screen name="Weight">{(props) => (<View style={{flex:1}}><FadeHeader onBack={() => props.navigation.goBack()} /><WeightScreen {...props} /></View>)}</Stack.Screen>
        <Stack.Screen name="Exercise">{(props) => (<View style={{flex:1}}><FadeHeader onBack={() => props.navigation.goBack()} /><ExerciseScreen {...props} /></View>)}</Stack.Screen>
        <Stack.Screen name="Medications">{(props) => (<View style={{flex:1}}><FadeHeader onBack={() => props.navigation.goBack()} /><MedicationsScreen {...props} /></View>)}</Stack.Screen>
        <Stack.Screen name="Settings">{(props) => (<View style={{flex:1}}><FadeHeader onBack={() => props.navigation.goBack()} /><SettingsScreen {...props} /></View>)}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
