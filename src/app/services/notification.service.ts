import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  async scheduleNotification(id: number, title: string, body: string, delayMs: number) {
    const triggerTime = new Date(Date.now() + delayMs);

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at: triggerTime },
          sound: undefined,
          attachments: [],
          actionTypeId: '',
          extra: null
        }
      ]
    });
  }
}
