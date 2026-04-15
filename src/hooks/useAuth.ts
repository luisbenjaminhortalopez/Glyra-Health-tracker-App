import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { getDatabase } from '../db/database';

function getSignInError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'Este usuario no existe. Verifica tu correo o crea una cuenta.';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta. Intenta de nuevo.';
    case 'auth/invalid-credential':
      return 'Credenciales incorrectas. Verifica tu correo y contraseña.';
    case 'auth/invalid-email':
      return 'El formato del correo no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intenta más tarde.';
    default:
      return 'Error al iniciar sesión. Intenta de nuevo.';
  }
}

function getSignUpError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Esta cuenta ya existe. Intenta iniciar sesión.';
    case 'auth/invalid-email':
      return 'El formato del correo no es válido.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Usa al menos 8 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde.';
    default:
      return 'Error al registrarse. Intenta de nuevo.';
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewAccount, setIsNewAccount] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsNewAccount(false);
    try {
      // Clear local DB so the new account's data is loaded from Firebase
      const db = getDatabase();
      db.execSync(`
        DELETE FROM glucose_records;
        DELETE FROM blood_pressure_records;
        DELETE FROM weight_records;
        DELETE FROM exercise_records;
        DELETE FROM medications;
        DELETE FROM user_config;
      `);
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err: any) {
      setError(getSignInError(err.code));
      return false;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      // Clear local DB so the new account starts fresh
      const db = getDatabase();
      db.execSync(`
        DELETE FROM glucose_records;
        DELETE FROM blood_pressure_records;
        DELETE FROM weight_records;
        DELETE FROM exercise_records;
        DELETE FROM medications;
        DELETE FROM user_config;
      `);
      await createUserWithEmailAndPassword(auth, email, password);
      setIsNewAccount(true);
      return true;
    } catch (err: any) {
      setError(getSignUpError(err.code));
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setIsNewAccount(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { user, loading, error, isNewAccount, signIn, signUp, signOut, clearError };
}
