import { auth } from '../config/firebase';
import * as fs from './firestore';

function getUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

export async function syncRecord(colName: string, action: 'add' | 'update' | 'delete', data: Record<string, any>, docId?: string) {
  try {
    const uid = getUid();
    if (!uid) return;

    if (action === 'add') {
      await fs.addRecord(uid, colName, data);
    } else if (action === 'update' && docId) {
      await fs.updateRecord(uid, colName, docId, data);
    } else if (action === 'delete' && docId) {
      await fs.deleteRecord(uid, colName, docId);
    }
  } catch {
    // Silently fail - SQLite is the source of truth, cloud sync is best-effort
  }
}

export async function syncUserProfile(data: Record<string, any>) {
  try {
    const uid = getUid();
    if (!uid) return;
    await fs.saveUserProfile(uid, data);
  } catch {}
}
