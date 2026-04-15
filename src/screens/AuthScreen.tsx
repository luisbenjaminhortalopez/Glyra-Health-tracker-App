import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import GlassButton from '../components/GlassButton';
import { useAuth } from '../hooks/useAuth';
import { spacing, fontSize, fontFamily, borderRadius } from '../theme';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { signIn, signUp, loading, error, clearError } = useAuth();

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email.trim() || !password) { setErrorMsg('Completa correo y contraseña'); return; }
    if (!email.trim().includes('@')) { setErrorMsg('Ingresa un correo electrónico válido'); return; }
    if (!isLogin && password.length < 8) { setErrorMsg('Mínimo 8 caracteres en la contraseña'); return; }
    if (!isLogin && password !== confirm) { setErrorMsg('Las contraseñas no coinciden'); return; }

    isLogin ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
  };

  const renderPassField = (label: string, val: string, set: (v: string) => void, show: boolean, toggle: () => void) => (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.passRow}>
        <TextInput style={s.passInput} value={val} onChangeText={set}
          placeholder="••••••" placeholderTextColor="rgba(255,255,255,0.4)" secureTextEntry={!show} />
        <TouchableOpacity onPress={toggle} style={s.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0c5d94', '#004c85', '#002f63', '#001544']} style={s.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.iconCircle}><Ionicons name="pulse" size={48} color="#FFFFFF" /></View>
          <Text style={s.appName}>Glyra Health</Text>
          <Text style={s.subtitle}>Tu salud, en tus manos</Text>

          <View style={s.cardOuter}>
            <BlurView style={StyleSheet.absoluteFill} tint="dark" intensity={40} />
            <View style={s.cardInner}>
              <Text style={s.cardTitle}>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</Text>

              <Text style={s.fieldLabel}>Correo electrónico</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail}
                placeholder="[email]" placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address" autoCapitalize="none" />

              {renderPassField('Contraseña', password, setPassword, showPass, () => setShowPass(!showPass))}
              {!isLogin && renderPassField('Confirmar contraseña', confirm, setConfirm, showConfirm, () => setShowConfirm(!showConfirm))}

              {(errorMsg || error) && <Text style={s.error}>{errorMsg || error}</Text>}
            </View>
          </View>

          <GlassButton title={isLogin ? 'Entrar' : 'Registrarse'} onPress={handleSubmit}
            disabled={loading} style={s.button} variant="default" />

          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setEmail(''); setPassword(''); setConfirm(''); setErrorMsg(''); clearError(); }} style={s.toggle}>
            <Text style={s.toggleText}>
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const s = StyleSheet.create({
  gradient: { flex: 1 }, flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl * 2 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.md },
  appName: { fontFamily: fontFamily.bold, fontSize: 32, color: '#FFF', textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.subtitle, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: spacing.xl },
  cardOuter: { borderRadius: borderRadius.large, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginBottom: spacing.lg },
  cardInner: { padding: spacing.lg },
  cardTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.title, color: '#FFF', marginBottom: spacing.md },
  fieldLabel: { fontFamily: fontFamily.bold, fontSize: fontSize.body, color: 'rgba(255,255,255,0.85)', marginTop: spacing.md, marginBottom: spacing.xs },
  input: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: '#FFF', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: borderRadius.small, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  passRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: borderRadius.small, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  passInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.body, color: '#FFF', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  eyeBtn: { paddingHorizontal: spacing.sm },
  error: { fontFamily: fontFamily.regular, fontSize: fontSize.small, color: '#FF6B6B', marginTop: spacing.sm },
  button: { alignSelf: 'center', minWidth: 220, backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.6)', paddingVertical: 14, borderRadius: 16 },
  toggle: { marginTop: spacing.md, alignSelf: 'center' },
  toggleText: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: 'rgba(255,255,255,0.7)' },
});

export default AuthScreen;
