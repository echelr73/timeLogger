import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  async scheduleNotification(id: number, title: string, body: string, delayMs: number, repeatHourly: boolean = false) {
    const triggerTime = new Date(Date.now() + delayMs);

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: repeatHourly ? { at: triggerTime, repeats: true, every: 'hour' } : { at: triggerTime },
          sound: 'default'
        }
      ]
    });
  }
}
