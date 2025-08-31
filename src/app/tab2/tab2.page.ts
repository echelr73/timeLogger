import { Component, OnInit } from '@angular/core';
import { Log } from '../models/log';
import { SqlliteManagerService } from '../services/sqllite-manager.service';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  logs: Log[] = [];
  registrosFiltrados: Log[] = [];
  startDate: string;
  endDate: string;
  totalTiempo: string;
  lang: string = "";

  constructor(private sqliteService: SqlliteManagerService, private langService: LanguageService) { }

  ngOnInit() {
    this.lang = this.langService.getLang();
    this.defaultDay();
  }

  ionViewWillEnter() {
    this.loadRecords();
  }

  formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString();
  }

  async loadRecords() {
    this.logs = await this.sqliteService.getAllLogs();
    this.registrosFiltrados = this.logs;
    this.calcularTotalTiempo(this.registrosFiltrados);
  }

  onSearch() {
    if (!this.startDate || !this.endDate) return;
  
    const inicio = this.parseLocalDate(this.startDate, false);
    const fin = this.parseLocalDate(this.endDate, true);
  
    if (!inicio || !fin) return;
  
    this.registrosFiltrados = this.logs.filter(log => {
      const fechaLog = new Date(log.Timestamp); // tus timestamps ISO con Z -> ok
      return fechaLog.getTime() >= inicio.getTime() && fechaLog.getTime() <= fin.getTime();
    });
  
    this.calcularTotalTiempo(this.registrosFiltrados);
  }
  

  // Helper: parsea distintos formatos y devuelve una Date en hora local.
  // si endOfDay = true devuelve la fecha al final del día (23:59:59.999)
  private parseLocalDate(dateStr: string | undefined, endOfDay = false): Date | null {
    if (!dateStr) return null;

    // Caso ISO con tiempo (ej: 2025-08-01T00:00:00Z o 2025-08-01T00:00:00)
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      if (endOfDay) d.setHours(23, 59, 59, 999);
      else d.setHours(0, 0, 0, 0);
      return d;
    }

    // Caso YYYY-MM-DD (ion-datetime suele dar esto si usaste toISOString().split('T')[0])
    const dash = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (dash) {
      const y = Number(dash[1]);
      const m = Number(dash[2]) - 1;
      const d = Number(dash[3]);
      return endOfDay ? new Date(y, m, d, 23, 59, 59, 999) : new Date(y, m, d, 0, 0, 0, 0);
    }

    // Caso DD/MM/YYYY (por si alguna vez tenés esa cadena)
    const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr);
    if (slash) {
      const day = Number(slash[1]);
      const month = Number(slash[2]) - 1;
      const year = Number(slash[3]);
      return endOfDay ? new Date(year, month, day, 23, 59, 59, 999) : new Date(year, month, day, 0, 0, 0, 0);
    }

    // Fallback seguro: usar constructor y normalizar horas
    const fallback = new Date(dateStr);
    if (isNaN(fallback.getTime())) return null;
    if (endOfDay) fallback.setHours(23, 59, 59, 999);
    else fallback.setHours(0, 0, 0, 0);
    return fallback;
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

  defaultDay() {
    const today = new Date();

    // Primer día del mes actual
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    // Convertimos a formato YYYY-MM-DD (ISO string corto)
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
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