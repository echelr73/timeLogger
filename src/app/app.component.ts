import { Component } from '@angular/core';
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { SqlliteManagerService } from './services/sqllite-manager.service';
import { AlertService } from './services/alert.service';
import { App as CapacitorApp } from '@capacitor/app';
import { Router } from '@angular/router';
import packageJson from '../../package.json';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {

  public isWeb: boolean;
  public load: boolean;
  deferredPrompt: any = null;
  showInstallButton = false;
  appVersion = packageJson.version;

  constructor( 
    private translate: TranslateService,
    private platform: Platform,
    private router: Router,
    private sqliteService: SqlliteManagerService,
    private alertService: AlertService
  ) {

    this.translate.setDefaultLang('es');
    this.isWeb = false;
    this.load = false;
    this.initApp();
  }

  initApp(){
    this.platform.ready().then( async() => {
      const lang = await Device.getLanguageCode();
      const info = await Device.getInfo();

      this.isWeb = info.platform == 'web';
      
      if (lang.value){
        this.translate.use(lang.value.slice(0, 2));
      }

      this.sqliteService.init();
      this.sqliteService.dbReady.subscribe(async isReady => {
          this.load = isReady;
          if (this.load) {
            this.alertService.alertMessage(
              this.translate.instant('label.welcome'),
              this.translate.instant('label.bd.loaded')
            );

            const permission = await LocalNotifications.checkPermissions();
            if (permission.display !== 'granted') {
              this.alertService.alertMessage(
                this.translate.instant('label.warning'),
                this.translate.instant('label.warning.message.notifications')
              );
              await LocalNotifications.requestPermissions();
            }
          }
      });
      CapacitorApp.addListener('backButton', () => {
        const currentUrl = this.router.url;
        if (currentUrl.includes('/tabs/tab2') || currentUrl.includes('/tabs/tab1')) {
          const confirmExit = confirm(this.translate.instant('label.exitApp'));
          if (confirmExit) {
            CapacitorApp.exitApp();
          }
        }
      });

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallButton = true;
      });
    });
  }

  installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();

      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
        } else {
        }
        this.deferredPrompt = null;
        this.showInstallButton = false;
      });
    }
  }

  notInstallPWA(){
    this.deferredPrompt = null;
    this.showInstallButton = false;
  }
}
