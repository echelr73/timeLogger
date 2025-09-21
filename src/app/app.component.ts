import { Component } from '@angular/core';
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { SqlliteManagerService } from './services/sqllite-manager.service';
import { AlertService } from './services/alert.service';
import { App as CapacitorApp } from '@capacitor/app';
import { Router } from '@angular/router';

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
      this.sqliteService.dbReady.subscribe(isReady => {
          this.load = isReady;
          if (this.load) {
            this.alertService.alertMessage(
              this.translate.instant('Bienvenido'),
              this.translate.instant('La base de cargo correctamente')
            );
          }
      });
      CapacitorApp.addListener('backButton', () => {
        const currentUrl = this.router.url;
        if (currentUrl.includes('/tabs/tab2')) {
          const confirmExit = confirm('¿Querés salir de la app?');
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
          console.log('PWA instalada ✅');
        } else {
          console.log('PWA no fue instalada ❌');
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
