import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAtCqaWJ-eCySu3hT5aSFBzN9ktoUwyoQU",
  authDomain: "glyra-health.firebaseapp.com",
  projectId: "glyra-health",
  storageBucket: "glyra-health.firebasestorage.app",
  messagingSenderId: "28255709598",
  appId: "1:28255709598:web:9abe375a0659f539730e8f",
  measurementId: "G-ERSV8Z6PF7",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;
