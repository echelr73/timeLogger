import { Component, OnInit } from '@angular/core';
import { SqlliteManagerService } from '../services/sqllite-manager.service';
import { Log } from '../models/log';
import { AlertService } from '../services/alert.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {

  currentDate: string = '';
  currentTime: string = '';
  isLogging: boolean;
  actualLog: Log;
  lastLogs: Log[];

  constructor(
    private sqliteService: SqlliteManagerService,
    private alertService: AlertService,
    private translate: TranslateService
  ) {
    this.actualLog = new Log();
    this.lastLogs = [];
    this.isLogging = false;
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

    await this.sqliteService.saveLog(this.actualLog).then(() => {
      this.alertService.alertMessage(
        this.translate.instant('label.success'),
        this.translate.instant('label.success.message.add.record')
      );
      this.isLogging = !this.isLogging;
      this.getLastLogs();
      console.log(this.lastLogs);
    }).catch(error => {
      this.alertService.alertMessage(
        this.translate.instant('label.error'),
        this.translate.instant('label.error.message.add.record')
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
}
