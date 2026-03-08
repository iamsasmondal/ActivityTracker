import { Component } from '@angular/core';
import { IonApp, IonSplitPane, IonRouterOutlet } from '@ionic/angular/standalone';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonSplitPane, IonRouterOutlet, SidebarComponent],
})
export class AppComponent {
  constructor() { }
}
