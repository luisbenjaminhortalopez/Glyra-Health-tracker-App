import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper to get user-scoped collection path
function userCol(userId: string, colName: string) {
  return collection(db, 'users', userId, colName);
}

function userDoc(userId: string) {
  return doc(db, 'users', userId);
}

// ---- User Profile ----
export async function getUserProfile(userId: string) {
  const snap = await getDoc(userDoc(userId));
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProfile(userId: string, data: Record<string, any>) {
  await setDoc(userDoc(userId), data, { merge: true });
}

// ---- Generic CRUD ----
export async function addRecord(userId: string, colName: string, data: Record<string, any>) {
  const ref = await addDoc(userCol(userId, colName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getRecord(userId: string, colName: string, id: string) {
  const snap = await getDoc(doc(db, 'users', userId, colName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllRecords(userId: string, colName: string, orderField = 'createdAt', dir: 'asc' | 'desc' = 'desc') {
  const q = query(userCol(userId, colName), orderBy(orderField, dir));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateRecord(userId: string, colName: string, id: string, data: Record<string, any>) {
  await updateDoc(doc(db, 'users', userId, colName, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteRecord(userId: string, colName: string, id: string) {
  await deleteDoc(doc(db, 'users', userId, colName, id));
}

export async function getRecordsByDateRange(userId: string, colName: string, startDate: string, endDate: string) {
  const q = query(
    userCol(userId, colName),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getRecordsByMonth(userId: string, colName: string, month: string) {
  const q = query(
    userCol(userId, colName),
    where('date', '>=', `${month}-01`),
    where('date', '<=', `${month}-31`),
    orderBy('date', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
