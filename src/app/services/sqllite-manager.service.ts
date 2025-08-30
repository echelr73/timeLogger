import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorSQLite, capSQLiteChanges, capSQLiteValues, JsonSQLite } from '@capacitor-community/sqlite';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { Log } from '../models/log';

@Injectable({
  providedIn: 'root'
})
export class SqlliteManagerService {

  public dbReady: BehaviorSubject<boolean>;
  public isWeb: boolean;
  public dbName: string;
  private DB_SETUP_KEY = 'first_db_setup';
  private DB_NAME_KEY = 'db_name';

  constructor(
    private alertController: AlertController,
    private http: HttpClient,
  ) {
    this.dbReady = new BehaviorSubject<boolean>(false);
    this.isWeb = false;
    this.dbName = '';
  }

  async init() {

    const info = await Device.getInfo();
    const sqlite = CapacitorSQLite as any;

    if (info.platform == 'android') {
      try {
        await sqlite.requestPermissions();
      }
      catch (e) {
        const alert = await this.alertController.create({
          header: 'Sin acceso a la base de datos',
          message: 'Esta app necesita acceso a la base de datos para funcionar',
          buttons: ['OK']
        });
        await alert.present();
      }
    } else if (info.platform == 'web') {
      this.isWeb = true;
      await sqlite.initWebStore();
    }

    this.setupDatabase();

  }

  async setupDatabase() {
    const dbSetupDone = await Preferences.get({ key: this.DB_SETUP_KEY });
    if (!dbSetupDone.value) {
      this.downloadDatabase();
    } else {
      this.dbName = await this.getDBName();
      await CapacitorSQLite.createConnection({database: this.dbName, encrypted: false, mode: 'full'});
      await CapacitorSQLite.open({database: this.dbName});
      this.dbReady.next(true);
    }
  }

  downloadDatabase(){
    this.http.get('assets/db/db.json').subscribe(async (jsonExport: JsonSQLite) => {
      const jsonString = JSON.stringify(jsonExport);
      const isValid= await CapacitorSQLite.isJsonValid({jsonstring: jsonString});

      if (isValid.result){
        this.dbName = jsonExport.database;
        await CapacitorSQLite.importFromJson({jsonstring: jsonString});
        await CapacitorSQLite.createConnection({database: this.dbName, encrypted: false, mode: 'full'});
        await CapacitorSQLite.open({database: this.dbName});

        await Preferences.set({key: this.DB_SETUP_KEY, value: '1'});
        await Preferences.set({key: this.DB_NAME_KEY, value: this.dbName});
        this.dbReady.next(true);
      }

    });
  }

  async getDBName(){
    if (!this.dbName){
      const dbName = await Preferences.get({key: this.DB_NAME_KEY});
      this.dbName = dbName.value;
    }
    return this.dbName;
  }

  async getLogs() {
    let sql = 'SELECT * FROM logger ORDER BY 2';

    const dbName = await this.getDBName();
    return CapacitorSQLite.query({
      database: dbName,
      statement: sql,
      values: []
    }).then((response: capSQLiteValues) => {
      let logs: Log[] = [];
      for (let index = 0; index < response.values.length; index++) {
        const row = response.values[index];
        let log = row as Log;
        logs.push(log);
      }
      return Promise.resolve(logs);
    }).catch(error => Promise.reject(error));

  }

  async getLastLogs(limit: number) {
    let sql = 'SELECT * FROM logger ORDER BY TimeStamp DESC LIMIT ?';

    const dbName = await this.getDBName();
    return CapacitorSQLite.query({
      database: dbName,
      statement: sql,
      values: [limit]
    }).then((response: capSQLiteValues) => {
      let logs: Log[] = [];
      for (let index = 0; index < response.values.length; index++) {
        const row = response.values[index];
        let log = row as Log;
        logs.push(log);
      }
      return Promise.resolve(logs);
    }).catch(error => Promise.reject(error));

  }

  async saveLog(log: Log) {
    const dbName = await this.getDBName();
    let sql = 'INSERT INTO logger (timeStamp, isActive) VALUES (?,?)';
    let values = [log.Timestamp, log.IsActive];

    return CapacitorSQLite.executeSet({
      database: dbName,
      set: [
        {
          statement: sql,
          values: values
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({
          database: dbName
        });
      }
      return changes;
    }).catch(error => Promise.reject(error));
  }
}
