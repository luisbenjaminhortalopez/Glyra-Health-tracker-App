import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { MedicationRecord } from '../types';

const DAY_MAP: Record<string, number> = {
  sunday: 1, monday: 2, tuesday: 3, wednesday: 4,
  thursday: 5, friday: 6, saturday: 7,
};

const CHANNEL_ID = 'medication-reminders-v2';

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios de medicación',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'notificacion',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
}

export async function scheduleMedicationNotifications(med: MedicationRecord): Promise<void> {
  await cancelMedicationNotifications(med.id);

  if (!med.active) return;

  const [startH, startM] = med.startTime.split(':').map(Number);
  const timesPerDay = Math.floor(24 / med.frequencyHours);

  for (const [dayKey, enabled] of Object.entries(med.days)) {
    if (!enabled) continue;
    const weekday = DAY_MAP[dayKey];
    if (!weekday) continue;

    for (let i = 0; i < timesPerDay; i++) {
      const totalMinutes = (startH * 60 + startM) + (i * med.frequencyHours * 60);
      const hour = Math.floor(totalMinutes / 60) % 24;
      const minute = totalMinutes % 60;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 ${med.name}`,
          body: `Es hora de tomar tu ${med.type.toLowerCase()}: ${med.name}`,
          sound: 'notificacion',
          data: { medicationId: med.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
        identifier: `med-${med.id}-${dayKey}-${i}`,
      });
    }
  }
}

export async function cancelMedicationNotifications(medId: number): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    if (n.identifier.startsWith(`med-${medId}-`)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
