import { Component } from '@angular/core';
import { Log } from '../models/log';
import { SqlliteManagerService } from '../services/sqllite-manager.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  logs: Log[] = [];
  registrosFiltrados: Log[] = [];
  startDate: string;
  endDate: string;
  totalTiempo: string;

  constructor(private sqliteService: SqlliteManagerService) {}

  ionViewWillEnter() {
    this.cargarRegistros();
  }

  async cargarRegistros() {
    this.logs = await this.sqliteService.getAllLogs();
    this.registrosFiltrados = this.logs;
    this.calcularTotalTiempo(this.registrosFiltrados);
  }

  onSearch() {
    if (!this.startDate || !this.endDate) return;

    const inicio = new Date(this.startDate);
    const fin = new Date(this.endDate);

    this.registrosFiltrados = this.logs.filter(log => {
      const fechaLog = new Date(log.Timestamp);
      return fechaLog >= inicio && fechaLog <= fin;
    });

    this.calcularTotalTiempo(this.registrosFiltrados);
  }

  calcularTotalTiempo(logs: Log[]) {
    let totalMs = 0;
    let inicio: Date | null = null;

    logs.forEach(log => {
      if (log.IsActive) {
        inicio = new Date(log.Timestamp);
      } else if (!log.IsActive && inicio) {
        const fin = new Date(log.Timestamp);
        totalMs += fin.getTime() - inicio.getTime();
        inicio = null; // reseteo hasta el próximo inicio
      }
    });

    // Convertimos a h/m
    const totalMin = Math.floor(totalMs / 60000);
    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;

    this.totalTiempo = `${horas}h ${minutos}m`;
  }

  getTimeDiff(currentLog: Log): string | null {
    const index = this.registrosFiltrados.indexOf(currentLog);
    if (index <= 0 || index >= this.registrosFiltrados.length) return null;
  
    // En ASC, el "inicio" está en el item anterior
    const prevLog = this.registrosFiltrados[index - 1];
    if (!prevLog || !prevLog.IsActive) return null;
  
    const start = new Date(prevLog.Timestamp).getTime();
    const end = new Date(currentLog.Timestamp).getTime();
    const diffMs = end - start;
  
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
  
    return `${hours}h ${minutes}m`;
  }

  getRowGroup(index: number): number {
    return Math.floor(index / 2); // cada 2 filas es un grupo
  }
  
  
}