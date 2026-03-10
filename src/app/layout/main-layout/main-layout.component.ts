import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonSplitPane, IonRouterOutlet } from '@ionic/angular/standalone';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TrackerStore } from '../../store/tracker.store';

@Component({
  selector: 'app-main-layout',
  template: `
    <ion-app>
      <ion-split-pane contentId="main-content" when="md">
        <app-sidebar></app-sidebar>
        <ion-router-outlet id="main-content"></ion-router-outlet>
      </ion-split-pane>
    </ion-app>
  `,
  standalone: true,
  imports: [IonApp, IonSplitPane, IonRouterOutlet, SidebarComponent]
})
export class MainLayoutComponent implements OnInit {
  private store = inject(TrackerStore);

  ngOnInit() {
    this.store.loadInitialData();
  }
}

