import { Component, OnInit } from '@angular/core';
import { SqlliteManagerService } from '../services/sqllite-manager.service';
import { Log } from '../models/log';
import { AlertService } from '../services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {

  currentDate: string = '';
  currentTime: string = '';
  isLogging = false;
  actualLog: Log;
  lastLogs: Log[];

  constructor(
    private sqliteService: SqlliteManagerService,
    private alertService: AlertService,
    private translate: TranslateService,
    private notificationService: NotificationService
  ) {
    this.actualLog = new Log();
    this.lastLogs = [];
    this.sqliteService.getLastLog().then(val => this.isLogging = val);
  }

  ngOnInit() {
    this.updateTime();
    setInterval(() => this.updateTime(), 1000); // Actualiza el reloj cada segundo
    this.getLastLogs();
  }

  async getLastLogs() {
    try {
      const logs = await this.sqliteService.getLastLogs(6);
      this.lastLogs = logs;
    } catch (error) {
      console.error('Error getting logs:', error);
    }
  }

  updateTime() {
    const now = new Date();
    this.currentDate = now.toLocaleDateString(); // Fecha y hora legible
    this.currentTime = now.toLocaleTimeString();
  }

  async toggleLogging() {
    const now = new Date();
    this.actualLog = {
      Timestamp: now.toISOString(),  // Fecha y hora actual en formato ISO
      IsActive: !this.isLogging      // true si estaba apagado, false si estaba encendido
    };

    this.sqliteService.saveLog(this.actualLog).then(async () => {
      this.alertService.alertMessage(
        this.translate.instant('label.success'),
        this.translate.instant('label.success.message.add.record')
      );
      await this.scheduleEndOfDayNotification(this.isLogging);
      this.isLogging = !this.isLogging;
      this.getLastLogs();
    }).catch(error => {
      this.alertService.alertMessage(
        this.translate.instant('label.error'),
        this.translate.instant(error.message || 'label.error.message.add.record')
      );
    });

  }

  formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString();
  }

  getTimeDiff(currentLog: Log): string | null {
    const index = this.lastLogs.indexOf(currentLog);
    if (index < 0 || index >= this.lastLogs.length - 1) return null;

    // En DESC, el "inicio" está en el siguiente item
    const nextLog = this.lastLogs[index + 1];
    if (!nextLog || !nextLog.IsActive) return null;

    const start = new Date(nextLog.Timestamp).getTime();
    const end = new Date(currentLog.Timestamp).getTime();
    const diffMs = end - start;

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    return `${hours}h ${minutes}m`;
  }

  async scheduleEndOfDayNotification(isLoggingOn: boolean) {
    const now = new Date();
    const finallyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 50, 59);
    const idHours = 1;
    if (!isLoggingOn) {
      try {
        await this.notificationService.scheduleNotification(
          idHours,
          this.translate.instant('label.log.active'),
          this.translate.instant('label.log.message'),
          60 * 60 * 1000,
          true
        );
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: idHours }] });
      } catch (error) {
        console.log(error);
      }
    }
  }

}
